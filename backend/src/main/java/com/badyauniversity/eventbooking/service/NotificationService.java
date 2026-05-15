package com.badyauniversity.eventbooking.service;

import com.badyauniversity.eventbooking.model.Event;
import com.badyauniversity.eventbooking.model.Notification;
import com.badyauniversity.eventbooking.model.User;
import com.badyauniversity.eventbooking.repository.NotificationRepository;
import com.badyauniversity.eventbooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private WhatsAppService whatsappService;

    /**
     * Sends event announcements to students in target faculties.
     * This is marked as Async to not block the event creation process.
     */
    @Async
    public void sendEventAnnouncements(Event event) {
        String targetFacultiesStr = event.getTargetFaculties();
        if (targetFacultiesStr == null || targetFacultiesStr.isEmpty()) {
            return;
        }

        List<String> targetFaculties = Arrays.asList(targetFacultiesStr.split(","));
        boolean isAllFaculties = targetFaculties.contains("All");

        List<User> students;
        if (isAllFaculties) {
            students = userRepository.findAll().stream()
                    .filter(u -> "USER".equals(u.getRole()))
                    .collect(Collectors.toList());
        } else {
            students = userRepository.findAll().stream()
                    .filter(u -> "USER".equals(u.getRole()))
                    .filter(u -> u.getFaculty() != null && targetFaculties.contains(u.getFaculty()))
                    .collect(Collectors.toList());
        }

        for (User student : students) {
            if (student.getPhone() == null || student.getPhone().isEmpty()) {
                continue;
            }

            // Avoid duplicate notifications for the same event and student
            List<Notification> existing = notificationRepository.findByEventId(event.getId());
            boolean alreadySent = existing.stream().anyMatch(n -> n.getStudent().getId().equals(student.getId()));
            if (alreadySent) continue;

            String message = formatMessage(student, event);
            
            Notification notification = new Notification(student, event, student.getPhone(), message, "PENDING");
            notificationRepository.save(notification);

            boolean success = whatsappService.sendMessage(student.getPhone(), message);
            
            if (success) {
                notification.setStatus("SENT");
            } else {
                notification.setStatus("FAILED");
                notification.setFailureReason("WhatsApp Service error or timeout.");
            }
            notificationRepository.save(notification);
        }
    }

    private String formatMessage(User student, Event event) {
        return "New Event Announcement\n\n" +
               "Hello " + student.getName() + ",\n\n" +
               "A new event is available for your faculty.\n\n" +
               "Event: " + event.getTitle() + "\n" +
               "Date: " + event.getDate().toString() + "\n" +
               "Time: " + event.getTime().toString() + "\n" +
               "Location: " + event.getVenue() + "\n\n" +
               "Description:\n" + event.getDescription() + "\n\n" +
               "Please check your account for more details.";
    }
}
