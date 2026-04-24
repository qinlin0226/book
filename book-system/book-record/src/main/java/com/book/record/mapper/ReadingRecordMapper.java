package com.book.record.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.book.common.entity.ReadingRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 阅读记录数据访问接口，负责阅读记录表持久化操作。
 *
 * @author OpenCode
 */
@Mapper
public interface ReadingRecordMapper extends BaseMapper<ReadingRecord> {
}
