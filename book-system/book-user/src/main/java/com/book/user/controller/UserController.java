package com.book.user.controller;

import com.book.common.constant.AuthConstant;
import com.book.common.entity.User;
import com.book.common.result.Result;
import com.book.user.dto.*;
import com.book.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        String token = userService.register(request.getUsername(), request.getPassword(), request.getNickname());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        return Result.success(data);
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        String token = userService.login(request.getUsername(), request.getPassword());
        User user = userService.getUserById(parseUserIdFromToken(token));
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("nickname", user.getNickname());
        data.put("role", user.getRole());
        return Result.success(data);
    }

    @GetMapping("/profile")
    public Result<User> getProfile(@RequestHeader("X-User-Id") Long userId) {
        return Result.success(userService.getUserById(userId));
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestHeader("X-User-Id") Long userId, @RequestBody UserUpdateRequest request) {
        User user = new User();
        user.setId(userId);
        user.setNickname(request.getNickname());
        user.setAvatarUrl(request.getAvatarUrl());
        userService.updateUser(user);
        return Result.success();
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestHeader("X-User-Id") Long userId, @RequestBody PasswordRequest request) {
        userService.updatePassword(userId, request.getOldPassword(), request.getNewPassword());
        return Result.success();
    }

    /**
     * 获取全部用户信息列表
     *
     * @param role 授权角色
     * @return 用户信息列表
     */
    @GetMapping("/admin/list")
    public Result<List<AdminUserItemResponse>> listUsers(@RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        return Result.success(userService.listUsers());
    }

    /**
     * 管理员新增用户
     *
     * @param role 授权角色
     * @param request 新增参数
     * @return 空响应
     */
    @PostMapping("/admin")
    public Result<Void> createUser(@RequestHeader("X-User-Role") Integer role,
                                   @RequestBody AdminUserSaveRequest request) {
        checkAdmin(role);
        userService.createUserByAdmin(request);
        return Result.success();
    }

    /**
     * 管理员修改用户信息
     *
     * @param id 用户ID
     * @param role 授权角色
     * @param request 修改参数
     * @return 空响应
     */
    @PutMapping("/admin/{id}")
    public Result<Void> updateUser(@PathVariable Long id,
                                   @RequestHeader("X-User-Role") Integer role,
                                   @RequestBody AdminUserSaveRequest request) {
        checkAdmin(role);
        userService.updateUserByAdmin(id, request);
        return Result.success();
    }

    /**
     * 管理员删除用户信息
     *
     * @param id 用户ID
     * @param operatorUserId 当前操作用户ID
     * @param role 授权角色
     * @return 空响应
     */
    @DeleteMapping("/admin/{id}")
    public Result<Void> deleteUser(@PathVariable Long id,
                                   @RequestHeader("X-User-Id") Long operatorUserId,
                                   @RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        userService.deleteUserByAdmin(id, operatorUserId);
        return Result.success();
    }

    private Long parseUserIdFromToken(String token) {
        return com.book.common.util.JwtUtil.getUserId(token);
    }

    // 管理员接口统一做角色校验，避免普通用户越权调用。
    private void checkAdmin(Integer role) {
        if (role != AuthConstant.ROLE_ADMIN) {
            throw new RuntimeException("无权限操作");
        }
    }
}
