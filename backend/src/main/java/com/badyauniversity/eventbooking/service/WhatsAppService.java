package com.badyauniversity.eventbooking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    @Value("${app.whatsapp.service.url:http://localhost:3000}")
    private String whatsappServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendMessage(String phone, String message) {
        try {
            String url = whatsappServiceUrl + "/send-message";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("phone", phone);
            body.put("message", message);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                return responseBody != null && (Boolean) responseBody.get("success");
            }
            return false;
        } catch (Exception e) {
            System.err.println("WhatsApp Service Error: " + e.getMessage());
            return false;
        }
    }

    public boolean isServiceReady() {
        try {
            String url = whatsappServiceUrl + "/status";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                return responseBody != null && (Boolean) responseBody.get("ready");
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
