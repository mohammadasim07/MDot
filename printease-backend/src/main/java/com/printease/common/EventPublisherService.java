package com.printease.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class EventPublisherService {

    private static final Logger log = LoggerFactory.getLogger(EventPublisherService.class);

    // Timeout: 30 minutes
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Subscribe a client to real-time events via SSE.
     */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.add(emitter);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("SSE client completed. Active emitters: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.debug("SSE client timed out. Active emitters: {}", emitters.size());
        });

        emitter.onError((ex) -> {
            emitters.remove(emitter);
            log.debug("SSE client error. Active emitters: {}", emitters.size());
        });

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Connected to PrintEase event stream", "activeClients", emitters.size())));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        log.info("New SSE client subscribed. Total active: {}", emitters.size());
        return emitter;
    }

    /**
     * Broadcast an event to all connected clients.
     */
    public void publishEvent(String eventName, Object data) {
        if (emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            log.debug("Removed {} dead SSE emitters. Remaining: {}", deadEmitters.size(), emitters.size());
        }
    }

    /**
     * Periodic heartbeat to keep connections alive and prevent proxy timeouts.
     */
    @Scheduled(fixedRate = 20000)
    public void sendHeartbeat() {
        if (!emitters.isEmpty()) {
            publishEvent("HEARTBEAT", Map.of("timestamp", System.currentTimeMillis()));
        }
    }
}
