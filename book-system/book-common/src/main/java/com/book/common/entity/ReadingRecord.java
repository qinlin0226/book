package com.book.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 阅读记录实体类，映射用户阅读行为数据。
 *
 * @author OpenCode
 */
@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@TableName("t_reading_record")
public class ReadingRecord extends BaseEntity {
    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 图书ID
     */
    private Long bookId;

    /**
     * 图书标题
     */
    private String bookTitle;

    /**
     * 图书封面
     */
    private String bookCover;

    /**
     * 阅读状态
     */
    private Integer readStatus;
}
