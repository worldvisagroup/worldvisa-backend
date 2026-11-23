# migration-export

Read-only export API that the new WorldVisa system's migration worker pulls from, to move the old DMS data (`dmszohoclients` and its children) into the new DMS. It exists only for the migration. **The folder, the `app.use` line in `app.js`, the `tsconfig.json` entries and the env key are all deleted after cut-over.**

The consumer side is specified in the new system's repo: `docs/discussions/dms-migration-spec.md`, section "Source API (old DMS)". If this README and that spec disagree, fix both.

## Rules

1. **Read only.** A use case reads and maps. It never writes. It never calls another service, with one exception: the `zoho/` use cases read Zoho CRM (read calls only), because this backend already holds the Zoho auth and the application detail exists only there. They group Zoho values by layout section and rename them; they never convert meaning (enums, stages, statuses), which the new system does.
2. **Never return secrets.** No password fields, Clerk or session fields, tokens. Every list selects an explicit allow list of columns (`APPLICATION_COLUMNS` style); never "everything except".
3. **Values untouched.** Return what is stored. Null stays null; empty stays empty. Dates are ISO strings or `null`, never `1970-01-01`.
4. **Every item has `externalId`** (the Mongo `_id` as a string). Child rows also carry the parent's `leadId` and `externalId`.
5. **Total order.** Every list sorts by `created_at` ascending, then `_id` ascending, so offset paging can never skip or repeat a row. A collection with no created time (documents) sorts by `_id` alone.
6. **Same error shape on every endpoint:** `{ "status": "fail", "message": "...", "errors"?: [...] }` with `401` (bad or missing key), `400` (query validation, `errors` holds the zod issues), `429` (rate limit), `503` (key not configured).
7. **Live reads.** No snapshots, no cache. A run re-reads everything.
8. **One folder per resource,** like the new system's API: `<resource>/` holds its controller, router, `dtos/` and `usecases/<name>/`. A new endpoint is one use-case folder, one controller function, one router line, one README row, and a spec.

## Auth and limits

