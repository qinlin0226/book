package com.book.recommend.feign;

import com.book.common.dto.ReadingRecordResponse;
import com.book.common.enums.ResultCode;
import com.book.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 阅读记录服务降级工厂，负责构造阅读记录远程调用失败后的兜底逻辑。
 *
 * @author OpenCode
 */
@Slf4j
@Component
public class RecordFeignClientFallbackFactory implements FallbackFactory<RecordFeignClient> {

    /**
     * 创建阅读记录服务降级实现。
     *
     * @param cause 触发降级的异常
     * @return 阅读记录服务降级实现
     */
    @Override
    public RecordFeignClient create(Throwable cause) {
        log.error("阅读记录服务调用降级", cause);
        return (userId, limit) -> Result.fail(ResultCode.REMOTE_ERROR.getCode(), "阅读记录服务暂不可用");
    }
}
