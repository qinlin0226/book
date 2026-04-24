package com.book.common.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 阅读记录响应对象，作为阅读记录服务对外输出的通用数据结构。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class ReadingRecordResponse {

    /**
     * 记录ID
     */
    private Long id;

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

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
