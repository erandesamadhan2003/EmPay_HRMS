import express from 'express';
import { reviewCompanyRequest } from '../controllers/superAdmin.controller.js';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';
import { listCompanyRequests } from '../controllers/superAdmin.controller.js';

const router = express.Router();

router.post('/company-request/:id/review', authRequired, requireRole('superadmin'), reviewCompanyRequest);
router.get('/company-requests', authRequired, requireRole('superadmin'), listCompanyRequests);

export default router;
