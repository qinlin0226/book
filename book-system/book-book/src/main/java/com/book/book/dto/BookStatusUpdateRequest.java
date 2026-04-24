package com.book.book.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 图书状态更新请求对象，封装上下架参数。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class BookStatusUpdateRequest {

    /**
     * 图书状态
     */
    @NotNull(message = "图书状态不能为空")
    private Integer status;
}
