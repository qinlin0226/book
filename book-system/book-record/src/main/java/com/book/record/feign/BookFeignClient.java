package com.book.record.feign;

import com.book.common.dto.BookInfoResponse;
import com.book.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * 图书服务远程调用接口，负责获取图书详情信息。
 *
 * @author OpenCode
 */
@FeignClient(name = "book-book", fallbackFactory = BookFeignClientFallbackFactory.class)
public interface BookFeignClient {

    /**
     * 根据图书ID查询详情。
     *
     * @param bookId 图书ID
     * @return 图书详情
     */
    @GetMapping("/book/{id}")
    Result<BookInfoResponse> getBook(@PathVariable("id") Long bookId);
}
