/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.config;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import io.runtime.sdk.capability.ConfigStoreCapability;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IP-based rate limiting filter for the login endpoint.
 *
 * <p><b>Phase 0.3 Security Fix</b>: prevents brute-force attacks by limiting the number
 * of login requests from a single IP address within a configurable time window.</p>
 *
 * <h3>Rate Limiting Strategy</h3>
 * <p>Uses a sliding-window counter approach per IP address:</p>
 * <ul>
 *   <li>Each IP is allowed a configurable number of login attempts per window (default: 10/minute)</li>
 *   <li>When the limit is exceeded, the server responds with HTTP 429 (Too Many Requests)</li>
 *   <li>The counter resets after the time window elapses</li>
 *   <li>Stale entries are periodically cleaned to prevent memory leaks</li>
 * </ul>
 *
 * <h3>Defense in Depth</h3>
 * <p>This filter provides IP-level protection as the first line of defense.
 * Account-level lockout belongs to the platform authentication flow and is handled
 * separately from this HTTP filter as business logic.</p>
 *
 * <h3>Configuration (via ConfigStoreCapability — Red Line 6 compliant)</h3>
 * <ul>
 *   <li>{@code identity.security.rate-limit.max-attempts} — max login requests per IP per window (default: 10)</li>
 *   <li>{@code identity.security.rate-limit.window-seconds} — time window in seconds (default: 60)</li>
 * </ul>
 *
 * <h3>Architecture Compliance</h3>
 * <ul>
 *   <li>Resides in identity-server (Layer 4 — plugin server), which is the correct layer
 *       for HTTP-level concerns like request filtering</li>
 *   <li>Does not depend on any infrastructure (no Redis, no external rate limiter)</li>
 *   <li>Uses in-memory state suitable for single-node deployment; for distributed deployments,
 *       a Redis-backed implementation via ResilienceCapability should be used (Phase 4.1)</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.2.1
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);

    /** The login endpoint path that this filter protects. */
    private static final String LOGIN_PATH = "/api/auth/login";

    /** Configuration key for max login attempts per IP per time window. */
    private static final String CONFIG_KEY_MAX_ATTEMPTS = "identity.security.rate-limit.max-attempts";

    /** Configuration key for the rate limit sliding window duration in seconds. */
    private static final String CONFIG_KEY_WINDOW_SECONDS = "identity.security.rate-limit.window-seconds";

    /** Default maximum login attempts per IP per time window. */
    private static final int DEFAULT_MAX_ATTEMPTS = 10;

    /** Default time window in seconds for the rate limiter. */
    private static final int DEFAULT_WINDOW_SECONDS = 60;

    /**
     * Cleanup threshold: when the bucket map exceeds this size, stale entries are purged
     * to prevent unbounded memory growth from accumulated IP records.
     */
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final ConfigStoreCapability configStore;
    private final ObjectMapper objectMapper;

    /**
     * Per-IP rate limit tracking using a concurrent map.
     * Key: client IP address, Value: rate limit bucket with counter and window start time.
     */
    private final ConcurrentHashMap<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    public LoginRateLimitFilter(ConfigStoreCapability configStore) {
        this.configStore = configStore;
        this.objectMapper = JsonMapper.builder().configureForJackson2().build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Only apply rate limiting to POST /api/auth/login
        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        int maxAttempts = (int) configStore.getLong(CONFIG_KEY_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
        int windowSeconds = (int) configStore.getLong(CONFIG_KEY_WINDOW_SECONDS, DEFAULT_WINDOW_SECONDS);

        // Periodically clean stale entries to prevent memory leaks
        if (buckets.size() > CLEANUP_THRESHOLD) {
            cleanStaleBuckets(windowSeconds);
        }

        RateLimitBucket bucket = buckets.compute(clientIp, (ip, existing) -> {
            long now = Instant.now().getEpochSecond();
            if (existing == null || now - existing.windowStart > windowSeconds) {
                // Start a new window
                return new RateLimitBucket(now, new AtomicInteger(1));
            }
            existing.counter.incrementAndGet();
            return existing;
        });

        if (bucket.counter.get() > maxAttempts) {
            log.warn("[RateLimit] Login rate limit exceeded for IP: {} ({}/{})",
                     clientIp, bucket.counter.get(), maxAttempts);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

            Map<String, Object> errorBody = Map.of(
                    "success", false,
                    "message", "Too many login attempts. Please try again later.",
                    "retryAfterSeconds", windowSeconds
            );
            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Checks if the incoming request is a login request (POST to the login path).
     *
     * @param request the HTTP request
     * @return {@code true} if this is a login request
     */
    private boolean isLoginRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().endsWith(LOGIN_PATH);
    }

    /**
     * Resolves the client IP address from the request.
     *
     * <p>Checks the {@code X-Forwarded-For} header first (for reverse proxy setups),
     * then falls back to {@code X-Real-IP}, and finally to the remote address.
     * Only the first IP in a comma-separated {@code X-Forwarded-For} list is used
     * (the original client IP).</p>
     *
     * @param request the HTTP request
     * @return the resolved client IP address
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For may contain multiple IPs: "client, proxy1, proxy2"
            // Take only the first (leftmost) which is the original client IP.
            String clientIp = xff.split(",")[0].trim();
            if (!clientIp.isEmpty()) {
                return clientIp;
            }
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * Removes stale rate limit buckets whose time window has expired.
     * Called when the bucket map exceeds {@link #CLEANUP_THRESHOLD} entries.
     *
     * @param windowSeconds the rate limit window duration in seconds
     */
    private void cleanStaleBuckets(int windowSeconds) {
        long now = Instant.now().getEpochSecond();
        buckets.entrySet().removeIf(entry ->
                now - entry.getValue().windowStart > windowSeconds);
    }

    /**
     * Internal data structure tracking rate limit state for a single IP address.
     * Each bucket represents a sliding time window with an atomic request counter.
     */
    private static class RateLimitBucket {
        /** The epoch-second timestamp when this rate limit window started. */
        final long windowStart;

        /** Atomic counter of login attempts within the current window. */
        final AtomicInteger counter;

        RateLimitBucket(long windowStart, AtomicInteger counter) {
            this.windowStart = windowStart;
            this.counter = counter;
        }
    }
}
