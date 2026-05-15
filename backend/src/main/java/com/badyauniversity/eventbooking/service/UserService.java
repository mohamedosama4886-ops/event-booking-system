package com.badyauniversity.eventbooking.service;

import com.badyauniversity.eventbooking.model.User;
import com.badyauniversity.eventbooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for User business logic
 * Handles all user-related operations
 */
@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;
    
    @Autowired
    public UserService(UserRepository userRepository, 
                       QrCodeService qrCodeService,
                       org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.qrCodeService = qrCodeService;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * Create a new user
     * @param user The user entity
     * @return Created user
     * @throws RuntimeException if email already exists
     */
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("User with email " + user.getEmail() + " already exists");
        }
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        assignQrCodeIfMissing(user);
        return userRepository.save(user);
    }

    /**
     * Ensures legacy rows (created before QR support) get a stable token and stored image.
     */
    public void ensureQrCodesForLegacyUsers() {
        for (User u : userRepository.findByQrTokenIsNull()) {
            assignQrCodeIfMissing(u);
            userRepository.save(u);
        }
    }

    private void assignQrCodeIfMissing(User user) {
        if (user.getQrToken() == null || user.getQrToken().isBlank()) {
            String token = qrCodeService.newStudentToken();
            user.setQrToken(token);
            user.setQrImageBase64(qrCodeService.encodeToPngDataUrl(token));
        }
    }
    
    /**
     * Get user by ID
     * @param id The user ID
     * @return User if found
     * @throws RuntimeException if user not found
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    /**
     * Get user by email
     * @param email The user's email
     * @return User if found
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Get all users
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Update user
     * @param id The user ID
     * @param user The updated user data
     * @return Updated user
     * @throws RuntimeException if user not found
     */
    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        existingUser.setPhone(user.getPhone());
        existingUser.setFaculty(user.getFaculty());
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        assignQrCodeIfMissing(existingUser);
        
        return userRepository.save(existingUser);
    }

    /**
     * Partial update (admin): only non-null, non-blank fields are applied.
     */
    public User patchUser(Long id, String name, String email, String newPassword) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        if (name != null && !name.isBlank()) {
            existingUser.setName(name.trim());
        }
        if (email != null && !email.isBlank()) {
            existingUser.setEmail(email.trim().toLowerCase());
        }
        if (newPassword != null && !newPassword.isBlank()) {
            existingUser.setPassword(passwordEncoder.encode(newPassword));
        }
        assignQrCodeIfMissing(existingUser);
        return userRepository.save(existingUser);
    }
    
    /**
     * Delete user
     * @param id The user ID
     * @throws RuntimeException if user not found
     */
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
    
    /**
     * Authenticate user
     * @param email The user's email
     * @param password The user's password
     * @return User if authentication successful
     * @throws RuntimeException if authentication fails
     */
    public User authenticateUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        String stored = user.getPassword() == null ? "" : user.getPassword();
        boolean ok;
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            ok = passwordEncoder.matches(password, stored);
        } else {
            ok = stored.equals(password); // Support legacy plaintext
        }

        if (!ok) {
            throw new RuntimeException("Invalid email or password");
        }
        
        return user;
    }
}

