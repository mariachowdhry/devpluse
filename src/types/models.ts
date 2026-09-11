export type UserRole = 'contributor' | 'maintainer';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type IssueType = 'bug' | 'feature_request';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface IssueRecord {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReporterSummary {
  id: number;
  name: string;
  role: UserRole;
}

export interface IssueWithReporter extends Omit<IssueRecord, 'reporter_id'> {
  reporter: ReporterSummary;
}
