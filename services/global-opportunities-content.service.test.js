const mockResponsesCreate = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    responses: { create: mockResponsesCreate },
  }))
);

jest.mock('./redis', () => ({
  fetchCachedSummary: jest.fn(),
  cacheSummary: jest.fn(),
}));

jest.mock('./pdf-generator.service', () => ({
  generatePDFWithRetry: jest.fn(),
}));

jest.mock(
  '../dist/templates/utils/country-registry',
  () => ({
    getCountryConfig: jest.fn((country) => ({
      code: country,
      name: country.charAt(0).toUpperCase() + country.slice(1),
    })),
  }),
  { virtual: true }
);

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
}));

const { fetchCachedSummary, cacheSummary } = require('./redis');
const { generatePDFWithRetry } = require('./pdf-generator.service');
const { buildAndRenderGlobalOpportunitiesReport } = require('./global-opportunities-content.service');

const FAKE_PDF = Buffer.from('fake-pdf-bytes');

function mockOpenAiResponses() {
  mockResponsesCreate.mockImplementation((params) => {
    // Resume-summary call has no `text.format` (plain text output).
    if (!params.text) {
      return Promise.resolve({ output_text: 'Senior software engineer, 8 years experience.' });
    }
    // Structured-output section calls -- return a minimal object satisfying
    // whatever schema was requested (tests only assert on orchestration, not
    // exact section content).
    return Promise.resolve({ output_text: JSON.stringify({ mock: true, schema: params.text.format.name }) });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOpenAiResponses();
  fetchCachedSummary.mockResolvedValue(null);
  cacheSummary.mockResolvedValue(undefined);
  generatePDFWithRetry.mockResolvedValue(FAKE_PDF);
});

const basePayload = {
  personalInfo: { name: 'Jane Doe', dob: '1990-01-01' },
  spouseInfo: null,
  visaProfileInfo: { australia: { anzscoCode: '261313' } },
  resumeText: 'Senior software engineer with 8 years of experience in fintech.',
  countries: ['australia'],
  requestId: 'req-1',
};

test('generates a resume summary once, then renders and returns the PDF buffer', async () => {
  const result = await buildAndRenderGlobalOpportunitiesReport(basePayload);

  expect(result).toBe(FAKE_PDF);
  expect(generatePDFWithRetry).toHaveBeenCalledTimes(1);

  const [callArgs, retries] = generatePDFWithRetry.mock.calls[0];
  expect(retries).toBe(2);
  expect(callArgs.userName).toBe('Jane Doe');
  expect(callArgs.countries).toEqual(['australia']);
  expect(callArgs.requestId).toBe('req-1');
});

test('assembles reportData with meta/coverPage plus every Australia section key', async () => {
  await buildAndRenderGlobalOpportunitiesReport(basePayload);

  const [{ reportData }] = generatePDFWithRetry.mock.calls[0];
  const australiaData = reportData.australia;

  expect(australiaData.meta).toEqual(
    expect.objectContaining({ country: 'australia', userName: 'Jane Doe', reportVersion: '1.0' })
  );
  expect(australiaData.coverPage.title).toContain('Australia');
  for (const key of ['executiveSummary', 'professionalProfile', 'visaPathways', 'skillDemand', 'topEmployers', 'salaryVariation']) {
    expect(australiaData[key]).toEqual(expect.objectContaining({ mock: true }));
  }
});

test('nests reportData per country even for a single-country request', async () => {
  await buildAndRenderGlobalOpportunitiesReport(basePayload);

  const [{ reportData }] = generatePDFWithRetry.mock.calls[0];
  expect(Object.keys(reportData)).toEqual(['australia']);
});

test('cache miss: generates and caches a cacheable (general) section', async () => {
  fetchCachedSummary.mockResolvedValue(null);

  await buildAndRenderGlobalOpportunitiesReport(basePayload);

  // skillDemand/topEmployers/salaryVariation are the cacheable AU sections.
  expect(cacheSummary).toHaveBeenCalled();
  const cachedKeys = cacheSummary.mock.calls.map(([key]) => key);
  expect(cachedKeys.some((key) => key.includes('skillDemand'))).toBe(true);
  expect(cachedKeys.some((key) => key.includes('261313'))).toBe(true); // AU occupation code used in the key
});

test('cache hit: reuses cached content and does not call OpenAI or re-cache for that section', async () => {
  const cachedSkillDemand = { primaryOccupationCode: '261313', cached: true };
  fetchCachedSummary.mockImplementation((key) => (key.includes('skillDemand') ? Promise.resolve(cachedSkillDemand) : Promise.resolve(null)));

  await buildAndRenderGlobalOpportunitiesReport(basePayload);

  const [{ reportData }] = generatePDFWithRetry.mock.calls[0];
  expect(reportData.australia.skillDemand).toEqual(cachedSkillDemand);

  const cachedKeysWritten = cacheSummary.mock.calls.map(([key]) => key);
  expect(cachedKeysWritten.some((key) => key.includes('skillDemand'))).toBe(false);
});

test('client-specific sections are never cached', async () => {
  await buildAndRenderGlobalOpportunitiesReport(basePayload);

  const cachedKeysWritten = cacheSummary.mock.calls.map(([key]) => key);
  for (const clientKey of ['executiveSummary', 'professionalProfile', 'visaPathways']) {
    expect(cachedKeysWritten.some((key) => key.includes(clientKey))).toBe(false);
  }
});

test('falls back to a resume-derived occupation key for Germany (no stored occupation code)', async () => {
  await buildAndRenderGlobalOpportunitiesReport({ ...basePayload, countries: ['germany'], visaProfileInfo: null });

  const cachedKeys = cacheSummary.mock.calls.map(([key]) => key);
  expect(cachedKeys.some((key) => key.startsWith('go:germany:') && key.includes('skillDemand'))).toBe(true);
});
