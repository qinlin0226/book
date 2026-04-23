package com.book.user.dto;

import lombok.Data;

@Data
public class PasswordRequest {
    private String oldPassword;
    private String newPassword;
}
