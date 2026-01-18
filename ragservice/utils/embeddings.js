import { CohereEmbeddings } from "@langchain/cohere";

export const getEmbeddings = () => {
  return new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY, // In Node.js defaults to process.env.COHERE_API_KEY
    batchSize: 48, // Default value if omitted is 48. Max value is 96
    model: "embed-english-v3.0",
  });
};
