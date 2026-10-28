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
import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import io.runtime.orchestrator.manifest.UIManifestLoader;

/**
 * Every plugin descriptor the platform modules ship passes the schema check the runtime makes when
 * the Host starts (root BRX-RS-MANIFEST-031). The runtime refuses to start on a descriptor its bundled
 * schema rejects, so a field the descriptor model accepts but the schema does not know is caught here
 * rather than at deployment.
 */
class PluginManifestSchemaContractTest {

    @Test
    void thePlatformDescriptorsPassTheRuntimesStartupSchemaCheck() {
        UIManifestLoader loader = new UIManifestLoader(new ObjectMapper());

        assertThatCode(loader::loadManifests).doesNotThrowAnyException();
        assertThat(loader.getAllManifests()).containsKeys("platform-identity", "platform-tenant", "platform-audit");
    }
}
