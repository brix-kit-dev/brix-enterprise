/*
 * Copyright 2026 Brix Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.brix.host.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

/**
 * Contract checks for the Phase 8 real Host composition and E2E script path.
 *
 * <p>The test intentionally inspects deployment descriptors rather than Host
 * source code. Phase 8 requires static Host assembly and support scripts; it
 * must not introduce Host business handlers or a second endpoint publication
 * path.</p>
 *
 * @author Brix Architecture Team
 * @since 3.0.10
 */
class Phase8HostCompositionContractTest {

    private static final Path MODULE_DIR = Path.of(System.getProperty("user.dir"));
    private static final Path STANDALONE_DIR = MODULE_DIR.resolve("../host-shell-standalone").normalize();
    private static final Path REMOTE_DEPLOY_DIR = MODULE_DIR.resolve("../../../../scripts/remote-deploy").normalize();

    @Test
    void standaloneHostAssemblesRequiredOperationalDataOwnerNotificationAndTenantPlugin() throws IOException {
        String pom = read(STANDALONE_DIR.resolve("pom.xml"));
        String yaml = read(STANDALONE_DIR.resolve("src/main/resources/application.yml"));
        String autoConfiguration = read(STANDALONE_DIR.resolve(
            "src/main/java/io/brix/enterprise/host/standalone/config/StandaloneShellAutoConfiguration.java"));

        assertThat(pom)
            .contains("<artifactId>platform-admin</artifactId>")
            .contains("<artifactId>platform-tenant</artifactId>")
            .contains("<artifactId>platform-notification</artifactId>")
            .contains("<artifactId>infra-adapter-email-smtp</artifactId>")
            .contains("<artifactId>tenant-server</artifactId>");
        assertThat(yaml)
            .contains("capability:")
            .contains("validate-on-startup: true")
            .contains("- io.runtime.sdk.capability.EventBusCapability")
            .contains("host-mode: STANDALONE")
            .contains("required-operational-modules:")
            .contains("- platform-admin")
            .contains("required-plugins:")
            .contains("- platform-tenant")
            .contains("- brix-app-tenant")
            .contains("setup-base-url: ${BRIX_PLATFORM_ADMIN_SETUP_BASE_URL:}")
            .contains("include: readinessState,runtimeShellReadiness");
        assertThat(autoConfiguration)
            .contains("RuntimeShellFatalAction")
            .contains("System.exit(properties.getFatalExitCode())")
            .doesNotContain("TenantPlugin")
            .doesNotContain("TenantManagementService")
            .doesNotContain("Repository");
    }

    @Test
    void dockerMailpitProfileUsesManagedNotificationProviderWithoutSecretOutput() throws IOException {
        String compose = read(STANDALONE_DIR.resolve("docker-compose.yml"));
        String mailpit = read(STANDALONE_DIR.resolve("docker-compose.dev-smtp.yml"));

        assertThat(compose)
            .contains("BRIX_PLATFORM_NOTIFICATION_ENABLED")
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL")
            .contains("BRIX_INFRA_EMAIL_SMTP_ENABLED")
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM")
            .contains("BRIX_INFRA_EMAIL_SMTP_TLS_ENABLED")
            .contains("BRIX_INFRA_EMAIL_SMTP_CERTIFICATE_HOSTNAME_VALIDATION");
        assertThat(mailpit)
            .contains("SPRING_MAIL_HOST: mailpit")
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM")
            .contains("SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE: \"false\"")
            .doesNotContain("BRIX_INFRA_EMAIL_SMTP_TLS_ENABLED: \"false\"")
            .doesNotContain("BRIX_INFRA_EMAIL_SMTP_CERTIFICATE_HOSTNAME_VALIDATION: \"false\"");
    }

    @Test
    void remoteDeployScriptsUseSingleRedactedE2EPath() throws IOException {
        String first = read(REMOTE_DEPLOY_DIR.resolve("_full_admin_test.sh"));
        String second = read(REMOTE_DEPLOY_DIR.resolve("_full_admin_test2.sh"));
        String e2e = read(REMOTE_DEPLOY_DIR.resolve("bootstrap-e2e.sh"));
        String wait = read(REMOTE_DEPLOY_DIR.resolve("_wait_and_check.sh"));

        assertThat(first).contains("bootstrap-e2e.sh");
        assertThat(second).contains("bootstrap-e2e.sh");
        assertThat(e2e)
            .contains("redact()")
            .contains("wait_for_readiness")
            .contains("mailpitSetupMailArrived=true")
            .doesNotContain("echo \"$bootstrap_token\"")
            .doesNotContain("echo \"$setup_token\"")
            .doesNotContain("SELECT id, email");
        assertThat(wait)
            .contains("redact()")
            .doesNotContain("SELECT id, email")
            .doesNotContain("SELECT id, identity_id");
    }

    @Test
    void dockerScriptsGenerateAndValidateSmtpAdapterEnvironment() throws IOException {
        Path scriptsDir = MODULE_DIR.resolve("../../../../scripts").normalize();
        String rebuild = read(scriptsDir.resolve("docker-rebuild.sh"));
        String start = read(scriptsDir.resolve("docker-start.sh"));
        String remoteDeploy = read(REMOTE_DEPLOY_DIR.resolve("deploy-to-remote.ps1"));
        String remoteStart = read(REMOTE_DEPLOY_DIR.resolve("remote-docker-start.ps1"));
        String remoteRebuild = read(REMOTE_DEPLOY_DIR.resolve("remote-docker-rebuild.ps1"));

        assertThat(rebuild)
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL=http://localhost:3001/platform/setup")
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL is empty")
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM=platform-admin@brix.local")
            .contains("SPRING_MAIL_HOST is set but BRIX_INFRA_EMAIL_SMTP_FROM is empty");
        assertThat(start)
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL is empty")
            .contains("SPRING_MAIL_HOST is set but BRIX_INFRA_EMAIL_SMTP_FROM is empty");
        assertThat(remoteDeploy)
            .contains("\"BRIX_INFRA_EMAIL_SMTP_FROM\"")
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM=platform-admin@brix.local");
        assertThat(remoteStart)
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM")
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL is empty")
            .contains("SPRING_MAIL_HOST is set but BRIX_INFRA_EMAIL_SMTP_FROM is empty");
        assertThat(remoteRebuild)
            .contains("BRIX_INFRA_EMAIL_SMTP_FROM")
            .contains("BRIX_PLATFORM_ADMIN_SETUP_BASE_URL is empty")
            .contains("SPRING_MAIL_HOST is set but BRIX_INFRA_EMAIL_SMTP_FROM is empty");
    }

    private static String read(Path path) throws IOException {
        return Files.readString(path);
    }
}
