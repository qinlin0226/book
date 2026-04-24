package com.book.common.constant;

/**
 * 认证鉴权常量类，统一维护请求头和角色标识。
 *
 * @author OpenCode
 */
public final class AuthConstant {

    /**
     * 私有构造方法，避免工具类被实例化。
     */
    private AuthConstant() {
    }

    /**
     * Token 请求头名称
     */
    public static final String TOKEN_HEADER = "Authorization";

    /**
     * Token 前缀
     */
    public static final String TOKEN_PREFIX = "Bearer ";

    /**
     * 管理员角色标识
     */
    public static final Integer ROLE_ADMIN = 1;

    /**
     * 普通用户角色标识
     */
    public static final Integer ROLE_USER = 0;
}
