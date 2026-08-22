const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('node:path');
const fs = require('node:fs');

const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// 1. 에러 로그 파일 설정 (7일 보관)
const errorTransport = new DailyRotateFile({
  dirname: `${logDirectory}/error`,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'error',
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
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  )
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(info => {
      const stackStr = info.stack ? `\n${info.stack}` : '';
      return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}${stackStr}`;
    })
  ),
  transports: [
    errorTransport,
    infoTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

module.exports = logger;