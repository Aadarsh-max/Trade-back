import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.config.js';

export const emailQueue = new Queue('email-queue', {
  connection: redisClient,
});

export const enqueueEmail = async (jobData) => {
  await emailQueue.add('send-email', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
};

const processEmailJob = async (job) => {
  const { to, subject, body } = job.data;

  console.log(`Sending email to ${to} | Subject: ${subject}`);
  console.log(`Body: ${body}`);

  return { sent: true, to, subject };
};

export const createEmailWorker = () => {
  const worker = new Worker('email-queue', processEmailJob, {
    connection: redisClient,
  });

  worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed`, err.message);
  });

  return worker;
};