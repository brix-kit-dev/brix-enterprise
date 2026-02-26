package io.host.shell.standalone;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Host 超薄壳层的架构红线守护测试。
 * 
 * <p>使用 {@link BrixArchitectureRules#hostProfile()} 规则集，确保 Host 层遵循以下原则：
 * <ul>
 *   <li>Host 层只能是 pom.xml + yaml 配置 + 启动类</li>
 *   <li>AutoConfiguration 类中不能有 @Bean 方法（除中间件组装外）</li>
 *   <li>不能包含业务逻辑、控制流代码</li>
 *   <li>不能有私有方法（表明存在实现细节）</li>
 * </ul>
 * 
 * <p>如果测试失败，说明代码违反了架构红线，必须修正后才能提交。
 * 
 * @see BrixArchitectureRules#hostProfile()
 * @see <a href="file:///d:/1.Sources/docs/v3.0.4-运行壳架构设计蓝图.md">v3.0.4-运行壳架构设计蓝图</a>
 */
@AnalyzeClasses(packages = "io.host.shell.standalone")
public class ArchitectureTest {

    /**
     * Host 层专用的架构规则集。
     * 
     * <p>与业务模块的 pluginProfile() 不同，Host 使用的是 hostProfile()，
     * 该规则集针对 Host 超薄壳层的特殊要求进行约束。
     */
    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.hostProfile();
}
