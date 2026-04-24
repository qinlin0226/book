# Java 后端开发规范手册

## 1. 基础编码规范

### 1.1 命名与风格

|   类型   |          规范           |                          示例                          |                           备注                            |
| :------: | :---------------------: | :----------------------------------------------------: | :-------------------------------------------------------: |
|   类名   | 大驼峰 (UpperCamelCase) |          UserService, OrderController, UserDO          |        名词为主，DO/DTO/VO 等后缀明确标识对象类型         |
|  方法名  | 小驼峰 (lowerCamelCase) | getUserById(), processPayment(), listUserByCondition() |  动词开头，语义清晰（list/query/get/delete/update/save）  |
|  常量名  |     全大写 + 下划线     |         MAX_RETRY_COUNT = 3, DEFAULT_TTL = 300         |        static final 修饰，仅存放不变值，禁止魔法值        |
| 布尔变量 |  避免否定词，前缀统一   |    isEnabled (✔️)、hasPermission (✔️)、isNotFound (❌)    |          防止逻辑歧义，前缀限定：is/has/contains          |
|   包名   |    全小写，域名倒序     |            com.company.trade.order.service             | 按 “公司域名 + 业务线 + 模块 + 层级” 划分，禁止拼音混英文 |
|  枚举名  |  大驼峰，枚举值全大写   |       OrderStatus { SUCCESS, FAIL, PROCESSING }        |    枚举类名加 “Enum” 后缀（可选），枚举值备注业务含义     |

**代码格式约束**

- 缩进：4 个空格 (IDE 全局配置 Use space instead of tab)

- 行宽：单行不超过 120 字符（超长时优先换行，如链式调用、SQL 拼接）

- 大括号：K&R 风格 (左括号不换行)，单行代码块也必须保留大括号

  ```
  // 正确
  if (user != null) {
      return user.getId();
  }
  // 错误
  if (user != null) return user.getId();
  ```

  

- 导入：禁止使用 `import java.util.*`，同一包下引用超 5 个类也需显式导入；导入顺序：JDK 类 > 第三方类 > 项目内部类

- 空格：运算符两侧、逗号后必须加空格，方法参数括号内无空格

  ```
  // 正确
  int sum = a + b;
  List<User> list = getUserList(userId, userName);
  // 错误
  int sum=a+b;
  List<User> list = getUserList( userId , userName );
  ```

  

### 1.2 Lombok 最佳实践

Lombok 减少样板代码，但需规避调试、序列化、继承风险：

|            场景             |                           推荐注解                           |        禁止操作         |                          备注                          |
| :-------------------------: | :----------------------------------------------------------: | :---------------------: | :----------------------------------------------------: |
|   Entity/DO (数据库映射)    | `@Getter + @Setter + @ToString + @NoArgsConstructor + @EqualsAndHashCode(of = "id")` |      禁止 `@Data`       | 避免全字段 equals/hashCode 导致 HashSet 异常、N+1 问题 |
| DTO (服务入参 / 跨服务传输) | `@Data + @Builder + @NoArgsConstructor + @AllArgsConstructor` |     禁止无参构造器      |               兼容序列化和 Builder 模式                |
|        VO (前端展示)        |               `@Getter + @Builder + @ToString`               |     禁止 `@Setter`      |          保持不可变性，仅通过 Builder 初始化           |
|        工具类 / 单例        |                       `@UtilityClass`                        |     手动编写构造器      |              自动私有化构造器，避免实例化              |
|          依赖注入           |         `@RequiredArgsConstructor` (配合 final 字段)         | 禁止字段级 `@Autowired` |              推荐构造器注入，提升可测试性              |

### 1.3 异常处理

#### 1.3.1 异常分类

|           异常类型            |                场景                |                   处理方式                    |
| :---------------------------: | :--------------------------------: | :-------------------------------------------: |
| 业务异常 (BusinessException)  |     参数非法、业务规则校验失败     | 自定义异常，携带错误码 + 错误信息，前端可展示 |
|  系统异常 (SystemException)   | 数据库连接失败、第三方服务调用异常 |    捕获后包装为系统异常，统一返回兜底提示     |
| 运行时异常 (RuntimeException) |          NPE、数组越界等           |              编码规避，而非捕获               |

#### 1.3.2 核心规范

- 禁止：捕获 `Exception` 后吞异常（无处理）、打印 `e.printStackTrace()`（日志乱序且无上下文）

