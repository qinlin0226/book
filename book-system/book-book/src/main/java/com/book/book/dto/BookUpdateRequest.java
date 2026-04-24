package com.book.book.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 图书修改请求对象，封装修改图书所需参数。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class BookUpdateRequest {

    /**
     * 图书标题
     */
    @NotBlank(message = "图书标题不能为空")
    private String title;

    /**
     * 作者
     */
    @NotBlank(message = "作者不能为空")
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
    @NotBlank(message = "图书分类不能为空")
    private String category;

    /**
     * 出版年份
     */
    @NotNull(message = "出版年份不能为空")
    private Integer publishYear;
}
