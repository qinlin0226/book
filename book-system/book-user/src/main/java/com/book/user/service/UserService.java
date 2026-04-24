package com.book.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.book.common.constant.AuthConstant;
import com.book.common.entity.User;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import com.book.user.dto.AdminUserItemResponse;
import com.book.user.dto.AdminUserSaveRequest;
import com.book.user.dto.LoginRequest;
import com.book.user.dto.PasswordRequest;
import com.book.user.dto.RegisterRequest;
import com.book.user.dto.UserUpdateRequest;
import com.book.user.mapper.ReadingRecordMapper;
import com.book.user.mapper.UserMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户服务类，处理认证、资料维护和管理员用户管理业务。
 *
 * @author OpenCode
 */
@Service
public class UserService {

    /**
     * 用户数据访问组件
     */
    private final UserMapper userMapper;

    /**
     * 阅读记录数据访问组件
     */
    private final ReadingRecordMapper readingRecordMapper;

    /**
     * 密码编码器
     */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 构造方法注入依赖。
     *
     * @param userMapper 用户数据访问组件
     * @param readingRecordMapper 阅读记录数据访问组件
     */
    public UserService(UserMapper userMapper, ReadingRecordMapper readingRecordMapper) {
        this.userMapper = userMapper;
        this.readingRecordMapper = readingRecordMapper;
    }

    /**
     * 用户注册。
     *
     * @param request 注册请求参数
     * @return 注册后的用户实体
     */
    public User register(RegisterRequest request) {
        validateUsernameUnique(request.getUsername(), null);

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setNickname(resolveNickname(request.getNickname(), request.getUsername()));
        user.setRole(AuthConstant.ROLE_USER);
        user.setStatus(1);
        fillCreateFields(user);
        userMapper.insert(user);
        return user;
    }

    /**
     * 用户登录。
     *
     * @param request 登录请求参数
     * @return 登录成功的用户实体
     */
    public User login(LoginRequest request) {
        User user = getActiveUserByUsername(request.getUsername());
        if (Integer.valueOf(0).equals(user.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "账号已被禁用");
        }
        if (!matchesPassword(user, request.getPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "用户名或密码错误");
        }
        return user;
    }

