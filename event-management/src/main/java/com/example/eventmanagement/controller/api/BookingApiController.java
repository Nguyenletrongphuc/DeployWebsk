package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.Booking;
import com.example.eventmanagement.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BookingApiController {

    @Autowired private BookingService bookingService;

    /**
     * POST /api/events/:id/book
     * Tạo booking cho sự kiện có phí
     */
    @PostMapping("/events/{eventId}/book")
    public ResponseEntity<?> createBooking(
            @PathVariable String eventId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            String zoneId = (String) body.get("zoneId");
            int quantity = body.get("quantity") instanceof Number
                    ? ((Number) body.get("quantity")).intValue() : 1;

            if (zoneId == null || zoneId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn khu vực"));
            }

            Booking booking = bookingService.createBooking(eventId, zoneId, quantity, auth.getName());
            return ResponseEntity.status(201).body(Map.of(
                    "message", "Đặt vé thành công! 🎉",
                    "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/my-bookings
     * Danh sách booking của user đang đăng nhập
     */
    @GetMapping("/my-bookings")
    public ResponseEntity<?> myBookings(Authentication auth) {
        List<Booking> bookings = bookingService.getBookingsByUser(auth.getName());
        return ResponseEntity.ok(bookings);
    }

    /**
     * DELETE /api/bookings/:id
     * Hủy booking
     */
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable String id, Authentication auth) {
        try {
            bookingService.cancelBooking(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Đã hủy đặt vé thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
