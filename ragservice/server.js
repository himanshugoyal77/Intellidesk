import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import { uploadPDF } from "./controllers/pdfController.js";
import { storeText } from "./controllers/storeController.js";
import { queryVectors } from "./controllers/queryController.js";
import { createEurekaClient } from "./config/eureka.js";

dotenv.config();

const app = express();
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Health check endpoint (required for Eureka)
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "rag-service",
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint (optional but useful)
app.get("/info", (req, res) => {
  res.json({
    service: "RAG Service",
    version: "1.0.0",
    description: "PDF RAG service with Pinecone and LangChain",
    endpoints: {
      uploadPdf: "POST /api/upload-pdf",
      storeText: "POST /api/store",
      query: "POST /api/qna",
    },
  });
});

// Upload and process PDF
app.post("/api/upload-pdf", upload.single("pdf"), uploadPDF);

// Store text directly
app.post("/api/store", storeText);

// QnA endpoint
app.post("/api/qna", queryVectors);

const PORT = process.env.SERVICE_PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`RAG Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Service info: http://localhost:${PORT}/info`);
});

// Initialize and start Eureka client
const eurekaClient = createEurekaClient(PORT);

eurekaClient.start((error) => {
  if (error) {
    console.error("Error starting Eureka client:", error);
  } else {
    console.log("Eureka client started successfully");
    console.log(`Registered as: ${process.env.SERVICE_NAME || "rag-service"}`);
    console.log(
      `Eureka server: http://${process.env.EUREKA_HOST || "localhost"}:${process.env.EUREKA_PORT || 8761}`,
    );
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");

  eurekaClient.stop((error) => {
    if (error) {
      console.error("Error stopping Eureka client:", error);
    } else {
      console.log("Deregistered from Eureka");
    }

    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// run kafka consumer
import runConsumer from "./kafkaConsumer.js";

runConsumer().catch((error) => {
  console.error("Error running Kafka consumer:", error);
  shutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown();
});