- Header `x-api-key`, compared in constant time with `MIGRATION_EXPORT_API_KEY`. This is a dedicated key, one per environment; it is **not** the shared `API_KEY`. If the variable is unset every request gets `503`.
- HTTPS only; this is enforced by the deployment, not by the code.
- 60 requests per minute for the whole API. Responses carry `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; a `429` also carries `Retry-After`. The key check runs first, so unauthenticated calls do not use the budget.

## Paging

Every list takes `page` (default 1) and `limit` (default 100, max 1000) and answers `{ "data": [...], "total": <matching rows>, "page": 1, "limit": 100 }`. Unknown query keys answer `400`.

**Exception: `/zoho/*`.** These read Zoho CRM by id, so they take `leadIds` (comma separated, required, at most 100) instead of `page` and `limit`, and answer `{ "data": [...], "requested": <distinct ids asked>, "found": <items returned> }`. A lead Zoho does not have is absent from `data` and counted in `requested - found`; it is never an error. Zoho being unreachable or rate limited answers `503` with the shared error shape.

## Endpoints

| Endpoint | Query | Returns | Used by |
|---|---|---|---|
| `GET /api/migration/applications` | `page`, `limit`, `recordType` (`visa_application` \| `spouse_skill_assessment`), `from`, `to` (ISO date or datetime; `from` inclusive, `to` exclusive; applied to `dmsCreatedAt`) | One item per `dmszohoclients` row, main and spouse | Phases 0, 1, 2 |
| `GET /api/migration/chat-conversations` | `page`, `limit`, `from`, `to` (applied to `createdAt`; `from` inclusive, `to` exclusive) | One item per `chatconversations` row with `type = "dm"` and exactly two participants, with the client participant's Zoho lead id resolved. Ordered by `createdAt`, `_id` | Phase 9 |
| `GET /api/migration/chat-messages` | `page`, `limit`, `conversationId` (a 24-character ObjectId), `from`, `to` (applied to `createdAt`; `from` inclusive, `to` exclusive) | One item per live (`deletedAt` empty) `chatmessages` row of a direct-message conversation, with a `file` link per attachment. Ordered by `createdAt`, `_id` | Phase 9 |
| `GET /api/migration/checklist-items` | `page`, `limit`, `leadId`, `recordType` (same values) | One item per element of the embedded `checklist[]` of a `dmszohoclients` row, main and spouse rows. Ordered by the application's `created_at`, `_id`, then array position | Phase 2 evidence, Phase 3 |
| `GET /api/migration/deadline-extensions` | `page`, `limit`, `leadId`, `recordType` (same values as `checklist-items`), `kind` (`approved` \| `request`), `status` (`pending` \| `approved` \| `rejected`; requests only) | Two sources in one list, told apart by `kind`: one `approved` item per element of the embedded `deadline_extensions[]` of a `dmszohoclients` row, and one `request` item per `adminapprovalrequests` row with `requestType = field_change`. Ordered by `kind` (approved first), creation time, then id | Phase 7 |
| `GET /api/migration/documents` | `page`, `limit`, `leadId`, `status` (`pending` \| `reviewed` \| `request_review` \| `approved` \| `rejected`) | One item per `dmszohodocuments` row, with its `history[]` and `comments[]` and a `file` link. Ordered by `_id` | Phase 2 evidence, Phase 4 |
| `GET /api/migration/stage-documents` | `page`, `limit`, `leadId`, `type` (`outcome` \| `eoi` \| `roi` \| `invitation`), `from`, `to` (applied to `createdAt`; `from` inclusive, `to` exclusive) | One item per `dmszohoausstage2documentschemas` row with a `file` link. Ordered by `createdAt`, `_id` | Phase 2 evidence, Phase 6 |
| `GET /api/migration/moved-documents` | `page`, `limit`, `leadId` | One item per `moveddocuments` row (a file archived when a document was re-uploaded or moved) with a `file` link. Ordered by `_id` | Phase 4 |
| `GET /api/migration/notes` | `page`, `limit`, `leadId`, `recordType` (same values as `checklist-items`) | One item per element of the embedded `notes[]` of a `dmszohoclients` row, main and spouse rows. Ordered by the application's `created_at`, `_id`, then array position | Phase 7 |
| `GET /api/migration/files/:source/:externalId` | `source` (`documents` \| `moved-documents` \| `stage-documents` \| `chat-messages`), `externalId` (the row's `externalId`), `index` (chat-messages only: the attachment's position), `checksum` (`true` computes SHA-256) | The file bytes behind a row's `file` link, or `404 { "error": "file_gone" }` | Phase 4 |
| `GET /api/migration/quality-check-requests` | `page`, `limit`, `leadId`, `status` (`pending` \| `reviewed`), `recordType` (`Visa_Applications` \| `Spouse_Skill_Assessment`, the stored Zoho module names), `from`, `to` (applied to `createdAt`; `from` inclusive, `to` exclusive) | One item per `qualitycheckrequests` row with its `messages[]`. Ordered by `createdAt`, `_id` | Phase 2 evidence, Phase 5 |
| `GET /api/migration/requested-reviews` | `page`, `limit`, `leadId` | One item per element of the embedded `requested_reviews[]` of a `dmszohodocuments` row (one review hop). Documents with no hops give no rows. Ordered by the document `_id`, then array position | Phase 5 |
| `GET /api/migration/zoho/visa-applications` | `leadIds` (required, comma separated, at most 100) | One item per found `leadId`: the Zoho `Visa_Applications` detail grouped by layout section | Phase 2 evidence, Phase 6 |
| `GET /api/migration/zoho/spouse-skill-assessments` | `leadIds` (required, comma separated, at most 100) | One item per found `leadId`: the Zoho `Spouse_Skill_Assessment` detail, plus the main applicant's Zoho id | Phase 2 evidence, Phase 6 |
| `GET /api/migration/zoho/application-status-history` | `leadIds` (required, comma separated, at most 100) | One item per entry of the Zoho `Application_Status_History` related list of each lead's `Visa_Applications` record (main applicants only; spouse records have no history in Zoho) | Built, not used by the import (no rule reads it yet) |

All planned endpoints are built. Tasks are not exported.

### `GET /api/migration/applications` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `leadId` | `lead_id` | Zoho Visa_Applications or Spouse_Skill_Assessment id |
| `recordType` | `record_type` | `null` on the 7 prod rows that have none; the consumer never migrates them |
| `name`, `fullName` | `name`, `full_name` | |
| `email`, `phone` | `email`, `phone` | |
| `leadOwner` | `lead_owner` | username string |
| `applicationState`, `applicationStage`, `dmsApplicationStatus` | `application_state`, `application_stage`, `dms_application_status` | |
| `qualifiedCountry`, `serviceType` | `qualified_country`, `service_type` | |
| `deadlineForLodgment` | `deadline_for_lodgment` | string as stored |
| `mainApplicant`, `spouseName`, `spouseSkillAssessment` | same, snake case | |
| `packageFinalize`, `suggestedAnzsco`, `assessingAuthority`, `qualityCheckFrom` | same, snake case | |
| `recentActivity` | `recent_activity` | ISO or `null` |
| `role`, `accountStatus` | `role`, `account_status` | |
| `createdAt` | `zoho_created_time` | ISO or `null` |
| `modifiedAt` | `zoho_modified_time` | ISO or `null` |
| `dmsCreatedAt` | `created_at` | when the row entered the old DMS; the sort key and the `from`/`to` window |

There is **no `updatedSince`**: the collection has no reliable "updated at" (`zoho_modified_time` is Zoho's time and does not change when staff fix a contact in the old DMS). Consumers read the whole collection each run.

Never returned: `password`, `password_value`, Clerk and session fields, reminder and checklist flags, and the embedded `checklist`, `notes` and `deadline_extensions` arrays (those get their own endpoints).

### `GET /api/migration/chat-conversations` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `participants` | `participants[]` | exactly two `{ type, id }` entries in stored order; `type` is `client` or `staff`; a `client` id is a `dmszohoclients` `_id`, a `staff` id is an old staff id |
| `clientLeadId` | the client participant's `dmszohoclients.lead_id` | resolved here so the consumer can find the Client; `null` for staff with staff, or when the client record no longer exists |
| `lastMessageAt` | `lastMessageAt` | ISO or `null` |
| `createdAt` | `createdAt` | ISO or `null`; the sort key and the `from`/`to` window |
| `modifiedAt` | `updatedAt` | ISO or `null` |

Only direct messages are exported (`type = "dm"`); `total` counts those. Client-to-client conversations cannot be created in the old DMS, so a conversation has at most one client participant. Never returned: `name`, `description`, `imageUrl`, `createdBy`, `archivedBy`. Messages are a separate endpoint (`chat-messages`).

### `GET /api/migration/chat-messages` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `conversationId` | `conversationId` | the `externalId` of a `chat-conversations` item |
| `sender` | `sender` | `{ type, id }`; `type` is `client` or `staff`; a `client` id is a `dmszohoclients` `_id`, a `staff` id is an old staff id |
| `content` | `content` | text, or `null` for an attachment-only message |
| `attachments` | `attachments[]` | in stored order, `[]` when none; each is `{ name, contentType, size, file }` |
| `attachments[].name` | `name` | `null` when empty |
| `attachments[].contentType` | `contentType` | as stored |
| `attachments[].size` | `size` | bytes; `null` when the old system stored `0` |
| `attachments[].file` | the attachment's `url` | `{ url, storageKind, size, checksum, name }`; `url` is `/files/chat-messages/<externalId>?index=<position>`; `null` when the attachment has no stored url |
| `forwarded` | `forwardedFromMessageId` | `true` when the message was forwarded; the original message id is not returned |
| `createdAt` | `createdAt` | ISO or `null`; the sort key and the `from`/`to` window |
| `modifiedAt` | `updatedAt` | ISO or `null` |

Only live messages (`deletedAt` empty) of direct-message conversations (the same rule as `chat-conversations`) are exported, and `total` counts those. `conversationId` narrows the list to one conversation; a conversation that is not a direct message gives an empty list. The direct-message conversation ids are read first and passed to the message query as a list (about 175 today). The old system stores each attachment as a public R2 URL; the export derives the object key from the URL's path and never returns the URL, the key or the bucket. Never returned: `deletedAt`, `forwardedFromMessageId`, attachment `url`.

### `GET /api/migration/checklist-items` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `checklist[]._id` | the element's own id |
| `parentExternalId` | the application's `_id` | |
| `leadId`, `recordType` | the application's `lead_id`, `record_type` | |
| `documentType`, `documentCategory` | `document_type`, `document_category` | |
| `required` | `required` | boolean |
| `instructions`, `description` | same | `null` when missing; text untouched |

`total` counts elements, not applications. The catalog (`checklistdocuments`) is not exported.

### `GET /api/migration/notes` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `notes[]._id` | the element's own id |
| `parentExternalId` | the application's `_id` | |
| `leadId`, `recordType` | the application's `lead_id`, `record_type` | |
| `note` | `note` | text untouched |
| `addedBy` | `addedBy` | the staff username, not an id; the consumer maps it to a staff member |
| `addedAt` | `addedAt` | ISO or `null` |

`total` counts notes, not applications.

### `GET /api/migration/deadline-extensions` item

| Field | `kind: "approved"` (embedded element) | `kind: "request"` (`adminapprovalrequests`) |
|---|---|---|
| `externalId` | `deadline_extensions[]._id` | the request's `_id` |
| `parentExternalId` | the application's `_id` | `null` |
| `leadId`, `recordType` | the application's `lead_id`, `record_type` | `leadId`, `recordType` |
| `kind` | `"approved"` | `"request"` |
| `fieldName` | `fieldName` | `fieldName` (always `Deadline_For_Lodgment` today) |
| `previousValue` | `previousValue` | `currentValue` |
| `newValue` | `newValue` | `requestedValue` (`YYYY-MM-DD`) |
| `reason`, `requestedBy` | same | same; `requestedBy` is a staff username |
| `approvedBy`, `approvedAt` | `approvedBy`, `approvedAt` | `reviewedBy`, `reviewedAt` (`null` while pending) |
| `requestId` | `requestId` as a string, or `null` | `null` |
| `status` | `"approved"` | `pending`, `approved` or `rejected` |
| `rejectionReason` | `null` | `rejectionReason` |
| `createdAt` | `approvedAt` | `createdAt` |

`total` counts rows of both sources. `status` implies `kind=request` (embedded rows have no request status), so `kind=approved` with a `status` answers `400`. Dates are ISO or `null`; text and the `YYYY-MM-DD` values are passed through untouched.

### `GET /api/migration/documents` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `leadId` | `record_id` | |
| `fileName`, `documentName`, `documentType`, `documentCategory` | `file_name`, `document_name`, `document_type`, `document_category` | `null` when missing |
| `description` | `description` | |
| `status` | `status` | |
| `uploadedBy`, `uploadedAt` | `uploaded_by`, `uploaded_at` | `uploadedAt` is ISO or `null` |
| `history[]` | `history[]` | `{ status, changedBy, changedAt }`, stored order |
| `comments[]` | `comments[]` | `{ comment, addedBy, documentLink, addedAt }`, stored order; `documentLink` is the old link text, untouched |
| `file` | `storage_type` and the stored file | `{ url, storageKind, size, checksum, name }` or `null` when the row has no stored file |

`file.url` points at `GET /api/migration/files/documents/<externalId>`, which streams the bytes. `storageKind` is `r2` or `workdrive`; `size` and `checksum` are `null` because the old system stores neither. `r2_key`, `workdrive_file_id`, `workdrive_parent_id`, `download_url` and `document_link` are never returned.

Never returned: `requested_reviews[]` (own endpoint), `reject_message`, `timeline[]`, `moved_files[]` (the archive rows come from their own endpoint).

### `GET /api/migration/stage-documents` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `leadId` | `record_id` | |
| `type` | `type` | `outcome`, `eoi`, `roi` or `invitation` |
| `invitationType` | `invitation_type` | `state nomination`, `Final invite` or `null` |
| `fileName`, `documentName`, `documentType` | `file_name`, `document_name`, `document_type` | |
| `outcome`, `outcomeDate` | `outcome`, `outcome_date` | `outcomeDate` is ISO or `null` |
| `skillAssessingBody`, `languageAssessingBody` | `skill_assessing_body`, `language_assessing_body` | |
| `subclass`, `state`, `point` | `subclass`, `state`, `point` | `point` is a number or `null` |
| `date`, `deadline`, `expiryAt` | `date`, `deadline`, `expiry_at` | ISO or `null` |
| `uploadedBy`, `uploadedAt` | `uploaded_by`, `uploaded_at` | |
| `createdAt`, `modifiedAt` | `createdAt`, `updatedAt` | |
| `file` | `storage_type` and the stored file | same as documents; `url` points at `/files/stage-documents/<externalId>` |

`r2_key`, `workdrive_file_id`, `workdrive_parent_id`, `download_url`, `document_link` and `last_expiry_reminder_sent_at` are never returned.

### `GET /api/migration/moved-documents` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `leadId` | `record_id` | |
| `documentExternalId` | `document_id` | the `externalId` of the row in `documents` it was archived from |
| `fileName` | `file_name` | `null` when missing |
| `movedBy`, `movedAt` | `moved_by`, `moved_at` | `movedAt` is ISO or `null` |
| `moveKind` | `move_kind` | `full_move`, `reupload_archive`, or `null` (old rows have none) |
| `file` | `file_id` | `{ url, storageKind, size, checksum, name }` or `null` when `file_id` is empty; `url` points at `/files/moved-documents/<externalId>` |

The old model has no `storage_type`. `file_id` holds an R2 key (it contains `/`) or a WorkDrive file id (it does not), and `storageKind` is resolved from that. `file_id` itself is never returned.

For `reupload_archive` rows the old code stores the original R2 key, not the key of the archived copy, so the file behind such a row may no longer exist (the file endpoint will answer `file_gone`).

### `GET /api/migration/files/:source/:externalId`

Streams the bytes of the file a row's `file.url` points at. Same key and rate limit as the other endpoints.

| Case | Answer |
|---|---|
| File found | `200`, the bytes as an attachment: `Content-Disposition` carries the stored `file_name`, `Content-Type` comes from its extension (`application/octet-stream` when unknown), `Content-Length` is set when the storage reports it |
| Unknown `externalId`, row with no stored id, or storage no longer serves the object (R2 `NoSuchKey`, WorkDrive 404, WorkDrive `401 F900` "Authorization check failed" for a file the service account can no longer read, or an HTML or JSON body instead of bytes) | `404 { "error": "file_gone" }` |
| `source` not in the list, `externalId` not an ObjectId, `index` missing for `chat-messages` or given for another source, `index` not a non-negative integer, unknown query key | `400` with the shared validation shape |
| R2 or WorkDrive unreachable, or the WorkDrive token fails (a 401 with any code other than `F900`) | `503 { "status": "fail", "message": ... }` |

`?checksum=true` reads the whole file into memory, hashes it and adds `X-Checksum-Sha256` (hex) before the body; without it the bytes are piped and no checksum is sent. R2 rows are read with the existing `r2Client`, WorkDrive rows with the existing `downloadFileFromWorkDrive`, so no token ever leaves this backend. The bytes are proxied, never redirected, so the link does not expire.

For `chat-messages` the file is the attachment at `index` of a live message; a deleted message, an unknown message or an `index` past the last attachment answers `file_gone`, and so does an attachment whose url is not on the old R2 bucket.

For `moved-documents` rows the source is `file_id` (R2 when it contains `/`, otherwise WorkDrive). A `reupload_archive` row that holds the document's original key can return the live file instead of the archive when that key is still current.

### `GET /api/migration/quality-check-requests` item

| Field | Source | Note |
|---|---|---|
| `externalId` | `_id` | |
| `leadId` | `leadId` | |
| `recordType` | `recordType` | the stored value, `Visa_Applications` or `Spouse_Skill_Assessment` (not the `record_type` values of the other endpoints) |
| `requestedBy`, `requestedTo` | `requested_by`, `requested_to` | usernames |
| `status` | `status` | `pending` or `reviewed` |
| `requestedAt` | `requested_at` | ISO or `null` |
| `messages[]` | `messages` | `{ username, message, addedAt }` in stored order; the sub-document `_id` is not returned |
| `migrated` | `migrated` | `true` = seeded earlier from the Zoho script |
| `createdAt`, `modifiedAt` | `createdAt`, `updatedAt` | |

### `GET /api/migration/requested-reviews` item

| Field | Source | Note |
|---|---|---|
| `externalId` | hop `_id` | |
| `parentExternalId` | the document's `_id` | |
| `leadId` | the document's `record_id` | |
| `requestedBy`, `requestedTo` | `requested_by`, `requested_to` | usernames |
| `status` | `status` | the hop's own status |
| `requestedAt` | `requested_at` | ISO or `null` |
| `messages[]` | `messages` | `{ username, message, addedAt }` in stored order; the sub-document `_id` is not returned |
| `participants[]` | `participants` | usernames; `[]` when absent |
| `documentStatus`, `rejectMessage` | the document's `status` and `reject_message` | copied onto every hop of the document so the consumer needs no second request |

### `GET /api/migration/zoho/visa-applications` item

Read live from the Zoho CRM `Visa_Applications` module through the Zoho auth this backend already holds (read calls only). Values are untouched: an empty field is `null`, multi-select fields are arrays of strings, dates are ISO strings. Names come from the layout label, not the Zoho API name (the API names are reused across stages and are misleading). Only fields on the allow list are requested or returned.

| Field | Note |
|---|---|
| `leadId`, `externalId` | the Zoho record id (both) |
| `skillAssessment` | `name`, `anzsco`, `assessingAuthority`, `noc`, `governmentFee`, `suggestedAnzsco`, `educationRecognized`, `fileNo`, `dateOfFiling` |
| `saOutcome` | `outcomeDate`, `validUpto`, `experienceConsidered`, `nominatedOccupations`, `warningExpiryDate` |
| `eoi` | `name`, `statesAppliedFor`, `language`, `points189`, `points190`, `points491`, `pointsActMatrix`, `dateOfFiling`, `validUpto`, `filingDeadline` |
| `roi[]` | always three objects, `round` 1 to 3, each `date`, `statesLodge`, `points`, `pnpDate`, `expiryDate`, `expressEntryNumber` (`points` is `null` for rounds 2 and 3: Zoho has no field for them) |
| `invitation` | `dateReceived`, `invitationType`, `invitationTypeIta1`, `invitedBy`, `statesInvited`, `pointsInvited`, `validUpto`, `stageDeadline`, `assessingAuthority` |
| `itaFiled` | `fileNo`, `filedDate`, `expiryDate`, `anzsco`, `state`, `pointsInvited`, `invitedBy`, `invitationType`, `fees`, `fee`, `fundsAvailable`, `notes` |
| `itaFinal` | `fileNo`, `finalDate`, `expiryDate`, `anzsco`, `state`, `invitedBy`, `invitationType`, `pointsInvited`, `pointsInvitedFinal` |
| `lodge` | `dateOfFiling`, `fileNo`, `subclass`, `state`, `feesPaid`, `numberOfApplicants`, `pointsAtLodge`, `maritalStatus`, `medical`, `validityDate` |
| `medicals` | `hapId`, `subclass`, `date`, `validUpto` |
| `language` | `testTaken`, then `ielts`, `pte`, `toefl`, `celpip`, `oet`, each `{ outcomeDate, validUpto }`. Only the five tests the new DMS stores; CAE and PTE Core are recognised from `testTaken`, and scores are not exported. Zoho reuses API names, so the dates follow the layout labels (for example PTE outcome date is `Visa_Approved`, PTE validity is `PTE_Validity_Upt`) |
| `visaGrant` | `fileNo`, `grantDate`, `validity`, `subclass`, `state`, `firstEntryDate` |
| `other` | `suggestedAnzsco`, `applicationType`, `paymentType`, `deadlineForLodgment`, `qualifiedCountry`, `serviceType` |

The portal account and every email field are never requested.

Zoho allows 50 fields per request, so the client fetches the allow list in sequential chunks of 50 and merges them by id; it retries once on a Zoho rate limit (429), then answers `503`. The consumer maps the two record type vocabularies itself: Zoho module names here and in `quality-check-requests`, snake_case in `applications` and `checklist-items`.

### `GET /api/migration/zoho/spouse-skill-assessments` item

Read live from the Zoho CRM `Spouse_Skill_Assessment` module with the same read client and the same rules as `zoho/visa-applications` (empty is `null`, multi-select is an array of strings, dates are ISO, only allow-listed fields are requested).

| Field | Note |
|---|---|
| `leadId`, `externalId` | the Zoho record id of the spouse record (both) |
| `mainLeadId` | the Zoho id of the main applicant's `Visa_Applications` record, from the `Visa_Applications` lookup; `null` when the lookup is empty |
| `skillAssessment` | `assessingAuthority`, `anzsco`, `outcomeDate`, `validUpto`, `experienceConsidered`, `education` |

Email, phone, stage and portal fields are never requested.

### `GET /api/migration/zoho/application-status-history` item

Read live from the related list `Application_Status_History` of the Zoho `Visa_Applications` record, one request per lead (a few leads at a time, 200 entries per page, ordered by the entry's id ascending). The list is a picklist tracker of Zoho's own `Application_Stage`: evidence and dates only, never the stage truth. `Spouse_Skill_Assessment` has no such list, so spouse leads give no items. A lead with no entries, and a lead id Zoho does not have, are both absent from `data` and counted in `requested - found`. `found` counts leads with at least one entry.

| Field | Note |
|---|---|
| `leadId` | the Zoho `Visa_Applications` id the entry belongs to |
| `externalId` | the Zoho id of the history entry itself |
| `stage`, `movedTo` | `Application_Stage`, `Moved_To__s`; either can be `null` (the first entry of a lead has no `stage`, the last has no `movedTo`) |
| `modifiedAt` | `Modified_Time`, as Zoho returns it (ISO with offset) |
| `modifiedBy` | the Zoho user who made the change as `{ id, name }`, or `null`. The email is never returned. The consumer maps this Zoho user to a migrated staff member |

`Duration_Days` is not returned: it is derivable from the dates.

## Structure

```text
migration-export/
  README.md
  tsconfig.json                       editor and type-check config for this folder, specs included (the root one excludes specs)
  migration-export.router.ts          key check and rate limit once, then mounts each resource router
  middleware/
    require-migration-api-key.ts
    migration-rate-limit.ts
  shared/
    paging.ts                         page, limit, skip, Page<T>
    iso-date.ts                       Date to ISO string or null (never 1970)
    iso-date-query.ts                 zod type for from/to
    record-type.ts                    visa_application | spouse_skill_assessment
    send-validation-error.ts          the 400 shape
    to-file-link.ts                   the `file` object (url, storageKind, size, checksum, name)
    lead-ids-query.ts                 zod type for `leadIds`, the `{ data, requested, found }` shape
    zoho-read-client.ts               Zoho CRM read client: auth, 50-field chunks, related-list paging, retry on 429, 503 on outage
    file-base-url.ts                  absolute base of the migration API, for `file.url`
  applications/
    applications.router.ts            the resource's routes (the Express stand-in for a Nest module)
    applications.controller.ts        thin: parse query into a command, call the use case, respond
    dtos/application-response.dto.ts
    usecases/list-applications/
      list-applications.command.ts    zod schema and inferred command type
      list-applications.usecase.ts    plain function: read with .lean(), explicit columns, map
      list-applications.usecase.spec.ts
      map-application-to-dto.ts
  chat-conversations/                 same shape as applications/
  chat-messages/                      same shape as applications/
  checklist-items/                    same shape as applications/
  deadline-extensions/                same shape as applications/
  documents/                          same shape as applications/
  stage-documents/                    same shape as applications/
  moved-documents/                    same shape as applications/
  notes/                              same shape as applications/
  files/                              files.router.ts, files.controller.ts and usecases/get-file/ (command, usecase, spec, file-storage.ts port, old-file-storage.ts R2 and WorkDrive readers); streams instead of paging
  quality-check-requests/             same shape as applications/
  requested-reviews/                  same shape as applications/
  zoho/
    zoho.router.ts                    one route per Zoho module
    zoho.controller.ts                like the others, plus 503 when Zoho is unreachable
    pick-fields.ts                    picks an allow list from a Zoho record, empty becomes null; lookupId reads a lookup's id
    fields/                           the allow lists: output name to Zoho API name, by layout section (visa-application, spouse-skill-assessment, application-status-history)
    dtos/                             one response DTO per Zoho module
    usecases/list-zoho-visa-applications/, list-zoho-spouse-skill-assessments/, list-zoho-application-status-history/   same use-case shape as applications/
```

Plain functions, no classes, no repository layer. A use case takes its model as an optional second argument so its spec can pass a stub; nothing else is injected. Resources may share `shared/` helpers; do not add an abstraction before a second endpoint needs it.

The module is TypeScript, loaded at runtime by the `tsx/cjs` hook at the top of `app.js`, like `routes/zohoDms/tasks.ts`.

## Running

```bash
# local: set a key, start the app as usual
MIGRATION_EXPORT_API_KEY=local-key pnpm dev

curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/applications?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/chat-conversations?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/chat-messages?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/checklist-items?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/deadline-extensions?limit=2&kind=request&status=pending"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/documents?limit=2&status=approved"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/stage-documents?limit=2&type=eoi"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/moved-documents?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/notes?limit=2"
curl -H "x-api-key: local-key" -o out.pdf "http://localhost:3000/api/migration/files/documents/<externalId>"
curl -H "x-api-key: local-key" -o out.bin "http://localhost:3000/api/migration/files/chat-messages/<externalId>?index=0"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/quality-check-requests?limit=2&status=pending"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/requested-reviews?limit=2"
curl -H "x-api-key: local-key" "http://localhost:3000/api/migration/zoho/visa-applications?leadIds=<id1>,<id2>"
```

## Tests

The repo's jest setup has no TypeScript transform, so these specs use `node:test` through `tsx`:

```bash
find migration-export -name '*.spec.ts' | xargs npx --no-install tsx --test
```

## Notes

- Sorting by `created_at` then `_id` can exceed MongoDB's in-memory sort limit on large documents, so the query sets `allowDiskUse(true)`.
- No index was added to the collection for this module; the export must not change the old DMS's data layer.
