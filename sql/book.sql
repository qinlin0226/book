-- ----------------------------
-- 1. 用户表 (t_user)
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID，自增',
  `username` varchar(64) NOT NULL COMMENT '用户名，用于登录',
  `password` varchar(128) NOT NULL COMMENT '登录密码，加密存储',
  `nickname` varchar(64) DEFAULT NULL COMMENT '用户昵称，展示在个人中心',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT '用户头像链接',
  `role` tinyint(4) NOT NULL DEFAULT '0' COMMENT '角色：0-普通用户，1-管理员',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '账号状态：0-禁用，1-正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`) COMMENT '用户名唯一索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- ----------------------------
-- 2. 图书表 (t_book)
-- ----------------------------
DROP TABLE IF EXISTS `t_book`;
CREATE TABLE `t_book` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID，自增',
  `title` varchar(128) NOT NULL COMMENT '图书标题',
  `author` varchar(64) NOT NULL COMMENT '图书作者',
  `cover_url` varchar(255) DEFAULT NULL COMMENT '图书封面链接',
  `description` text COMMENT '图书简介',
  `category` varchar(64) DEFAULT NULL COMMENT '图书分类',
  `publish_year` int(11) DEFAULT NULL COMMENT '出版年份',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '上架状态：0-下架，1-上架',
  `read_count` bigint(20) NOT NULL DEFAULT '0' COMMENT '阅读次数(冗余字段，用于热门推荐)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`) COMMENT '分类索引',
  KEY `idx_status` (`status`) COMMENT '上架状态索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书信息表';

-- ----------------------------
-- 3. 阅读记录表 (t_reading_record)
-- 变更点：read_progress 改为 read_status (0-已读，1-未读)
-- ----------------------------
DROP TABLE IF EXISTS `t_reading_record`;
CREATE TABLE `t_reading_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID，自增',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `book_id` bigint(20) NOT NULL COMMENT '图书ID',
  `book_title` varchar(128) NOT NULL COMMENT '图书标题(冗余字段，避免关联查询)',
  `book_cover` varchar(255) DEFAULT NULL COMMENT '图书封面(冗余字段，个人中心展示用)',
  `read_status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '阅读状态：0-已读，1-未读',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加记录时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除(用户删除记录)',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_book_id` (`book_id`) COMMENT '图书ID索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户阅读记录表';

ALTER TABLE t_reading_record MODIFY id BIGINT AUTO_INCREMENT;
ALTER TABLE t_book MODIFY id BIGINT AUTO_INCREMENT;
ALTER TABLE t_user MODIFY id BIGINT AUTO_INCREMENT;

ALTER TABLE t_reading_record
ADD CONSTRAINT fk_reading_user
FOREIGN KEY (user_id) REFERENCES t_user(id)
ON UPDATE CASCADE;

ALTER TABLE t_reading_record
ADD CONSTRAINT fk_reading_book
FOREIGN KEY (book_id) REFERENCES t_book(id)
ON UPDATE CASCADE;
-- ----------------------------
-- 初始化数据
-- ----------------------------

-- 1. 插入用户
INSERT INTO `t_user` (`username`, `password`, `nickname`, `avatar_url`, `role`, `status`) VALUES
('admin', 'e10adc3949ba59abbe56e057f20f883e', '系统管理员', '/img/avatar/admin.png', 1, 1),
('zhangsan', 'e10adc3949ba59abbe56e057f20f883e', '张三', '/img/avatar/user1.png', 0, 1),
('lisi', 'e10adc3949ba59abbe56e057f20f883e', '李四', '/img/avatar/user2.png', 0, 1);

INSERT INTO `t_user` (`username`, `password`, `nickname`, `avatar_url`, `role`, `status`) VALUES
('123', 'e10adc3949ba59abbe56e057f20f883e', '1', '/img/avatar/admin.png', 0, 1),
('1234', 'e10adc3949ba59abbe56e057f20f883e', '2', '/img/avatar/user1.png', 0, 1),
('12345', 'e10adc3949ba59abbe56e057f20f883e', '3', '/img/avatar/user2.png', 0, 1);


-- 2. 插入图书
INSERT INTO `t_book` (`title`, `author`, `cover_url`, `description`, `category`, `publish_year`, `status`, `read_count`) VALUES
('深入理解计算机系统', 'Randal E. Bryant', '/img/book/csapp.jpg', '程序员必读经典。', '计算机技术', 2016, 1, 1024),
('三体全集', '刘慈欣', '/img/book/3body.jpg', '中国科幻文学里程碑。', '科幻小说', 2008, 1, 856),
('人类简史', '尤瓦尔·赫拉利', '/img/book/sapiens.jpg', '讲述人类进化历程。', '历史人文', 2014, 1, 532),
('旧书回收示例', '佚名', '/img/book/old.jpg', '这是一本已经下架的旧书。', '其他', 1990, 0, 12);

-- 3. 插入阅读记录 (用户ID为2，即zhangsan)
-- 记录1：深入理解计算机系统 -> 状态：0 (已读)
-- 记录2：三体全集 -> 状态：0 (已读)
-- 记录3：人类简史 -> 状态：1 (未读)
INSERT INTO `t_reading_record` (`user_id`, `book_id`, `book_title`, `book_cover`, `read_status`) VALUES
(2, 1, '深入理解计算机系统', '/img/book/csapp.jpg', 0),
(2, 2, '三体全集', '/img/book/3body.jpg', 0),
(2, 3, '人类简史', '/img/book/sapiens.jpg', 1),
(3, 2, '三体全集', '/img/book/3body.jpg', 0);