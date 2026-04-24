package com.book.recommend.feign;

import com.book.common.dto.BookInfoResponse;
import com.book.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 图书服务远程调用接口，负责获取随机图书数据。
 *
 * @author OpenCode
 */
@FeignClient(name = "book-book", fallbackFactory = BookFeignClientFallbackFactory.class)
public interface BookFeignClient {

    /**
     * 获取随机图书列表。
     *
     * @param limit 返回数量
     * @return 图书列表
     */
    @GetMapping("/book/random")
    Result<List<BookInfoResponse>> getRandomBooks(@RequestParam("limit") Integer limit);
}
