import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../utils/errors.util';
import { sendSuccess } from '../../utils/response.util';
import {
  validateTitle,
  validateDescription,
  validateIssueType,
  validateIssueStatus,
} from '../../utils/validation.util';
import * as issuesService from './issues.service';
import type { CreateIssueBody, GetIssuesQuery, UpdateIssueBody } from './issues.types';
import type { IssueType, IssueStatus } from '../../types/models';


export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<CreateIssueBody>;

  const errors: Record<string, string> = {};
  const titleErr = validateTitle(body.title);
  const descErr = validateDescription(body.description);
  const typeErr = validateIssueType(body.type);
  if (titleErr) errors.title = titleErr;
  if (descErr) errors.description = descErr;
  if (typeErr) errors.type = typeErr;

  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest('Validation failed', errors);
  }


  const reporterId = req.user!.id;

  const issue = await issuesService.createIssue(reporterId, {
    title: body.title!.trim(),
    description: body.description!.trim(),
    type: body.type!,
  });

  sendSuccess(res, 201, 'Issue created successfully', issue);
});

export const getAllIssues = asyncHandler(async (req: Request, res: Response) => {
  const { sort, type, status } = req.query as Record<string, string | undefined>;

  if (sort !== undefined && sort !== 'newest' && sort !== 'oldest') {
    throw AppError.badRequest('sort must be "newest" or "oldest"');
  }

  if (type !== undefined && type !== 'bug' && type !== 'feature_request') {
    throw AppError.badRequest('type must be "bug" or "feature_request"');
  }

  if (
    status !== undefined &&
    status !== 'open' &&
    status !== 'in_progress' &&
    status !== 'resolved'
  ) {
    throw AppError.badRequest('status must be "open", "in_progress", or "resolved"');
  }

  const issuesQuery: GetIssuesQuery = {
    sort: (sort as GetIssuesQuery['sort']) ?? 'newest',
    ...(type !== undefined && { type: type as IssueType }),
    ...(status !== undefined && { status: status as IssueStatus }),
  };

  const issues = await issuesService.getAllIssues(issuesQuery);

  sendSuccess(res, 200, 'Issues retrieved successfully', issues);
});

export const getIssueById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('Invalid issue id');
  }

  const issue = await issuesService.getIssueById(id);

  sendSuccess(res, 200, 'Issue retrieved successfully', issue);
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('Invalid issue id');
  }

  const body = req.body as Partial<UpdateIssueBody>;

  const errors: Record<string, string> = {};
  if (body.title !== undefined) {
    const err = validateTitle(body.title);
    if (err) errors.title = err;
  }
  if (body.description !== undefined) {
    const err = validateDescription(body.description);
    if (err) errors.description = err;
  }
  if (body.type !== undefined) {
    const err = validateIssueType(body.type);
    if (err) errors.type = err;
  }
  if (body.status !== undefined) {
    const err = validateIssueStatus(body.status);
    if (err) errors.status = err;
  }

  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest('Validation failed', errors);
  }

  const patch: Partial<UpdateIssueBody> = {};
  if (body.title !== undefined) patch.title = body.title.trim();
  if (body.description !== undefined) patch.description = body.description.trim();
  if (body.type !== undefined) patch.type = body.type;
  if (body.status !== undefined) patch.status = body.status;

  if (Object.keys(patch).length === 0) {
    throw AppError.badRequest('At least one field must be provided to update');
  }

  const updated = await issuesService.updateIssue(id, req.user!.id, req.user!.role, patch);

  sendSuccess(res, 200, 'Issue updated successfully', updated);
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('Invalid issue id');
  }

  await issuesService.deleteIssue(id);

  sendSuccess(res, 200, 'Issue deleted successfully', null);
});