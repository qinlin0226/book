package com.book.book.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.Book;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 图书数据访问接口
 *
 * @author OpenCode
 */
@Mapper
public interface BookMapper extends BaseMapper<Book> {

    /**
     * 按ID物理删除图书
     *
     * @param id 图书ID
     * @return 影响行数
     */
    @Delete("DELETE FROM t_book WHERE id = #{id}")
    int deletePhysicalById(@Param("id") Long id);
}
