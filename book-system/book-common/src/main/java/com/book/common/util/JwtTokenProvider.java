package com.book.common.util;

import com.book.common.properties.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 令牌提供者，负责生成和解析登录令牌。
 *
 * @author OpenCode
 */
@Component
public class JwtTokenProvider {

    /**
     * JWT 配置属性
     */
    private final JwtProperties jwtProperties;

    /**
     * 构造方法注入 JWT 配置。
     *
     * @param jwtProperties JWT 配置
     */
    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    /**
     * 生成 JWT Token。
     *
     * @param userId 用户ID
     * @param username 用户名
     * @param role 角色标识
     * @return JWT Token
     */
    public String generateToken(Long userId, String username, Integer role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("role", role);
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * 解析 JWT Token。
     *
     * @param token JWT Token
     * @return Claims 载荷
     */
    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 获取用户ID。
     *
     * @param token JWT Token
     * @return 用户ID
     */
    public Long getUserId(String token) {
        return parseToken(token).get("userId", Long.class);
    }

    /**
     * 获取用户名。
     *
     * @param token JWT Token
     * @return 用户名
     */
    public String getUsername(String token) {
        return parseToken(token).get("username", String.class);
    }

    /**
     * 获取角色标识。
     *
     * @param token JWT Token
     * @return 角色标识
     */
    public Integer getRole(String token) {
        return parseToken(token).get("role", Integer.class);
    }

    /**
     * 判断 Token 是否过期。
     *
     * @param token JWT Token
     * @return true-已过期，false-未过期
     */
    public boolean isTokenExpired(String token) {
        try {
            return parseToken(token).getExpiration().before(new Date());
        } catch (Exception exception) {
            return true;
        }
    }

    /**
     * 获取签名密钥。
     *
     * @return 签名密钥
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
