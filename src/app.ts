import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { APP_CONSTANTS } from './config/constants';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/error.middleware';

// ─── Route Imports ──────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import companyRoutes from './modules/company/company.routes';
import userRoutes from './modules/user/user.routes';
import departmentRoutes from './modules/department/department.routes';
import expenseRoutes from './modules/expense/expense.routes';
import reportRoutes from './modules/report/report.routes';
import receiptRoutes from './modules/receipt/receipt.routes';
import ocrRoutes from './modules/ocr/ocr.routes';
import aiRoutes from './modules/ai/ai.routes';
import ruleRoutes from './modules/approval/rule/rule.routes';
import workflowRoutes from './modules/approval/workflow/workflow.routes';
import actionRoutes from './modules/approval/action/action.routes';
import budgetRoutes from './modules/budget/budget.routes';
import reimbursementRoutes from './modules/reimbursement/reimbursement.routes';
import recognitionRoutes from './modules/recognition/recognition.routes';
import notificationRoutes from './modules/notification/notification.routes';
import integrationRoutes from './modules/integration/integration.routes';

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.isDev ? '*' : undefined }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isDev ? 1000 : 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// Static file serving for uploaded receipts
app.use(`/${env.uploadDir}`, express.static(path.join(process.cwd(), env.uploadDir)));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ─── API Routes ─────────────────────────────────────────────
const PREFIX = APP_CONSTANTS.API_PREFIX;

app.use(`${PREFIX}/auth`, authRoutes);
app.use(`${PREFIX}/companies`, companyRoutes);
app.use(`${PREFIX}/users`, userRoutes);
app.use(`${PREFIX}/departments`, departmentRoutes);
app.use(`${PREFIX}/expenses`, expenseRoutes);
app.use(`${PREFIX}/reports`, reportRoutes);
app.use(`${PREFIX}/receipts`, receiptRoutes);
app.use(`${PREFIX}/ocr`, ocrRoutes);
app.use(`${PREFIX}/ai`, aiRoutes);
app.use(`${PREFIX}/approval/rules`, ruleRoutes);
app.use(`${PREFIX}/approval/workflows`, workflowRoutes);
app.use(`${PREFIX}/approval/actions`, actionRoutes);
app.use(`${PREFIX}/budgets`, budgetRoutes);
app.use(`${PREFIX}/reimbursements`, reimbursementRoutes);
app.use(`${PREFIX}/recognition`, recognitionRoutes);
app.use(`${PREFIX}/notifications`, notificationRoutes);
app.use(`${PREFIX}/integrations`, integrationRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.nodeEnv,
  });
});

// ─── API Docs Summary ───────────────────────────────────────
app.get(`${PREFIX}`, (_req, res) => {
  res.json({
    name: 'AI-Powered Expense Management System',
    version: '1.0.0',
    endpoints: {
      auth: `${PREFIX}/auth`,
      companies: `${PREFIX}/companies`,
      users: `${PREFIX}/users`,
      departments: `${PREFIX}/departments`,
      expenses: `${PREFIX}/expenses`,
      reports: `${PREFIX}/reports`,
      receipts: `${PREFIX}/receipts`,
      ocr: `${PREFIX}/ocr`,
      ai: `${PREFIX}/ai`,
      approvalRules: `${PREFIX}/approval/rules`,
      approvalWorkflows: `${PREFIX}/approval/workflows`,
      approvalActions: `${PREFIX}/approval/actions`,
      budgets: `${PREFIX}/budgets`,
      reimbursements: `${PREFIX}/reimbursements`,
      recognition: `${PREFIX}/recognition`,
      notifications: `${PREFIX}/notifications`,
      integrations: `${PREFIX}/integrations`,
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

export default app;
