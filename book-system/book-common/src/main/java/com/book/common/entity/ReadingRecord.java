package com.book.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_reading_record")
public class ReadingRecord extends BaseEntity {
    private Long userId;
    private Long bookId;
    private String bookTitle;
    private String bookCover;
    private Integer readStatus;
}
