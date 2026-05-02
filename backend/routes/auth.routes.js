import express from 'express';
import { createCompany, registerUser, login, changePassword } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/company', createCompany);
router.post('/register', registerUser);
router.post('/login', login);
router.post('/change-password', authRequired, changePassword);

export default router;

