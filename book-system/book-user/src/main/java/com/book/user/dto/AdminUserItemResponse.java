package com.book.user.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理员用户列表展示对象
 *
 * @author OpenCode
 */
@Data
public class AdminUserItemResponse {
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
     * 角色
     */
    private Integer role;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
