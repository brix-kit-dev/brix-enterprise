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
package io.brix.enterprise.app.solutions.booking.pact;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import io.brix.enterprise.app.booking.controller.BookableResourceController;
import io.brix.enterprise.app.booking.controller.BookingController;
import io.brix.enterprise.app.booking.repository.BookableResourceRepository;
import io.brix.enterprise.app.booking.service.BookingService;
import io.runtime.sdk.context.RuntimeContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.condition.EnabledIf;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

/**
 * Pact Provider 验证测试 - 预约 API
 *
 * <p>【Phase 5.3-2】Consumer-Driven Contract Testing - Provider 端</p>
 *
 * <p>本测试类验证后端（Provider）是否满足前端（Consumer）定义的 API 契约。
 * 契约文件由前端通过 pnpm test:pact 生成，位于 booking-shared/pacts/ 目录。</p>
 *
 * <h3>契约测试工作流</h3>
 * <ol>
 *   <li>前端运行 pnpm test:pact → 生成 pacts/*.json</li>
 *   <li>后端运行本测试 → 验证是否满足契约</li>
 *   <li>CI 中两端都通过才允许合并</li>
 * </ol>
 *
 * <h3>运行命令</h3>
 * <pre>
 * mvn test -Dtest=BookingApiPactProviderTest
 * </pre>
 *
 * <h3>State 方法说明</h3>
 * <p>@State 注解的方法用于准备测试数据，与 Consumer 测试中的 given() 对应。</p>
 *
 * @author Brix Platform Team
 * @version 3.0.4
 * @see <a href="https://docs.pact.io/implementation_guides/jvm/provider/junit5">Pact JVM Provider</a>
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(
    classes = BookingApiPactProviderTest.PactProviderTestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@EnabledIf("pactFilesAvailable")
@Provider("booking-server")
@PactFolder("../../booking-shared/pacts")
public class BookingApiPactProviderTest {

    private static final Path PACT_DIRECTORY = Path.of("../../booking-shared/pacts");

    /**
     * SLF4J logger used in lieu of {@code System.out} (architecture red-line R11.1).
     * Even in test code we route diagnostic output through SLF4J so Pact state
     * traces are filterable, capturable by Surefire test-reports and consistent
     * with production logging behaviour.
     */
    private static final Logger log = LoggerFactory.getLogger(BookingApiPactProviderTest.class);

    @LocalServerPort
    private int port;

    static boolean pactFilesAvailable() {
        if (!Files.isDirectory(PACT_DIRECTORY)) {
            return false;
        }
        try (Stream<Path> pactFiles = Files.list(PACT_DIRECTORY)) {
            return pactFiles.anyMatch(path -> path.getFileName().toString().endsWith(".json"));
        } catch (IOException ignored) {
            return false;
        }
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import({BookingController.class, BookableResourceController.class})
    static class PactProviderTestApplication {

        @Bean
        RuntimeContext runtimeContext() {
            return Mockito.mock(RuntimeContext.class);
        }

        @Bean
        BookingService bookingService() {
            return Mockito.mock(BookingService.class);
        }

        @Bean
        BookableResourceRepository bookableResourceRepository() {
            return Mockito.mock(BookableResourceRepository.class);
        }
    }

    /**
     * 设置测试目标
     *
     * <p>配置 Pact 验证目标为本地启动的 Spring Boot 服务</p>
     *
     * @param context Pact 验证上下文
     */
    @BeforeEach
    void setupTestTarget(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new HttpTestTarget("localhost", port));
        }
    }

    /**
     * Pact 验证模板测试
     *
     * <p>为每个 Pact 交互生成测试用例</p>
     *
     * @param context Pact 验证上下文
     */
    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verifyPact(PactVerificationContext context) {
        if (context != null) {
            context.verifyInteraction();
        }
    }

    // ========================================================================
    // State 方法 - 准备测试数据
    // ========================================================================

    /**
     * 状态：存在预约数据
     *
     * <p>对应 Consumer 测试中的 given('存在预约数据')</p>
     */
    @State("存在预约数据")
    void setupExistingBookings() {
        // 在实际场景中，这里会准备测试数据
        // 例如：向数据库插入测试预约记录
        // 当前使用 Mock 或内存数据库，数据由 @BeforeEach 准备
        log.debug("[Pact] state: existing bookings present");
    }

    /**
     * 状态：存在 ID 为 1 的预约
     *
     * <p>对应 Consumer 测试中的 given('存在 ID 为 1 的预约')</p>
     */
    @State("存在 ID 为 1 的预约")
    void setupBookingWithId1() {
        log.debug("[Pact] state: booking with id=1 exists");
        // TODO: 插入 ID 为 1 的测试预约数据
    }

    /**
     * 状态：不存在 ID 为 99999 的预约
     *
     * <p>对应 Consumer 测试中的 given('不存在 ID 为 99999 的预约')</p>
     */
    @State("不存在 ID 为 99999 的预约")
    void setupNonExistentBooking() {
        log.debug("[Pact] state: booking with id=99999 does not exist");
        // 无需操作，确保数据库中没有此 ID 的记录
    }

    /**
     * 状态：资源 1 在指定时间可用
     *
     * <p>对应 Consumer 测试中的 given('资源 1 在 2024-01-20 10:00-10:30 可用')</p>
     */
    @State("资源 1 在 2024-01-20 10:00-10:30 可用")
    void setupAvailableTimeSlot() {
        log.debug("[Pact] state: resource 1 available 2024-01-20 10:00-10:30");
        // TODO: 确保该时间段没有预约
    }

    /**
     * 状态：资源 1 在指定时间已被预约
     *
     * <p>对应 Consumer 测试中的 given('资源 1 在 2024-01-15 09:00-09:30 已被预约')</p>
     */
    @State("资源 1 在 2024-01-15 09:00-09:30 已被预约")
    void setupConflictingBooking() {
        log.debug("[Pact] state: resource 1 booked 2024-01-15 09:00-09:30");
        // TODO: 插入占用该时间段的预约
    }

    /**
     * 状态：存在 ID 为 1 的已确认预约
     *
     * <p>对应 Consumer 测试中的 given('存在 ID 为 1 的已确认预约')</p>
     */
    @State("存在 ID 为 1 的已确认预约")
    void setupConfirmedBooking() {
        log.debug("[Pact] state: confirmed booking with id=1 exists");
        // TODO: 插入状态为 CONFIRMED 的预约
    }

    /**
     * 状态：存在可预约资源
     *
     * <p>对应 Consumer 测试中的 given('存在可预约资源')</p>
     */
    @State("存在可预约资源")
    void setupBookableResources() {
        log.debug("[Pact] state: bookable resources present");
        // TODO: 插入可预约资源数据
    }
}
