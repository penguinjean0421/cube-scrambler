const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('node:path');
const fs = require('node:fs');

const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const getTimestampWithTimezone = () => {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +00:00`;
};

const interactionTimestamp = winston.format((info) => {
  if (!info.timestamp) {
    info.timestamp = getTimestampWithTimezone();
  }
  return info;
});

// 1. 에러 로그 파일 설정 (7일 보관)
const errorTransport = new DailyRotateFile({
  dirname: `${logDirectory}/error`,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'error',
  utc: true,
});

// 2. 통계(사용량) 로그 파일 설정 (30일 보관)
const infoTransport = new DailyRotateFile({
  dirname: `${logDirectory}/usage`,
  filename: 'usage-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'info',
  utc: true,
  format: winston.format.combine(
    interactionTimestamp(),
    winston.format.json()
  )
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    interactionTimestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(info => {
      const stackStr = info.stack ? `\n${info.stack}` : '';
      return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}${stackStr}`;
    })
  ),
  transports: [
    errorTransport,
    infoTransport,
  ],
});

module.exports = logger;