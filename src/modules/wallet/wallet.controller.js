import {
  getWalletBalance,
  depositToWallet,
  withdrawFromWallet,
  getTransactionHistory,
} from "./wallet.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getBalance = async (req, res, next) => {
  try {
    const wallet = await getWalletBalance(req.user.userId);
    return new ApiResponse(200, "Wallet balance fetched", wallet).send(res);
  } catch (err) {
    next(err);
  }
};

export const deposit = async (req, res, next) => {
  try {
    const { amount, idempotencyKey } = req.body;
    const result = await depositToWallet(
      req.user.userId,
      amount,
      idempotencyKey,
    );

    if (result.duplicate) {
      return new ApiResponse(
        200,
        "Deposit already processed",
        result.transaction,
      ).send(res);
    }

    return new ApiResponse(201, "Deposit successful", result).send(res);
  } catch (err) {
    next(err);
  }
};

export const withdraw = async (req, res, next) => {
  try {
    const { amount, idempotencyKey } = req.body;
    const result = await withdrawFromWallet(
      req.user.userId,
      amount,
      idempotencyKey,
    );

    if (result.duplicate) {
      return new ApiResponse(
        200,
        "Withdrawal already processed",
        result.transaction,
      ).send(res);
    }

    return new ApiResponse(201, "Withdrawal successful", result).send(res);
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getTransactionHistory(req.user.userId, {
      page,
      limit,
    });
    return new ApiResponse(200, "Transaction history fetched", result).send(
      res,
    );
  } catch (err) {
    next(err);
  }
};
