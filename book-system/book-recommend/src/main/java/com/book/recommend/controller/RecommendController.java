package com.book.recommend.controller;

import com.book.common.dto.BookInfoResponse;
import com.book.common.result.Result;
import com.book.recommend.dto.RecommendResponse;
import com.book.recommend.service.RecommendService;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 推荐控制器，负责聚合推荐与个性化推荐接口。
 *
 * @author OpenCode
 */
@Validated
@RestController
@RequestMapping("/recommend")
public class RecommendController {

    /**
     * 推荐业务服务
     */
    private final RecommendService recommendService;

    /**
     * 构造方法注入推荐服务。
     *
     * @param recommendService 推荐业务服务
     */
    public RecommendController(RecommendService recommendService) {
        this.recommendService = recommendService;
    }

    /**
     * 查询综合推荐结果。
     *
     * @param userId 当前用户ID
     * @param limit 返回数量
     * @return 综合推荐结果
     */
    @GetMapping
    public Result<RecommendResponse> getRecommend(@RequestHeader("X-User-Id") Long userId,
                                                  @RequestParam(defaultValue = "10") @Min(value = 1, message = "返回数量必须大于0") Integer limit) {
        return Result.success(recommendService.getRecommend(userId, limit));
    }

    /**
     * 查询个性化推荐结果。
     *
     * @param userId 当前用户ID
     * @param category 指定分类
     * @param limit 返回数量
     * @return 图书推荐列表
     */
    @GetMapping("/personalized")
    public Result<List<BookInfoResponse>> getPersonalized(@RequestHeader("X-User-Id") Long userId,
                                                          @RequestParam(required = false) String category,
                                                          @RequestParam(defaultValue = "10") @Min(value = 1, message = "返回数量必须大于0") Integer limit) {
        return Result.success(recommendService.getPersonalizedRecommend(userId, category, limit));
    }
}
