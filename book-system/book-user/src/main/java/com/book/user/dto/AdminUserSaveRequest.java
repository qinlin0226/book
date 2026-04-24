package com.book.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 管理员新增或修改用户请求对象。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class AdminUserSaveRequest {

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
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
     * 角色标识
     */
    private Integer role;

    /**
     * 账号状态
     */
    private Integer status;
}
