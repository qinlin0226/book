package com.book.recommend.dto;

import com.book.common.dto.BookInfoResponse;
import com.book.common.dto.ReadingRecordResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 推荐响应对象，封装推荐图书和最近阅读数据。
 *
 * @author OpenCode
 */
@Getter
@Setter
public class RecommendResponse {

    /**
     * 推荐图书列表
     */
    private List<BookInfoResponse> recommends;

    /**
     * 最近阅读记录
     */
    private List<ReadingRecordResponse> recentlyRead;
}
