package com.book.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_book")
public class Book extends BaseEntity {
    private String title;
    private String author;
    private String coverUrl;
    private String description;
    private String category;
    private Integer publishYear;
    private Integer status;
    private Long readCount;
}