    /**
     * 根据用户ID查询用户。
     *
     * @param userId 用户ID
     * @return 用户实体
     */
    public User getUserById(Long userId) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getId, userId).eq(User::getIsDeleted, 0);
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "用户不存在");
        }
        return user;
    }

    /**
     * 更新当前用户资料。
     *
     * @param userId 用户ID
     * @param request 用户资料更新参数
     */
    public void updateProfile(Long userId, UserUpdateRequest request) {
        User user = getUserById(userId);
        user.setNickname(request.getNickname().trim());
        user.setAvatarUrl(normalizeText(request.getAvatarUrl()));
        touchUpdateTime(user);
        userMapper.updateById(user);
    }

    /**
     * 修改当前用户密码。
     *
     * @param userId 用户ID
     * @param request 密码修改参数
     */
    public void updatePassword(Long userId, PasswordRequest request) {
        User user = getUserById(userId);
        if (!matchesPassword(user, request.getOldPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "原密码错误");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        touchUpdateTime(user);
        userMapper.updateById(user);
    }

    /**
     * 查询管理员用户列表。
     *
     * @return 用户列表
     */
    public List<AdminUserItemResponse> listUsers() {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getIsDeleted, 0).orderByDesc(User::getId);
        return userMapper.selectList(wrapper).stream().map(this::toAdminItem).toList();
    }

    /**
     * 管理员新增用户。
     *
     * @param request 用户新增参数
     */
    public void createUserByAdmin(AdminUserSaveRequest request) {
        if (!StringUtils.hasText(request.getPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "密码不能为空");
        }
        validateUsernameUnique(request.getUsername(), null);

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setNickname(resolveNickname(request.getNickname(), request.getUsername()));
        user.setAvatarUrl(normalizeText(request.getAvatarUrl()));
        user.setRole(resolveRole(request.getRole()));
        user.setStatus(resolveStatus(request.getStatus()));
        fillCreateFields(user);
        userMapper.insert(user);
    }

    /**
     * 管理员修改用户。
     *
     * @param userId 用户ID
     * @param request 用户修改参数
     */
    public void updateUserByAdmin(Long userId, AdminUserSaveRequest request) {
        User currentUser = getUserById(userId);
        validateUsernameUnique(request.getUsername(), userId);

        currentUser.setUsername(request.getUsername().trim());
        currentUser.setNickname(resolveNickname(request.getNickname(), request.getUsername()));
        currentUser.setAvatarUrl(normalizeText(request.getAvatarUrl()));
        currentUser.setRole(request.getRole() == null ? currentUser.getRole() : resolveRole(request.getRole()));
        currentUser.setStatus(request.getStatus() == null ? currentUser.getStatus() : resolveStatus(request.getStatus()));
        if (StringUtils.hasText(request.getPassword())) {
            currentUser.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        touchUpdateTime(currentUser);
        userMapper.updateById(currentUser);
    }

    /**
     * 管理员删除用户。
     *
     * @param userId 用户ID
     * @param operatorUserId 当前操作用户ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteUserByAdmin(Long userId, Long operatorUserId) {
        if (userId.equals(operatorUserId)) {
            throw new BusinessException(ResultCode.CONFLICT, "不能删除当前登录账号");
        }
        getUserById(userId);

        // 先清理关联阅读记录，再删除用户主记录，避免残留无效数据。
        readingRecordMapper.deletePhysicalByUserId(userId);
        userMapper.deletePhysicalById(userId);
    }

    /**
     * 根据用户名查询有效用户。
     *
     * @param username 用户名
     * @return 用户实体
     */
    private User getActiveUserByUsername(String username) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username.trim()).eq(User::getIsDeleted, 0);
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "用户名或密码错误");
        }
        return user;
    }

    /**
     * 校验用户名唯一性。
     *
     * @param username 用户名
     * @param excludeUserId 需要排除的用户ID
     */
    private void validateUsernameUnique(String username, Long excludeUserId) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username.trim()).eq(User::getIsDeleted, 0);
        if (excludeUserId != null) {
            wrapper.ne(User::getId, excludeUserId);
        }
        if (userMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.CONFLICT, "用户名已存在");
        }
    }

    /**
     * 转换管理员用户列表项。
     *
     * @param user 用户实体
     * @return 管理员用户响应对象
     */
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

    /**
     * 兼容旧密码并完成平滑升级。
     *
     * @param user 用户实体
     * @param rawPassword 明文密码
     * @return true-密码匹配，false-密码不匹配
     */
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
        touchUpdateTime(user);
        userMapper.updateById(user);
        return true;
    }

    /**
     * 填充新增通用字段。
     *
     * @param user 用户实体
     */
    private void fillCreateFields(User user) {
        LocalDateTime now = LocalDateTime.now();
        user.setCreateTime(now);
        user.setUpdateTime(now);
        user.setIsDeleted(0);
    }

    /**
     * 更新时间戳字段。
     *
     * @param user 用户实体
     */
    private void touchUpdateTime(User user) {
        user.setUpdateTime(LocalDateTime.now());
    }

    /**
     * 处理昵称为空场景。
     *
     * @param nickname 昵称
     * @param username 用户名
     * @return 最终昵称
     */
    private String resolveNickname(String nickname, String username) {
        return StringUtils.hasText(nickname) ? nickname.trim() : username.trim();
    }

    /**
     * 规范化可选字符串字段。
     *
     * @param text 原始文本
     * @return 处理后的文本
     */
    private String normalizeText(String text) {
        return StringUtils.hasText(text) ? text.trim() : null;
    }

    /**
     * 校验并返回角色值。
     *
     * @param role 角色值
     * @return 角色值
     */
    private Integer resolveRole(Integer role) {
        if (AuthConstant.ROLE_ADMIN.equals(role) || AuthConstant.ROLE_USER.equals(role)) {
            return role;
        }
        throw new BusinessException(ResultCode.BAD_REQUEST, "角色参数不合法");
    }

    /**
     * 校验并返回状态值。
     *
     * @param status 状态值
     * @return 状态值
     */
    private Integer resolveStatus(Integer status) {
        if (Integer.valueOf(0).equals(status) || Integer.valueOf(1).equals(status)) {
            return status;
        }
        throw new BusinessException(ResultCode.BAD_REQUEST, "状态参数不合法");
    }
}
