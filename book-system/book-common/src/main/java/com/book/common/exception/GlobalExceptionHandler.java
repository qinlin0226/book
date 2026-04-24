package com.book.common.exception;

import com.book.common.enums.ResultCode;
import com.book.common.result.Result;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Optional;

/**
 * 全局异常处理器，统一转换服务异常响应。
 *
 * @author OpenCode
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常。
     *
     * @param exception 业务异常
     * @return 统一失败结果
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException exception) {
        log.warn("业务异常：code={}, message={}", exception.getCode(), exception.getMessage());
        return Result.fail(exception.getCode(), exception.getMessage());
    }

    /**
     * 处理请求体参数校验异常。
     *
     * @param exception 参数校验异常
     * @return 统一失败结果
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception) {
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), extractBindMessage(exception.getBindingResult().getFieldError()));
    }

    /**
     * 处理表单参数校验异常。
     *
     * @param exception 绑定异常
     * @return 统一失败结果
     */
    @ExceptionHandler(BindException.class)
    public Result<Void> handleBindException(BindException exception) {
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), extractBindMessage(exception.getBindingResult().getFieldError()));
    }

    /**
     * 处理约束校验异常。
     *
     * @param exception 约束校验异常
     * @return 统一失败结果
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public Result<Void> handleConstraintViolationException(ConstraintViolationException exception) {
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), exception.getMessage());
    }

    /**
     * 处理未捕获系统异常。
     *
     * @param exception 系统异常
     * @return 统一失败结果
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception exception) {
        log.error("系统异常", exception);
        return Result.fail(ResultCode.SYSTEM_ERROR.getCode(), ResultCode.SYSTEM_ERROR.getMessage());
    }

    /**
     * 提取字段校验失败消息。
     *
     * @param fieldError 字段错误
     * @return 友好错误消息
     */
    private String extractBindMessage(FieldError fieldError) {
        return Optional.ofNullable(fieldError)
                .map(FieldError::getDefaultMessage)
                .orElse(ResultCode.BAD_REQUEST.getMessage());
    }
}
