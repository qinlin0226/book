package com.book.recommend.feign;

import com.book.common.dto.BookInfoResponse;
import com.book.common.enums.ResultCode;
import com.book.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 图书服务降级工厂，负责构造图书远程调用失败后的兜底逻辑。
 *
 * @author OpenCode
 */
@Slf4j
@Component
public class BookFeignClientFallbackFactory implements FallbackFactory<BookFeignClient> {

    /**
     * 创建图书服务降级实现。
     *
     * @param cause 触发降级的异常
     * @return 图书服务降级实现
     */
    @Override
    public BookFeignClient create(Throwable cause) {
        log.error("图书服务调用降级", cause);
        return limit -> Result.fail(ResultCode.REMOTE_ERROR.getCode(), "图书服务暂不可用");
    }
}
