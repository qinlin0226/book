package com.book.recommend.service;

import com.book.common.entity.Book;
import com.book.common.entity.ReadingRecord;
import com.book.recommend.dto.RecommendResponse;
import com.book.recommend.feign.BookFeignClient;
import com.book.recommend.feign.RecordFeignClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecommendService {

    @Autowired
    private BookFeignClient bookFeignClient;

    @Autowired
    private RecordFeignClient recordFeignClient;

    public RecommendResponse getRecommend(Long userId, Integer limit) {
        RecommendResponse response = new RecommendResponse();

        List<Book> randomBooks = bookFeignClient.getRandomBooks(limit).getData();
        response.setRecommends(randomBooks);

        List<ReadingRecord> recentlyRead = recordFeignClient.getRecentlyRead(userId, limit).getData();
        response.setRecentlyRead(recentlyRead);

        return response;
    }

    public List<Book> getPersonalizedRecommend(Long userId, String category, Integer limit) {
        return bookFeignClient.getRandomBooks(limit).getData();
    }
}
