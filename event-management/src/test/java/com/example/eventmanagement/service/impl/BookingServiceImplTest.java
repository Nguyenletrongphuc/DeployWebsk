package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.model.Booking;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.SeatZone;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.repository.BookingRepository;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Event sampleEvent;
    private User sampleUser;
    private SeatZone sampleZone;
    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("u1");
        sampleUser.setEmail("user@example.com");
        sampleUser.setFullName("Test User");
        sampleUser.setBalance(1000000L); // 1 million VND

        sampleZone = new SeatZone("zone1", "VIP", "VIP Area", "#FFD700", 50, 200000L); // 200k VND
        List<SeatZone> zones = new ArrayList<>();
        zones.add(sampleZone);

        sampleEvent = new Event();
        sampleEvent.setId("e1");
        sampleEvent.setTitle("Paid Event");
        sampleEvent.setStatus(EventStatus.PUBLISHED);
        sampleEvent.setFree(false);
        sampleEvent.setSeatZones(zones);

        sampleBooking = new Booking();
        sampleBooking.setId("b1");
        sampleBooking.setEventId("e1");
        sampleBooking.setEventTitle("Paid Event");
        sampleBooking.setUserId("u1");
        sampleBooking.setUserEmail("user@example.com");
        sampleBooking.setZoneId("zone1");
        sampleBooking.setQuantity(2);
        sampleBooking.setFinalAmount(400000L);
        sampleBooking.setStatus("CONFIRMED");
    }

    @Test
    void createBooking_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId("b_new");
            return b;
        });

        Booking result = bookingService.createBooking("e1", "zone1", 2, "user@example.com");

        assertNotNull(result);
        assertEquals("b_new", result.getId());
        assertEquals(400000L, result.getTotalAmount());
        assertEquals("CONFIRMED", result.getStatus());
        
        verify(mongoTemplate, times(2)).updateFirst(any(Query.class), any(Update.class), any(Class.class));
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void createBooking_InsufficientBalance() {
        sampleUser.setBalance(100000L); // Only 100k, needs 400k (2 tickets * 200k)
        
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));

        IllegalStateException ex = assertThrows(IllegalStateException.class, 
            () -> bookingService.createBooking("e1", "zone1", 2, "user@example.com"));
        assertTrue(ex.getMessage().contains("Số dư không đủ"));
    }

    @Test
    void createBooking_NotEnoughSeats() {
        sampleZone.setSoldSeats(49); // Only 1 seat left
        
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));

        IllegalStateException ex = assertThrows(IllegalStateException.class, 
            () -> bookingService.createBooking("e1", "zone1", 2, "user@example.com"));
        assertTrue(ex.getMessage().contains("chỉ còn"));
    }

    @Test
    void cancelBooking_Success() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(sampleBooking));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));

        bookingService.cancelBooking("b1", "user@example.com");

        assertEquals("CANCELLED", sampleBooking.getStatus());
        verify(mongoTemplate, times(2)).updateFirst(any(Query.class), any(Update.class), any(Class.class));
        verify(bookingRepository, times(1)).save(sampleBooking);
    }

    @Test
    void cancelBooking_AccessDenied() {
        User otherUser = new User();
        otherUser.setId("u2");

        when(bookingRepository.findById("b1")).thenReturn(Optional.of(sampleBooking));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> bookingService.cancelBooking("b1", "other@example.com"));
    }
}
