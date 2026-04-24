package com.book.user.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 登录注册响应对象，返回令牌和基础用户信息。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class AuthResponse {

    /**
     * 登录令牌
     */
    private String token;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 角色标识
     */
    private Integer role;
}
