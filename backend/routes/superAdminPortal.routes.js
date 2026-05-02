import express from 'express';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';
import {
  getDashboardStats,
  getGrowthAnalytics,
  getHealthAnalytics,
  getPlatformActivity,
  getAnalyticsByStatus,
  listCompanies,
  getCompaniesStats,
  suspendCompany,
  activateCompany,
  getAuditLogs,
  getAuditLogsStats
} from '../controllers/superAdmin.controller.js';

const router = express.Router();

router.use(authRequired);
router.use(requireRole('superadmin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/growth', getGrowthAnalytics);
router.get('/analytics/health', getHealthAnalytics);
router.get('/analytics/by-status', getAnalyticsByStatus);
router.get('/activity', getPlatformActivity);
router.get('/companies', listCompanies);
router.get('/companies/stats', getCompaniesStats);
router.put('/companies/:id/suspend', suspendCompany);
router.put('/companies/:id/activate', activateCompany);
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/stats', getAuditLogsStats);

export default router;
