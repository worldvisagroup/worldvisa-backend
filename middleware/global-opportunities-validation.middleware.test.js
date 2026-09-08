const { validateGlobalOpportunitiesRequest } = require('./global-opportunities-validation.middleware');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

const validBody = {
  personalInfo: { name: 'Jane Doe', dob: '1990-01-01' },
  resumeText: 'Senior software engineer with 8 years of experience.',
  countries: ['australia'],
};

test('calls next() for a valid request', () => {
  const req = { body: { ...validBody } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test('rejects a request missing personalInfo', () => {
  const req = { body: { ...validBody, personalInfo: undefined } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(next).not.toHaveBeenCalled();
});

test('rejects a request missing dob on personalInfo', () => {
  const req = { body: { ...validBody, personalInfo: { name: 'Jane Doe' } } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(next).not.toHaveBeenCalled();
});

test('rejects a request with empty resumeText', () => {
  const req = { body: { ...validBody, resumeText: '   ' } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(next).not.toHaveBeenCalled();
});

test('rejects a request with an empty countries array', () => {
  const req = { body: { ...validBody, countries: [] } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(next).not.toHaveBeenCalled();
});

test('rejects a request with an unsupported country', () => {
  const req = { body: { ...validBody, countries: ['australia', 'france'] } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('france') }));
  expect(next).not.toHaveBeenCalled();
});

test('accepts multiple supported countries, case-insensitively', () => {
  const req = { body: { ...validBody, countries: ['Australia', 'CANADA', 'germany'] } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(next).toHaveBeenCalled();
});

test('rejects a non-object spouseInfo', () => {
  const req = { body: { ...validBody, spouseInfo: 'not an object' } };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(next).not.toHaveBeenCalled();
});

test('accepts a request with spouseInfo and visaProfileInfo present', () => {
  const req = {
    body: {
      ...validBody,
      spouseInfo: { age: 29, englishLanguage: 'competent', eligibleForAssessment: true },
      visaProfileInfo: { australia: { anzscoCode: '261313' } },
    },
  };
  const res = createRes();
  const next = jest.fn();

  validateGlobalOpportunitiesRequest(req, res, next);

  expect(next).toHaveBeenCalled();
});
