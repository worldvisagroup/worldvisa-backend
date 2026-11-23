import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { toAttachmentStoredFile } from '../../../chat-messages/usecases/list-chat-messages/map-chat-message-to-dto';
import { toStoredFile } from '../../../moved-documents/usecases/list-moved-documents/map-moved-document-to-dto';
import type { StoredFile } from '../../../shared/to-file-link';
import { openStoredFile, type FileStorage } from './file-storage';
import { oldFileStorage } from './old-file-storage';
import type { GetFileCommand } from './get-file.command';

const ChatMessage = require('../../../../models/chatMessage');
const DmsZohoDocument = require('../../../../models/dmsZohoDocument');
const DmsZohoAusStage2Document = require('../../../../models/dmsZohoAusStage2Documents');
const MovedDocument = require('../../../../models/movedDocuments');

export interface FileResult {
  stream: Readable;
  name: string | null;
  size: number | null;
  checksum: string | null;
}

/** `index` is the attachment position, only given for `chat-messages`. */
type FindStoredFile = (externalId: string, index?: number) => Promise<StoredFile | null>;

const STORED_FILE_COLUMNS = 'storage_type r2_key workdrive_file_id file_name';

export interface FileLookups {
  documents: FindStoredFile;
  'moved-documents': FindStoredFile;
  'stage-documents': FindStoredFile;
  'chat-messages': FindStoredFile;
}

interface ChatMessageAttachments {
  findOne(filter: Record<string, unknown>): { select(columns: string): { lean(): Promise<{ attachments?: Parameters<typeof toAttachmentStoredFile>[0][] } | null> } };
}

/** A deleted message is not exported, so its attachments are not served either. */
export const findChatAttachment =
  (messages: ChatMessageAttachments): FindStoredFile =>
  async (id, index = 0) => {
    const row = await messages.findOne({ _id: id, deletedAt: null }).select('attachments').lean();
    const attachment = row?.attachments?.[index];
    return attachment ? toAttachmentStoredFile(attachment) : null;
  };

export const modelLookups: FileLookups = {
  documents: (id) => DmsZohoDocument.findById(id).select(STORED_FILE_COLUMNS).lean(),
  'stage-documents': (id) => DmsZohoAusStage2Document.findById(id).select(STORED_FILE_COLUMNS).lean(),
  'moved-documents': async (id) => {
    const row = await MovedDocument.findById(id).select('file_id file_name').lean();
    return row ? toStoredFile(row) : null;
  },
  'chat-messages': findChatAttachment(ChatMessage),
};

/** `documents` and `stage-documents` rows without a `storage_type` are WorkDrive files (the old default). */
const withStorageKind = (stored: StoredFile): StoredFile => ({ ...stored, storage_type: stored.storage_type ?? 'workdrive' });

const hashBody = async (stream: Readable): Promise<{ body: Buffer; checksum: string }> => {
  const hash = createHash('sha256');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    hash.update(chunk);
    chunks.push(Buffer.from(chunk));
  }
  return { body: Buffer.concat(chunks), checksum: hash.digest('hex') };
};

/** Resolves `null` when the row, the stored id or the stored bytes are gone: the endpoint answers 404 `file_gone`. */
export const getFile = async (
  { source, externalId, index, checksum }: GetFileCommand,
  storage: FileStorage = oldFileStorage,
  lookups: FileLookups = modelLookups
): Promise<FileResult | null> => {
  const stored = await lookups[source](externalId, index);
  if (!stored) {
    return null;
  }
  const opened = await openStoredFile(withStorageKind(stored), storage);
  if (!opened) {
    return null;
  }
  const name = stored.file_name ?? null;
  if (!checksum) {
    return { stream: opened.stream, name, size: opened.size, checksum: null };
  }
  const { body, checksum: sha256 } = await hashBody(opened.stream);
  return { stream: Readable.from([body]), name, size: body.length, checksum: sha256 };
};
