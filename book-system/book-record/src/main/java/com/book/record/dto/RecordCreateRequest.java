package com.book.record.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 阅读记录创建请求对象，封装图书选择参数。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class RecordCreateRequest {

    /**
     * 图书ID
     */
    @NotNull(message = "图书ID不能为空")
    private Long bookId;
}
