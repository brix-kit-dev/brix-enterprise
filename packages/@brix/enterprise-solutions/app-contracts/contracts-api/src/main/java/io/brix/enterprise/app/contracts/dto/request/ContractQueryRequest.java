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
package io.brix.enterprise.app.contracts.dto.request;

import io.brix.enterprise.app.contracts.enums.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 合同查询请求对象
 *
 * <p>用于查询合同列表时传递筛选条件。
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractQueryRequest {

    /**
     * 合同编号（模糊匹配）
     */
    private String contractNo;

    /**
     * 关联案例ID
     */
    private String caseId;

    /**
     * 模板ID
     */
    private Long templateId;

    /**
     * 合同状态
     */
    private ContractStatus status;

    /**
     * 参与方ID
     * <p>查询某个用户/机构参与的合同
     */
    private String partyId;

    /**
     * 创建人ID
     */
    private String createdBy;

    /**
     * 创建开始日期
     */
    private LocalDate createdFrom;

    /**
     * 创建结束日期
     */
    private LocalDate createdTo;

    /**
     * 签署开始日期
     */
    private LocalDate signedFrom;

    /**
     * 签署结束日期
     */
    private LocalDate signedTo;

    /**
     * 是否已过期
     */
    private Boolean isExpired;

    /**
     * 关键字搜索
     * <p>搜索合同编号、参与方名称
     */
    private String keyword;

    /**
     * 页码（从0开始）
     */
    private Integer page;

    /**
     * 每页大小
     */
    private Integer size;

    /**
     * 排序字段
     */
    private String sortBy;

    /**
     * 排序方向（ASC/DESC）
     */
    private String sortDirection;

    /**
     * 获取页码（默认0）
     */
    public int getPageOrDefault() {
        return page != null && page >= 0 ? page : 0;
    }

    /**
     * 获取每页大小（默认20，最大100）
     */
    public int getSizeOrDefault() {
        if (size == null || size <= 0) {
            return 20;
        }
        return Math.min(size, 100);
    }
}
