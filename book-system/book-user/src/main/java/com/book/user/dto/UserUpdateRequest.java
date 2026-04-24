package com.book.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户资料更新请求对象，封装个人资料修改参数。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class UserUpdateRequest {

    /**
     * 昵称
     */
    @NotBlank(message = "昵称不能为空")
    private String nickname;

    /**
     * 头像地址
     */
    private String avatarUrl;
}
