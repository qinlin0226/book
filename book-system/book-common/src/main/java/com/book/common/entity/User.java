package com.book.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 用户实体类，映射用户基础信息表。
 *
 * @author OpenCode
 */
@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@TableName("t_user")
public class User extends BaseEntity {
    private static final long serialVersionUID = 1L;

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
     * 角色标识
     */
    private Integer role;

    /**
     * 账号状态
     */
    private Integer status;
}
