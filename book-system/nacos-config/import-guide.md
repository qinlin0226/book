# Nacos 配置导入脚本
# 使用方式：将以下配置通过 Nacos Web UI 导入，或使用 Nacos Open API

# ============================================
# 共享配置：book-dev.yaml
# ============================================
# Data ID: book-dev.yaml

spring:
  data:
    redis:
      host: 192.168.101.129
      port: 6379
      password:
      database: 0
      ssl:
        enabled: false

book:
  datasource:
    dev:
      url: jdbc:mysql://192.168.101.129:3306/book?allowPublicKeyRetrieval=true&useSSL=false&useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&tinyInt1isBit=false&allowMultiQueries=true&serverTimezone=GMT%2B8
      username: root
      password: root
