package com.shinwa.app.products.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shinwa.app.products.api.ProductService;
import com.shinwa.app.products.dto.CreateProductRequest;
import com.shinwa.app.products.dto.ProductDTO;
import com.shinwa.app.products.dto.UpdateProductRequest;
import com.shinwa.app.products.entity.Product;
import com.shinwa.app.products.enums.ProductStatus;
import com.shinwa.app.products.enums.ProductType;
import com.shinwa.app.products.repository.ProductRepository;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.context.RuntimeContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 产品服务实现类
 *
 * <p>v3.0 业务模块，实现 ProductService 接口。
 *
 * <p>v3.0 改造要点：
 * <ul>
 *   <li>通过 RuntimeContext 获取能力契约</li>
 *   <li>使用 AuthContextCapability 获取当前租户</li>
 *   <li>使用 ObservabilityCapability 记录指标</li>
 *   <li>使用 EventBusCapability 发布领域事件</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final RuntimeContext runtimeContext;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // =====================================================
    // 辅助方法：获取当前租户
    // =====================================================

    /**
     * 获取当前租户 ID
     *
     * @return 租户 ID
     * @throws IllegalStateException 如果租户上下文不可用
     */
    private String getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            // 开发环境默认租户
            return "default";
        }
        return tenantId;
    }

    /**
     * 获取当前用户
     *
     * @return 用户标识
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
    // 辅助方法：发布事件
    // =====================================================

    /**
     * 发布产品事件
     *
     * <p>注意：v3.0 EventBusCapability.publish() 需要 DomainEvent 对象，
     * 此处简化为日志记录，后续可扩展为真正的事件发布。
     *
     * @param eventType 事件类型
     * @param product 产品实体
     */
    private void publishEvent(String eventType, Product product) {
        log.info("[事件] 产品事件发布, type={}, productId={}, productName={}, status={}",
            eventType, product.getId(), product.getName(), product.getStatus());
        
        // 记录指标
        try {
            ObservabilityCapability observability = runtimeContext.getObservability();
            observability.recordMetric("products.event." + eventType.toLowerCase(), 1.0, 
                Map.of("productType", product.getType().name(), "status", product.getStatus().name()));
        } catch (Exception e) {
            log.debug("记录产品事件指标失败: {}", e.getMessage());
        }
    }

    // =====================================================
    // 辅助方法：DTO 转换
    // =====================================================

    /**
     * 将实体转换为 DTO
     *
     * @param product 产品实体
     * @return 产品 DTO
     */
    private ProductDTO toDTO(Product product) {
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

    /**
     * 解析 JSON 列表
     */
    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.warn("解析 JSON 列表失败: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 将列表转换为 JSON
     */
    private String toJsonList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.warn("转换 JSON 列表失败: {}", e.getMessage());
            return null;
        }
    }

    // =====================================================
    // 创建与更新操作
    // =====================================================

    @Override
    @Transactional
    public ProductDTO create(CreateProductRequest request) {
        log.info("[用例] 创建产品, name={}, type={}, partnerId={}",
            request.getName(), request.getType(), request.getPartnerId());
        
        String tenantId = getCurrentTenantId();
        
        // 1. 验证名称唯一性
        if (productRepository.existsByNameAndTenantId(request.getName(), tenantId)) {
            throw new IllegalArgumentException("产品名称已存在：" + request.getName());
        }
        
        // 2. 创建实体
        Product product = Product.create(
            request.getName(),
            request.getDescription(),
            request.getType(),
            request.getPartnerId(),
            tenantId
        );
        
        // 3. 设置其他字段
        product.setCode(request.getCode());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setPriceRange(request.getPriceRange());
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        product.setCategoryId(request.getCategoryId());
        product.setServiceItemsJson(toJsonList(request.getServiceItems()));
        product.setDuration(request.getDuration());
        product.setRemarks(request.getRemarks());
        product.setCoverImage(request.getCoverImage());
        product.setImagesJson(toJsonList(request.getImages()));
        product.setTagsJson(toJsonList(request.getTags()));
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }
        product.setCreatedBy(getCurrentUser());
        
        // 4. 持久化
        Product saved = productRepository.save(product);
        log.info("[用例] 产品创建成功, id={}", saved.getId());
        
        // 5. 发布事件
        publishEvent("CREATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO update(Long id, UpdateProductRequest request) {
        log.info("[用例] 更新产品, id={}, name={}", id, request.getName());
        
        String tenantId = getCurrentTenantId();
        
        // 1. 查询产品
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        // 2. 验证名称唯一性（排除自身）
        if (productRepository.existsByNameAndIdNotAndTenantId(request.getName(), id, tenantId)) {
            throw new IllegalArgumentException("产品名称已存在：" + request.getName());
        }
        
        // 3. 更新（领域方法会验证状态）
        product.update(
            request.getName(),
            request.getDescription(),
            request.getPriceRange(),
            request.getDuration()
        );
        
        // 更新其他字段
        product.setCode(request.getCode());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        product.setCategoryId(request.getCategoryId());
        product.setServiceItemsJson(toJsonList(request.getServiceItems()));
        product.setRemarks(request.getRemarks());
        product.setCoverImage(request.getCoverImage());
        product.setImagesJson(toJsonList(request.getImages()));
        product.setTagsJson(toJsonList(request.getTags()));
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }
        
        // 4. 持久化
        Product saved = productRepository.save(product);
        log.info("[用例] 产品更新成功, id={}", saved.getId());
        
        // 5. 发布事件
        publishEvent("UPDATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("[用例] 删除产品, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        // 软删除（领域方法会验证状态）
        product.markDeleted();
        
        productRepository.save(product);
        log.info("[用例] 产品删除成功, id={}", id);
        
        publishEvent("DELETED", product);
    }

    // =====================================================
    // 查询操作
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductDTO> findById(Long id) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByIdAndTenantId(id, tenantId)
            .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getById(Long id) {
        return findById(id)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findAll() {
        String tenantId = getCurrentTenantId();
        return productRepository.findAllByTenantId(tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findByStatus(ProductStatus status) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByStatusAndTenantId(status, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findByType(ProductType type) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByTypeAndTenantId(type, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findByPartnerId(Long partnerId) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByPartnerIdAndTenantId(partnerId, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findActiveProducts() {
        String tenantId = getCurrentTenantId();
        return productRepository.findActiveProductsByTenantId(tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
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
    // 状态管理操作
    // =====================================================

    @Override
    @Transactional
    public ProductDTO submitReview(Long id) {
        log.info("[用例] 提交审核, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.submitReview();
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品提交审核成功, id={}", saved.getId());
        
        publishEvent("SUBMITTED_REVIEW", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO approve(Long id) {
        log.info("[用例] 审核通过, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.approve();
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品审核通过成功, id={}", saved.getId());
        
        publishEvent("APPROVED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO reject(Long id, String reason) {
        log.info("[用例] 审核驳回, id={}, reason={}", id, reason);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.reject();
        
        // 可以将驳回原因存储到备注
        if (reason != null && !reason.isBlank()) {
            String currentRemarks = product.getRemarks();
            product.setRemarks((currentRemarks != null ? currentRemarks + "\n" : "") + 
                "[驳回原因] " + reason);
        }
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品审核驳回成功, id={}", saved.getId());
        
        publishEvent("REJECTED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO deactivate(Long id) {
        log.info("[用例] 下架产品, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.deactivate();
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品下架成功, id={}", saved.getId());
        
        publishEvent("DEACTIVATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO reactivate(Long id) {
        log.info("[用例] 重新上架产品, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.reactivate();
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品重新上架成功, id={}", saved.getId());
        
        publishEvent("REACTIVATED", saved);
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO archive(Long id) {
        log.info("[用例] 归档产品, id={}", id);
        
        String tenantId = getCurrentTenantId();
        
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("产品不存在，ID：" + id));
        
        product.archive();
        
        Product saved = productRepository.save(product);
        log.info("[用例] 产品归档成功, id={}", saved.getId());
        
        publishEvent("ARCHIVED", saved);
        
        return toDTO(saved);
    }
}