- 必须：使用统一异常处理器（@RestControllerAdvice），示例：

  ```
  @RestControllerAdvice
  public class GlobalExceptionHandler {
      @ExceptionHandler(BusinessException.class)
      public Result<Void> handleBusinessException(BusinessException e) {
          log.warn("业务异常：{}", e.getMessage(), e);
          return Result.fail(e.getCode(), e.getMessage());
      }
  
      @ExceptionHandler(Exception.class)
      public Result<Void> handleSystemException(Exception e) {
          log.error("系统异常", e);
          return Result.fail(500, "服务暂不可用，请稍后重试");
      }
  }
  ```

- 推荐：对外接口抛出异常前，记录完整上下文（用户 ID、请求参数、TraceId）

### 1.4 日志规范

- 日志框架：统一使用 SLF4J + Logback，禁止直接使用 Log4j/Log4j2

- 日志级别：`ERROR`（影响业务运行）> `WARN`（需关注但不阻断）> `INFO`（核心流程）> `DEBUG`（调试信息）> `TRACE`（细粒度）

- 格式要求：必须使用 {} 占位符，禁止字符串拼接，示例：

  ```
  // 正确
  log.info("用户下单成功，用户ID：{}，订单ID：{}", userId, orderId);
  // 错误
  log.info("用户下单成功，用户ID：" + userId + "，订单ID：" + orderId);
  ```

- 敏感信息：日志中脱敏手机号（138****1234）、身份证（110*********1234）、银行卡号

- 链路追踪：日志中必须打印 TraceId（通过 MDC 透传），示例：

  ```
  MDC.put("traceId", TraceIdUtil.generate());
  log.info("发起支付请求，参数：{}", JSON.toJSONString(payDTO));
  MDC.remove("traceId");
  ```

### 1.5 空值处理

- 集合：判空使用 `CollectionUtils.isEmpty()`/`CollectionUtils.isNotEmpty()`，禁止 `list == null` 或 `list.size() == 0`

- 对象：非空判断优先使用 Optional，避免 NPE，示例：

  ```
  // 正确
  String userName = Optional.ofNullable(user).map(User::getName).orElse("默认名称");
  // 错误
  String userName = user.getName(); // 可能NPE
  ```

- 字符串：判空使用 `StringUtils.isBlank()`/`StringUtils.isNotBlank()`，覆盖空字符串、空格场景

## 2. 架构与分层设计

### 2.1 分层架构 (Clean Architecture 落地版)

严格遵循 “依赖向下，接口向上”，禁止跨层调用、循环依赖：

|       层级        |                     职责边界                     |                      禁止操作                       |                           核心规范                           |
| :---------------: | :----------------------------------------------: | :-------------------------------------------------: | :----------------------------------------------------------: |
|    Controller     |    参数校验、请求转发、结果封装、TraceId 透传    |     包含业务逻辑、直接操作数据库、捕获异常不抛      | 1. 使用 `@Validated` 做参数校验2. 统一返回 `Result<T>` 格式3. 禁止返回 Entity/DO 给前端 |
|      Service      | 事务控制、核心业务逻辑、领域模型编排、幂等性处理 | 处理 HTTP 请求、直接返回前端 VO、跨服务调用不做降级 | 1. 按业务域拆分（如 OrderService、UserService）2. 接口定义清晰，避免超大方法（超过 50 行拆分） |
| Repository/Mapper |           仅负责数据库 CRUD、SQL 执行            |     包含业务逻辑、复杂 SQL 拼接（移至 Service）     | 1. 禁止跨库操作（除非分布式事务）2. 仅暴露与数据库交互的方法 |
|    Util/Common    |         通用工具类（加密、日期、字符串）         |        包含业务逻辑、持有状态（如成员变量）         |        1. 工具类私有化构造器2. 方法全部静态，无副作用        |

### 2.2 对象转换规范 (DO/DTO/VO)

禁止跨层级直接传递对象，统一使用 MapStruct 做对象转换（性能优于 BeanUtils）：

| 对象类型 |         全称         |             用途             |                           核心规范                           |
| :------: | :------------------: | :--------------------------: | :----------------------------------------------------------: |
|  DO/PO   |    Domain Object     | 数据库映射，与表结构一一对应 | 1. 字段名与数据库一致（下划线转驼峰）2. 包含 `@TableField`/`@TableId` 等注解3. 禁止包含业务方法 |
|   DTO    | Data Transfer Object |    服务入参 / 跨服务传输     | 1. 添加 JSR-380 校验注解（`@NotBlank`/`@NotNull`/`@Pattern`）2. 仅包含传输所需字段，无冗余 |
|    VO    |     View Object      |           前端展示           | 1. 脱敏处理（手机号、身份证）2. 格式化字段（日期转 yyyy-MM-dd HH:mm:ss）3. 按需组装字段，避免前端冗余解析 |

