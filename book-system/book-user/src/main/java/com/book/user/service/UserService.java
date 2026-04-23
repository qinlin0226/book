package com.book.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.book.common.constant.AuthConstant;
import com.book.common.entity.User;
import com.book.common.util.JwtUtil;
import com.book.user.dto.AdminUserItemResponse;
import com.book.user.dto.AdminUserSaveRequest;
import com.book.user.mapper.ReadingRecordMapper;
import com.book.user.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ReadingRecordMapper readingRecordMapper;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String register(String username, String password, String nickname) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username);
        wrapper.eq("is_deleted", 0);
        if (userMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setRole(0);
        user.setStatus(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        user.setIsDeleted(0);
        userMapper.insert(user);

        return JwtUtil.generateToken(user.getId(), username, user.getRole());
    }

    public String login(String username, String password) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username);
        wrapper.eq("is_deleted", 0);
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }
        if (!matchesPassword(user, password)) {
            throw new RuntimeException("用户名或密码错误");
        }

        return JwtUtil.generateToken(user.getId(), username, user.getRole());
    }

    public User getUserById(Long id) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("id", id);
        wrapper.eq("is_deleted", 0);
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        return user;
    }

    public void updateUser(User user) {
        getUserById(user.getId());
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        if (!matchesPassword(user, oldPassword)) {
            throw new RuntimeException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    /**
     * 查询全部未删除用户信息
     *
     * @return 用户列表
     */
    public List<AdminUserItemResponse> listUsers() {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("is_deleted", 0);
        wrapper.orderByDesc("id");
        return userMapper.selectList(wrapper).stream().map(this::toAdminItem).collect(Collectors.toList());
    }

    /**
     * 管理员新增用户
     *
     * @param request 用户参数
     * @return void
     */
    public void createUserByAdmin(AdminUserSaveRequest request) {
        if (!StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getPassword())) {
            throw new RuntimeException("用户名和密码不能为空");
        }
        validateUsernameUnique(request.getUsername(), null);

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setNickname(StringUtils.hasText(request.getNickname()) ? request.getNickname().trim() : request.getUsername().trim());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setRole(request.getRole() != null ? request.getRole() : AuthConstant.ROLE_USER);
        user.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        user.setIsDeleted(0);
        userMapper.insert(user);
    }

    /**
     * 管理员修改用户信息
     *
     * @param userId 用户ID
     * @param request 用户参数
     * @return void
     */
    public void updateUserByAdmin(Long userId, AdminUserSaveRequest request) {
        User currentUser = getUserById(userId);
        if (!StringUtils.hasText(request.getUsername())) {
            throw new RuntimeException("用户名不能为空");
        }
        validateUsernameUnique(request.getUsername(), userId);

        currentUser.setUsername(request.getUsername().trim());
        currentUser.setNickname(StringUtils.hasText(request.getNickname()) ? request.getNickname().trim() : request.getUsername().trim());
        currentUser.setAvatarUrl(request.getAvatarUrl());
        currentUser.setRole(request.getRole() != null ? request.getRole() : currentUser.getRole());
        currentUser.setStatus(request.getStatus() != null ? request.getStatus() : currentUser.getStatus());
        if (StringUtils.hasText(request.getPassword())) {
            currentUser.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        currentUser.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(currentUser);
    }

    /**
     * 管理员删除用户信息
     *
     * @param userId 用户ID
     * @param operatorUserId 当前操作用户ID
     * @return void
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteUserByAdmin(Long userId, Long operatorUserId) {
        if (userId.equals(operatorUserId)) {
            throw new RuntimeException("不能删除当前登录账号");
        }
        getUserById(userId);

        // 先物理删除用户关联的阅读记录，再物理删除用户主记录。
        readingRecordMapper.deletePhysicalByUserId(userId);
        userMapper.deletePhysicalById(userId);
    }

    // 管理员列表只返回前端展示需要的字段，避免泄露密码。
    private AdminUserItemResponse toAdminItem(User user) {
        AdminUserItemResponse item = new AdminUserItemResponse();
        item.setId(user.getId());
        item.setUsername(user.getUsername());
        item.setNickname(user.getNickname());
        item.setAvatarUrl(user.getAvatarUrl());
        item.setRole(user.getRole());
        item.setStatus(user.getStatus());
        item.setCreateTime(user.getCreateTime());
        return item;
    }

    private void validateUsernameUnique(String username, Long excludeUserId) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username.trim());
        wrapper.eq("is_deleted", 0);
        if (excludeUserId != null) {
            wrapper.ne("id", excludeUserId);
        }
        if (userMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException("用户名已存在");
        }
    }

    private boolean matchesPassword(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword != null && storedPassword.startsWith("$2a$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        String md5Password = DigestUtils.md5DigestAsHex(rawPassword.getBytes(StandardCharsets.UTF_8));
        if (!md5Password.equalsIgnoreCase(storedPassword)) {
            return false;
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
        return true;
    }
}
