import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectPostgres = async () => {
  await prisma.$connect();
  return prisma;
};

export default prisma;