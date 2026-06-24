import {
  getUserHoldings,
  getPortfolioSummary,
  getRealizedPnl,
} from "./portfolio.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getHoldings = async (req, res, next) => {
  try {
    const holdings = await getUserHoldings(req.user.userId);
    return new ApiResponse(200, "Holdings fetched", holdings).send(res);
  } catch (err) {
    next(err);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await getPortfolioSummary(req.user.userId);
    return new ApiResponse(200, "Portfolio summary fetched", summary).send(res);
  } catch (err) {
    next(err);
  }
};

export const getPnl = async (req, res, next) => {
  try {
    const pnl = await getRealizedPnl(req.user.userId);
    return new ApiResponse(200, "Realized P&L fetched", pnl).send(res);
  } catch (err) {
    next(err);
  }
};
