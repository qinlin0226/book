package com.book.recommend.feign;

import com.book.common.entity.Book;
import com.book.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "book-book")
public interface BookFeignClient {

    @GetMapping("/book/random")
    Result<List<Book>> getRandomBooks(@RequestParam("limit") Integer limit);
}
