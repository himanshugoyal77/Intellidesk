package com.fitness.activityservice.service;

import com.fitness.activityservice.model.Ticket;
import java.util.List;

public interface TicketService {
    Ticket createTicket(Ticket ticket);
    Ticket getTicketById(String id);
    Ticket getTicketByNumber(String ticketNumber);
    List<Ticket> getAllTickets();
    Ticket updateTicket(String id, Ticket ticket);
    void deleteTicket(String id);

    // Business logic methods
    Ticket updateStatus(String id, Ticket.TicketStatus status);
    Ticket assignTicket(String id, String assigneeId);
    Ticket resolveTicket(String id);
    Ticket closeTicket(String id);

    // Query methods
    List<Ticket> getTicketsByRequester(String requesterId);
    List<Ticket> getTicketsByAssignee(String assigneeId);
    List<Ticket> getTicketsByStatus(Ticket.TicketStatus status);
    List<Ticket> getTicketsByPriority(Ticket.TicketPriority priority);
    List<Ticket> getTicketsByCategory(String category);
    List<Ticket> searchTicketsByTag(String tag);
}