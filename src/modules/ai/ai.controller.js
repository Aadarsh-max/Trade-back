import { getChatResponse, getChatHistory, analyzeSentiment, getPortfolioInsights } from './ai.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const reply = await getChatResponse(req.user.userId, message);
    return new ApiResponse(200, 'AI response generated', { reply }).send(res);
  } catch (err) {
    next(err);
  }
};

export const fetchChatHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await getChatHistory(req.user.userId, limit);
    return new ApiResponse(200, 'Chat history fetched', history).send(res);
  } catch (err) {
    next(err);
  }
};

export const sentiment = async (req, res, next) => {
  try {
    const { headlines } = req.body;
    const result = await analyzeSentiment(headlines);
    return new ApiResponse(200, 'Sentiment analyzed', result).send(res);
  } catch (err) {
    next(err);
  }
};

export const insights = async (req, res, next) => {
  try {
    const result = await getPortfolioInsights(req.user.userId);
    return new ApiResponse(200, 'Portfolio insights generated', { insights: result }).send(res);
  } catch (err) {
    next(err);
  }
};