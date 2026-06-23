import {
  signupUser,
  loginUser,
  refreshUserAccessToken,
  logoutUser,
} from "./auth.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { env } from "../../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
};

export const signup = async (req, res, next) => {
  try {
    const result = await signupUser(req.body);

    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return new ApiResponse(201, "Signup successful", {
      user: result.user,
      accessToken: result.accessToken,
    }).send(res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return new ApiResponse(200, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
    }).send(res);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const result = await refreshUserAccessToken(token);

    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return new ApiResponse(200, "Token refreshed", {
      accessToken: result.accessToken,
    }).send(res);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await logoutUser(req.user.userId);

    res.clearCookie("refreshToken", cookieOptions);

    return new ApiResponse(200, "Logout successful").send(res);
  } catch (err) {
    next(err);
  }
};
