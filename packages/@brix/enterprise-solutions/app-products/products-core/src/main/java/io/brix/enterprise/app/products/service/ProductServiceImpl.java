/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.products.service;

import io.brix.enterprise.app.products.api.ProductService;
import io.brix.enterprise.app.products.dto.CreateProductRequest;
import io.brix.enterprise.app.products.dto.ProductDTO;
import io.brix.enterprise.app.products.dto.UpdateProductRequest;
import io.brix.enterprise.app.products.entity.Product;
import io.brix.enterprise.app.products.enums.ProductStatus;
import io.brix.enterprise.app.products.enums.ProductType;
import io.brix.enterprise.app.products.repository.ProductRepository;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.context.RuntimeContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * Product Service Implementation
 *
 * <p>Implements {@link ProductService} for the v3.0 Runtime Shell architecture.
 * All cross-cutting capabilities are accessed via {@link RuntimeContext}.</p>
 *
 * <h3>Caching Strategy (Phase 4.3)</h3>
 * <p>Read-heavy queries use Spring Cache abstraction ({@code @Cacheable}) with
 * the platform-provided {@code StateStoreCacheManager}. Cache eviction is
 * triggered on all write operations via {@code @CacheEvict(allEntries=true)}.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    /** Cache name for product data. */
    static final String CACHE_PRODUCTS = "products";

        private static final String TENANT_CONTEXT_REQUIRED_MESSAGE =
            "Tenant context is required for product operations";

    private final ProductRepository productRepository;
    private final RuntimeContext runtimeContext;

    // =====================================================
    // Helper: Current Tenant
    // =====================================================

    /**
     * Returns the current tenant ID from the auth context.
     *
     * @return tenant ID
     * @throws IllegalStateException if tenant context is unavailable
     */
    private String getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(TENANT_CONTEXT_REQUIRED_MESSAGE);
        }
        return tenantId;
    }

    /**
     * Returns the current user identifier.
     *
     * @return the principal name, or "system" if unavailable
     */
    private String getCurrentUser() {
        try {
            var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
            return principal != null ? principal.getName() : "system";
        } catch (Exception e) {
            return "system";
        }
    }

    // =====================================================
    // Helper: Event Publishing
    // =====================================================

    /**
     * Publishes a product event.
     *
     * <p>Currently simplified to logging + metric recording.
     * A full DomainEvent implementation can be added later.</p>
     *
     * @param eventType the event type
     * @param product   the product entity
     */
    private void publishEvent(String eventType, Product product) {
        log.info("[event] Product event published, type={}, productId={}, productName={}, status={}",
            eventType, product.getId(), product.getName(), product.getStatus());
        
        // Record metric
        try {
            ObservabilityCapability observability = runtimeContext.getObservability();
            observability.recordMetric("products.event." + eventType.toLowerCase(), 1.0, 
                Map.of("productType", product.getType().name(), "status", product.getStatus().name()));
        } catch (Exception e) {
            log.debug("Failed to record product event metric: {}", e.getMessage());
        }
    }

    // =====================================================
    // Helper: DTO Conversion (delegated to ProductMapper)
    // =====================================================

    private ProductDTO toDTO(Product product) {
        return ProductMapper.toDTO(product);
    }

    // =====================================================
    // Create & Update Operations
    // =====================================================

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO create(CreateProductRequest request) {
        log.info("[use-case] Create product, name={}, type={}, partnerId={}",
            request.getName(), request.getType(), request.getPartnerId());
        
        String tenantId = getCurrentTenantId();
        
        // 1. Validate name uniqueness
        if (productRepository.existsByNameAndTenantId(request.getName(), tenantId)) {
            throw new IllegalArgumentException("Product name already exists: " + request.getName());
        }
        
        // 2. Create entity
        Product product = Product.create(
            request.getName(),
            request.getDescription(),
            request.getType(),
            request.getPartnerId(),
            tenantId
        );
        
        // 3. Set additional fields
        product.setCode(request.getCode());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setPriceRange(request.getPriceRange());
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        product.setCategoryId(request.getCategoryId());
        product.setServiceItemsJson(ProductMapper.toJsonList(request.getServiceItems()));
        product.setDuration(request.getDuration());
        product.setRemarks(request.getRemarks());
        product.setCoverImage(request.getCoverImage());
        product.setImagesJson(ProductMapper.toJsonList(request.getImages()));
        product.setTagsJson(ProductMapper.toJsonList(request.getTags()));
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }
        product.setCreatedBy(getCurrentUser());
        
        // 4. Persist
        Product saved = productRepository.save(product);
        log.info("[use-case] Product created, id={}", saved.getId());
        
        // 5. Publish event
        publishEvent("CREATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO update(Long id, UpdateProductRequest request) {
        log.info("[use-case] Update product, id={}, name={}", id, request.getName());
        
        String tenantId = getCurrentTenantId();
        
        // 1. Find product
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found, ID: " + id));
        
        // 2. Validate name uniqueness (excluding self)
        if (productRepository.existsByNameAndIdNotAndTenantId(request.getName(), id, tenantId)) {
            throw new IllegalArgumentException("Product name already exists: " + request.getName());
        }
        
        // 3. Update (domain method validates status)
        product.update(
            request.getName(),
            request.getDescription(),
            request.getPriceRange(),
            request.getDuration()
        );
        
        // Update additional fields
        product.setCode(request.getCode());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        product.setCategoryId(request.getCategoryId());
        product.setServiceItemsJson(ProductMapper.toJsonList(request.getServiceItems()));
        product.setRemarks(request.getRemarks());
        product.setCoverImage(request.getCoverImage());
        product.setImagesJson(ProductMapper.toJsonList(request.getImages()));
        product.setTagsJson(ProductMapper.toJsonList(request.getTags()));
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }
        
        // 4. Persist
        Product saved = productRepository.save(product);
        log.info("[use-case] Product updated, id={}", saved.getId());
        
        // 5. Publish event
        publishEvent("UPDATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public void delete(Long id) {
        log.info("[use-case] Delete product, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found, ID: " + id));
        
        // Soft delete (domain method validates status)
        product.markDeleted();
        
        productRepository.save(product);
        log.info("[use-case] Product deleted, id={}", id);
        
        publishEvent("DELETED", product);
    }

    // =====================================================
    // Query Operations
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'byId:' + #id", unless = "#result == null || !#result.isPresent()")
    public Optional<ProductDTO> findById(Long id) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByIdAndTenantId(id, tenantId)
            .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'getById:' + #id")
    public ProductDTO getById(Long id) {
        return findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found, ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'all'")
    public List<ProductDTO> findAll() {
        String tenantId = getCurrentTenantId();
        return productRepository.findAllByTenantId(tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'byStatus:' + #status.name()")
    public List<ProductDTO> findByStatus(ProductStatus status) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByStatusAndTenantId(status, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'byType:' + #type.name()")
    public List<ProductDTO> findByType(ProductType type) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByTypeAndTenantId(type, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'byPartner:' + #partnerId")
    public List<ProductDTO> findByPartnerId(Long partnerId) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByPartnerIdAndTenantId(partnerId, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'active'")
    public List<ProductDTO> findActiveProducts() {
        String tenantId = getCurrentTenantId();
        return productRepository.findActiveProductsByTenantId(tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CACHE_PRODUCTS, key = "'search:' + #keyword")
    public List<ProductDTO> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return findAll();
        }
        String tenantId = getCurrentTenantId();
        return productRepository.searchByKeywordAndTenantId(keyword, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    // =====================================================
    // Status Management Operations
    // =====================================================

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO submitReview(Long id) {
        return executeStatusTransition(id, "Submit for review", Product::submitReview);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO approve(Long id) {
        return executeStatusTransition(id, "Approve product", Product::approve);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO reject(Long id, String reason) {
        return executeStatusTransition(id, "Reject product", product -> {
            product.reject();
            if (reason != null && !reason.isBlank()) {
                String currentRemarks = product.getRemarks();
                product.setRemarks((currentRemarks != null ? currentRemarks + "\n" : "") +
                    "[Rejection reason] " + reason);
            }
        });
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO deactivate(Long id) {
        return executeStatusTransition(id, "Deactivate product", Product::deactivate);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO reactivate(Long id) {
        return executeStatusTransition(id, "Reactivate product", Product::reactivate);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_PRODUCTS, allEntries = true)
    public ProductDTO archive(Long id) {
        return executeStatusTransition(id, "Archive product", Product::archive);
    }

    /**
     * Template method for status transitions.
     * Logs, loads entity, applies transition, persists, and publishes event.
     */
    private ProductDTO executeStatusTransition(Long id, String operation, Consumer<Product> action) {
        log.info("[use-case] {}, id={}", operation, id);
        String tenantId = getCurrentTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found, ID: " + id));
        action.accept(product);
        Product saved = productRepository.save(product);
        log.info("[use-case] {} completed, id={}", operation, saved.getId());
        publishEvent(operation.toUpperCase().replace(" ", "_"), saved);
        return toDTO(saved);
    }
}
