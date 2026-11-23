import type { ApplicationStatusHistoryResponseDto, ZohoUserDto } from '../../dtos/application-status-history-response.dto';
import { APPLICATION_STATUS_HISTORY, MODIFIED_BY_LOOKUP } from '../../fields/application-status-history-fields';
import { lookupId, pickFields } from '../../pick-fields';
import type { ZohoRecord } from '../../../shared/zoho-read-client';

// The user arrives as `{ id, name, email }`; the email is never returned.
const toModifiedBy = (value: unknown): ZohoUserDto | null => {
  const id = lookupId(value);
  if (id === null) {
    return null;
  }
  const name = (value as { name?: unknown }).name;
  return { id, name: typeof name === 'string' && name !== '' ? name : null };
};

export const mapApplicationStatusHistoryToDto = (leadId: string, record: ZohoRecord): ApplicationStatusHistoryResponseDto => ({
  leadId,
  externalId: record.id,
  ...pickFields(record, APPLICATION_STATUS_HISTORY),
  modifiedBy: toModifiedBy(record[MODIFIED_BY_LOOKUP]),
});
