package com.book.record;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * 阅读记录服务启动类。
 *
 * @author OpenCode
 */
@EnableFeignClients
@EnableDiscoveryClient
@SpringBootApplication(scanBasePackages = "com.book")
public class RecordApplication {

    /**
     * 启动阅读记录服务。
     *
     * @param args 启动参数
     */
    public static void main(String[] args) {
        SpringApplication.run(RecordApplication.class, args);
    }
}
