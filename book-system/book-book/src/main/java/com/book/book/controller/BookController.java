package com.book.book.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.book.dto.BookCreateRequest;
import com.book.book.dto.BookUpdateRequest;
import com.book.book.service.BookService;
import com.book.common.entity.Book;
import com.book.common.result.Result;
import com.book.common.constant.AuthConstant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/book")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public Result<Page<Book>> listBooks(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestHeader(value = "X-User-Role", required = false) Integer role) {
        boolean includeAllStatuses = role != null && role == AuthConstant.ROLE_ADMIN;
        return Result.success(bookService.listBooks(page, size, category, keyword, includeAllStatuses));
    }

    @GetMapping("/{id}")
    public Result<Book> getBook(@PathVariable Long id) {
        return Result.success(bookService.getBookById(id));
    }

    @GetMapping("/random")
    public Result<java.util.List<Book>> getRandomBooks(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(bookService.getRandomBooks(limit));
    }

    @PostMapping
    public Result<Void> createBook(@RequestBody BookCreateRequest request,
                                  @RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setCoverUrl(request.getCoverUrl());
        book.setDescription(request.getDescription());
        book.setCategory(request.getCategory());
        book.setPublishYear(request.getPublishYear());
        bookService.createBook(book);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> updateBook(@PathVariable Long id,
                                  @RequestBody BookUpdateRequest request,
                                  @RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        Book book = new Book();
        book.setId(id);
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setCoverUrl(request.getCoverUrl());
        book.setDescription(request.getDescription());
        book.setCategory(request.getCategory());
        book.setPublishYear(request.getPublishYear());
        bookService.updateBook(book);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteBook(@PathVariable Long id,
                                   @RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        bookService.deleteBook(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                   @RequestBody Map<String, Integer> statusMap,
                                   @RequestHeader("X-User-Role") Integer role) {
        checkAdmin(role);
        bookService.updateStatus(id, statusMap.get("status"));
        return Result.success();
    }

    private void checkAdmin(Integer role) {
        if (role != AuthConstant.ROLE_ADMIN) {
            throw new RuntimeException("无权限操作");
        }
    }
}
