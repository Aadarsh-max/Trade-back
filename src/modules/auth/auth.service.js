import bcrypt from 'bcryptjs';
import prisma from '../../config/db.config.js';
import { ApiError } from '../../utils/apiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { enqueueEmail } from '../../jobs/email.job.js';

export const signupUser = async ({ fullName, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  await enqueueEmail({
    to: user.email,
    subject: 'Welcome to the Trading App',
    body: `Hi ${user.fullName}, your account has been created successfully.`,
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (token) => {
  if (!token) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Refresh token does not match');
  }

  const newAccessToken = generateAccessToken({ userId: user.id });
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};