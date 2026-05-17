/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */

/**
 * Shared integration event contracts for cross-plugin communication.
 *
 * <h2>Package Purpose</h2>
 * <p>This package contains {@link io.runtime.sdk.event.IntegrationEvent} subclasses
 * that are <strong>published by one plugin and subscribed to by other plugins</strong>.
 * By housing them in a neutral {@code shared-events} module (rather than in
 * any single plugin's API module), we ensure that subscribing plugins never
 * take a compile-time dependency on the publishing plugin.  This is the
 * architectural fix for review item <strong>R8.1</strong>.</p>
 *
 * <h2>Design Contract</h2>
 * <ul>
 *   <li>Every class in this package extends {@code IntegrationEvent}.</li>
 *   <li>Every class is a <em>pure data carrier</em> — no business logic.</li>
 *   <li>This package depends ONLY on {@code runtime-sdk-api}.</li>
 *   <li>No plugin module (booking, identity, etc.) is imported.</li>
 * </ul>
 *
 * <h2>Versioning</h2>
 * <p>Integration events are part of the public contract between plugins.
 * Follow strict backward-compatibility rules:  fields may be added but
 * must never be removed or renamed.  Use {@code @Since} to tag additions.</p>
 *
 * @see io.runtime.sdk.event.IntegrationEvent
 * @since 3.2.0
 */
package io.brix.enterprise.shared.event;
