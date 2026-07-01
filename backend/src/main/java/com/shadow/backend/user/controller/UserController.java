package com.shadow.backend.user.controller;

import com.shadow.backend.common.response.PageResult;
import com.shadow.backend.common.response.Result;
import com.shadow.backend.user.dto.CreateUserRequest;
import com.shadow.backend.user.dto.UpdateUserRequest;
import com.shadow.backend.user.dto.UserPageQuery;
import com.shadow.backend.user.service.UserService;
import com.shadow.backend.user.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Result<PageResult<UserVO>> page(@Valid UserPageQuery query) {
        return Result.success(userService.page(query));
    }

    @GetMapping("/{id}")
    public Result<UserVO> getById(@PathVariable Long id) {
        return Result.success(userService.getById(id));
    }

    @PostMapping
    public Result<UserVO> create(@Valid @RequestBody CreateUserRequest request) {
        return Result.success(userService.create(request));
    }

    @PutMapping("/{id}")
    public Result<UserVO> update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return Result.success(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return Result.success();
    }
}
