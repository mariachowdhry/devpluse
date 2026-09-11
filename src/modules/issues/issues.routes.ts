import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from './issues.controller';

const router = Router();

router.get('/', getAllIssues);

router.get('/:id', getIssueById);


router.post('/', authenticate, createIssue);


router.patch('/:id', authenticate, updateIssue);


router.delete('/:id', authenticate, requireRole('maintainer'), deleteIssue);

export default router;
