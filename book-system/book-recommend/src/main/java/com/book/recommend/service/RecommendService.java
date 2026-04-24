package com.book.recommend.service;

import com.book.common.dto.BookInfoResponse;
import com.book.common.dto.ReadingRecordResponse;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import com.book.common.result.Result;
import com.book.recommend.dto.RecommendResponse;
import com.book.recommend.feign.BookFeignClient;
import com.book.recommend.feign.RecordFeignClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * 推荐服务类，处理推荐聚合和个性化筛选逻辑。
 *
 * @author OpenCode
 */
@Service
public class RecommendService {

    /**
     * 个性化推荐回补抓取倍数
     */
    private static final int PERSONALIZED_FETCH_FACTOR = 3;

    /**
     * 图书远程调用客户端
     */
    private final BookFeignClient bookFeignClient;

    /**
     * 阅读记录远程调用客户端
     */
    private final RecordFeignClient recordFeignClient;

    /**
     * 构造方法注入远程客户端。
     *
     * @param bookFeignClient 图书远程调用客户端
     * @param recordFeignClient 阅读记录远程调用客户端
     */
    public RecommendService(BookFeignClient bookFeignClient, RecordFeignClient recordFeignClient) {
        this.bookFeignClient = bookFeignClient;
        this.recordFeignClient = recordFeignClient;
    }

    /**
     * 获取综合推荐结果。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 推荐聚合结果
     */
    public RecommendResponse getRecommend(Long userId, Integer limit) {
        RecommendResponse response = new RecommendResponse();
        response.setRecommends(fetchBooks(limit));
        response.setRecentlyRead(fetchRecentlyRead(userId, limit));
        return response;
    }

    /**
     * 获取个性化推荐结果。
     *
     * @param userId 当前用户ID
     * @param category 图书分类
     * @param limit 返回数量
     * @return 图书推荐列表
     */
    public List<BookInfoResponse> getPersonalizedRecommend(Long userId, String category, Integer limit) {
        List<BookInfoResponse> seedBooks = fetchBooks(Math.min(limit * PERSONALIZED_FETCH_FACTOR, 30));
        if (!StringUtils.hasText(category)) {
            return seedBooks.stream().limit(limit).toList();
        }

        String targetCategory = category.trim();
        Set<Long> selectedIds = new LinkedHashSet<>();
        List<BookInfoResponse> personalizedBooks = new ArrayList<>();

        // 先优先命中指定分类，再按随机图书回补，避免分类无数据时页面完全空白。
        seedBooks.stream()
                .filter(book -> targetCategory.equalsIgnoreCase(book.getCategory()))
                .forEach(book -> addBookIfAbsent(personalizedBooks, selectedIds, book, limit));

        seedBooks.forEach(book -> addBookIfAbsent(personalizedBooks, selectedIds, book, limit));
        return personalizedBooks;
    }

    /**
     * 拉取图书推荐列表。
     *
     * @param limit 返回数量
     * @return 图书推荐列表
     */
    private List<BookInfoResponse> fetchBooks(Integer limit) {
        return extractData(bookFeignClient.getRandomBooks(limit), "获取图书推荐失败");
    }

    /**
     * 拉取最近阅读列表。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 最近阅读列表
     */
    private List<ReadingRecordResponse> fetchRecentlyRead(Long userId, Integer limit) {
        return extractData(recordFeignClient.getRecentlyRead(userId, limit), "获取最近阅读记录失败");
    }

    /**
     * 提取远程调用结果数据。
     *
     * @param result 远程调用结果
     * @param errorMessage 失败消息
     * @param <T> 数据类型
     * @return 业务数据
     */
    private <T> T extractData(Result<T> result, String errorMessage) {
        if (result == null || result.getCode() == null || !Objects.equals(result.getCode(), 200) || result.getData() == null) {
            throw new BusinessException(ResultCode.REMOTE_ERROR, errorMessage);
        }
        return result.getData();
    }

    /**
     * 向结果集中去重追加图书。
     *
     * @param books 结果集
     * @param selectedIds 已选图书ID集合
     * @param book 当前图书
     * @param limit 返回上限
     */
    private void addBookIfAbsent(List<BookInfoResponse> books, Set<Long> selectedIds, BookInfoResponse book, Integer limit) {
        if (books.size() >= limit || book == null || book.getId() == null) {
            return;
        }
        if (selectedIds.add(book.getId())) {
            books.add(book);
        }
    }
}
