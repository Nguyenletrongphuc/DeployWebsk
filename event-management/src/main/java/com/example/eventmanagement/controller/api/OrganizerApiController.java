package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.dto.EventDto;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.SeatZone;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.service.BookingService;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organizer")
public class OrganizerApiController {

    @Autowired private EventService eventService;
    @Autowired private RegistrationService registrationService;
    @Autowired private BookingService bookingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/my-events")
    public ResponseEntity<?> myEvents(
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            Authentication auth) {

        EventStatus eventStatus = null;
        if (!status.isEmpty()) {
            try { eventStatus = EventStatus.valueOf(status); } catch (Exception ignored) {}
        }
        PageRequest pageable = PageRequest.of(page, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> events = eventService.getOrganizerEvents(auth.getName(), eventStatus, pageable);
        return ResponseEntity.ok(Map.of(
                "content", events.getContent(),
                "totalPages", events.getTotalPages(),
                "currentPage", page
        ));
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("location") String location,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(defaultValue = "0") int maxCapacity,
            @RequestParam(defaultValue = "DRAFT") String status,
            @RequestParam(value = "tagsInput", defaultValue = "") String tagsInput,
            @RequestParam(value = "isFree", defaultValue = "true") boolean isFree,
            @RequestParam(value = "zonesJson", required = false) String zonesJson,
            @RequestParam(value = "bannerFile", required = false) MultipartFile bannerFile,
            Authentication auth) {
        try {
            EventDto dto = buildEventDto(title, description, location, startDate, endDate,
                    maxCapacity, status, tagsInput, isFree, zonesJson);
            Event event = eventService.createEvent(dto, auth.getName(), bannerFile);
            return ResponseEntity.status(201).body(Map.of("message", "Tạo sự kiện thành công!", "event", event));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable String id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("location") String location,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(defaultValue = "0") int maxCapacity,
            @RequestParam(defaultValue = "DRAFT") String status,
            @RequestParam(value = "tagsInput", defaultValue = "") String tagsInput,
            @RequestParam(value = "isFree", defaultValue = "true") boolean isFree,
            @RequestParam(value = "zonesJson", required = false) String zonesJson,
            @RequestParam(value = "bannerFile", required = false) MultipartFile bannerFile,
            Authentication auth) {
        try {
            EventDto dto = buildEventDto(title, description, location, startDate, endDate,
                    maxCapacity, status, tagsInput, isFree, zonesJson);
            Event event = eventService.updateEvent(id, dto, auth.getName(), bannerFile);
            return ResponseEntity.ok(Map.of("message", "Cập nhật sự kiện thành công!", "event", event));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable String id, Authentication auth) {
        try {
            eventService.cancelOrDeleteEvent(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Đã hủy/xóa sự kiện thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/events/{id}/registrations")
    public ResponseEntity<?> eventRegistrations(@PathVariable String id, Authentication auth) {
        List<Registration> regs = registrationService.getByEventId(id);
        List<Map<String, Object>> bookings = bookingService.getBookingsByEvent(id).stream().map(b -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", b.getId());
            m.put("userFullName", b.getUserFullName());
            m.put("userEmail", b.getUserEmail());
            m.put("zoneName", b.getZoneName());
            m.put("quantity", b.getQuantity());
            m.put("finalAmount", b.getFinalAmount());
            m.put("status", b.getStatus());
            m.put("createdAt", b.getCreatedAt());
            m.put("type", "BOOKING");
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("registrations", regs, "bookings", bookings));
    }

    // ---- Helper ----
    private EventDto buildEventDto(String title, String description, String location,
            String startDate, String endDate, int maxCapacity, String status,
            String tagsInput, boolean isFree, String zonesJson) throws Exception {
        EventDto dto = new EventDto();
        dto.setTitle(title);
        dto.setDescription(description);
        dto.setLocation(location);
        dto.setMaxCapacity(maxCapacity);
        dto.setStatus(status);
        dto.setFree(isFree);
        if (!tagsInput.isBlank()) {
            dto.setTags(Arrays.stream(tagsInput.split(",")).map(String::trim)
                    .filter(s -> !s.isEmpty()).toList());
        }
        if (startDate != null && !startDate.isBlank())
            dto.setStartDate(java.time.LocalDateTime.parse(startDate));
        if (endDate != null && !endDate.isBlank())
            dto.setEndDate(java.time.LocalDateTime.parse(endDate));
        if (!isFree && zonesJson != null && !zonesJson.isBlank()) {
            List<SeatZone> zones = objectMapper.readValue(zonesJson,
                    new TypeReference<List<SeatZone>>() {});
            dto.setSeatZones(zones);
        }
        return dto;
    }
}
