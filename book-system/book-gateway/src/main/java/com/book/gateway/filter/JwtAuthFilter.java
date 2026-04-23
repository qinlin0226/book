package com.book.gateway.filter;

import com.book.common.util.JwtUtil;
import com.book.common.constant.AuthConstant;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthFilter implements GlobalFilter {

    private static final List<String> AUTH_WHITE_LIST = List.of(
            "/api/user/login",
            "/api/user/register",
            "/user/login",
            "/user/register"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (isWhitelistedRequest(request, path)) {
            return chain.filter(exchange);
        }

        String token = request.getHeaders().getFirst(AuthConstant.TOKEN_HEADER);
        if (!StringUtils.hasText(token) || !token.startsWith(AuthConstant.TOKEN_PREFIX)) {
            return unauthorized(exchange.getResponse());
        }

        token = token.replace(AuthConstant.TOKEN_PREFIX, "");

        try {
            if (JwtUtil.isTokenExpired(token)) {
                return unauthorized(exchange.getResponse());
            }

            Long userId = JwtUtil.getUserId(token);
            String username = JwtUtil.getUsername(token);
            Integer role = JwtUtil.getRole(token);

            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId.toString())
                    .header("X-Username", username)
                    .header("X-User-Role", role.toString())
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception e) {
            return unauthorized(exchange.getResponse());
        }
    }

    private boolean isWhitelistedRequest(ServerHttpRequest request, String path) {
        if (AUTH_WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return true;
        }

        boolean isPublicBookRequest = request.getMethod() == HttpMethod.GET
                && (path.startsWith("/api/book") || path.startsWith("/book"));

        return isPublicBookRequest
                && !StringUtils.hasText(request.getHeaders().getFirst(AuthConstant.TOKEN_HEADER));
    }

    private Mono<Void> unauthorized(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        String body = "{\"code\":401,\"message\":\"unauthorized\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
