import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { initPinecone } from "../config/pinecone.js";
import { getEmbeddings } from "../utils/embeddings.js";

export const storeText = async (req, res) => {
  try {
    const { text, metadata = {} } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text], [metadata]);

    // Initialize Pinecone and embeddings
    const pineconeIndex = await initPinecone();
    const embeddings = getEmbeddings();

    // Store vectors in Pinecone
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
      namespace: metadata.namespace || "default",
    });

    res.json({
      success: true,
      message: "Text stored successfully",
      chunksStored: docs.length,
    });
  } catch (error) {
    console.error("Error storing text:", error);
    res.status(500).json({ error: error.message });
  }
};
