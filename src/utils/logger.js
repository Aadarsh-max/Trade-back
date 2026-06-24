import winston from 'winston';
import mongoose from '../config/mongo.config.js';

const logSchema = new mongoose.Schema({
  level: String,
  message: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

const LogModel = mongoose.models.Log || mongoose.model('Log', logSchema);

class MongoTransport extends winston.Transport {
  log(info, callback) {
    LogModel.create({
      level: info.level,
      message: info.message,
      meta: info.meta || {},
    }).catch(() => {});

    callback();
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new MongoTransport(),
  ],
});

export default logger;