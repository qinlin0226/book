package com.book.record.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.common.dto.ReadingRecordResponse;
import com.book.common.result.Result;
import com.book.record.dto.RecordCreateRequest;
import com.book.record.dto.StatusUpdateRequest;
import com.book.record.service.RecordService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 阅读记录控制器，负责阅读记录查询和维护接口。
 *
 * @author OpenCode
 */
@Validated
@RestController
@RequestMapping("/record")
public class RecordController {

    /**
     * 阅读记录业务服务
     */
    private final RecordService recordService;

    /**
     * 构造方法注入阅读记录服务。
     *
     * @param recordService 阅读记录业务服务
     */
    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    /**
     * 分页查询当前用户阅读记录。
     *
     * @param userId 当前用户ID
     * @param page 页码
     * @param size 页大小
     * @param readStatus 阅读状态
     * @return 阅读记录分页数据
     */
    @GetMapping
    public Result<Page<ReadingRecordResponse>> listRecords(@RequestHeader("X-User-Id") Long userId,
                                                           @RequestParam(defaultValue = "1") @Min(value = 1, message = "页码必须大于0") Integer page,
                                                           @RequestParam(defaultValue = "10") @Min(value = 1, message = "分页大小必须大于0") Integer size,
                                                           @RequestParam(required = false) Integer readStatus) {
        return Result.success(recordService.listRecords(userId, page, size, readStatus));
    }

    /**
     * 查询单条阅读记录。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @return 阅读记录详情
     */
    @GetMapping("/{id}")
    public Result<ReadingRecordResponse> getRecord(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return Result.success(recordService.getRecordById(id, userId));
    }

    /**
     * 查询最近阅读记录。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 最近阅读列表
     */
    @GetMapping("/recently-read")
    public Result<List<ReadingRecordResponse>> getRecentlyRead(@RequestHeader("X-User-Id") Long userId,
                                                               @RequestParam(defaultValue = "10") @Min(value = 1, message = "返回数量必须大于0") Integer limit) {
        return Result.success(recordService.getRecentlyRead(userId, limit));
    }

    /**
     * 新增阅读记录。
     *
     * @param userId 当前用户ID
     * @param request 阅读记录创建参数
     * @return 空响应
     */
    @PostMapping
    public Result<Void> createRecord(@RequestHeader("X-User-Id") Long userId,
                                     @Valid @RequestBody RecordCreateRequest request) {
        recordService.createRecord(userId, request.getBookId());
        return Result.success();
    }

    /**
     * 更新阅读状态。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @param request 状态更新参数
     * @return 空响应
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @RequestHeader("X-User-Id") Long userId,
                                     @Valid @RequestBody StatusUpdateRequest request) {
        recordService.updateStatus(id, userId, request.getReadStatus());
        return Result.success();
    }

    /**
     * 删除阅读记录。
     *
     * @param id 记录ID
     * @param userId 当前用户ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteRecord(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        recordService.deleteRecord(id, userId);
        return Result.success();
    }
}
