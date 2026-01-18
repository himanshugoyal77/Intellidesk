import { PineconeStore } from "@langchain/pinecone";
import { initPinecone } from "../config/pinecone.js";
import { getEmbeddings } from "../utils/embeddings.js";
import {
  extractTextFromPDF,
  splitTextIntoChunks,
} from "../utils/pdfProcessor.js";

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "File must be a PDF" });
    }

    const { namespace = "default", source } = req.body;

    console.log("Processing PDF:", req.file.originalname);

    // Extract text from PDF
    const text = await extractTextFromPDF(req.file.buffer);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text found in PDF" });
    }

    console.log(`Extracted ${text.length} characters from PDF`);

    // Split text into chunks
    const docs = await splitTextIntoChunks(text);

    // Add metadata to each chunk
    const docsWithMetadata = docs.map((doc, i) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        source: source || req.file.originalname,
        chunk: i,
        totalChunks: docs.length,
        namespace,
      },
    }));

    console.log(`Split into ${docs.length} chunks`);

    // Initialize Pinecone and embeddings
    const pineconeIndex = await initPinecone();
    const embeddings = getEmbeddings();

    // Store vectors in Pinecone
    await PineconeStore.fromDocuments(docsWithMetadata, embeddings, {
      pineconeIndex,
      namespace,
    });

    console.log("Successfully stored vectors in Pinecone");

    res.json({
      success: true,
      message: "PDF processed and stored successfully",
      filename: req.file.originalname,
      chunksStored: docs.length,
      textLength: text.length,
      namespace,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ error: error.message });
  }
};
