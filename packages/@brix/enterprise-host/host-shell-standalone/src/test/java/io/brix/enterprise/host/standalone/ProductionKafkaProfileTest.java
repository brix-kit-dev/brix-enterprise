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
package io.brix.enterprise.host.standalone;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.Profiles;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import io.infra.adapter.kafka.KafkaClientSettings;
import io.infra.adapter.kafka.KafkaEventSettings;

/**
 * The host writes the Kafka production baseline down in its {@code prod} / {@code production} profile (standard-link
 * plan point 5; Kafka design D35): twelve partitions per event and command topic, three replicas, two in sync. With the
 * deployment's TLS client certificate, those defaults pass the adapter's production check; the small topics of the
 * {@code standalone} document, which every host runs, do not. A production host runs both profiles, so the production
 * document comes later and wins.
 */
class ProductionKafkaProfileTest {

    private static final String PARTITIONS = "brix.infra.kafka.events.partitions";
    private static final String REPLICAS = "brix.infra.kafka.events.replication-factor";
    private static final String IN_SYNC = "brix.infra.kafka.events.min-insync-replicas";
    private static final Pattern DEFAULT = Pattern.compile("\\$\\{[A-Z_]+:(\\d+)}");

    @Test
    void theProductionDocumentAppliesToBothProductionProfileNames() throws IOException {
        Object onProfile = document("prod").getProperty("spring.config.activate.on-profile");
        Profiles production = Profiles.of(String.valueOf(onProfile));

        assertThat(production.matches(Set.of("prod")::contains)).isTrue();
        assertThat(production.matches(Set.of("production")::contains)).isTrue();
        assertThat(production.matches(Set.of("dev")::contains)).isFalse();
    }

    @Test
    void theProductionDefaultsAreTwelvePartitionsThreeReplicasAndTwoInSyncAndPassTheProductionCheck()
            throws IOException {
        PropertySource<?> production = document("prod");
        int partitions = defaultOf(production, PARTITIONS);
        int replicas = defaultOf(production, REPLICAS);
        int inSync = defaultOf(production, IN_SYNC);

        assertThat(List.of(partitions, replicas, inSync)).containsExactly(12, 3, 2);
        assertThatCode(() -> KafkaClientSettings.of("kafka-1:9093", mutualTls(), settings(partitions, replicas, inSync),
            true)).doesNotThrowAnyException();
    }

    @Test
    void theStandaloneDocumentsSmallTopicsWouldNotPassIt() throws IOException {
        PropertySource<?> standalone = document("standalone");
        int partitions = defaultOf(standalone, PARTITIONS);

        assertThat(partitions).isEqualTo(3);
        assertThatThrownBy(() -> KafkaClientSettings.of("kafka-1:9093", mutualTls(),
            settings(partitions, defaultOf(standalone, REPLICAS), defaultOf(standalone, IN_SYNC)), true))
            .hasMessageContaining("partitions must be at least 12");
    }

    @Test
    void theProductionDocumentComesAfterTheStandaloneDocumentSoItsValuesWin() throws IOException {
        // Spring Boot applies the documents of a file in order: a later document overrides an earlier one.
        List<PropertySource<?>> documents = documents();

        assertThat(documents.indexOf(document("prod"))).isGreaterThan(documents.indexOf(document("standalone")));
    }

    private static List<PropertySource<?>> documents() throws IOException {
        return new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yml"));
    }

    /** The document of application.yml that activates on the profile and sets the Kafka topics. */
    private static PropertySource<?> document(String profile) throws IOException {
        return documents().stream()
            .filter(document -> document.containsProperty(PARTITIONS))
            .filter(document -> {
                Object onProfile = document.getProperty("spring.config.activate.on-profile");
                return onProfile != null && Profiles.of(String.valueOf(onProfile)).matches(Set.of(profile)::contains);
            })
            .findFirst()
            .orElseThrow(() -> new AssertionError("no document sets " + PARTITIONS + " for " + profile));
    }

    /** The default the document writes for a setting: 12 in {@code ${BRIX_INFRA_KAFKA_EVENTS_PARTITIONS:12}}. */
    private static int defaultOf(PropertySource<?> document, String name) {
        String value = String.valueOf(document.getProperty(name));
        Matcher matcher = DEFAULT.matcher(value);
        assertThat(matcher.matches()).as(name + " = " + value).isTrue();
        return Integer.parseInt(matcher.group(1));
    }

    private static KafkaEventSettings settings(int partitions, int replicas, int inSync) {
        return new KafkaEventSettings(partitions, (short) replicas, (short) inSync, Duration.ofDays(7), 10,
            Duration.ofMillis(500), Duration.ofSeconds(5), Duration.ofSeconds(10), Duration.ofSeconds(10));
    }

    private static Map<String, String> mutualTls() {
        Map<String, String> client = new LinkedHashMap<>();
        client.put("security.protocol", "SSL");
        client.put("ssl.keystore.type", "PKCS12");
        client.put("ssl.keystore.location", "/etc/brix/kafka/client.p12");
        client.put("ssl.truststore.type", "PKCS12");
        client.put("ssl.truststore.location", "/etc/brix/kafka/trust.p12");
        return client;
    }
}
