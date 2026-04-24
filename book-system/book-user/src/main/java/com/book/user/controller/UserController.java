package com.book.user.controller;

import com.book.common.constant.AuthConstant;
import com.book.common.entity.User;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import com.book.common.result.Result;
import com.book.common.util.JwtTokenProvider;
import com.book.user.dto.AdminUserItemResponse;
import com.book.user.dto.AdminUserSaveRequest;
import com.book.user.dto.AuthResponse;
import com.book.user.dto.LoginRequest;
import com.book.user.dto.PasswordRequest;
import com.book.user.dto.RegisterRequest;
import com.book.user.dto.UserProfileResponse;
import com.book.user.dto.UserUpdateRequest;
import com.book.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户控制器，负责认证、个人资料和管理员用户管理接口。
 *
 * @author OpenCode
 */
@Validated
@RestController
@RequestMapping("/user")
public class UserController {

    /**
     * 用户业务服务
     */
    private final UserService userService;

    /**
     * JWT 令牌提供者
     */
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 构造方法注入依赖。
     *
     * @param userService 用户业务服务
     * @param jwtTokenProvider JWT 令牌提供者
     */
    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * 用户注册接口。
     *
     * @param request 注册请求参数
     * @return 登录结果
     */
    @PostMapping("/register")
    public Result<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        return Result.success(buildAuthResponse(user));
    }

    /**
     * 用户登录接口。
     *
     * @param request 登录请求参数
     * @return 登录结果
     */
    @PostMapping("/login")
    public Result<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.login(request);
        return Result.success(buildAuthResponse(user));
    }

    /**
     * 获取当前登录用户资料。
     *
     * @param userId 当前用户ID
     * @return 用户资料
     */
    @GetMapping("/profile")
    public Result<UserProfileResponse> getProfile(@RequestHeader("X-User-Id") Long userId) {
        return Result.success(toUserProfileResponse(userService.getUserById(userId)));
    }

    /**
     * 更新当前登录用户资料。
     *
     * @param userId 当前用户ID
     * @param request 用户资料更新参数
     * @return 空响应
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestHeader("X-User-Id") Long userId,
                                      @Valid @RequestBody UserUpdateRequest request) {
        userService.updateProfile(userId, request);
        return Result.success();
    }

    /**
     * 修改当前登录用户密码。
     *
     * @param userId 当前用户ID
     * @param request 密码修改参数
     * @return 空响应
     */
    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestHeader("X-User-Id") Long userId,
                                       @Valid @RequestBody PasswordRequest request) {
        userService.updatePassword(userId, request);
        return Result.success();
    }

    /**
     * 查询管理员用户列表。
     *
     * @param role 当前用户角色
     * @return 用户列表
     */
    @GetMapping("/admin/list")
    public Result<List<AdminUserItemResponse>> listUsers(@RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        return Result.success(userService.listUsers());
    }

    /**
     * 管理员新增用户。
     *
     * @param role 当前用户角色
     * @param request 用户新增参数
     * @return 空响应
     */
    @PostMapping("/admin")
    public Result<Void> createUser(@RequestHeader("X-User-Role") Integer role,
                                   @Valid @RequestBody AdminUserSaveRequest request) {
        requireAdmin(role);
        userService.createUserByAdmin(request);
        return Result.success();
    }

    /**
     * 管理员修改用户。
     *
     * @param id 用户ID
     * @param role 当前用户角色
     * @param request 用户修改参数
     * @return 空响应
     */
    @PutMapping("/admin/{id}")
    public Result<Void> updateUser(@PathVariable Long id,
                                   @RequestHeader("X-User-Role") Integer role,
                                   @Valid @RequestBody AdminUserSaveRequest request) {
        requireAdmin(role);
        userService.updateUserByAdmin(id, request);
        return Result.success();
    }

    /**
     * 管理员删除用户。
     *
     * @param id 用户ID
     * @param operatorUserId 当前操作用户ID
     * @param role 当前用户角色
     * @return 空响应
     */
    @DeleteMapping("/admin/{id}")
    public Result<Void> deleteUser(@PathVariable Long id,
                                   @RequestHeader("X-User-Id") Long operatorUserId,
                                   @RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        userService.deleteUserByAdmin(id, operatorUserId);
        return Result.success();
    }

    /**
     * 构建登录响应对象。
     *
     * @param user 用户实体
     * @return 登录响应
     */
    private AuthResponse buildAuthResponse(User user) {
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setNickname(user.getNickname());
        response.setRole(user.getRole());
        return response;
    }

    /**
     * 转换用户资料响应对象。
     *
     * @param user 用户实体
     * @return 用户资料响应
     */
    private UserProfileResponse toUserProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setNickname(user.getNickname());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setCreateTime(user.getCreateTime());
        return response;
    }

    /**
     * 校验当前用户是否为管理员。
     *
     * @param role 当前用户角色
     */
    private void requireAdmin(Integer role) {
        if (!AuthConstant.ROLE_ADMIN.equals(role)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
    }
}
