package com.book.common.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 图书响应对象，作为图书服务对外输出的通用数据结构。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class BookInfoResponse {

    /**
     * 图书ID
     */
    private Long id;

    /**
     * 图书标题
     */
    private String title;

    /**
     * 作者
     */
    private String author;

    /**
     * 封面地址
     */
    private String coverUrl;

    /**
     * 图书简介
     */
    private String description;

    /**
     * 图书分类
     */
    private String category;

    /**
     * 出版年份
     */
    private Integer publishYear;

    /**
     * 上下架状态
     */
    private Integer status;

    /**
     * 阅读次数
     */
    private Long readCount;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
