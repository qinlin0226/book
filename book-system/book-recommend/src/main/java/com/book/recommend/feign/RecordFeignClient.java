package com.book.recommend.feign;

import com.book.common.dto.ReadingRecordResponse;
import com.book.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 阅读记录服务远程调用接口，负责获取最近阅读记录。
 *
 * @author OpenCode
 */
@FeignClient(name = "book-record", fallbackFactory = RecordFeignClientFallbackFactory.class)
public interface RecordFeignClient {

    /**
     * 获取用户最近阅读记录。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 阅读记录列表
     */
    @GetMapping("/record/recently-read")
    Result<List<ReadingRecordResponse>> getRecentlyRead(@RequestHeader("X-User-Id") Long userId,
                                                        @RequestParam("limit") Integer limit);
}
