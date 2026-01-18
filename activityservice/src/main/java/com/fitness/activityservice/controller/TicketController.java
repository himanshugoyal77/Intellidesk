package com.fitness.activityservice.controller;

import com.fitness.activityservice.model.Ticket;
import com.fitness.activityservice.service.TicketService;
import com.fitness.activityservice.service.UserValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final KafkaTemplate<String, Ticket> kafkaTemplate;
    private final UserValidationService userValidationService;

    @Value("${kafka.topic.name}")
    private String topicName;

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        if(!userValidationService.validateUser(ticket.getRequesterId())){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        Ticket createdTicket = ticketService.createTicket(ticket);

        try{
            kafkaTemplate.send(topicName, ticket);
        }catch(Exception e){
            e.printStackTrace();
        }

        return new ResponseEntity<>(createdTicket, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        List<Ticket> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable String id) {
        Ticket ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/number/{ticketNumber}")
    public ResponseEntity<Ticket> getTicketByNumber(@PathVariable String ticketNumber) {
        Ticket ticket = ticketService.getTicketByNumber(ticketNumber);
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable String id, @RequestBody Ticket ticket) {
        Ticket updatedTicket = ticketService.updateTicket(id, ticket);
        return ResponseEntity.ok(updatedTicket);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable String id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
            @PathVariable String id,
            @RequestParam Ticket.TicketStatus status) {
        Ticket updatedTicket = ticketService.updateStatus(id, status);
        return ResponseEntity.ok(updatedTicket);
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable String id,
            @RequestParam String assigneeId) {
        Ticket updatedTicket = ticketService.assignTicket(id, assigneeId);
        return ResponseEntity.ok(updatedTicket);
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Ticket> resolveTicket(@PathVariable String id) {
        Ticket updatedTicket = ticketService.resolveTicket(id);
        return ResponseEntity.ok(updatedTicket);
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Ticket> closeTicket(@PathVariable String id) {
        Ticket updatedTicket = ticketService.closeTicket(id);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<Ticket>> getTicketsByRequester(@PathVariable String requesterId) {
        List<Ticket> tickets = ticketService.getTicketsByRequester(requesterId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<List<Ticket>> getTicketsByAssignee(@PathVariable String assigneeId) {
        List<Ticket> tickets = ticketService.getTicketsByAssignee(assigneeId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Ticket>> getTicketsByStatus(@PathVariable Ticket.TicketStatus status) {
        List<Ticket> tickets = ticketService.getTicketsByStatus(status);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Ticket>> getTicketsByPriority(@PathVariable Ticket.TicketPriority priority) {
        List<Ticket> tickets = ticketService.getTicketsByPriority(priority);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Ticket>> getTicketsByCategory(@PathVariable String category) {
        List<Ticket> tickets = ticketService.getTicketsByCategory(category);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<Ticket>> searchTicketsByTag(@PathVariable String tag) {
        List<Ticket> tickets = ticketService.searchTicketsByTag(tag);
        return ResponseEntity.ok(tickets);
    }
}