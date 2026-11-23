import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { requireMigrationApiKey } from './require-migration-api-key';

const run = (headerValue?: string) => {
  const result: { status?: number; body?: unknown; nextCalled: boolean } = { nextCalled: false };
  const req = { header: () => headerValue } as unknown as Request;
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
    },
  } as unknown as Response;
  requireMigrationApiKey(req, res, () => {
    result.nextCalled = true;
  });
  return result;
};

describe('requireMigrationApiKey', () => {
  afterEach(() => {
    delete process.env.MIGRATION_EXPORT_API_KEY;
  });

  it('answers 503 when no key is configured, even if a header is sent', () => {
    assert.equal(run('anything').status, 503);
  });

  it('answers 401 for a missing or wrong key', () => {
    process.env.MIGRATION_EXPORT_API_KEY = 'secret-key';
    assert.equal(run().status, 401);
    assert.equal(run('wrong').status, 401);
  });

  it('lets the matching key through', () => {
    process.env.MIGRATION_EXPORT_API_KEY = 'secret-key';
    const result = run('secret-key');
    assert.equal(result.nextCalled, true);
    assert.equal(result.status, undefined);
  });
});
