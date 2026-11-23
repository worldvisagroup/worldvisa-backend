export type FileSource = 'documents' | 'moved-documents' | 'stage-documents' | 'chat-messages';
export type StorageKind = 'r2' | 'workdrive';

/** The stored-file columns shared by the old document models. */
export interface StoredFile {
  storage_type?: StorageKind | null;
  r2_key?: string | null;
  workdrive_file_id?: string | null;
  file_name?: string | null;
}

export interface FileLinkDto {
  url: string;
  storageKind: StorageKind;
  size: number | null;
  checksum: string | null;
  name: string | null;
}

/**
 * Link to `GET /migration/files/:source/:externalId`, which streams the bytes.
 * Internal storage ids are never returned. The old system stores no size or checksum, so both are `null`.
 * `index` picks one element of a row that holds several files (a chat message's attachments).
 */
export const toFileLink = (
  fileBaseUrl: string,
  source: FileSource,
  externalId: string,
  { storage_type, r2_key, workdrive_file_id, file_name }: StoredFile,
  index?: number
): FileLinkDto | null => {
  const storageKind: StorageKind = storage_type ?? 'workdrive';
  const storedId = storageKind === 'r2' ? r2_key : workdrive_file_id;
  if (!storedId) {
    return null;
  }
  return {
    url: `${fileBaseUrl}/files/${source}/${externalId}${index === undefined ? '' : `?index=${index}`}`,
    storageKind,
    size: null,
    checksum: null,
    name: file_name ?? null,
  };
};
