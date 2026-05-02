import express from 'express';
import { getDepartments, createDept, updateDept, deleteDept } from '../controllers/departments.controller.js';
import { authRequired, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/departments', authRequired, getDepartments);
router.post('/departments', authRequired, requireRoles('admin', 'hr_officer'), createDept);
router.put('/departments/:id', authRequired, requireRoles('admin', 'hr_officer'), updateDept);
router.delete('/departments/:id', authRequired, requireRoles('admin'), deleteDept);

export default router;
