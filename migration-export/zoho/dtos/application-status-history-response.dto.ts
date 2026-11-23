import type { APPLICATION_STATUS_HISTORY } from '../fields/application-status-history-fields';
import type { Picked } from '../pick-fields';

export interface ZohoUserDto {
  id: string;
  name: string | null;
}

export interface ApplicationStatusHistoryResponseDto extends Picked<typeof APPLICATION_STATUS_HISTORY> {
  leadId: string;
  externalId: string;
  modifiedBy: ZohoUserDto | null;
}
