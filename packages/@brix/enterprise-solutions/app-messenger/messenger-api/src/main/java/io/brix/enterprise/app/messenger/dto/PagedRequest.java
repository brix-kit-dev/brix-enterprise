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
package io.brix.enterprise.app.messenger.dto;

/**
 * 分页请求参数
 *
 * <p>替代 Spring Data 的 Pageable，避免 API 层依赖 spring-data。
 * 待 SDK 提供统一 PagedRequest 后迁移至 io.brix.platform.sdk.PagedRequest。
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public class PagedRequest {

    /** 页码（从 0 开始） */
    private int page;

    /** 每页大小 */
    private int size;

    /** 排序字段（可选，格式: "field,asc" 或 "field,desc"） */
    private String sort;

    public PagedRequest() {
        this.page = 0;
        this.size = 20;
    }

    public PagedRequest(int page, int size) {
        this.page = page;
        this.size = size;
    }

    public PagedRequest(int page, int size, String sort) {
        this.page = page;
        this.size = size;
        this.sort = sort;
    }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public String getSort() { return sort; }
    public void setSort(String sort) { this.sort = sort; }
}
