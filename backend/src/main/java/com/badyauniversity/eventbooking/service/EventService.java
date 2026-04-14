package com.badyauniversity.eventbooking.service;

import com.badyauniversity.eventbooking.dto.EventDTO;
import com.badyauniversity.eventbooking.model.Event;
import com.badyauniversity.eventbooking.repository.BookingRepository;
import com.badyauniversity.eventbooking.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for Event business logic
 * Handles all event-related operations
 */
@Service
@Transactional
public class EventService {
    
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    
    @Autowired
    public EventService(EventRepository eventRepository, BookingRepository bookingRepository) {
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
    }
    
    /**
     * Get all events
     * @return List of all events as DTOs
     */
    public List<EventDTO> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        return events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get event by ID
     * @param id The event ID
     * @return Event DTO if found
     * @throws RuntimeException if event not found
     */
    public EventDTO getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        return convertToDTO(event);
    }
    
    /**
     * Get events by category
     * @param category The event category
     * @return List of events in the specified category
     */
    public List<EventDTO> getEventsByCategory(String category) {
        List<Event> events = eventRepository.findByCategory(category);
        return events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get upcoming events
     * @return List of upcoming events
     */
    public List<EventDTO> getUpcomingEvents() {
        List<Event> events = eventRepository.findByDateAfter(LocalDate.now());
        return events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new event
     * @param eventDTO The event data
     * @return Created event as DTO
     */
    public EventDTO createEvent(EventDTO eventDTO) {
        Event event = convertToEntity(eventDTO);
        Event savedEvent = eventRepository.save(event);
        return convertToDTO(savedEvent);
    }
    
    /**
     * Update an existing event
     * @param id The event ID
     * @param eventDTO The updated event data
     * @return Updated event as DTO
     * @throws RuntimeException if event not found
     */
    public EventDTO updateEvent(Long id, EventDTO eventDTO) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        
        // Update fields
        existingEvent.setTitle(eventDTO.getTitle());
        existingEvent.setDescription(eventDTO.getDescription());
        existingEvent.setCategory(eventDTO.getCategory());
        existingEvent.setDate(eventDTO.getDate());
        existingEvent.setTime(eventDTO.getTime());
        existingEvent.setVenue(eventDTO.getVenue());
        existingEvent.setCapacity(eventDTO.getCapacity());
        existingEvent.setPrice(eventDTO.getPrice());
        existingEvent.setImage(eventDTO.getImage());
        existingEvent.setOrganizer(eventDTO.getOrganizer());
        existingEvent.setContactEmail(eventDTO.getContactEmail());
        
        Event updatedEvent = eventRepository.save(existingEvent);
        return convertToDTO(updatedEvent);
    }
    
    /**
     * Delete an event
     * @param id The event ID
     * @throws RuntimeException if event not found
     */
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
    }
    
    /**
     * Check if event exists
     * @param id The event ID
     * @return true if event exists, false otherwise
     */
    public boolean eventExists(Long id) {
        return eventRepository.existsById(id);
    }
    
    /**
     * Get event entity by ID (for internal use)
     * @param id The event ID
     * @return Event entity if found
     * @throws RuntimeException if event not found
     */
    public Event getEventEntityById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
    }
    
    /**
     * Convert Event entity to EventDTO
     * @param event The event entity
     * @return EventDTO
     */
    private EventDTO convertToDTO(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setCategory(event.getCategory());
        dto.setDate(event.getDate());
        dto.setTime(event.getTime());
        dto.setVenue(event.getVenue());
        dto.setCapacity(event.getCapacity());
        Integer sold = bookingRepository.countTotalTicketsByEventId(event.getId());
        if (sold == null) {
            sold = 0;
        }
        dto.setTicketsAvailable(Math.max(0, event.getCapacity() - sold));
        dto.setPrice(event.getPrice());
        dto.setImage(event.getImage());
        dto.setOrganizer(event.getOrganizer());
        dto.setContactEmail(event.getContactEmail());
        return dto;
    }
    
    /**
     * Convert EventDTO to Event entity
     * @param dto The event DTO
     * @return Event entity
     */
    private Event convertToEntity(EventDTO dto) {
        Event event = new Event();
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setCategory(dto.getCategory());
        event.setDate(dto.getDate());
        event.setTime(dto.getTime());
        event.setVenue(dto.getVenue());
        event.setCapacity(dto.getCapacity());
        event.setPrice(dto.getPrice());
        event.setImage(dto.getImage());
        event.setOrganizer(dto.getOrganizer());
        event.setContactEmail(dto.getContactEmail());
        return event;
    }
}

