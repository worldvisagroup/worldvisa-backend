export interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification: { status: string } | null;
}

export interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  image_url: string | null;
  first_name: string | null;
  last_name: string | null;
  public_metadata?: {
    username?: string;
    role?: string;
    user_id?: string;
  };
}

export interface ClerkDeletedPayload {
  id: string;
}

export interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload | ClerkDeletedPayload;
}

export interface UserSyncResult {
  email: string;
  staffUpdated: boolean;
  clientUpdated: boolean;
}

export interface DeleteSyncResult {
  staffUpdated: boolean;
  clientUpdated: boolean;
}
