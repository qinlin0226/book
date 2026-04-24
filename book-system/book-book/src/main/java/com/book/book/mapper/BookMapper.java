package com.book.book.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.Book;
import org.apache.ibatis.annotations.Mapper;

/**
 * 图书数据访问接口，负责图书表持久化操作。
 *
 * @author OpenCode
 */
@Mapper
public interface BookMapper extends BaseMapper<Book> {
}
