package com.book.common.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT 配置属性类，统一维护签名密钥和过期时间。
 *
 * @author OpenCode
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * JWT 签名密钥
     */
    private String secret = "book-system-secret-key-must-be-at-least-256-bits-long-for-hs256";

    /**
     * Token 过期时间，单位毫秒
     */
    private long expiration = 7L * 24 * 60 * 60 * 1000;
}
