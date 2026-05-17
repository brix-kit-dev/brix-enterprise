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
package io.brix.enterprise.app.contracts.service;

import io.brix.enterprise.app.contracts.dto.ContractDTO;
import io.brix.enterprise.app.contracts.dto.request.ContractQueryRequest;
import io.brix.enterprise.app.contracts.dto.request.CreateContractRequest;
import io.brix.enterprise.app.contracts.dto.request.SignContractRequest;
import io.brix.enterprise.app.contracts.enums.ContractStatus;

import java.util.List;
import java.util.Optional;

/**
 * 合同服务接口
 *
 * <p>定义合同管理的核心业务操作，包括合同的创建、签署、查询等功能。
 *
 * <p>核心功能：
 * <ul>
 *   <li>合同创建 - 基于模板创建合同，填充变量</li>
 *   <li>签署流程 - 发起签署、执行签署、完成签署</li>
 *   <li>状态管理 - 合同取消、过期处理</li>
 *   <li>合同查询 - 多条件查询、详情查询</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface ContractService {

    /**
     * 创建合同
     *
     * <p>基于模板创建合同，支持变量填充和参与方设置。
     *
     * @param request 创建请求
     * @return 创建的合同信息
     */
    ContractDTO createContract(CreateContractRequest request);

    /**
     * 发起签署
     *
     * <p>将合同从草稿状态转为待签署状态，开始签署流程。
     *
     * @param contractId 合同ID
     * @return 更新后的合同信息
     */
    ContractDTO startSign(Long contractId);

    /**
     * 签署合同
     *
     * <p>执行签署操作，记录签署信息。
     *
     * @param contractId 合同ID
     * @param request    签署请求
     * @return 更新后的合同信息
     */
    ContractDTO sign(Long contractId, SignContractRequest request);

    /**
     * 取消合同
     *
     * <p>取消草稿或待签署状态的合同。
     *
     * @param contractId 合同ID
     * @param reason     取消原因
     * @return 更新后的合同信息
     */
    ContractDTO cancel(Long contractId, String reason);

    /**
     * 根据ID查询合同
     *
     * @param contractId 合同ID
     * @return 合同信息（可能为空）
     */
    Optional<ContractDTO> findById(Long contractId);

    /**
     * 根据合同编号查询
     *
     * @param contractNo 合同编号
     * @return 合同信息（可能为空）
     */
    Optional<ContractDTO> findByContractNo(String contractNo);

    /**
     * 查询合同列表
     *
     * @param request 查询条件
     * @return 合同列表
     */
    List<ContractDTO> findAll(ContractQueryRequest request);

    /**
     * 按案例ID查询合同
     *
     * @param caseId 案例ID
     * @return 合同列表
     */
    List<ContractDTO> findByCaseId(String caseId);

    /**
     * 按状态查询合同
     *
     * @param status 合同状态
     * @return 合同列表
     */
    List<ContractDTO> findByStatus(ContractStatus status);

    /**
     * 查询我参与的合同
     *
     * @param partyId 参与方ID
     * @return 合同列表
     */
    List<ContractDTO> findByPartyId(String partyId);

    /**
     * 删除合同
     *
     * <p>只能删除草稿状态的合同。
     *
     * @param contractId 合同ID
     */
    void delete(Long contractId);

    /**
     * 统计合同数量
     *
     * @param status 合同状态（可选）
     * @return 合同数量
     */
    long count(ContractStatus status);

    /**
     * 处理过期合同
     *
     * <p>将已超过有效期的已签署合同标记为过期。
     *
     * @return 处理的合同数量
     */
    int processExpiredContracts();
}
