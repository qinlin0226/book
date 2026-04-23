package com.book.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.ReadingRecord;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户阅读记录数据访问接口
 *
 * @author OpenCode
 */
@Mapper
public interface ReadingRecordMapper extends BaseMapper<ReadingRecord> {
    /**
     * 按用户ID物理删除阅读记录
     *
     * @param userId 用户ID
     * @return 影响行数
     */
    @Delete("DELETE FROM t_reading_record WHERE user_id = #{userId}")
    int deletePhysicalByUserId(@Param("userId") Long userId);
}
