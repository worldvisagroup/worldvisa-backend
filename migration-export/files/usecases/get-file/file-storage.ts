import type { Readable } from 'node:stream';
import type { StoredFile } from '../../../shared/to-file-link';

export interface OpenedFile {
  stream: Readable;
  size: number | null;
}

/** Reads one stored object. Resolves `null` when the old system no longer has it. */
export interface FileStorage {
  openR2(key: string): Promise<OpenedFile | null>;
  openWorkDrive(fileId: string): Promise<OpenedFile | null>;
}

/** The storage is reachable but did not answer; the caller can retry later. */
export class FileStorageUnavailableError extends Error {
  constructor(message = 'Old file storage is unavailable') {
    super(message);
    this.name = 'FileStorageUnavailableError';
  }
}

export const openStoredFile = async (stored: StoredFile, storage: FileStorage): Promise<OpenedFile | null> => {
  if (stored.storage_type === 'r2') {
    return stored.r2_key ? storage.openR2(stored.r2_key) : null;
  }
  return stored.workdrive_file_id ? storage.openWorkDrive(stored.workdrive_file_id) : null;
};

const AUTHORIZATION_CHECK_FAILED = 'F900';

/**
 * WorkDrive answers 401 F900 ("Authorization check failed") for a file this service account can no longer read.
 * It is permanent for that file, unlike an expired token (401 with another code), so it counts as gone.
 */
export const isInaccessibleFile = (status: number | undefined, body: string): boolean => {
  if (status !== 401 && status !== 403) {
    return false;
  }
  try {
    return JSON.parse(body)?.errors?.some((entry: { id?: string }) => entry?.id === AUTHORIZATION_CHECK_FAILED) === true;
  } catch {
    return false;
  }
};
