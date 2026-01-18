import { Pinecone } from "@pinecone-database/pinecone";

export const initPinecone = async () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return pinecone.Index(process.env.PINECONE_INDEX_NAME);
};
