package com.book.record.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.common.dto.BookInfoResponse;
import com.book.common.dto.ReadingRecordResponse;
import com.book.common.entity.ReadingRecord;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import com.book.common.result.Result;
import com.book.record.feign.BookFeignClient;
import com.book.record.mapper.ReadingRecordMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 阅读记录服务类，处理阅读记录查询、创建和状态维护业务。
 *
 * @author OpenCode
 */
@Service
public class RecordService {

    /**
     * 最近阅读接口最大返回数量
     */
    private static final int MAX_RECENT_LIMIT = 20;

    /**
     * 阅读记录数据访问组件
     */
    private final ReadingRecordMapper recordMapper;

    /**
     * 图书远程调用客户端
     */
    private final BookFeignClient bookFeignClient;

    /**
     * 构造方法注入依赖。
     *
     * @param recordMapper 阅读记录数据访问组件
     * @param bookFeignClient 图书远程调用客户端
     */
    public RecordService(ReadingRecordMapper recordMapper, BookFeignClient bookFeignClient) {
        this.recordMapper = recordMapper;
        this.bookFeignClient = bookFeignClient;
    }

    /**
     * 分页查询阅读记录。
     *
     * @param userId 当前用户ID
     * @param page 页码
     * @param size 页大小
     * @param readStatus 阅读状态
     * @return 阅读记录分页数据
     */
    public Page<ReadingRecordResponse> listRecords(Long userId, Integer page, Integer size, Integer readStatus) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId).eq(ReadingRecord::getIsDeleted, 0);
        if (readStatus != null) {
            wrapper.eq(ReadingRecord::getReadStatus, readStatus);
        }
        wrapper.orderByDesc(ReadingRecord::getUpdateTime);

        List<ReadingRecord> records = recordMapper.selectList(wrapper);
        List<ReadingRecordResponse> visibleRecords = filterVisibleRecords(records, null);
        return buildPage(visibleRecords, page, size);
    }

    /**
     * 查询单条阅读记录。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @return 阅读记录详情
     */
    public ReadingRecordResponse getRecordById(Long id, Long userId) {
        ReadingRecord record = getOwnedRecord(id, userId);
        if (Boolean.FALSE.equals(isBookVisible(record.getBookId(), new HashMap<>()))) {
            throw new BusinessException(ResultCode.NOT_FOUND, "图书已下架或不存在");
        }
        return toReadingRecordResponse(record);
    }

    /**
     * 创建阅读记录。
     *
     * @param userId 当前用户ID
     * @param bookId 图书ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void createRecord(Long userId, Long bookId) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId)
                .eq(ReadingRecord::getBookId, bookId)
                .eq(ReadingRecord::getIsDeleted, 0);
        if (recordMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.CONFLICT, "阅读记录已存在");
        }

        BookInfoResponse book = getBookInfo(bookId);
        if (!Integer.valueOf(1).equals(book.getStatus())) {
            throw new BusinessException(ResultCode.CONFLICT, "图书已下架");
        }
        if (!StringUtils.hasText(book.getTitle())) {
            throw new BusinessException(ResultCode.REMOTE_ERROR, "图书信息不完整");
        }

        ReadingRecord record = new ReadingRecord();
        record.setUserId(userId);
        record.setBookId(bookId);
        record.setBookTitle(book.getTitle());
        record.setBookCover(book.getCoverUrl());
        record.setReadStatus(1);
        fillCreateFields(record);
        recordMapper.insert(record);
    }

    /**
     * 更新阅读状态。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @param readStatus 阅读状态
     */
    public void updateStatus(Long id, Long userId, Integer readStatus) {
        if (!Integer.valueOf(0).equals(readStatus) && !Integer.valueOf(1).equals(readStatus) && !Integer.valueOf(2).equals(readStatus)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "阅读状态参数不合法");
        }
        ReadingRecord record = getOwnedRecord(id, userId);
        record.setReadStatus(readStatus);
        touchUpdateTime(record);
        recordMapper.updateById(record);
    }

    /**
     * 删除阅读记录。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     */
    public void deleteRecord(Long id, Long userId) {
        getOwnedRecord(id, userId);
        recordMapper.deleteById(id);
    }

    /**
     * 查询最近阅读记录。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 最近阅读列表
     */
    public List<ReadingRecordResponse> getRecentlyRead(Long userId, Integer limit) {
        int safeLimit = Math.min(limit, MAX_RECENT_LIMIT);
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId)
                .eq(ReadingRecord::getIsDeleted, 0)
                .orderByDesc(ReadingRecord::getUpdateTime);

        List<ReadingRecord> records = recordMapper.selectList(wrapper);
        return filterVisibleRecords(records, safeLimit);
    }

    /**
     * 过滤可见图书的阅读记录。
     *
     * @param records 原始记录列表
     * @param limit 返回数量限制
     * @return 过滤后的记录列表
     */
    private List<ReadingRecordResponse> filterVisibleRecords(List<ReadingRecord> records, Integer limit) {
        Map<Long, Boolean> visibleBookCache = new HashMap<>();
        List<ReadingRecordResponse> visibleRecords = new ArrayList<>();

        for (ReadingRecord record : records) {
            if (isBookVisible(record.getBookId(), visibleBookCache)) {
                visibleRecords.add(toReadingRecordResponse(record));
                if (limit != null && visibleRecords.size() >= limit) {
                    break;
                }
            }
        }
        return visibleRecords;
    }

    /**
     * 判断图书是否对外可见。
     *
     * @param bookId 图书ID
     * @param visibleBookCache 可见性缓存
     * @return true-可见，false-不可见
     */
    private boolean isBookVisible(Long bookId, Map<Long, Boolean> visibleBookCache) {
        return visibleBookCache.computeIfAbsent(bookId, id -> {
            try {
                return Integer.valueOf(1).equals(getBookInfo(id).getStatus());
            } catch (BusinessException exception) {
                return false;
            }
        });
    }

    /**
     * 根据图书ID获取图书信息。
     *
     * @param bookId 图书ID
     * @return 图书信息
     */
    private BookInfoResponse getBookInfo(Long bookId) {
        Result<BookInfoResponse> result = bookFeignClient.getBook(bookId);
        if (result == null || result.getCode() == null || !Objects.equals(result.getCode(), 200) || result.getData() == null) {
            throw new BusinessException(ResultCode.REMOTE_ERROR, "获取图书信息失败");
        }
        return result.getData();
    }

    /**
     * 获取当前用户拥有的记录。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @return 阅读记录实体
     */
    private ReadingRecord getOwnedRecord(Long id, Long userId) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getId, id)
                .eq(ReadingRecord::getUserId, userId)
                .eq(ReadingRecord::getIsDeleted, 0);
        ReadingRecord record = recordMapper.selectOne(wrapper);
        if (record == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "阅读记录不存在");
        }
        return record;
    }

    /**
     * 手动构建分页结果。
     *
     * @param records 记录列表
     * @param page 页码
     * @param size 页大小
     * @return 分页结果
     */
    private Page<ReadingRecordResponse> buildPage(List<ReadingRecordResponse> records, Integer page, Integer size) {
        Page<ReadingRecordResponse> result = new Page<>(page, size, records.size());
        long startIndex = Math.max(0, (long) (page - 1) * size);
        long endIndex = Math.min(records.size(), startIndex + size);

        if (startIndex >= records.size()) {
            result.setRecords(List.of());
            return result;
        }

        result.setRecords(records.subList((int) startIndex, (int) endIndex));
        return result;
    }

    /**
     * 转换阅读记录响应对象。
     *
     * @param record 阅读记录实体
     * @return 阅读记录响应
     */
    private ReadingRecordResponse toReadingRecordResponse(ReadingRecord record) {
        ReadingRecordResponse response = new ReadingRecordResponse();
        response.setId(record.getId());
        response.setUserId(record.getUserId());
        response.setBookId(record.getBookId());
        response.setBookTitle(record.getBookTitle());
        response.setBookCover(record.getBookCover());
        response.setReadStatus(record.getReadStatus());
        response.setUpdateTime(record.getUpdateTime());
        return response;
    }

    /**
     * 填充新增通用字段。
     *
     * @param record 阅读记录实体
     */
    private void fillCreateFields(ReadingRecord record) {
        LocalDateTime now = LocalDateTime.now();
        record.setCreateTime(now);
        record.setUpdateTime(now);
        record.setIsDeleted(0);
    }

    /**
     * 更新时间字段。
     *
     * @param record 阅读记录实体
     */
    private void touchUpdateTime(ReadingRecord record) {
        record.setUpdateTime(LocalDateTime.now());
    }
}
