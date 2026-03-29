import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // API Keys
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || 'free-tier',
  restCountriesApiUrl: process.env.REST_COUNTRIES_API_URL || 'https://restcountries.com/v3.1',

  // OCR
  ocrLanguage: process.env.OCR_LANGUAGE || 'eng',

  // File Upload
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-me-in-prod!!!',
};
