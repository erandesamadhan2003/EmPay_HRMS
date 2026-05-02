import express from 'express';
import {
    getEmployees,
    createEmployee,
    getMe,
    updateMe,
    getById,
    updateEmployee,
    deleteEmployee,
} from '../controllers/employees.controller.js';
import { authRequired, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/employees', authRequired, getEmployees);
router.post('/employees', authRequired, requireRoles('admin', 'hr_officer'), createEmployee);
router.get('/employees/me', authRequired, getMe);
router.put('/employees/me', authRequired, updateMe);
router.get('/employees/:id', authRequired, getById);
router.put('/employees/:id', authRequired, requireRoles('admin', 'hr_officer'), updateEmployee);
router.delete('/employees/:id', authRequired, requireRoles('admin'), deleteEmployee);

export default router;
