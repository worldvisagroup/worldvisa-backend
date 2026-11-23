import { toIsoOrNull } from '../../../shared/iso-date';
import type { RequestedReviewResponseDto } from '../../dtos/requested-review-response.dto';

export interface RequestedReviewHop {
  _id: { toString(): string };
  requested_by?: string | null;
  requested_to?: string | null;
  status?: string | null;
  requested_at?: Date | string | null;
  messages?: { username?: string | null; message?: string | null; added_at?: Date | string | null }[];
  participants?: string[];
}

/** One review hop after `$unwind`, carrying the columns of the document it belongs to. */
export interface RequestedReviewRow {
  _id: { toString(): string };
  record_id: string;
  status?: string | null;
  reject_message?: string | null;
  requested_reviews: RequestedReviewHop;
}

export const mapRequestedReviewToDto = ({ _id, record_id, status, reject_message, requested_reviews: hop }: RequestedReviewRow): RequestedReviewResponseDto => ({
  externalId: hop._id.toString(),
  parentExternalId: _id.toString(),
  leadId: record_id,
  requestedBy: hop.requested_by ?? null,
  requestedTo: hop.requested_to ?? null,
  status: hop.status ?? null,
  requestedAt: toIsoOrNull(hop.requested_at),
  messages: (hop.messages ?? []).map((entry) => ({
    username: entry.username ?? null,
    message: entry.message ?? null,
    addedAt: toIsoOrNull(entry.added_at),
  })),
  participants: hop.participants ?? [],
  documentStatus: status ?? null,
  rejectMessage: reject_message ?? null,
});
