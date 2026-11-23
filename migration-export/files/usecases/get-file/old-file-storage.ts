import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { FileStorageUnavailableError, isInaccessibleFile, type FileStorage, type OpenedFile } from './file-storage';

const { r2Client } = require('../../../../services/r2Client');
const { downloadFileFromWorkDrive } = require('../../../../utils/dmsZohoWorkDrive');

const MAX_ERROR_BODY_LENGTH = 4096;

const isMissingR2Object = (error: any): boolean => error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;

const openR2 = async (key: string): Promise<OpenedFile | null> => {
  try {
    const { Body, ContentLength } = await r2Client.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    return Body ? { stream: Body as Readable, size: ContentLength ?? null } : null;
  } catch (error) {
    if (isMissingR2Object(error)) {
      return null;
    }
    throw new FileStorageUnavailableError();
  }
};

/** WorkDrive answers a missing file with 404, or with an HTML or JSON body instead of the bytes (zip worker precedent). */
const isNotFileBody = (contentType: unknown): boolean => /text\/html|application\/json/i.test(String(contentType ?? ''));

const readErrorBody = async (stream: AsyncIterable<Buffer | string> | undefined): Promise<string> => {
  let body = '';
  try {
    for await (const chunk of stream ?? []) {
      body += chunk;
      if (body.length > MAX_ERROR_BODY_LENGTH) {
        break;
      }
    }
  } catch {
    return body;
  }
  return body;
};

const openWorkDrive = async (fileId: string): Promise<OpenedFile | null> => {
  let response: any;
  try {
    response = await downloadFileFromWorkDrive(fileId);
  } catch (error: any) {
    const status = error?.response?.status;
    const body = await readErrorBody(error?.response?.data);
    error?.response?.data?.destroy?.();
    if (status === 404 || isInaccessibleFile(status, body)) {
      return null;
    }
    throw new FileStorageUnavailableError();
  }
  if (isNotFileBody(response.headers?.['content-type'])) {
    response.data.destroy();
    return null;
  }
  const length = Number(response.headers?.['content-length']);
  return { stream: response.data as Readable, size: Number.isFinite(length) && length > 0 ? length : null };
};

export const oldFileStorage: FileStorage = { openR2, openWorkDrive };
