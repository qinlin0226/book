# 微服务图书阅读与推荐系统

## 技术栈

| 层级 | 技术 |
| - | - |
| 后端 | Java 17 + Spring Boot 3.2 + Spring Cloud 2023 |
| 微服务 | Spring Cloud Gateway + Nacos + OpenFeign |
| 数据层 | MySQL 8.0 + Redis |
| ORM | MyBatis-Plus 3.5 |

## 项目结构

```
book-system/
├── book-common          # 公共模块（实体、工具类、结果封装）
├── book-gateway         # 网关服务（8080）
├── book-user            # 用户服务（8081）
├── book-book            # 图书服务（8082）
├── book-record          # 阅读记录服务（8083）
└── book-recommend       # 推荐服务（8084）
```

## 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0
- Redis
- Nacos 2.2.x

## 启动顺序

1. **启动 Nacos**
   ```bash
   # Windows
   startup.cmd -m standalone

   # Linux/Mac
   sh startup.sh -m standalone
   ```

2. **导入配置到 Nacos**
   - 打开 http://localhost:8848/nacos
   - 默认账号/密码: nacos/nacos
   - 在配置管理中添加配置文件（见下方配置内容）

3. **启动各服务**
   ```bash
   cd book-system

   # 编译
   mvn clean install -DskipTests

   # 启动网关
   java -jar book-gateway/target/book-gateway-1.0.0.jar

   # 启动用户服务
   java -jar book-user/target/book-user-1.0.0.jar

   # 启动图书服务
   java -jar book-book/target/book-book-1.0.0.jar

   # 启动阅读记录服务
   java -jar book-record/target/book-record-1.0.0.jar

   # 启动推荐服务
   java -jar book-recommend/target/book-recommend-1.0.0.jar
   ```

## 服务端口

| 服务 | 端口 | 描述 |
| - | - | - |
| Gateway | 8080 | 统一入口 |
| User | 8081 | 用户注册/登录 |
| Book | 8082 | 图书CRUD |
| Record | 8083 | 阅读记录 |
| Recommend | 8084 | 推荐服务 |

## API 测试

### 用户接口

```bash
# 注册
POST http://localhost:8080/api/user/register
Content-Type: application/json
{"username":"test","password":"123456","nickname":"测试用户"}

# 登录
POST http://localhost:8080/api/user/login
Content-Type: application/json
{"username":"test","password":"123456"}

# 获取个人信息（需要Token）
GET http://localhost:8080/api/user/profile
Authorization: Bearer <token>
```

### 图书接口

```bash
# 获取图书列表
GET http://localhost:8080/api/book?page=1&size=10

# 获取图书详情
GET http://localhost:8080/api/book/1

# 上架/下架（管理员）
PUT http://localhost:8080/api/book/1/status
Authorization: Bearer <admin_token>
Content-Type: application/json
{"status": 1}
```

### 阅读记录接口

```bash
# 添加阅读记录
POST http://localhost:8080/api/record
Authorization: Bearer <token>
Content-Type: application/json
{"bookId": 1}

# 获取阅读记录列表
GET http://localhost:8080/api/record
Authorization: Bearer <token>

# 更新阅读状态
PUT http://localhost:8080/api/record/1/status
Authorization: Bearer <token>
Content-Type: application/json
{"readStatus": 0}

# 删除记录
DELETE http://localhost:8080/api/record/1
Authorization: Bearer <token>
```

### 推荐接口

```bash
# 获取推荐（随机图书 + 最近阅读）
GET http://localhost:8080/api/recommend?limit=10
Authorization: Bearer <token>
```

## Nacos 配置

### book-gateway 共享配置

```yaml
spring:
  application:
    name: book-gateway
  profiles:
    active: dev
  cloud:
    nacos:
      server-addr: 192.168.101.128:8848
      username: nacos
      password: nacos
      discovery:
        namespace: f447a694-519a-4255-95f9-bcbb5a5d636
      config:
        server-addr: ${spring.cloud.nacos.server-addr}
        username: ${spring.cloud.nacos.username}
        password: ${spring.cloud.nacos.password}
        namespace: ${spring.cloud.nacos.discovery.namespace}
        file-extension: yaml
        shared-configs:
          - data-id: book-dev.yaml
            refresh: true
```

### 共享开发配置（book-dev.yaml）

```yaml
spring:
  data:
    redis:
      host: 192.168.101.128
      port: 6379
      password:
      database: 0
      ssl:
        enabled: false

book:
  datasource:
    dev:
      url: jdbc:mysql://192.168.101.128:3306/book?useSSL=false&useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&tinyInt1isBit=false&allowMultiQueries=true&serverTimezone=GMT%2B8
      username: root
      password: root
```

## 数据库初始化

```bash
# 创建数据库
CREATE DATABASE book_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 执行SQL
mysql -u root -p book_db < sql/book.sql
```

## 默认账号

| 账号 | 密码 | 角色 |
| - | - | - |
| admin | 123456 | 管理员 |
| zhangsan | 123456 | 普通用户 |
| lisi | 123456 | 普通用户 |
