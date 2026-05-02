import express from 'express';
import { reviewCompanyRequest } from '../controllers/superAdmin.controller.js';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/company-request/:id/review', authRequired, requireRole('superadmin'), reviewCompanyRequest);

export default router;
