package com.book.book.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.book.common.entity.Book;
import com.book.book.mapper.BookMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookService {

    @Autowired
    private BookMapper bookMapper;

    public Page<Book> listBooks(Integer page, Integer size, String category, String keyword, boolean includeAllStatuses) {
        Page<Book> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        if (!includeAllStatuses) {
            wrapper.eq(Book::getStatus, 1);
        }
        wrapper.eq(Book::getIsDeleted, 0);

        if (StringUtils.hasText(category)) {
            wrapper.eq(Book::getCategory, category);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Book::getTitle, keyword).or().like(Book::getAuthor, keyword));
        }
        wrapper.orderByDesc(Book::getCreateTime);

        return bookMapper.selectPage(pageParam, wrapper);
    }

    public Book getBookById(Long id) {
        Book book = bookMapper.selectById(id);
        if (book == null || book.getIsDeleted() == 1) {
            throw new RuntimeException("图书不存在");
        }
        return book;
    }

    public List<Book> getRandomBooks(Integer limit) {
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Book::getStatus, 1);
        wrapper.eq(Book::getIsDeleted, 0);
        wrapper.last("ORDER BY RAND() LIMIT " + limit);
        return bookMapper.selectList(wrapper);
    }

    public void createBook(Book book) {
        book.setStatus(0);
        book.setReadCount(0L);
        book.setCreateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        book.setIsDeleted(0);
        bookMapper.insert(book);
    }

    public void updateBook(Book book) {
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);
    }

    public void deleteBook(Long id) {
        bookMapper.deletePhysicalById(id);
    }

    public void updateStatus(Long id, Integer status) {
        Book book = new Book();
        book.setId(id);
        book.setStatus(status);
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);
    }
}
