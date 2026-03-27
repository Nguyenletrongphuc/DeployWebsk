package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class RegistrationApiController {

    @Autowired private RegistrationService registrationService;
    @Autowired private EventService eventService;

    @PostMapping("/api/events/{id}/register")
    public ResponseEntity<?> register(@PathVariable String id, Authentication auth) {
        try {
            Registration reg = registrationService.register(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Đăng ký tham dự thành công! 🎉", "registrationId", reg.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/registrations/{id}")
    public ResponseEntity<?> cancel(@PathVariable String id, Authentication auth) {
        try {
            registrationService.cancel(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Đã hủy đăng ký thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/my-registrations")
    public ResponseEntity<?> myRegistrations(Authentication auth) {
        List<Registration> registrations = registrationService.getByUserEmail(auth.getName());
        List<Map<String, Object>> result = registrations.stream().map(r -> {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", r.getId());
            item.put("eventId", r.getEventId());
            item.put("status", r.getStatus());
            item.put("registeredAt", r.getRegisteredAt());
            try {
                Event e = eventService.getEventById(r.getEventId());
                item.put("eventTitle", e.getTitle());
                item.put("eventLocation", e.getLocation());
                item.put("eventStartDate", e.getStartDate());
                item.put("eventBanner", e.getBannerImagePath());
            } catch (Exception ignored) {}
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
