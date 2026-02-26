package com.shinwa.app.messenger.dto;

import java.util.List;

/**
 * 分页响应包装
 *
 * <p>替代 Spring Data 的 Page，避免 API 层依赖 spring-data。
 * 待 SDK 提供统一 PagedResponse 后迁移至 io.brix.platform.sdk.PagedResponse。
 *
 * @param <T> 数据项类型
 * @author Shinwa Team
 * @since 3.0.0
 */
public class PagedResponse<T> {

    /** 当前页数据 */
    private List<T> content;

    /** 当前页码（从 0 开始） */
    private int page;

    /** 每页大小 */
    private int size;

    /** 总元素数 */
    private long totalElements;

    /** 总页数 */
    private int totalPages;

    public PagedResponse() {}

    public PagedResponse(List<T> content, int page, int size, long totalElements) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
    }

    public List<T> getContent() { return content; }
    public void setContent(List<T> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean hasNext() { return page < totalPages - 1; }
    public boolean hasPrevious() { return page > 0; }
}
