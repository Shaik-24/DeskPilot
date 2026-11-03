package com.shaik.deskpilot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shaik.deskpilot.dto.UserResponse;
import com.shaik.deskpilot.entity.User;
import com.shaik.deskpilot.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Public registration: always creates a USER account.
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody User user) {

        User savedUser = userService.createUser(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toUserResponse(savedUser));
    }

    // Return the complete details of the logged-in user.
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new AccessDeniedException(
                    "User is not authenticated");
        }

        User user = userService.getUserByEmail(
                authentication.getName());

        return ResponseEntity.ok(toUserResponse(user));
    }

    // Only an administrator can create AGENT or ADMIN accounts.
    @PostMapping("/admin/create")
    public ResponseEntity<UserResponse> createPrivilegedUser(
            @RequestBody User user,
            Authentication authentication) {

        if (authentication == null
                || authentication.getAuthorities().stream()
                        .noneMatch(authority ->
                                "ROLE_ADMIN".equals(
                                        authority.getAuthority())
                                || "ADMIN".equals(
                                        authority.getAuthority()))) {

            throw new AccessDeniedException(
                    "Only administrators can create privileged accounts");
        }

        User savedUser = userService.createPrivilegedUser(
                user, user.getRole());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toUserResponse(savedUser));
    }

    // Convert User entity into a safe response without password.
    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
