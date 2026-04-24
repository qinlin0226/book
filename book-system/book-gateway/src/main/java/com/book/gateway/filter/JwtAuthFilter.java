package com.book.gateway.filter;

import com.alibaba.fastjson2.JSON;
import com.book.common.constant.AuthConstant;
import com.book.common.enums.ResultCode;
import com.book.common.result.Result;
import com.book.common.util.JwtTokenProvider;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 网关 JWT 鉴权过滤器，负责拦截请求并透传用户身份。
 *
 * @author OpenCode
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    /**
     * 无需登录即可访问的白名单路径
     */
    private static final List<String> AUTH_WHITE_LIST = List.of(
            "/api/user/login",
            "/api/user/register",
            "/user/login",
            "/user/register"
    );

    /**
     * JWT 令牌提供者
     */
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 构造方法注入 JWT 令牌组件。
     *
     * @param jwtTokenProvider JWT 令牌提供者
     */
    public JwtAuthFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * 过滤请求并校验登录令牌。
     *
     * @param exchange 当前请求上下文
     * @param chain 过滤器链
     * @return 响应结果
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (isWhitelistedRequest(request, path)) {
            return chain.filter(exchange);
        }

        String authorization = request.getHeaders().getFirst(AuthConstant.TOKEN_HEADER);
        if (!StringUtils.hasText(authorization) || !authorization.startsWith(AuthConstant.TOKEN_PREFIX)) {
            return unauthorized(exchange.getResponse(), ResultCode.UNAUTHORIZED.getMessage());
        }

        String token = authorization.substring(AuthConstant.TOKEN_PREFIX.length());
        if (jwtTokenProvider.isTokenExpired(token)) {
            return unauthorized(exchange.getResponse(), "登录已过期，请重新登录");
        }

        try {
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", String.valueOf(jwtTokenProvider.getUserId(token)))
                    .header("X-Username", jwtTokenProvider.getUsername(token))
                    .header("X-User-Role", String.valueOf(jwtTokenProvider.getRole(token)))
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception exception) {
            return unauthorized(exchange.getResponse(), "登录令牌无效");
        }
    }

    /**
     * 设置过滤器顺序，确保鉴权优先执行。
     *
     * @return 顺序值
     */
    @Override
    public int getOrder() {
        return -100;
    }

    /**
     * 判断是否属于白名单请求。
     *
     * @param request 当前请求
     * @param path 请求路径
     * @return true-白名单，false-需要鉴权
     */
    private boolean isWhitelistedRequest(ServerHttpRequest request, String path) {
        if (AUTH_WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return true;
        }

        return request.getMethod() == HttpMethod.GET
                && (path.startsWith("/api/book") || path.startsWith("/book"))
                && !StringUtils.hasText(request.getHeaders().getFirst(AuthConstant.TOKEN_HEADER));
    }

    /**
     * 返回统一未认证响应。
     *
     * @param response 当前响应
     * @param message 错误消息
     * @return 响应结果
     */
    private Mono<Void> unauthorized(ServerHttpResponse response, String message) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        byte[] body = JSON.toJSONString(Result.fail(ResultCode.UNAUTHORIZED.getCode(), message))
                .getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(body);
        return response.writeWith(Mono.just(buffer));
    }
}
