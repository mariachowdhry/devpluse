import { IssueStatus, IssueType } from '../../types/models';

export interface CreateIssueBody {
  title: string;
  description: string;
  type: IssueType;
}

export interface UpdateIssueBody {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
}

export interface GetIssuesQuery {
  sort?: 'newest' | 'oldest';
  type?: IssueType;
  status?: IssueStatus;
}
