/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
package io.brix.enterprise.app.products.service;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import io.brix.enterprise.app.products.dto.ProductDTO;
import io.brix.enterprise.app.products.entity.Product;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

/**
 * Stateless mapper between {@link Product} entities and {@link ProductDTO}.
 *
 * <p>Extracted from {@code ProductServiceImpl} (Phase 4.4) to keep the service
 * focused on business logic and honour the 500-line threshold.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Slf4j
public final class ProductMapper {

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder().configureForJackson2().build();

    private ProductMapper() { }

    /** Converts a Product entity to ProductDTO. */
    public static ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
            .id(product.getId())
            .name(product.getName())
            .description(product.getDescription())
            .type(product.getType())
            .status(product.getStatus())
            .code(product.getCode())
            .price(product.getPrice())
            .originalPrice(product.getOriginalPrice())
            .priceRange(product.getPriceRange())
            .currency(product.getCurrency())
            .partnerId(product.getPartnerId())
            .categoryId(product.getCategoryId())
            .serviceItems(parseJsonList(product.getServiceItemsJson()))
            .duration(product.getDuration())
            .remarks(product.getRemarks())
            .coverImage(product.getCoverImage())
            .images(parseJsonList(product.getImagesJson()))
            .tags(parseJsonList(product.getTagsJson()))
            .sortOrder(product.getSortOrder())
            .salesCount(product.getSalesCount())
            .viewCount(product.getViewCount())
            .createdAt(product.getCreatedAt())
            .updatedAt(product.getUpdatedAt())
            .createdBy(product.getCreatedBy())
            .tenantId(product.getTenantId())
            .build();
    }

    /** Parses a JSON string into a list of strings. */
    public static List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (JacksonException e) {
            log.warn("Failed to parse JSON list: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /** Serializes a list of strings to JSON. */
    public static String toJsonList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(list);
        } catch (JacksonException e) {
            log.warn("Failed to serialize JSON list: {}", e.getMessage());
            return null;
        }
    }
}
