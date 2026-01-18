// kafkaConsumer.js
// const { Kafka } = require("kafkajs");
import { Kafka } from "kafkajs";

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "ticket-rag-processor",
  brokers: ["localhost:9092"],
});

// Create consumer
const consumer = kafka.consumer({
  groupId: "ticket-processor-group",
});

const runConsumer = async () => {
  // Connect to Kafka
  await consumer.connect();
  console.log("Kafka consumer connected");

  // Subscribe to your topic
  await consumer.subscribe({
    topic: "ticket-events", // Same as topicName in Spring Boot
    fromBeginning: false,
  });

  // Process messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // Parse the ticket from Kafka message
        const ticket = JSON.parse(message.value.toString());

        console.log("Received ticket:", {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
        });

        // Process with RAG
        await processTicketWithRAG(ticket);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },
  });
};

// RAG Processing function
async function processTicketWithRAG(ticket) {
  console.log(`Processing ticket ${ticket.ticketNumber} with RAG...`);

  try {
    // 1. Call your RAG service/API
    const query = `${ticket.title}. ${ticket.description}`;
    const ragAnswer = await callRAGService(query);
    // console.log("RAG answer:", ragAnswer);
    if (ragAnswer && ragAnswer.overallConfidence > 0.5) {
      // RAG found a good answer
      console.log(`RAG answered ticket ${ticket.ticketNumber}`);

      // 2. Update ticket in database (call Spring Boot API)
      await updateTicketStatus(ticket.id, {
        status: "RESOLVED",
        answer: ragAnswer.answer,
        resolvedBy: "RAG_SYSTEM",
      });

      // 3. Notify user via SSE or other method
      await notifyUser(ticket.id, ragAnswer.answer);
    } else {
      // RAG couldn't answer - send for manual review
      console.log(`Ticket ${ticket.ticketNumber} needs manual review`);

      await updateTicketStatus(ticket.id, {
        status: "IN_PROGRESS",
        requiresManualReview: true,
      });

      await notifyUser(ticket.id, "Ticket sent for manual review");
    }
  } catch (error) {
    console.error(`Error processing ticket ${ticket.id}:`, error);
    // Handle error - maybe send to DLQ or retry
  }
}

async function callRAGService(query) {
  // Replace with your actual RAG implementation
  // Could be OpenAI, LangChain, custom model, etc.

  // Example using a REST API
  const response = await fetch("http://localhost:3000/api/qna", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: query }),
  });

  return await response.json();
  // Returns: { text: "answer", confidence: 0.95 }
}

// Update ticket via Spring Boot API
async function updateTicketStatus(ticketId, updates) {
  const response = await fetch(
    `http://localhost:8082/api/tickets/${ticketId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );

  return await response.json();
}

// Notify user (SSE, WebSocket, or other)
async function notifyUser(ticketId, message) {
  // Implementation depends on your notification strategy
  // Could publish to another Kafka topic, trigger SSE, etc.
  console.log(`Notifying user about ticket ${ticketId}: ${message}`);
}

// Error handling
const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
  process.on(type, async (error) => {
    try {
      console.log(`process.on ${type}`);
      console.error(error);
      await consumer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});

// Start consumer
runConsumer().catch(console.error);

export default runConsumer;
