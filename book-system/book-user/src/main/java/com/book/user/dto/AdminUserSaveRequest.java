package com.book.user.dto;

import lombok.Data;

/**
 * 管理员新增或修改用户请求参数
 *
 * @author OpenCode
 */
@Data
public class AdminUserSaveRequest {
    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

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
}
