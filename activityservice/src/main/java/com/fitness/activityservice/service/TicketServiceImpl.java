package com.fitness.activityservice.service;

import com.fitness.activityservice.model.Ticket;
import com.fitness.activityservice.repository.TicketRepository;
import com.fitness.activityservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;

    private String generateTicketNumber() {
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "TICK-" + uuid;
    }

    @Override
    public Ticket createTicket(Ticket ticket) {
        log.info("Creating new ticket with title: {}", ticket.getTitle());

        ticket.setTicketNumber(generateTicketNumber());
        ticket.setStatus(Ticket.TicketStatus.OPEN);

        if (ticket.getPriority() == null) {
            ticket.setPriority(Ticket.TicketPriority.MEDIUM);
        }

        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket getTicketById(String id) {
        log.info("Fetching ticket by id: {}", id);
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
    }

    @Override
    public Ticket getTicketByNumber(String ticketNumber) {
        log.info("Fetching ticket by number: {}", ticketNumber);
        return ticketRepository.findByTicketNumber(ticketNumber);
    }

    @Override
    public List<Ticket> getAllTickets() {
        log.info("Fetching all tickets");
        return ticketRepository.findAll();
    }

    @Override
    public Ticket updateTicket(String id, Ticket ticketDetails) {
        log.info("Updating ticket with id: {}", id);

        Ticket existingTicket = getTicketById(id);

        if(ticketDetails.getAnswer() != null){
            existingTicket.setAnswer(ticketDetails.getAnswer());
        }

        if (ticketDetails.getTitle() != null) {
            existingTicket.setTitle(ticketDetails.getTitle());
        }
        if (ticketDetails.getDescription() != null) {
            existingTicket.setDescription(ticketDetails.getDescription());
        }
        if (ticketDetails.getPriority() != null) {
            existingTicket.setPriority(ticketDetails.getPriority());
        }
        if (ticketDetails.getCategory() != null) {
            existingTicket.setCategory(ticketDetails.getCategory());
        }
        if (ticketDetails.getTags() != null) {
            existingTicket.setTags(ticketDetails.getTags());
        }
        if (ticketDetails.getAssigneeId() != null) {
            existingTicket.setAssigneeId(ticketDetails.getAssigneeId());
        }

        return ticketRepository.save(existingTicket);
    }

    @Override
    public void deleteTicket(String id) {
        log.info("Deleting ticket with id: {}", id);
        Ticket ticket = getTicketById(id);
        ticketRepository.delete(ticket);
    }

    @Override
    public Ticket updateStatus(String id, Ticket.TicketStatus status) {
        log.info("Updating status of ticket {} to {}", id, status);

        Ticket ticket = getTicketById(id);
        ticket.setStatus(status);

        if (status == Ticket.TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (status == Ticket.TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket assignTicket(String id, String assigneeId) {
        log.info("Assigning ticket {} to assignee {}", id, assigneeId);

        Ticket ticket = getTicketById(id);
        ticket.setAssigneeId(assigneeId);

        if (ticket.getStatus() == Ticket.TicketStatus.OPEN) {
            ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
        }

        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket resolveTicket(String id) {
        log.info("Resolving ticket: {}", id);
        return updateStatus(id, Ticket.TicketStatus.RESOLVED);
    }

    @Override
    public Ticket closeTicket(String id) {
        log.info("Closing ticket: {}", id);
        return updateStatus(id, Ticket.TicketStatus.CLOSED);
    }

    @Override
    public List<Ticket> getTicketsByRequester(String requesterId) {
        log.info("Fetching tickets for requester: {}", requesterId);
        return ticketRepository.findByRequesterId(requesterId);
    }

    @Override
    public List<Ticket> getTicketsByAssignee(String assigneeId) {
        log.info("Fetching tickets for assignee: {}", assigneeId);
        return ticketRepository.findByAssigneeId(assigneeId);
    }

    @Override
    public List<Ticket> getTicketsByStatus(Ticket.TicketStatus status) {
        log.info("Fetching tickets with status: {}", status);
        return ticketRepository.findByStatus(status);
    }

    @Override
    public List<Ticket> getTicketsByPriority(Ticket.TicketPriority priority) {
        log.info("Fetching tickets with priority: {}", priority);
        return ticketRepository.findByPriority(priority);
    }

    @Override
    public List<Ticket> getTicketsByCategory(String category) {
        log.info("Fetching tickets in category: {}", category);
        return ticketRepository.findByCategory(category);
    }

    @Override
    public List<Ticket> searchTicketsByTag(String tag) {
        log.info("Searching tickets with tag: {}", tag);
        return ticketRepository.findByTagsContaining(tag);
    }
}