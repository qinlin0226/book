package com.book.common.config;

import com.book.common.properties.JwtProperties;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * 通用配置类，负责注册公共模块共享的基础 Bean。
 *
 * @author OpenCode
 */
@Configuration
@ComponentScan("com.book.common")
@EnableConfigurationProperties(JwtProperties.class)
public class CommonConfig {

    /**
     * Long 类型转字符串配置，避免前端精度丢失。
     *
     * @return Jackson 自定义配置
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonLongToStringCustomizer() {
        return builder -> {
            builder.serializerByType(Long.class, ToStringSerializer.instance);
            builder.serializerByType(Long.TYPE, ToStringSerializer.instance);
        };
    }
}
