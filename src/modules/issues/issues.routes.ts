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

// GET /api/issues - Public
router.get('/', getAllIssues);

// GET /api/issues/:id - Public
router.get('/:id', getIssueById);

// POST /api/issues - Authenticated (contributor, maintainer)
router.post('/', authenticate, createIssue);

// PATCH /api/issues/:id - Maintainer (any) OR Contributor (own, if open)
// Permission nuance is enforced inside the service layer since it
// depends on issue ownership/state, not just role.
router.patch('/:id', authenticate, updateIssue);

// DELETE /api/issues/:id - Maintainer only
router.delete('/:id', authenticate, requireRole('maintainer'), deleteIssue);

export default router;
