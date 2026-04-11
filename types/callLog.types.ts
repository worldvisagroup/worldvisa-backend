export type DateRangePreset = 'last_24h' | 'last_7d' | 'last_30d' | 'last_90d';

export type CallStatus =
  | 'initiated'
  | 'answered'
  | 'completed'
  | 'missed'
  | 'busy'
  | 'cancelled';

export type CallDirection = 'inbound' | 'outbound';

// ── Query ─────────────────────────────────────────────────────────────────────

export interface CallLogListQuery {
  /** Free-text search across phone numbers, agent name, and client name */
  q?:         string;
  status?:    CallStatus;
  direction?: CallDirection;
  /** Named date-range preset — takes priority over startDate/endDate */
  dateRange?: DateRangePreset;
  /** ISO date string (YYYY-MM-DD), used only when dateRange is absent */
  startDate?: string;
  endDate?:   string;
  page?:      number;
  limit?:     number;
}

// ── Document shapes ───────────────────────────────────────────────────────────

/** Populated agent shape returned from list / detail endpoints */
export interface PopulatedAgent {
  _id:          string;
  name:         string;
  email:        string;
  agent_number: string | null;
}

/** Populated client shape returned from detail endpoint */
export interface PopulatedClient {
  _id:     string;
  Name:    string;
  Email:   string;
  Phone:   string;
  lead_id: string;
}

export interface CallLogDocument {
  _id:               string;
  call_id:           string;
  direction:         CallDirection;
  status:            CallStatus;
  dial_status:       string;
  agent_phone:       string;
  agent_name:        string;
  agent_id:          string | PopulatedAgent | null;
  customer_phone:    string;
  client_id:         string | PopulatedClient | null;
  client_lead_id:    string | null;
  client_name:       string | null;
  mcube_did:         string;
  group_name:        string;
  start_time:        string;
  end_time:          string | null;
  answered_duration: string | null;
  disconnected_by:   string | null;
  recording_url:     string | null;
  created_at:        string;
  updated_at:        string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface CallLogPagination {
  currentPage:  number;
  totalPages:   number;
  totalRecords: number;
  limit:        number;
}

export interface CallLogListResponse {
  status:     'success';
  results:    number;
  pagination: CallLogPagination;
  data:       { callLogs: CallLogDocument[] };
}

export interface CallLogDetailResponse {
  status: 'success';
  data:   { callLog: CallLogDocument };
}
