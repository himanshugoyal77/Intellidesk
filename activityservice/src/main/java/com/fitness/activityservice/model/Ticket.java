package com.fitness.activityservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "tickets")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Ticket {
    @Id
    private String id;

    @Field("ticket_number")
    private String ticketNumber;

    private String title;
    private String description;

    @Field("requester_id")
    private String requesterId;

    @Field("assignee_id")
    private String assigneeId;

    private TicketStatus status;

    private TicketPriority priority;

    @Field("category")
    private String category;

    @Field("tags")
    private List<String> tags;

    @Field("answer")
    private String answer;

    @Field("resolved_at")
    private LocalDateTime resolvedAt;

    @Field("closed_at")
    private LocalDateTime closedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum TicketStatus {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED
    }

    public enum TicketPriority {
        LOW, MEDIUM, HIGH
    }
}