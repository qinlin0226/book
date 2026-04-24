package com.book.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.ReadingRecord;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 阅读记录数据访问接口，负责用户模块侧的记录清理操作。
 *
 * @author OpenCode
 */
@Mapper
public interface ReadingRecordMapper extends BaseMapper<ReadingRecord> {

    /**
     * 根据用户ID物理删除阅读记录。
     *
     * @param userId 用户ID
     * @return 影响行数
     */
    @Delete("DELETE FROM t_reading_record WHERE user_id = #{userId}")
    int deletePhysicalByUserId(@Param("userId") Long userId);
}
