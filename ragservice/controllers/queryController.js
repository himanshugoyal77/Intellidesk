// controllers/queryController.js
import { PineconeStore } from "@langchain/pinecone";
import { ChatCohere } from "@langchain/cohere";
import { RetrievalQAChain } from "langchain/chains";
import { initPinecone } from "../config/pinecone.js";
import { getEmbeddings } from "../utils/embeddings.js";

export const queryVectors = async (req, res) => {
  try {
    const { question, namespace = "default", k = 3 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`Querying: "${question}" in namespace: ${namespace}`);

    // Initialize Pinecone and embeddings
    const pineconeIndex = await initPinecone();
    const embeddings = getEmbeddings();

    // Create vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
    });

    // Initialize Cohere LLM
    const model = new ChatCohere({
      apiKey: process.env.COHERE_API_KEY,
      model: "command-r-08-2024",
    });

    // Create retrieval chain with source documents
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(k), {
      returnSourceDocuments: true,
    });

    // Query
    const response = await chain.call({
      query: question,
    });

    // Get similarity search with scores
    const docsWithScores = await vectorStore.similaritySearchWithScore(
      question,
      k,
    );

    // Format documents with confidence scores
    const documentsWithConfidence = docsWithScores.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      similarityScore: score,
      confidenceScore: convertToConfidence(score), // Convert to percentage
    }));

    // Calculate overall confidence based on top document score
    const overallConfidence =
      documentsWithConfidence.length > 0
        ? documentsWithConfidence[0].confidenceScore
        : 0;

    res.json({
      success: true,
      question,
      answer: response.text,
      namespace,
      topK: k,
      overallConfidence: overallConfidence,
      documents: documentsWithConfidence,
      // Legacy field for backward compatibility
      topKDocuments: response.sourceDocuments,
    });
  } catch (error) {
    console.error("Error querying vectors:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to convert similarity score to confidence percentage
// Pinecone cosine similarity ranges from -1 to 1
// We normalize it to 0-100%
function convertToConfidence(score) {
  // For cosine similarity: (score + 1) / 2 * 100
  // This converts -1 to 1 range into 0 to 100
  const confidence = ((score + 1) / 2) * 100;
  return Math.round(confidence * 100) / 100; // Round to 2 decimal places
}

// Alternative: More detailed confidence calculation
export const queryVectorsAdvanced = async (req, res) => {
  try {
    const {
      question,
      namespace = "default",
      k = 3,
      confidenceThreshold = 0.7,
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`Querying: "${question}" in namespace: ${namespace}`);

    const pineconeIndex = await initPinecone();
    const embeddings = getEmbeddings();

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
    });

    const model = new ChatCohere({
      apiKey: process.env.COHERE_API_KEY,
      model: "command-r-08-2024",
    });

    // Get documents with scores first
    const docsWithScores = await vectorStore.similaritySearchWithScore(
      question,
      k,
    );

    // Filter by confidence threshold
    const filteredDocs = docsWithScores.filter(([_, score]) => {
      const confidence = (score + 1) / 2;
      return confidence >= confidenceThreshold;
    });

    if (filteredDocs.length === 0) {
      return res.json({
        success: true,
        question,
        answer:
          "I could not find relevant information with sufficient confidence to answer this question.",
        namespace,
        topK: k,
        overallConfidence: 0,
        documents: [],
        warning: `No documents found above confidence threshold of ${confidenceThreshold * 100}%`,
      });
    }

    // Use only high-confidence documents for the answer
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(k), {
      returnSourceDocuments: true,
    });

    const response = await chain.call({
      query: question,
    });

    // Calculate confidence metrics
    const documentsWithConfidence = docsWithScores.map(([doc, score]) => {
      const confidence = ((score + 1) / 2) * 100;
      return {
        content: doc.pageContent,
        metadata: doc.metadata,
        similarityScore: score,
        confidenceScore: Math.round(confidence * 100) / 100,
        isAboveThreshold: confidence >= confidenceThreshold * 100,
      };
    });

    // Calculate average confidence
    const avgConfidence =
      documentsWithConfidence.reduce(
        (sum, doc) => sum + doc.confidenceScore,
        0,
      ) / documentsWithConfidence.length;

    // Get top score
    const topConfidence = documentsWithConfidence[0]?.confidenceScore || 0;

    res.json({
      success: true,
      question,
      answer: response.text,
      namespace,
      topK: k,
      confidence: {
        overall: Math.round(topConfidence * 100) / 100,
        average: Math.round(avgConfidence * 100) / 100,
        top: Math.round(topConfidence * 100) / 100,
        threshold: confidenceThreshold * 100,
      },
    });
  } catch (error) {
    console.error("Error querying vectors:", error);
    res.status(500).json({ error: error.message });
  }
};
