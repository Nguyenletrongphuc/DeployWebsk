package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private RegistrationRepository registrationRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        long totalEvents = eventRepository.count();
        long publishedEvents = eventRepository.findByStatus(EventStatus.PUBLISHED,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        long totalUsers = userRepository.count();
        long totalRegistrations = registrationRepository.count();

        var top5 = eventRepository.findTop5ByOrderByCurrentAttendeesDesc();
        return ResponseEntity.ok(Map.of(
                "totalEvents", totalEvents,
                "publishedEvents", publishedEvents,
                "totalUsers", totalUsers,
                "totalRegistrations", totalRegistrations,
                "top5Events", top5
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page) {
        Role roleFilter = null;
        if (!role.isEmpty()) {
            try { roleFilter = Role.valueOf(role); } catch (Exception ignored) {}
        }
        PageRequest pageable = PageRequest.of(page, 10, Sort.by("createdAt").descending());
        Page<User> users = userService.getAllUsers(keyword, roleFilter, pageable);
        return ResponseEntity.ok(Map.of(
                "content", users.getContent(),
                "totalPages", users.getTotalPages(),
                "currentPage", page,
                "roles", Role.values()
        ));
    }

    @PostMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable String id) {
        try {
            userService.toggleEnabled(id);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái tài khoản"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable String id, @RequestParam String role) {
        try {
            userService.changeRole(id, Role.valueOf(role));
            return ResponseEntity.ok(Map.of("message", "Đã đổi quyền thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
