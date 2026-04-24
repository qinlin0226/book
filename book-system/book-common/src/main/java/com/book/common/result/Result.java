package com.book.common.result;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * 通用返回体，统一接口响应结构。
 *
 * @param <T> 响应数据类型
 * @author OpenCode
 */
@Getter
@Setter
@NoArgsConstructor
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 成功状态码
     */
    private static final Integer SUCCESS_CODE = 200;

    /**
     * 默认成功消息
     */
    private static final String SUCCESS_MESSAGE = "success";

    /**
     * 默认失败状态码
     */
    private static final Integer DEFAULT_ERROR_CODE = 500;

    /**
     * 响应码
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 响应时间戳
     */
    private Long timestamp;

    /**
     * 返回无数据成功结果。
     *
     * @param <T> 响应数据类型
     * @return 成功结果
     */
    public static <T> Result<T> success() {
        return success(null);
    }

    /**
     * 返回带数据成功结果。
     *
     * @param data 响应数据
     * @param <T> 响应数据类型
     * @return 成功结果
     */
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(SUCCESS_CODE);
        result.setMessage(SUCCESS_MESSAGE);
        result.setData(data);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }

    /**
     * 返回默认失败结果。
     *
     * @param message 错误信息
     * @param <T> 响应数据类型
     * @return 失败结果
     */
    public static <T> Result<T> fail(String message) {
        return fail(DEFAULT_ERROR_CODE, message);
    }

    /**
     * 返回指定状态码失败结果。
     *
     * @param code 状态码
     * @param message 错误信息
     * @param <T> 响应数据类型
     * @return 失败结果
     */
    public static <T> Result<T> fail(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }
}
