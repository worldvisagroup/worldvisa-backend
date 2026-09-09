jest.mock('../../../services/global-opportunities-content.service', () => ({
  buildAndRenderGlobalOpportunitiesReport: jest.fn(),
}));

jest.mock('../../../workers/goReportWorker', () => ({
  processGoReportJob: jest.fn(),
}));

const { processGoReportJob } = require('../../../workers/goReportWorker');
const router = require('./global-opportunities-content.routes');

const VALID_BODY = {
  personalInfo: { name: 'Jane Doe', dob: '1990-01-01' },
  resumeText: 'Senior software engineer with 8 years of experience.',
  countries: ['australia'],
  versionId: 'version-1',
  organizationId: 'org-1',
  callbackUrl: 'https://example.com/webhook',
};

function buildReq(body = VALID_BODY, headers = {}) {
  return {
    method: 'POST',
    url: '/generate-report/start',
    headers: { 'x-api-token': process.env.GO_REPORT_API_TOKEN, ...headers },
    body,
  };
}

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

// Dispatches directly through the router (no HTTP server, no supertest --
// matches this repo's existing middleware-test convention of hand-built
// req/res doubles). Flushes one setImmediate tick since the route defers
// background work via setImmediate after responding.
async function dispatch(req, res) {
  await new Promise((resolve, reject) => {
    router(req, res, (err) => (err ? reject(err) : resolve()));
    // If the route handler responds directly (no next()), resolve once
    // the synchronous handler call stack has unwound.
    setImmediate(resolve);
  });
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GO_REPORT_API_TOKEN = 'test-token';
});

describe('POST /generate-report/start', () => {
  test('responds 202 with a requestId immediately, without waiting on generation', async () => {
    const req = buildReq();
    const res = buildRes();

    await dispatch(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ requestId: expect.any(String) });
    expect(processGoReportJob).toHaveBeenCalledTimes(1);
    expect(processGoReportJob).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 'version-1', organizationId: 'org-1', callbackUrl: 'https://example.com/webhook' })
    );
  });

  test('401s when the API token is missing or wrong', async () => {
    const req = buildReq(VALID_BODY, { 'x-api-token': 'wrong-token' });
    const res = buildRes();

    await dispatch(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(processGoReportJob).not.toHaveBeenCalled();
  });

  test('400s on the existing request-shape validation (missing resumeText)', async () => {
    const req = buildReq({ ...VALID_BODY, resumeText: '' });
    const res = buildRes();

    await dispatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(processGoReportJob).not.toHaveBeenCalled();
  });

  test('400s when versionId is missing', async () => {
    const { versionId, ...withoutVersionId } = VALID_BODY;
    const req = buildReq(withoutVersionId);
    const res = buildRes();

    await dispatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/versionId/) }));
    expect(processGoReportJob).not.toHaveBeenCalled();
  });

  test('400s when callbackUrl is missing', async () => {
    const { callbackUrl, ...withoutCallbackUrl } = VALID_BODY;
    const req = buildReq(withoutCallbackUrl);
    const res = buildRes();

    await dispatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/callbackUrl/) }));
    expect(processGoReportJob).not.toHaveBeenCalled();
  });
});
