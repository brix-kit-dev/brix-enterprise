package com.shinwa.app.contracts.service;

import com.shinwa.app.contracts.dto.ContractTemplateDTO;
import com.shinwa.app.contracts.dto.TemplateVersionDTO;
import com.shinwa.app.contracts.dto.request.CreateTemplateRequest;
import com.shinwa.app.contracts.dto.request.PublishVersionRequest;
import com.shinwa.app.contracts.enums.ContractType;

import java.util.List;
import java.util.Optional;

/**
 * 合同模板服务接口
 *
 * <p>定义合同模板管理的核心业务操作，包括模板的创建、版本管理、查询等功能。
 *
 * <p>核心功能：
 * <ul>
 *   <li>模板创建 - 创建新的合同模板</li>
 *   <li>版本管理 - 发布新版本、切换版本</li>
 *   <li>状态管理 - 启用/禁用模板</li>
 *   <li>模板查询 - 按类型、状态查询</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
public interface ContractTemplateService {

    /**
     * 创建模板
     *
     * <p>创建新的合同模板，同时创建第一个版本。
     *
     * @param request 创建请求
     * @return 创建的模板信息
     */
    ContractTemplateDTO createTemplate(CreateTemplateRequest request);

    /**
     * 更新模板基本信息
     *
     * @param templateId 模板ID
     * @param name       模板名称
     * @param description 描述
     * @return 更新后的模板信息
     */
    ContractTemplateDTO updateTemplate(Long templateId, String name, String description);

    /**
     * 发布新版本
     *
     * <p>为模板发布新版本。
     *
     * @param templateId 模板ID
     * @param request    版本发布请求
     * @return 新版本信息
     */
    TemplateVersionDTO publishVersion(Long templateId, PublishVersionRequest request);

    /**
     * 切换当前版本
     *
     * @param templateId    模板ID
     * @param versionNumber 目标版本号
     * @return 更新后的模板信息
     */
    ContractTemplateDTO switchVersion(Long templateId, Integer versionNumber);

    /**
     * 启用模板
     *
     * @param templateId 模板ID
     * @return 更新后的模板信息
     */
    ContractTemplateDTO enable(Long templateId);

    /**
     * 禁用模板
     *
     * @param templateId 模板ID
     * @return 更新后的模板信息
     */
    ContractTemplateDTO disable(Long templateId);

    /**
     * 根据ID查询模板
     *
     * @param templateId 模板ID
     * @return 模板信息（可能为空）
     */
    Optional<ContractTemplateDTO> findById(Long templateId);

    /**
     * 根据模板编码查询
     *
     * @param templateCode 模板编码
     * @return 模板信息（可能为空）
     */
    Optional<ContractTemplateDTO> findByCode(String templateCode);

    /**
     * 查询所有模板
     *
     * @param activeOnly 是否只查询启用的模板
     * @return 模板列表
     */
    List<ContractTemplateDTO> findAll(boolean activeOnly);

    /**
     * 按合同类型查询模板
     *
     * @param contractType 合同类型
     * @return 模板列表
     */
    List<ContractTemplateDTO> findByType(ContractType contractType);

    /**
     * 查询模板的所有版本
     *
     * @param templateId 模板ID
     * @return 版本列表
     */
    List<TemplateVersionDTO> findVersions(Long templateId);

    /**
     * 删除模板
     *
     * <p>只能删除未被使用的模板。
     *
     * @param templateId 模板ID
     */
    void delete(Long templateId);

    /**
     * 统计模板数量
     *
     * @param activeOnly 是否只统计启用的模板
     * @return 模板数量
     */
    long count(boolean activeOnly);
}
