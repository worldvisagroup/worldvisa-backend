
export type EmailProvider  = 'resend' | 'gmail';
export type EmailDirection = 'inbound' | 'outbound';
export type EmailType      = 'system' | 'agent' | 'client';
export type EmailEvent     =
  | 'queued' | 'sent' | 'delivered' | 'opened' | 'bounced'
  | 'received' | 'complained' | 'clicked' | 'delivery_delayed';

export interface EmailAttachment {
  _id?:                   unknown;
  filename:               string;
  content_type:           string;
  size:                   number;
  storage_key:            string;
  provider_attachment_id: string | null;
  content_disposition:    string | null;
  content_id:             string | null;
  url?:                   string;
}


export interface EmailDocument {
  _id:               unknown;
  provider:          EmailProvider;
  provider_email_id: string | null;
  message_id:        string | null;
  in_reply_to:       string | null;
  references:        string[];
  thread_id:         string | null;
  client_id:         unknown;
  direction:         EmailDirection;
  email_type:        EmailType;
  from:              string;
  to:                string[];
  cc:                string[];
  bcc:               string[];
  reply_to:          string[];
  subject:           string;
  html:              string | null;
  text:              string | null;
  attachments:       EmailAttachment[];
  headers:           Record<string, unknown>;
  last_event:        EmailEvent;
  is_read:           boolean;
  created_at:        Date;
  received_at:       Date | null;
}

export type EmailListItem = Omit<EmailDocument, 'html' | 'text' | 'headers'>;


export interface EmailListQuery {
  page?:       string;
  limit?:      string;
  direction?:  string;
  filter?:     string;
  email_type?: string;
  client_id?:  string;
  email?:      string;
  provider?:   string;
  q?:          string;
  unread?:     string;
  today?:      string;
  startDate?:  string;
  endDate?:    string;
}


export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}



export interface ResendEventData {
  email_id?:   string;
  message_id?: string | null;
  from?:       string;
  to?:         string | string[];
  cc?:         string | string[];
  bcc?:        string | string[];
  subject?:    string;
  created_at?: string;
}

export interface ResendWebhookPayload {
  type?: string;
  data?: ResendEventData & { email_id?: string };
}


export interface GmailSyncOptions {
  afterDate?:   string;
  pageToken?:   string;
  maxPages?:    number;
  maxMessages?: number;
}


export interface SendEmailBody {
  to:          string | string[];
  subject:     string;
  html:        string;
  text?:       string;
  cc?:         string | string[];
  bcc?:        string | string[];
  client_id?:  string;
  in_reply_to?: string;
  message_id?:  string;
}
