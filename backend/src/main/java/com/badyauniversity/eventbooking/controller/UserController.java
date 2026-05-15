package com.badyauniversity.eventbooking.controller;

import com.badyauniversity.eventbooking.model.User;
import com.badyauniversity.eventbooking.service.AttendanceTokenService;
import com.badyauniversity.eventbooking.service.QrCodeService;
import com.badyauniversity.eventbooking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * REST Controller for User operations
 * Handles HTTP requests related to users
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    private final QrCodeService qrCodeService;
    private final AttendanceTokenService attendanceTokenService;
    
    @Autowired
    public UserController(UserService userService, QrCodeService qrCodeService, AttendanceTokenService attendanceTokenService) {
        this.userService = userService;
        this.qrCodeService = qrCodeService;
        this.attendanceTokenService = attendanceTokenService;
    }
    
    /**
     * Create a new user (Sign Up)
     * POST /api/users
     * @param user The user data
     * @return Created user
     */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }
    
    /**
     * Authenticate user (Sign In)
     * POST /api/users/authenticate
     * @param credentials The authentication credentials
     * @return User if authentication successful
     */
    @PostMapping("/authenticate")
    public ResponseEntity<Map<String, Object>> authenticateUser(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        User user = userService.authenticateUser(email, password);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("faculty", user.getFaculty());
        response.put("role", user.getRole());
        response.put("qrToken", user.getQrToken());
        response.put("qrImageBase64", user.getQrImageBase64());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get user by ID
     * GET /api/users/{id}
     * @param id The user ID
     * @return User
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Static profile QR: encodes a stable URL like /user/{id}.
     * GET /api/users/{id}/qr-profile
     */
    @GetMapping(value = "/{id}/qr-profile", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getProfileQr(@PathVariable Long id) {
        userService.getUserById(id); // validate existence
        String payload = "/user/" + id;
        byte[] png = qrCodeService.encodeToPngBytes(payload, 240);

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.IMAGE_PNG).body(png);
    }

    /**
     * Temporary attendance QR: encodes /attendance/scan?token=XYZ (token is rotated when refreshed).
     * GET /api/users/{id}/qr-attendance
     */
    @GetMapping(value = "/{id}/qr-attendance", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getAttendanceQr(@PathVariable Long id) {
        User user = userService.getUserById(id);
        AttendanceTokenService.IssuedToken issued = attendanceTokenService.issueForUser(user);
        String payload = "/attendance/scan?token=" + issued.rawToken();
        byte[] png = qrCodeService.encodeToPngBytes(payload, 240);

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl(CacheControl.noStore());
        headers.add("X-Token-Expires-At", issued.expiresAt().toString());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.IMAGE_PNG).body(png);
    }
    
    /**
     * Get all users
     * GET /api/users
     * @return List of all users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    /**
     * Update user
     * PUT /api/users/{id}
     * @param id The user ID
     * @param user The updated user data
     * @return Updated user
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }
    
    /**
     * Delete user
     * DELETE /api/users/{id}
     * @param id The user ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