**MapStruct 示例**：

```
@Mapper(componentModel = "spring")
public interface UserConvert {
    UserConvert INSTANCE = Mappers.getMapper(UserConvert.class);

    UserVO doToVo(UserDO userDO);

    List<UserVO> doListToVoList(List<UserDO> userDOList);

    @Mapping(source = "createTime", target = "createTimeStr", dateFormat = "yyyy-MM-dd HH:mm:ss")
    UserVO doToVoWithFormat(UserDO userDO);
}
```

## 3. 微服务与云原生

### 3.1 微服务拆分与交互

- 拆分原则：基于 DDD 领域驱动，按 “限界上下文” 拆分（如订单域、用户域、支付域），单一职责，避免 “微服务单体化”

- 通信协议：

  - 内部同步调用：OpenFeign (HTTP/REST)，适配大部分业务场景
  - 高性能 / 大数据场景：Dubbo (RPC)，配置序列化方式为 Hessian2
  - 异步通信：RocketMQ/Kafka，用于解耦、削峰填谷（如订单创建后发送消息通知库存）

- 幂等性：写操作接口（POST/PUT/DELETE）必须实现幂等，常见方案：

  |      场景      |           幂等方案           |
  | :------------: | :--------------------------: |
  |  前端重复提交  | 前端 Token + 后端 Redis 校验 |
  | 分布式服务调用 |  数据库唯一索引（如订单号）  |
  |  消息重复消费  |    消息表 + 消费状态标记     |

  

### 3.2 OpenFeign 规范（落地版）

- 超时配置：必须配置（默认超时易导致线程池耗尽），示例：

  ```
  feign:
    client:
      config:
        default:
          connectTimeout: 3000 # 连接超时 3s
          readTimeout: 5000    # 读取超时 5s
  ```

- 降级处理：必须实现 FallbackFactory（可获取异常信息），禁止直接实现 Fallback：

  ```
  @FeignClient(name = "user-service", fallbackFactory = UserServiceFallbackFactory.class)
  public interface UserFeignClient {
      @GetMapping("/user/{id}")
      Result<UserDTO> getUserById(@PathVariable("id") Long id);
  }
  
  @Component
  public class UserServiceFallbackFactory implements FallbackFactory<UserFeignClient> {
      @Override
      public UserFeignClient create(Throwable cause) {
          log.error("用户服务调用降级，原因：", cause);
          return id -> Result.fail(503, "用户服务暂不可用");
      }
  }
  ```

  

- 上下文透传：透传 TraceId、Auth Token 等核心请求头，通过 RequestInterceptor实现：

  ```
  @Component
  public class FeignRequestInterceptor implements RequestInterceptor {
      @Override
      public void apply(RequestTemplate template) {
          // 透传TraceId
          String traceId = MDC.get("traceId");
          if (StringUtils.isNotBlank(traceId)) {
              template.header("Trace-Id", traceId);
          }
          // 透传登录Token
          ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
          if (attributes != null) {
              String token = attributes.getRequest().getHeader("Authorization");
              if (StringUtils.isNotBlank(token)) {
                  template.header("Authorization", token);
              }
          }
      }
  }
  ```

  

### 3.3 网关 (Gateway) 规范

- 核心职责：路由转发、统一鉴权（黑白名单 / JWT）、限流、日志埋点、CORS 处理

- 限流配置：基于 Sentinel/Redis 实现，按接口 + IP 限流，示例（Sentinel）：

  ```
  spring:
    cloud:
      gateway:
        routes:
          - id: order-service
            uri: lb://order-service
            predicates:
              - Path=/order/**
            filters:
              - name: Sentinel
                args:
                  fallbackUri: forward:/fallback/order
                  resourceMode: URL
  ```

  

- CORS 统一配置：下游服务禁止重复配置，避免冲突：

  ```
  spring:
    cloud:
      gateway:
        globalcors:
          cors-configurations:
            '[/**]':
              allowedOrigins: "*" # 生产环境替换为具体域名
              allowedMethods: GET,POST,PUT,DELETE
              allowedHeaders: "*"
              allowCredentials: true
              maxAge: 3600
  ```

  

### 3.4 分布式事务 (Seata)

- 模式选择：

  - 优先：AT 模式（无侵入、自动补偿，适配 80% 业务场景）
  - 复杂场景：TCC 模式（如跨多库 / 多服务的资金操作，需手动实现 Try/Confirm/Cancel）

  

