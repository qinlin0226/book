package com.book.book.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.book.dto.BookCreateRequest;
import com.book.book.dto.BookStatusUpdateRequest;
import com.book.book.dto.BookUpdateRequest;
import com.book.book.service.BookService;
import com.book.common.constant.AuthConstant;
import com.book.common.dto.BookInfoResponse;
import com.book.common.entity.Book;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import com.book.common.result.Result;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 图书控制器，负责图书查询和后台管理接口。
 *
 * @author OpenCode
 */
@Validated
@RestController
@RequestMapping("/book")
public class BookController {

    /**
     * 图书业务服务
     */
    private final BookService bookService;

    /**
     * 构造方法注入图书服务。
     *
     * @param bookService 图书业务服务
     */
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    /**
     * 分页查询图书列表。
     *
     * @param page 页码
     * @param size 页大小
     * @param category 图书分类
     * @param keyword 搜索关键字
     * @param role 当前用户角色
     * @return 图书分页数据
     */
    @GetMapping
    public Result<Page<BookInfoResponse>> listBooks(@RequestParam(defaultValue = "1") @Min(value = 1, message = "页码必须大于0") Integer page,
                                                    @RequestParam(defaultValue = "10") @Min(value = 1, message = "分页大小必须大于0") Integer size,
                                                    @RequestParam(required = false) String category,
                                                    @RequestParam(required = false) String keyword,
                                                    @RequestHeader(value = "X-User-Role", required = false) Integer role) {
        boolean includeAllStatuses = AuthConstant.ROLE_ADMIN.equals(role);
        return Result.success(toBookPage(bookService.listBooks(page, size, category, keyword, includeAllStatuses)));
    }

    /**
     * 查询图书详情。
     *
     * @param id 图书ID
     * @return 图书详情
     */
    @GetMapping("/{id}")
    public Result<BookInfoResponse> getBook(@PathVariable Long id) {
        return Result.success(toBookResponse(bookService.getBookById(id)));
    }

    /**
     * 随机获取图书列表。
     *
     * @param limit 返回数量
     * @return 图书列表
     */
    @GetMapping("/random")
    public Result<List<BookInfoResponse>> getRandomBooks(@RequestParam(defaultValue = "10") @Min(value = 1, message = "返回数量必须大于0") Integer limit) {
        return Result.success(bookService.getRandomBooks(limit).stream().map(this::toBookResponse).toList());
    }

    /**
     * 新增图书。
     *
     * @param request 图书新增参数
     * @param role 当前用户角色
     * @return 空响应
     */
    @PostMapping
    public Result<Void> createBook(@Valid @RequestBody BookCreateRequest request,
                                   @RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        bookService.createBook(request);
        return Result.success();
    }

    /**
     * 修改图书。
     *
     * @param id 图书ID
     * @param request 图书修改参数
     * @param role 当前用户角色
     * @return 空响应
     */
    @PutMapping("/{id}")
    public Result<Void> updateBook(@PathVariable Long id,
                                   @Valid @RequestBody BookUpdateRequest request,
                                   @RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        bookService.updateBook(id, request);
        return Result.success();
    }

    /**
     * 删除图书。
     *
     * @param id 图书ID
     * @param role 当前用户角色
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteBook(@PathVariable Long id, @RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        bookService.deleteBook(id);
        return Result.success();
    }

    /**
     * 更新图书状态。
     *
     * @param id 图书ID
     * @param request 状态更新参数
     * @param role 当前用户角色
     * @return 空响应
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @Valid @RequestBody BookStatusUpdateRequest request,
                                     @RequestHeader("X-User-Role") Integer role) {
        requireAdmin(role);
        bookService.updateStatus(id, request.getStatus());
        return Result.success();
    }

    /**
     * 校验管理员权限。
     *
     * @param role 当前用户角色
     */
    private void requireAdmin(Integer role) {
        if (!AuthConstant.ROLE_ADMIN.equals(role)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
    }

    /**
     * 转换图书详情响应对象。
     *
     * @param book 图书实体
     * @return 图书响应对象
     */
    private BookInfoResponse toBookResponse(Book book) {
        BookInfoResponse response = new BookInfoResponse();
        response.setId(book.getId());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setCoverUrl(book.getCoverUrl());
        response.setDescription(book.getDescription());
        response.setCategory(book.getCategory());
        response.setPublishYear(book.getPublishYear());
        response.setStatus(book.getStatus());
        response.setReadCount(book.getReadCount());
        response.setCreateTime(book.getCreateTime());
        return response;
    }

    /**
     * 转换图书分页响应对象。
     *
     * @param source 图书分页实体
     * @return 图书分页响应
     */
    private Page<BookInfoResponse> toBookPage(Page<Book> source) {
        Page<BookInfoResponse> page = new Page<>(source.getCurrent(), source.getSize(), source.getTotal());
        page.setRecords(source.getRecords().stream().map(this::toBookResponse).toList());
        return page;
    }
}
