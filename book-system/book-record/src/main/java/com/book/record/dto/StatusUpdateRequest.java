package com.book.record.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 阅读状态更新请求对象，封装阅读状态参数。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class StatusUpdateRequest {

    /**
     * 阅读状态
     */
    @NotNull(message = "阅读状态不能为空")
    private Integer readStatus;
}
