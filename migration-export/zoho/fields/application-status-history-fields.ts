/**
 * Allow list for the Zoho `Application_Status_History` related list of `Visa_Applications` (D24),
 * `output name -> Zoho API name`. The list is a picklist tracker of the Zoho application stage: it is
 * evidence of when a stage was reached, never the stage truth. `Spouse_Skill_Assessment` has no such list.
 * Left out on purpose: `Duration_Days` (derivable from the dates), the user's email, currency and system fields.
 */
export const APPLICATION_STATUS_HISTORY = {
  stage: 'Application_Stage',
  movedTo: 'Moved_To__s',
  modifiedAt: 'Modified_Time',
} as const;

// Zoho user who made the change; read through `toModifiedBy`, never through `pickFields`.
export const MODIFIED_BY_LOOKUP = 'Modified_By';

export const APPLICATION_STATUS_HISTORY_FIELDS: readonly string[] = [...Object.values(APPLICATION_STATUS_HISTORY), MODIFIED_BY_LOOKUP];
