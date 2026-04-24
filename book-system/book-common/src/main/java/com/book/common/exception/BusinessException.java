package com.book.common.exception;

import com.book.common.enums.ResultCode;
import lombok.Getter;

/**
 * 业务异常类，用于承载可预期业务错误。
 *
 * @author OpenCode
 */
@Getter
public class BusinessException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    /**
     * 业务错误码
     */
    private final Integer code;

    /**
     * 通过枚举构造业务异常。
     *
     * @param resultCode 返回码枚举
     */
    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    /**
     * 通过枚举和自定义消息构造业务异常。
     *
     * @param resultCode 返回码枚举
     * @param message 自定义消息
     */
    public BusinessException(ResultCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }
}
