package com.book.book.dto;

import lombok.Data;

@Data
public class BookUpdateRequest {
    private String title;
    private String author;
    private String coverUrl;
    private String description;
    private String category;
    private Integer publishYear;
}