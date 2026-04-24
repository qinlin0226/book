package com.book.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 统一返回码枚举，维护公共业务错误语义。
 *
 * @author OpenCode
 */
@Getter
@RequiredArgsConstructor
public enum ResultCode {

    /**
     * 参数非法
     */
    BAD_REQUEST(400, "请求参数不合法"),

    /**
     * 未认证
     */
    UNAUTHORIZED(401, "未登录或登录已失效"),

    /**
     * 无权限
     */
    FORBIDDEN(403, "无权限操作"),

    /**
     * 资源不存在
     */
    NOT_FOUND(404, "资源不存在"),

    /**
     * 业务冲突
     */
    CONFLICT(409, "业务状态冲突"),

    /**
     * 远程服务异常
     */
    REMOTE_ERROR(503, "远程服务暂不可用"),

    /**
     * 系统异常
     */
    SYSTEM_ERROR(500, "服务暂不可用，请稍后重试");

    /**
     * 错误码
     */
    private final Integer code;

    /**
     * 默认消息
     */
    private final String message;
}
