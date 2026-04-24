package com.book.user.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 用户资料响应对象，提供前端展示所需字段。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class UserProfileResponse {

    /**
     * 用户ID
     */
    private Long id;

    /**
     * 用户名
     */
    private String username;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像地址
     */
    private String avatarUrl;

    /**
     * 角色标识
     */
    private Integer role;

    /**
     * 账号状态
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
