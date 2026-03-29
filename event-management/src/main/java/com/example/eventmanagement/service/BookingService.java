package com.example.eventmanagement.service;

import com.example.eventmanagement.model.Booking;

import java.util.List;

public interface BookingService {
    /**
     * Tạo booking cho sự kiện có phí.
     * Trừ tiền từ balance user, tăng soldSeats atomic.
     */
    Booking createBooking(String eventId, String zoneId, int quantity, String userEmail);

    /**
     * Hủy booking - hoàn tiền và giảm soldSeats.
     */
    void cancelBooking(String bookingId, String userEmail);

    /** Lấy danh sách booking của một user */
    List<Booking> getBookingsByUser(String userEmail);

    /** Lấy danh sách booking của một event (organizer/admin) */
    List<Booking> getBookingsByEvent(String eventId);

    /** Tổng doanh thu của toàn hệ thống (chỉ admin) */
    long getTotalRevenue();

    /** Doanh thu theo từng event */
    List<java.util.Map<String, Object>> getRevenueByEvent();
}
