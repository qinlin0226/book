package com.book.recommend.dto;

import com.book.common.entity.Book;
import com.book.common.entity.ReadingRecord;
import lombok.Data;

import java.util.List;

@Data
public class RecommendResponse {
    private List<Book> recommends;
    private List<ReadingRecord> recentlyRead;
}