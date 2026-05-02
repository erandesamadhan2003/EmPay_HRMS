import express from 'express';
import { createCompany, registerUser, login, reviewCompanyRequest } from '../controllers/auth.controller.js';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/company', createCompany);
router.post('/register', registerUser);
router.post('/login', login);

// review company request - only superadmin
router.post('/company-request/:id/review', authRequired, requireRole('superadmin'), reviewCompanyRequest);

export default router;

