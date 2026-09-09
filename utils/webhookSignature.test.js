const { generateHmacSignature, validateHmacSignature, generateZohoSignature, validateZohoSignature } = require('./webhookSignature');

const SECRET = 'test-secret';
const PAYLOAD = { versionId: 'v1', success: true, pdfBase64: 'abc123' };

describe('generateHmacSignature / validateHmacSignature', () => {
  test('a signature generated with the secret validates successfully', () => {
    const signature = generateHmacSignature(PAYLOAD, SECRET);
    expect(validateHmacSignature(PAYLOAD, signature, SECRET)).toBe(true);
  });

  test('is stable regardless of key insertion order (canonicalized before signing)', () => {
    const reordered = { success: true, pdfBase64: 'abc123', versionId: 'v1' };
    expect(generateHmacSignature(PAYLOAD, SECRET)).toBe(generateHmacSignature(reordered, SECRET));
  });

  test('fails validation when the payload is tampered with', () => {
    const signature = generateHmacSignature(PAYLOAD, SECRET);
    expect(validateHmacSignature({ ...PAYLOAD, success: false }, signature, SECRET)).toBe(false);
  });

  test('fails validation with the wrong secret', () => {
    const signature = generateHmacSignature(PAYLOAD, SECRET);
    expect(validateHmacSignature(PAYLOAD, signature, 'wrong-secret')).toBe(false);
  });

  test('fails validation when no signature is provided', () => {
    expect(validateHmacSignature(PAYLOAD, undefined, SECRET)).toBe(false);
  });

  test('throws when generating without a secret', () => {
    expect(() => generateHmacSignature(PAYLOAD, undefined)).toThrow('Webhook secret is required');
  });
});

describe('Zoho-named exports stay aliases of the generic functions', () => {
  test('generateZohoSignature and validateZohoSignature interoperate with the generic ones', () => {
    const signature = generateZohoSignature(PAYLOAD, SECRET);
    expect(validateHmacSignature(PAYLOAD, signature, SECRET)).toBe(true);
    expect(validateZohoSignature(PAYLOAD, generateHmacSignature(PAYLOAD, SECRET), SECRET)).toBe(true);
  });
});
