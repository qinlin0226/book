package com.book.record.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.common.entity.Book;
import com.book.common.entity.ReadingRecord;
import com.book.common.result.Result;
import com.book.record.mapper.ReadingRecordMapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class RecordService {

    @Autowired
    private ReadingRecordMapper recordMapper;

    @Autowired
    private DiscoveryClient discoveryClient;

    @Autowired
    private RestTemplate restTemplate;

    public Page<ReadingRecord> listRecords(Long userId, Integer page, Integer size, Integer readStatus) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId);
        wrapper.eq(ReadingRecord::getIsDeleted, 0);
        if (readStatus != null) {
            wrapper.eq(ReadingRecord::getReadStatus, readStatus);
        }
        wrapper.orderByDesc(ReadingRecord::getUpdateTime);

        List<ReadingRecord> records = recordMapper.selectList(wrapper);
        List<ReadingRecord> visibleRecords = filterVisibleRecords(records, null);

        return buildPage(visibleRecords, page, size);
    }

    public ReadingRecord getRecordById(Long id) {
        ReadingRecord record = recordMapper.selectById(id);
        if (record == null || record.getIsDeleted() == 1) {
            throw new RuntimeException("记录不存在");
        }
        return record;
    }

    public void createRecord(Long userId, Long bookId) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId);
        wrapper.eq(ReadingRecord::getBookId, bookId);
        wrapper.eq(ReadingRecord::getIsDeleted, 0);
        ReadingRecord exist = recordMapper.selectOne(wrapper);

        if (exist != null) {
            throw new RuntimeException("记录已存在");
        }

        Book book = getBookInfo(bookId);

        if (book.getStatus() == null || book.getStatus() != 1) {
            throw new RuntimeException("图书已下架：ID=" + bookId);
        }

        if (!StringUtils.hasText(book.getTitle())) {
            throw new RuntimeException("图书信息不完整：ID=" + bookId);
        }

        String bookTitle = book.getTitle();
        String bookCover = book.getCoverUrl() != null ? book.getCoverUrl() : "";

        ReadingRecord record = new ReadingRecord();
        record.setUserId(userId);
        record.setBookId(bookId);
        record.setBookTitle(bookTitle);
        record.setBookCover(bookCover);
        record.setReadStatus(1);
        record.setCreateTime(LocalDateTime.now());
        record.setUpdateTime(LocalDateTime.now());
        record.setIsDeleted(0);
        recordMapper.insert(record);
    }

    public void updateStatus(Long id, Long userId, Integer readStatus) {
        ReadingRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new RuntimeException("记录不存在：ID=" + id);
        }
        if (!record.getUserId().equals(userId)) {
            throw new RuntimeException("无权限访问此记录：记录ID=" + id + ", 当前用户ID=" + userId);
        }
        if (record.getIsDeleted() == 1) {
            throw new RuntimeException("记录已被删除：ID=" + id);
        }
        record.setReadStatus(readStatus);
        record.setUpdateTime(LocalDateTime.now());
        recordMapper.updateById(record);
    }

    public void deleteRecord(Long id, Long userId) {
        ReadingRecord record = recordMapper.selectById(id);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new RuntimeException("记录不存在或无权限");
        }
        recordMapper.deleteById(id);
    }

    public List<ReadingRecord> getRecentlyRead(Long userId, Integer limit) {
        LambdaQueryWrapper<ReadingRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReadingRecord::getUserId, userId);
        wrapper.eq(ReadingRecord::getIsDeleted, 0);
        wrapper.orderByDesc(ReadingRecord::getUpdateTime);

        List<ReadingRecord> records = recordMapper.selectList(wrapper);
        return filterVisibleRecords(records, limit);
    }

    private Page<ReadingRecord> buildPage(List<ReadingRecord> records, Integer page, Integer size) {
        Page<ReadingRecord> result = new Page<>(page, size);
        result.setTotal(records.size());

        long startIndex = Math.max(0, (long) (page - 1) * size);
        long endIndex = Math.min(records.size(), startIndex + size);

        if (startIndex >= records.size()) {
            result.setRecords(List.of());
            return result;
        }

        result.setRecords(records.subList((int) startIndex, (int) endIndex));
        return result;
    }

    private List<ReadingRecord> filterVisibleRecords(List<ReadingRecord> records, Integer limit) {
        Map<Long, Boolean> visibleBookCache = new HashMap<>();
        List<ReadingRecord> visibleRecords = new ArrayList<>();

        for (ReadingRecord record : records) {
            if (isBookVisible(record.getBookId(), visibleBookCache)) {
                visibleRecords.add(record);
                if (limit != null && visibleRecords.size() >= limit) {
                    break;
                }
            }
        }

        return visibleRecords;
    }

    private boolean isBookVisible(Long bookId, Map<Long, Boolean> visibleBookCache) {
        return visibleBookCache.computeIfAbsent(bookId, id -> {
            try {
                Book book = getBookInfo(id);
                return book.getStatus() != null && book.getStatus() == 1;
            } catch (RuntimeException exception) {
                return false;
            }
        });
    }

    private Book getBookInfo(Long bookId) {
        List<ServiceInstance> instances = discoveryClient.getInstances("book-book");
        
        if (instances == null || instances.isEmpty()) {
            throw new RuntimeException("图书服务不可用：未找到服务实例。请确保 book-book 服务已启动并正确注册到 Nacos。");
        }
        
        ServiceInstance instance = instances.get(0);
        String url = instance.getUri() + "/book/" + bookId;
        
        try {
            ResponseEntity<Result<Book>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Result<Book>>() {
                    }
            );

            Result<Book> result = response.getBody();
            if (result == null || result.getCode() == null || result.getCode() != 200 || result.getData() == null) {
                throw new RuntimeException("图书不存在：ID=" + bookId);
            }

            return result.getData();
        } catch (Exception e) {
            throw new RuntimeException("获取图书信息失败：URL=" + url + ", 错误：" + e.getMessage());
        }
    }
}
