package com.book.book.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.book.dto.BookCreateRequest;
import com.book.book.dto.BookUpdateRequest;
import com.book.book.mapper.BookMapper;
import com.book.common.entity.Book;
import com.book.common.enums.ResultCode;
import com.book.common.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 图书服务类，处理图书查询、维护和状态管理业务。
 *
 * @author OpenCode
 */
@Service
public class BookService {

    /**
     * 随机推荐接口单次最大返回数量
     */
    private static final int MAX_RANDOM_LIMIT = 20;

    /**
     * 图书数据访问组件
     */
    private final BookMapper bookMapper;

    /**
     * 构造方法注入图书数据组件。
     *
     * @param bookMapper 图书数据访问组件
     */
    public BookService(BookMapper bookMapper) {
        this.bookMapper = bookMapper;
    }

    /**
     * 分页查询图书列表。
     *
     * @param page 页码
     * @param size 页大小
     * @param category 图书分类
     * @param keyword 搜索关键字
     * @param includeAllStatuses 是否包含全部状态
     * @return 图书分页数据
     */
    public Page<Book> listBooks(Integer page, Integer size, String category, String keyword, boolean includeAllStatuses) {
        Page<Book> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Book::getIsDeleted, 0);
        if (!includeAllStatuses) {
            wrapper.eq(Book::getStatus, 1);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Book::getCategory, category.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String searchKeyword = keyword.trim();
            wrapper.and(item -> item.like(Book::getTitle, searchKeyword).or().like(Book::getAuthor, searchKeyword));
        }
        wrapper.orderByDesc(Book::getCreateTime);
        return bookMapper.selectPage(pageParam, wrapper);
    }

    /**
     * 根据图书ID查询图书详情。
     *
     * @param id 图书ID
     * @return 图书实体
     */
    public Book getBookById(Long id) {
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Book::getId, id).eq(Book::getIsDeleted, 0);
        Book book = bookMapper.selectOne(wrapper);
        if (book == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "图书不存在");
        }
        return book;
    }

    /**
     * 随机获取已上架图书。
     *
     * @param limit 返回数量
     * @return 图书列表
     */
    public List<Book> getRandomBooks(Integer limit) {
        int safeLimit = Math.min(limit, MAX_RANDOM_LIMIT);
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Book::getStatus, 1).eq(Book::getIsDeleted, 0);

        // limit 已经过边界约束，再拼接到 SQL 末尾，避免返回过多随机数据。
        wrapper.last("ORDER BY RAND() LIMIT " + safeLimit);
        return bookMapper.selectList(wrapper);
    }

    /**
     * 新增图书。
     *
     * @param request 图书新增参数
     */
    public void createBook(BookCreateRequest request) {
        Book book = new Book();
        book.setTitle(request.getTitle().trim());
        book.setAuthor(request.getAuthor().trim());
        book.setCoverUrl(normalizeText(request.getCoverUrl()));
        book.setDescription(normalizeText(request.getDescription()));
        book.setCategory(request.getCategory().trim());
        book.setPublishYear(request.getPublishYear());
        book.setStatus(0);
        book.setReadCount(0L);
        fillCreateFields(book);
        bookMapper.insert(book);
    }

    /**
     * 修改图书。
     *
     * @param id 图书ID
     * @param request 图书修改参数
     */
    public void updateBook(Long id, BookUpdateRequest request) {
        Book currentBook = getBookById(id);
        currentBook.setTitle(request.getTitle().trim());
        currentBook.setAuthor(request.getAuthor().trim());
        currentBook.setCoverUrl(normalizeText(request.getCoverUrl()));
        currentBook.setDescription(normalizeText(request.getDescription()));
        currentBook.setCategory(request.getCategory().trim());
        currentBook.setPublishYear(request.getPublishYear());
        touchUpdateTime(currentBook);
        bookMapper.updateById(currentBook);
    }

    /**
     * 删除图书。
     *
     * @param id 图书ID
     */
    public void deleteBook(Long id) {
        getBookById(id);
        bookMapper.deleteById(id);
    }

    /**
     * 修改图书上下架状态。
     *
     * @param id 图书ID
     * @param status 状态值
     */
    public void updateStatus(Long id, Integer status) {
        if (!Integer.valueOf(0).equals(status) && !Integer.valueOf(1).equals(status)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "图书状态参数不合法");
        }
        Book book = getBookById(id);
        book.setStatus(status);
        touchUpdateTime(book);
        bookMapper.updateById(book);
    }

    /**
     * 填充新增通用字段。
     *
     * @param book 图书实体
     */
    private void fillCreateFields(Book book) {
        LocalDateTime now = LocalDateTime.now();
        book.setCreateTime(now);
        book.setUpdateTime(now);
        book.setIsDeleted(0);
    }

    /**
     * 更新时间字段。
     *
     * @param book 图书实体
     */
    private void touchUpdateTime(Book book) {
        book.setUpdateTime(LocalDateTime.now());
    }

    /**
     * 规范化可选字符串字段。
     *
     * @param text 原始文本
     * @return 处理后的文本
     */
    private String normalizeText(String text) {
        return StringUtils.hasText(text) ? text.trim() : null;
    }
}
