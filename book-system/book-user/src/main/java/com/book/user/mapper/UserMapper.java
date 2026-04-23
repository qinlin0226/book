package com.book.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户数据访问接口
 *
 * @author OpenCode
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    /**
     * 物理删除用户主记录
     *
     * @param id 用户ID
     * @return 影响行数
     */
    @Delete("DELETE FROM t_user WHERE id = #{id}")
    int deletePhysicalById(@Param("id") Long id);
}