- 规范约束：

  1. `@GlobalTransactional` 仅标注在**事务发起方**（Controller 调用的第一个 Service 方法），禁止多层标注
  2. 分支事务必须使用 `@Transactional`，与全局事务兼容
  3. 禁止在分布式事务中调用无降级的 Feign 接口，避免阻塞

  

### 3.5 配置中心与注册发现

- 配置中心：使用 Nacos Config，按 “环境 + 服务 + 版本” 分层配置，敏感配置（数据库密码、密钥）加密存储：

  ```
  # Nacos配置分层
  dataId: order-service-dev.yml # 环境+服务
  group: DEFAULT_GROUP
  namespace: dev # 环境隔离
  ```

  

- 注册发现：使用 Nacos Discovery，服务名统一为 “业务域 - 服务名”（如 trade-order-service），禁止使用随机名称

## 4. 持久层 (MyBatis-Plus)

### 4.1 SQL 与索引规范

- 禁止：`SELECT *`、`OR` 连接多条件（改用 `IN`）、函数操作索引字段（如 `DATE(create_time) = '2024-01-01'`）

- 索引设计：

  1. WHERE/ORDER BY/GROUP BY 字段必须建索引，单表索引不超过 5 个（避免写性能下降）
  2. 联合索引遵循 “最左匹配原则”，高频查询字段放左侧（如 idx_order_user_time (user_id, create_time)）
  3. 禁止给低基数字段建索引（如性别、状态仅 2-3 个值）

  

- 分页优化：

  - 禁止内存分页（`list.subList()`）

  - 深分页（LIMIT 100000, 10）优化为 “游标分页”：

    ```
    -- 优化前
    SELECT id, order_no, amount FROM t_order LIMIT 100000, 10;
    -- 优化后（基于主键游标）
    SELECT id, order_no, amount FROM t_order WHERE id > 100000 LIMIT 10;
    ```

### 4.2 MyBatis-Plus 落地规范

- Wrapper 使用：优先 LambdaQueryWrapper（类型安全，避免字段名硬编码），禁止 QueryWrapper：

  

  ```
  // 正确
  LambdaQueryWrapper<UserDO> wrapper = Wrappers.lambdaQuery();
  wrapper.eq(UserDO::getId, userId)
         .ge(UserDO::getCreateTime, startTime);
  // 错误
  QueryWrapper<UserDO> wrapper = Wrappers.query();
  wrapper.eq("id", userId) // 字段名硬编码，易出错
         .ge("create_time", startTime);
  ```

  

- 批量操作：必须使用 MyBatis-Plus 批量方法，禁止 for 循环单条插入：

  ```
  // 正确（批量插入，默认批次1000，可自定义）
  userMapper.saveBatch(userDOList, 500);
  // 错误
  for (UserDO user : userDOList) {
      userMapper.insert(user); // 频繁IO，性能差
  }
  ```

  

- 逻辑删除：全局配置，禁止物理删除业务数据：

  ```
  mybatis-plus:
    global-config:
      db-config:
        logic-delete-field: deleted # 全局逻辑删除字段名
        logic-delete-value: 1 # 删除值
        logic-not-delete-value: 0 # 未删除值
  ```

  

- 多表关联：复杂多表查询优先写 XML，禁止使用 Wrapper 拼接多表条件（可读性差）

### 4.3 事务管理

- 作用域：仅在 Service 层添加 `@Transactional`，禁止在 Controller/Mapper 层使用

- 只读优化：查询方法添加 `@Transactional(readOnly = true)`，提升数据库读取性能

- 回滚配置：

  ```
  // 需回滚所有异常（包括受检异常）
  @Transactional(rollbackFor = Exception.class)
  public void createOrder(OrderDTO orderDTO) throws BusinessException {
      // 业务逻辑
  }
  ```

  

- 禁止场景：

  1. 同类内部调用事务方法（A 方法调用本类 B 方法，B 方法的事务失效）
  2. 事务方法内包含耗时操作（如第三方接口调用、文件 IO）

  

## 5. 安全与性能

### 5.1 安全规范（业务落地版）

- 输入校验：Controller 层使用 @Validated \+ JSR-380 注解，禁止仅前端校验：

  ```
  @PostMapping("/order/create")
  public Result<Long> createOrder(@Validated @RequestBody OrderCreateDTO dto) {
      return Result.success(orderService.createOrder(dto));
  }
  
  // DTO 校验注解
  @Data
  public class OrderCreateDTO {
      @NotNull(message = "用户ID不能为空")
      private Long userId;
  
      @NotBlank(message = "订单号不能为空")
      @Pattern(regexp = "^ORDER\\d{12}$", message = "订单号格式错误")
      private String orderNo;
  
      @Min(value = 1, message = "订单金额不能小于1元")
      private BigDecimal amount;
  }
  ```

  

