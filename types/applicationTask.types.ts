import type {
  FollowUpSource,
  TaskLinkType,
  TaskSortField,
  TaskSortOrder,
  TaskStatus,
} from '../constants/applicationTask';
import type { RECORD_TYPES } from '../models/adminApprovalRequest.model';

export type RecordType = (typeof RECORD_TYPES)[number];

export interface TaskLinkInput {
  url: string;
  label?: string;
  type?: TaskLinkType;
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  search?: string;
  leadId?: string;
  status?: TaskStatus;
  statusIn?: string;
  leadOwner?: string;
  createdBy?: string;
  mine?: string;
  recordType?: RecordType;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  createdFrom?: string;
  createdTo?: string;
  overdue?: string;
  upcoming?: string;
  sortBy?: TaskSortField;
  sortOrder?: TaskSortOrder;
  includeDeleted?: string;
}

export interface TaskListContext {
  actorType: 'staff' | 'client';
  username?: string;
  role?: string;
  leadId?: string;
}

export interface CreateTaskBody {
  leadId: string;
  recordType?: RecordType;
  leadOwner?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  date?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  links?: TaskLinkInput[];
}

export interface UpdateTaskBody {
  title?: string;
  description?: string;
  date?: string | null;
  scheduledFrom?: string | null;
  scheduledTo?: string | null;
  links?: TaskLinkInput[];
}

export interface UpdateTaskStatusBody {
  status: TaskStatus;
}

export interface SendFollowUpNowBody {
  source: FollowUpSource;
  message?: string;
}

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TaskClientSummary {
  name: string;
  profile_image_url: string | null;
}

export interface TaskCreatorSummary {
  username: string;
  name: string;
  profile_image_url: string | null;
}
