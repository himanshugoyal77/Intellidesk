package com.fitness.activityservice.repository;


import com.fitness.activityservice.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    List<Ticket> findByRequesterId(String requesterId);

    List<Ticket> findByAssigneeId(String assigneeId);

    List<Ticket> findByStatus(Ticket.TicketStatus status);

    List<Ticket> findByPriority(Ticket.TicketPriority priority);

    List<Ticket> findByCategory(String category);

    Ticket findByTicketNumber(String ticketNumber);

    List<Ticket> findByTagsContaining(String tag);
}