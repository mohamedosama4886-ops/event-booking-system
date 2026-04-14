package com.badyauniversity.eventbooking.service;

import com.badyauniversity.eventbooking.dto.BookingRequestDTO;
import com.badyauniversity.eventbooking.dto.BookingResponseDTO;
import com.badyauniversity.eventbooking.dto.EventDTO;
import com.badyauniversity.eventbooking.model.Booking;
import com.badyauniversity.eventbooking.model.Event;
import com.badyauniversity.eventbooking.repository.BookingRepository;
import com.badyauniversity.eventbooking.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for Booking business logic
 * Handles all booking-related operations
 */
@Service
@Transactional
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;
    
    @Autowired
    public BookingService(BookingRepository bookingRepository, 
                          EventRepository eventRepository,
                          EventService eventService) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.eventService = eventService;
    }
    
    /**
     * Create a new booking
     * @param eventId The event ID
     * @param bookingRequest The booking request data
     * @return Created booking as DTO
     * @throws RuntimeException if event not found or capacity exceeded
     */
    public BookingResponseDTO createBooking(Long eventId, BookingRequestDTO bookingRequest) {
        // Get the event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
        
        // Check available capacity
        Integer totalBookedTickets = bookingRepository.countTotalTicketsByEventId(eventId);
        if (totalBookedTickets == null) {
            totalBookedTickets = 0;
        }
        
        Integer availableCapacity = event.getCapacity() - totalBookedTickets;
        
        if (availableCapacity <= 0) {
            throw new RuntimeException("This event is sold out. No tickets remaining.");
        }
        if (bookingRequest.getTickets() > availableCapacity) {
            throw new RuntimeException(
                String.format("Not enough tickets left. Available: %d, requested: %d.",
                    availableCapacity, bookingRequest.getTickets())
            );
        }
        
        BigDecimal unitPrice = event.getPrice() != null ? event.getPrice() : BigDecimal.ZERO;
        boolean isPaid = unitPrice.compareTo(BigDecimal.ZERO) > 0;
        String paymentMethod = null;
        if (isPaid) {
            String pm = bookingRequest.getPaymentMethod();
            if (pm == null || pm.isBlank()) {
                throw new RuntimeException("Payment method is required for paid events. Choose Visa or Cash.");
            }
            String normalized = pm.trim().toUpperCase();
            if (!"VISA".equals(normalized) && !"CASH".equals(normalized)) {
                throw new RuntimeException("Invalid payment method. Use VISA or CASH.");
            }
            paymentMethod = normalized;
        }
        
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(bookingRequest.getTickets()));
        
        Booking booking = new Booking();
        booking.setEvent(event);
        booking.setStudentName(bookingRequest.getStudentName());
        booking.setStudentId(bookingRequest.getStudentId());
        booking.setStudentEmail(bookingRequest.getStudentEmail());
        booking.setTickets(bookingRequest.getTickets());
        booking.setTotalAmount(totalAmount);
        booking.setPaymentMethod(paymentMethod);
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Convert to response DTO
        return convertToResponseDTO(savedBooking);
    }
    
    /**
     * Get all bookings
     * @return List of all bookings as DTOs
     */
    public List<BookingResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get booking by ID
     * @param id The booking ID
     * @return Booking DTO if found
     * @throws RuntimeException if booking not found
     */
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
        return convertToResponseDTO(booking);
    }
    
    /**
     * Get bookings by student email
     * @param studentEmail The student's email
     * @return List of bookings made by the student
     */
    public List<BookingResponseDTO> getBookingsByStudentEmail(String studentEmail) {
        List<Booking> bookings = bookingRepository.findByStudentEmail(studentEmail);
        return bookings.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get bookings by event ID
     * @param eventId The event ID
     * @return List of bookings for the event
     */
    public List<BookingResponseDTO> getBookingsByEventId(Long eventId) {
        List<Booking> bookings = bookingRepository.findByEventId(eventId);
        return bookings.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a booking
     * @param id The booking ID
     * @throws RuntimeException if booking not found
     */
    public void deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        bookingRepository.deleteById(id);
    }
    
    /**
     * Get available capacity for an event
     * @param eventId The event ID
     * @return Available capacity
     */
    public Integer getAvailableCapacity(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
        
        Integer totalBookedTickets = bookingRepository.countTotalTicketsByEventId(eventId);
        if (totalBookedTickets == null) {
            totalBookedTickets = 0;
        }
        
        return event.getCapacity() - totalBookedTickets;
    }
    
    /**
     * Convert Booking entity to BookingResponseDTO
     * @param booking The booking entity
     * @return BookingResponseDTO
     */
    private BookingResponseDTO convertToResponseDTO(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setEventId(booking.getEvent().getId());
        
        // Convert event to DTO
        EventDTO eventDTO = eventService.getEventById(booking.getEvent().getId());
        dto.setEvent(eventDTO);
        
        dto.setStudentName(booking.getStudentName());
        dto.setStudentId(booking.getStudentId());
        dto.setStudentEmail(booking.getStudentEmail());
        dto.setTickets(booking.getTickets());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setBookingDate(booking.getBookingDate());
        dto.setPaymentMethod(booking.getPaymentMethod());
        
        return dto;
    }
}

