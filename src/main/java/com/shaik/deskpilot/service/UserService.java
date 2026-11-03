package com.shaik.deskpilot.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.shaik.deskpilot.entity.User;
import com.shaik.deskpilot.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Public registration: always creates a USER account.
    public User createUser(User user) {
        return saveUser(user, "USER");
    }

    // Only administrators can create AGENT or ADMIN accounts.
    public User createPrivilegedUser(User user, String role) {

        if (role == null) {
            throw new IllegalArgumentException(
                    "Role must be AGENT or ADMIN");
        }

        role = role.trim().toUpperCase(Locale.ROOT);

        if (!role.equals("AGENT") && !role.equals("ADMIN")) {
            throw new IllegalArgumentException(
                    "Role must be AGENT or ADMIN");
        }

        return saveUser(user, role);
    }

    // Find a user using their authenticated email.
    public User getUserByEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "User email is required");
        }

        return userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }

    private boolean isValidPassword(String password) {

        if (password == null) {
            return false;
        }

        boolean hasUppercase = password.chars()
                .anyMatch(Character::isUpperCase);

        boolean hasLowercase = password.chars()
                .anyMatch(Character::isLowerCase);

        boolean hasNumber = password.chars()
                .anyMatch(Character::isDigit);

        boolean hasSpecialCharacter = password.chars()
                .anyMatch(c -> !Character.isLetterOrDigit(c)
                        && !Character.isWhitespace(c));

        return hasUppercase
                && hasLowercase
                && hasNumber
                && hasSpecialCharacter;
    }

    private User saveUser(User user, String role) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "User details are required");
        }

        if (user.getName() == null || user.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (!isValidPassword(user.getPassword())) {
            throw new IllegalArgumentException(
                    "Password must contain at least one uppercase letter, "
                    + "one lowercase letter, one number, "
                    + "and one special character.");
        }

        String email = user.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email is already registered");
        }

        user.setId(null);
        user.setName(user.getName().trim());
        user.setEmail(email);
        user.setRole(role);

        user.setPassword(
                passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }
}
