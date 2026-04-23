package com.book.record.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.common.entity.ReadingRecord;
import com.book.common.result.Result;
import com.book.record.dto.RecordCreateRequest;
import com.book.record.dto.StatusUpdateRequest;
import com.book.record.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/record")
public class RecordController {

    @Autowired
    private RecordService recordService;

    @GetMapping
    public Result<Page<ReadingRecord>> listRecords(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer readStatus) {
        return Result.success(recordService.listRecords(userId, page, size, readStatus));
    }

    @GetMapping("/{id}")
    public Result<ReadingRecord> getRecord(@PathVariable Long id,
                                           @RequestHeader("X-User-Id") Long userId) {
        ReadingRecord record = recordService.getRecordById(id);
        if (!record.getUserId().equals(userId)) {
            return Result.error(403, "无权限访问");
        }
        return Result.success(record);
    }

    @GetMapping("/recently-read")
    public Result<List<ReadingRecord>> getRecentlyRead(@RequestHeader("X-User-Id") Long userId,
                                                       @RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(recordService.getRecentlyRead(userId, limit));
    }

    @PostMapping
    public Result<Void> createRecord(@RequestHeader("X-User-Id") Long userId,
                                    @RequestBody RecordCreateRequest request) {
        recordService.createRecord(userId, request.getBookId());
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                    @RequestHeader("X-User-Id") Long userId,
                                    @RequestBody StatusUpdateRequest request) {
        recordService.updateStatus(id, userId, request.getReadStatus());
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteRecord(@PathVariable Long id,
                                     @RequestHeader("X-User-Id") Long userId) {
        recordService.deleteRecord(id, userId);
        return Result.success();
    }
}
