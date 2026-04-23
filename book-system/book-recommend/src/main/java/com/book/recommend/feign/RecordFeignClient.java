package com.book.recommend.feign;

import com.book.common.entity.ReadingRecord;
import com.book.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "book-record")
public interface RecordFeignClient {

    @GetMapping("/record/recently-read")
    Result<List<ReadingRecord>> getRecentlyRead(@RequestHeader("X-User-Id") Long userId,
                                                @RequestParam("limit") Integer limit);
}
