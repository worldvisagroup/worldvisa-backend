const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { fetchCachedSummary, cacheSummary } = require('./redis');
const { generatePDFWithRetry } = require('./pdf-generator.service');
const { COUNTRY_SECTIONS, resumeSummaryPrompt } = require('./global-opportunities-prompts');

const CLIENT_MODEL = 'gpt-5.6-terra';
const RESEARCH_MODEL = 'gpt-5.6-terra';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000,
  maxRetries: 2,
});

let countryRegistry = null;
function loadCountryRegistry() {
  if (!countryRegistry) {
    const registryPath = path.join(__dirname, '../dist/templates/utils/country-registry.js');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`Country registry not found at ${registryPath}. Run "npm run build:templates".`);
    }
    countryRegistry = require('../dist/templates/utils/country-registry');
  }
  return countryRegistry;
}

// ---------------------------------------------------------------------------
// OpenAI calls
// ---------------------------------------------------------------------------

async function callStructuredSection({ model, system, user, schemaName, schema, useWebSearch }) {
  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema,
        strict: true,
      },
    },
    ...(useWebSearch ? { tools: [{ type: 'web_search' }], parallel_tool_calls: true } : {}),
    store: false,
  });

  return JSON.parse(response.output_text);
}

async function summarizeResume(resumeText) {
  const { system, user } = resumeSummaryPrompt(resumeText);
  const response = await client.responses.create({
    model: CLIENT_MODEL,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_output_tokens: 500,
    store: false,
  });
  return response.output_text.trim();
}

// ---------------------------------------------------------------------------
// Occupation-code resolution + cache keys
// ---------------------------------------------------------------------------

function resolveOccupationCode(country, visaProfileInfo) {
  if (country === 'australia') {
    return visaProfileInfo?.australia?.anzscoCode ?? null;
  }
  if (country === 'canada') {
    return visaProfileInfo?.canada?.nocCode ?? null;
  }
  // Germany has no stable occupation-code field on VisaProfile -- falls back
  // to the resume-derived occupation title, a known, less-stable cache key.
  return null;
}

function cacheKeyFor(section, country, occupationCode, occupationTitle) {
  if (section.cacheScope === 'country') {
    return `go:${country}:general:${section.key}`;
  }
  const occupationKey = occupationCode || (occupationTitle ? occupationTitle.trim().toLowerCase() : 'unknown-occupation');
  return `go:${country}:${occupationKey}:${section.key}`;
}

// ---------------------------------------------------------------------------
// Section generation (cache-aware)
// ---------------------------------------------------------------------------

async function generateSection(section, country, ctx) {
  const cacheKey = section.cacheable
    ? cacheKeyFor(section, country, ctx.occupationCode, ctx.occupationTitle)
    : null;

  if (cacheKey) {
    const cached = await fetchCachedSummary(cacheKey);
    if (cached) {
      logger.info('Global Opportunities section cache hit', { country, section: section.key, cacheKey });
      return cached;
    }
  }

  const { system, user } = section.buildMessages(ctx);
  const model = section.cacheable ? RESEARCH_MODEL : CLIENT_MODEL;

  const data = await callStructuredSection({
    model,
    system,
    user,
    schemaName: section.schemaName,
    schema: section.schema,
    useWebSearch: !!section.useWebSearch,
  });

  if (cacheKey) {
    await cacheSummary(cacheKey, data);
  }

  return data;
}

async function generateCountryReportData(country, sharedCtx) {
  const { getCountryConfig } = loadCountryRegistry();
  const countryConfig = getCountryConfig(country);
  if (!countryConfig) {
    throw new Error(`Unknown country: ${country}`);
  }

  const occupationCode = resolveOccupationCode(country, sharedCtx.visaProfileInfo);
  const ctx = { ...sharedCtx, occupationCode, occupationTitle: sharedCtx.occupationTitle };

  const sections = COUNTRY_SECTIONS[country];
  const results = await Promise.all(
    sections.map((section) => generateSection(section, country, ctx).then((data) => [section.key, data]))
  );

  const reportData = Object.fromEntries(results);
  reportData.meta = {
    country,
    userName: sharedCtx.personalInfo.name,
    generatedDate: new Date().toISOString().slice(0, 10),
    reportVersion: '1.0',
  };
  reportData.coverPage = {
    title: `${countryConfig.name} Global Opportunities Report`,
    subtitle: `Prepared for ${sharedCtx.personalInfo.name}`,
  };

  return reportData;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

async function buildAndRenderGlobalOpportunitiesReport({ personalInfo, spouseInfo, visaProfileInfo, resumeText, countries, requestId }) {
  const normalizedCountries = countries.map((c) => c.toLowerCase());

  const resumeSummary = await summarizeResume(resumeText);

  const sharedCtx = {
    personalInfo,
    spouseInfo: spouseInfo ?? null,
    visaProfileInfo: visaProfileInfo ?? null,
    resumeSummary,
    // Only Germany's cache key needs this fallback (AU/CA have real codes);
    // a resume-derived title is the best available signal without a code.
    occupationTitle: resumeSummary.match(/^[^.]*/)?.[0] ?? null,
  };

  // Always build the nested {[country]: {...}} shape -- generatePDF's own
  // normalizeReportData() accepts this for both single and multi-country
  // requests, so there's no need to special-case single-country here.
  const countryResults = await Promise.all(
    normalizedCountries.map((country) => generateCountryReportData(country, sharedCtx).then((data) => [country, data]))
  );
  const reportData = Object.fromEntries(countryResults);

  return generatePDFWithRetry(
    {
      userName: personalInfo.name,
      countries: normalizedCountries,
      reportData,
      requestId,
    },
    2
  );
}

module.exports = {
  buildAndRenderGlobalOpportunitiesReport,
};
