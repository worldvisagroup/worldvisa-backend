const mockPost = jest.fn();

jest.mock('axios', () => ({ post: (...args) => mockPost(...args) }));

jest.mock('../services/global-opportunities-content.service', () => ({
  buildAndRenderGlobalOpportunitiesReport: jest.fn(),
}));

const { buildAndRenderGlobalOpportunitiesReport } = require('../services/global-opportunities-content.service');
const { processGoReportJob, postWebhook } = require('./goReportWorker');

const BASE_JOB = {
  requestId: 'req-1',
  versionId: 'version-1',
  organizationId: 'org-1',
  callbackUrl: 'https://example.com/webhook',
  personalInfo: { name: 'Jane Doe', dob: '1990-01-01' },
  spouseInfo: null,
  visaProfileInfo: null,
  resumeText: 'Senior engineer.',
  countries: ['australia'],
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  process.env.GO_WEBHOOK_SECRET = 'test-secret';
});

afterEach(() => {
  jest.useRealTimers();
});

describe('processGoReportJob', () => {
  test('posts a success webhook with a base64 PDF when generation succeeds', async () => {
    const fakePdf = Buffer.from('pdf-bytes');
    buildAndRenderGlobalOpportunitiesReport.mockResolvedValue(fakePdf);
    mockPost.mockResolvedValue({ status: 200 });

    await processGoReportJob(BASE_JOB);

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, payload, options] = mockPost.mock.calls[0];
    expect(url).toBe(BASE_JOB.callbackUrl);
    expect(payload).toEqual({
      requestId: 'req-1',
      organizationId: 'org-1',
      versionId: 'version-1',
      success: true,
      pdfBase64: fakePdf.toString('base64'),
    });
    expect(options.headers['X-GO-Report-Signature']).toEqual(expect.any(String));
  });

  test('posts a failure webhook with the error message when generation throws', async () => {
    buildAndRenderGlobalOpportunitiesReport.mockRejectedValue(new Error('OpenAI timed out'));
    mockPost.mockResolvedValue({ status: 200 });

    await processGoReportJob(BASE_JOB);

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [, payload] = mockPost.mock.calls[0];
    expect(payload).toEqual({
      requestId: 'req-1',
      organizationId: 'org-1',
      versionId: 'version-1',
      success: false,
      error: 'OpenAI timed out',
    });
  });

  test('does not throw when every webhook delivery attempt fails', async () => {
    buildAndRenderGlobalOpportunitiesReport.mockResolvedValue(Buffer.from('pdf'));
    mockPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const resultPromise = processGoReportJob(BASE_JOB);
    await jest.runAllTimersAsync();
    await expect(resultPromise).resolves.toBeUndefined();
    expect(mockPost).toHaveBeenCalledTimes(3);
  });
});

describe('postWebhook', () => {
  test('retries with backoff and succeeds on a later attempt', async () => {
    mockPost.mockRejectedValueOnce(new Error('fail-1')).mockRejectedValueOnce(new Error('fail-2')).mockResolvedValueOnce({ status: 200 });

    const resultPromise = postWebhook('https://example.com/webhook', { versionId: 'v1' });
    await jest.runAllTimersAsync();
    await resultPromise;

    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  test('throws after exhausting all attempts', async () => {
    mockPost.mockRejectedValue(new Error('always fails'));

    const assertion = expect(postWebhook('https://example.com/webhook', { versionId: 'v1' })).rejects.toThrow('always fails');
    await jest.runAllTimersAsync();
    await assertion;

    expect(mockPost).toHaveBeenCalledTimes(3);
  });
});
