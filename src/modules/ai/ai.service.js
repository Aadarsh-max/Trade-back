import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { getPortfolioSummary } from "../portfolio/portfolio.service.js";
import {
  buildPortfolioContextPrompt,
  buildChatSystemPrompt,
  buildSentimentPrompt,
  buildDailySummaryPrompt,
  buildPortfolioInsightsPrompt,
} from "./ai.prompts.js";
import mongoose from "../../config/mongo.config.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const aiChatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AIChatHistory =
  mongoose.models.AIChatHistory ||
  mongoose.model("AIChatHistory", aiChatHistorySchema);

export const getChatResponse = async (userId, userMessage) => {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(503, "AI service is not configured");
  }

  const portfolioSummary = await getPortfolioSummary(userId);
  const contextPrompt = buildPortfolioContextPrompt(portfolioSummary);

  const recentHistory = await AIChatHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  const orderedHistory = recentHistory.reverse();

  const messages = [
    { role: "system", content: buildChatSystemPrompt() },
    { role: "system", content: contextPrompt },
    ...orderedHistory.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.4,
    max_tokens: 500,
  });

  const assistantReply =
    completion.choices[0]?.message?.content ||
    "I could not generate a response.";

  await AIChatHistory.create({ userId, role: "user", content: userMessage });
  await AIChatHistory.create({
    userId,
    role: "assistant",
    content: assistantReply,
  });

  return assistantReply;
};

export const getChatHistory = async (userId, limit = 20) => {
  const history = await AIChatHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return history.reverse();
};

export const analyzeSentiment = async (headlines) => {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(503, "AI service is not configured");
  }

  const prompt = buildSentimentPrompt(headlines);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new ApiError(502, "Failed to parse sentiment analysis response");
  }
};

export const generateDailySummary = async (marketSnapshot) => {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(503, "AI service is not configured");
  }

  const prompt = buildDailySummaryPrompt(marketSnapshot);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || "No summary available.";
};

export const getPortfolioInsights = async (userId) => {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(503, "AI service is not configured");
  }

  const portfolioSummary = await getPortfolioSummary(userId);

  const prompt = buildPortfolioInsightsPrompt(portfolioSummary);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content || "No insights available.";
};
