package com.book.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 图书实体类，映射图书基础信息表。
 *
 * @author OpenCode
 */
@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@TableName("t_book")
public class Book extends BaseEntity {
    private static final long serialVersionUID = 1L;

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
}
