package com.badyauniversity.eventbooking.controller;

import com.badyauniversity.eventbooking.dto.EventDTO;
import com.badyauniversity.eventbooking.service.EventService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Event operations
 * Handles HTTP requests related to events
 */
@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {
    
    private final EventService eventService;
    
    @Autowired
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }
    
    /**
     * Get all events
     * GET /api/events
     * @return List of all events
     */
    @GetMapping
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        List<EventDTO> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get event by ID
     * GET /api/events/{id}
     * @param id The event ID
     * @return Event DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        EventDTO event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }
    
    /**
     * Get events by category
     * GET /api/events/category/{category}
     * @param category The event category
     * @return List of events in the category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<EventDTO>> getEventsByCategory(@PathVariable String category) {
        List<EventDTO> events = eventService.getEventsByCategory(category);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get upcoming events
     * GET /api/events/upcoming
     * @return List of upcoming events
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<EventDTO>> getUpcomingEvents() {
        List<EventDTO> events = eventService.getUpcomingEvents();
        return ResponseEntity.ok(events);
    }
    
    /**
     * Create a new event
     * POST /api/events
     * @param eventDTO The event data
     * @return Created event DTO
     */
    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
        EventDTO createdEvent = eventService.createEvent(eventDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }
    
    /**
     * Update an existing event
     * PUT /api/events/{id}
     * @param id The event ID
     * @param eventDTO The updated event data
     * @return Updated event DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable Long id, 
                                                @Valid @RequestBody EventDTO eventDTO) {
        EventDTO updatedEvent = eventService.updateEvent(id, eventDTO);
        return ResponseEntity.ok(updatedEvent);
    }
    
    /**
     * Delete an event
     * DELETE /api/events/{id}
     * @param id The event ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}

