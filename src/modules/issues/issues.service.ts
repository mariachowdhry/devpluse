import { pool } from '../../config/db';
import { AppError } from '../../utils/errors.util';
import type {
  IssueRecord,
  IssueWithReporter,
  ReporterSummary,
  UserRole,
} from '../../types/models';
import type { CreateIssueBody, GetIssuesQuery, UpdateIssueBody } from './issues.types';


async function attachReporters(issues: IssueRecord[]): Promise<IssueWithReporter[]> {
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const reportersResult = await pool.query<ReporterSummary>(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );

  const reporterMap = new Map<number, ReporterSummary>(
    reportersResult.rows.map((reporter) => [reporter.id, reporter])
  );

  return issues.map(({ reporter_id, ...issue }) => ({
    ...issue,
    reporter: reporterMap.get(reporter_id) ?? {
      id: reporter_id,
      name: 'Unknown user',
      role: 'contributor' as UserRole,
    },
  }));
}

export async function createIssue(
  reporterId: number,
  body: CreateIssueBody
): Promise<IssueRecord> {
  const result = await pool.query<IssueRecord>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [body.title, body.description, body.type, reporterId]
  );

  const issue = result.rows[0];
  if (!issue) {
    throw AppError.internal('Failed to create issue');
  }

  return issue;
}

export async function getAllIssues(query: GetIssuesQuery): Promise<IssueWithReporter[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.type) {
    params.push(query.type);
    conditions.push(`type = $${params.length}`);
  }

  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortDirection = query.sort === 'oldest' ? 'ASC' : 'DESC';

  const result = await pool.query<IssueRecord>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereClause}
     ORDER BY created_at ${sortDirection}`,
    params
  );

  return attachReporters(result.rows);
}
export async function getIssueById(id: number): Promise<IssueWithReporter> {
  const result = await pool.query<IssueRecord>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );

  const issue = result.rows[0];
  if (!issue) {
    throw AppError.notFound('Issue not found');
  }

  const [withReporter] = await attachReporters([issue]);
  if (!withReporter) {
    throw AppError.internal('Failed to attach reporter to issue');
  }

  return withReporter;
}

async function getRawIssueById(id: number): Promise<IssueRecord> {
  const result = await pool.query<IssueRecord>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );

  const issue = result.rows[0];
  if (!issue) {
    throw AppError.notFound('Issue not found');
  }
  return issue;
}

export async function updateIssue(
  id: number,
  requesterId: number,
  requesterRole: UserRole,
  body: UpdateIssueBody
): Promise<IssueRecord> {
  const issue = await getRawIssueById(id);

  const isMaintainer = requesterRole === 'maintainer';
  const isOwner = issue.reporter_id === requesterId;

  if (!isMaintainer && !isOwner) {
    throw AppError.forbidden('You can only update your own issues');
  }

  if (body.status !== undefined && !isMaintainer) {
    throw AppError.forbidden('Only maintainers can change issue status');
  }

  if (!isMaintainer && issue.status !== 'open') {
    throw AppError.conflict('This issue can no longer be edited because it is not open');
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  if (body.title !== undefined) {
    params.push(body.title);
    fields.push(`title = $${params.length}`);
  }
  if (body.description !== undefined) {
    params.push(body.description);
    fields.push(`description = $${params.length}`);
  }
  if (body.type !== undefined) {
    params.push(body.type);
    fields.push(`type = $${params.length}`);
  }
  if (body.status !== undefined) {
    params.push(body.status);
    fields.push(`status = $${params.length}`);
  }

  if (fields.length === 0) {
    throw AppError.badRequest('No valid fields provided to update');
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query<IssueRecord>(
    `UPDATE issues SET ${fields.join(', ')}
     WHERE id = $${params.length}
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    params
  );

  const updatedIssue = result.rows[0];
  if (!updatedIssue) {
    throw AppError.internal('Failed to update issue');
  }

  return updatedIssue;
}

export async function deleteIssue(id: number): Promise<void> {
  const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);

  if (result.rowCount === 0) {
    throw AppError.notFound('Issue not found');
  }
}