- SQL 注入防护：禁止 ${} 拼接 SQL，必须使用 #{} 预编译：

  ```
  <!-- 正确 -->
  <select id="getUserById" resultType="com.company.user.entity.UserDO">
      SELECT id, name FROM t_user WHERE id = #{id}
  </select>
  <!-- 错误（存在注入风险） -->
  <select id="getUserById" resultType="com.company.user.entity.UserDO">
      SELECT id, name FROM t_user WHERE id = ${id}
  </select>
  ```

  

- 敏感数据处理：

  1. 密码：BCrypt 加密存储，禁止明文 / MD5 加密：

     ```
     String encryptPwd = BCrypt.hashpw(rawPwd, BCrypt.gensalt());
     boolean match = BCrypt.checkpw(rawPwd, encryptPwd);
     ```

  2. 日志脱敏：使用工具类统一处理：

     ```
     // 手机号脱敏：13800138000 → 138****8000
     public static String maskMobile(String mobile) {
         if (StringUtils.isBlank(mobile) || mobile.length() != 11) {
             return mobile;
         }
         return mobile.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
     }
     ```

  

- 配置安全：数据库密码、AccessKey 等禁止硬编码，通过 Nacos + 环境变量注入：

  ```
  # application.yml
  spring:
    datasource:
      password: ${DB_PASSWORD:default} # 优先读取环境变量，无则用默认值（仅测试环境）
  ```

  

### 5.2 性能与并发

- 集合优化：

  1. 初始化指定容量：`new ArrayList<>(100)`（避免扩容复制数组）
  2. 遍历：ArrayList 用普通 for 循环，LinkedList 用 foreach / 迭代器
  3. 禁止：频繁调用 `list.add()` 后转数组（改用 `ArrayList.toArray(new T[0])`）

  

- 线程池规范：禁止使用 Executors创建（FixedThreadPool/CachedThreadPool 易 OOM），必须自定义 ThreadPoolTaskExecutor：

  ```
  @Bean
  public ThreadPoolTaskExecutor orderThreadPool() {
      ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
      executor.setCorePoolSize(8); // 核心线程数
      executor.setMaxPoolSize(16); // 最大线程数
      executor.setQueueCapacity(1000); // 队列容量
      executor.setKeepAliveSeconds(60); // 空闲线程存活时间
      executor.setThreadNamePrefix("order-"); // 线程名前缀（便于排查）
      // 拒绝策略：丢弃并抛异常（生产环境可改为DiscardOldestPolicy）
      executor.setRejectedExecutionHandler(new AbortPolicy());
      executor.initialize();
      return executor;
  }
  ```

- 缓存优化（Redis）：

  |   问题   |               解决方案               |
  | :------: | :----------------------------------: |
  | 缓存穿透 | 空值缓存（设置短期 TTL）+ 布隆过滤器 |
  | 缓存击穿 |     热点 Key 永不过期 + 分布式锁     |
  | 缓存雪崩 |   随机 TTL（如 300±60s）+ 集群部署   |
  | 缓存更新 | 写操作后更新缓存（先更库，再删缓存） |

  

## 附录：AI 代码审查清单

提交 AI 生成的代码前，必须自检以下项：

### 基础编码

1. 命名 / 格式是否符合规范，无魔法值、拼音混英文
2. Lombok 注解是否误用（Entity 未用 @Data）
3. 空值处理是否合规（Optional/CollectionUtils/StringUtils）
4. 日志是否使用 {} 占位符，无敏感信息、无 e.printStackTrace ()

### 业务逻辑

1. 异常是否分类处理，统一返回 Result 格式
2. 事务注解是否加在 Service 层，rollbackFor 是否配置
3. DO/DTO/VO 是否混用，转换是否使用 MapStruct

### 持久层

1. SQL 是否禁止 SELECT *，索引是否合理，无深分页
2. MyBatis-Plus 是否使用 LambdaQueryWrapper，无 for 循环批量操作
3. 逻辑删除是否启用，无物理删除业务数据

### 微服务 / 安全

1. OpenFeign 是否配置超时 / 降级，上下文是否透传
2. 接口是否做参数校验，无 SQL 注入风险
3. 敏感数据（密码 / 手机号）是否加密 / 脱敏

### 性能 / 并发

1. 集合是否指定初始容量，线程池是否自定义配置
2. 缓存（Redis）是否处理穿透 / 击穿 / 雪崩问题
3. 写操作接口是否实现幂等性