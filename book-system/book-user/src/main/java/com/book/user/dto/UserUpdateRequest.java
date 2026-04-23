package com.book.user.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String nickname;
    private String avatarUrl;
}
