package com.book.recommend.controller;

import com.book.common.result.Result;
import com.book.recommend.dto.RecommendResponse;
import com.book.recommend.service.RecommendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recommend")
public class RecommendController {

    @Autowired
    private RecommendService recommendService;

    @GetMapping
    public Result<RecommendResponse> getRecommend(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(recommendService.getRecommend(userId, limit));
    }

    @GetMapping("/personalized")
    public Result<?> getPersonalized(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(recommendService.getPersonalizedRecommend(userId, category, limit));
    }
}