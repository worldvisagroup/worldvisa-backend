/**
 * Prompt + JSON-schema definitions for the Global Opportunities report.
 *
 * One descriptor per section, per country, mirroring templates/types/report-types.ts
 * and templates/utils/country-registry.ts's `sections[].dataKey` list (the registry
 * is the source of truth for which keys the React templates actually consume —
 * the "Complete Report Data Structure" interfaces in report-types.ts are slightly
 * stale for AU/CA/DE's trailing sections, so this file follows the registry).
 *
 * `cacheScope`:
 *   - null        -> client-specific, always generated fresh
 *   - 'occupation'-> country + occupation general content (Redis-cached)
 *   - 'country'   -> country-only general content, occupation-independent (Redis-cached)
 */

// ---------------------------------------------------------------------------
// Small JSON-schema helpers (strict-mode friendly: every property is required,
// nothing is left optional -- matches this codebase's existing "always a real
// value, never omit" convention from the TA integration).
// ---------------------------------------------------------------------------

function str(description) {
  return { type: 'string', description };
}

function strArr(description) {
  return { type: 'array', items: { type: 'string' }, description };
}

function obj(properties, description) {
  return {
    type: 'object',
    description,
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function arrOf(itemSchema, description) {
  return { type: 'array', items: itemSchema, description };
}

function schemaFor(name, properties, description) {
  return {
    schemaName: name,
    schema: obj(properties, description),
  };
}

// ---------------------------------------------------------------------------
// Resume summarization (client-specific, always fresh)
// ---------------------------------------------------------------------------

function resumeSummaryPrompt(resumeText) {
  return {
    system:
      'You are an immigration case analyst. Summarize resumes into a concise, factual profile brief usable as context for downstream report generation. Never invent facts not present in the resume.',
    user: `Summarize the following resume into a short factual brief covering: primary occupation/title, total years of experience, seniority level, key technical/professional skills, notable employers, and highest education qualification. Plain text, no markdown, no headings.

Resume text:
"""
${resumeText}
"""`,
  };
}

// ---------------------------------------------------------------------------
// Shared context builders
// ---------------------------------------------------------------------------

function clientContextBlock(ctx) {
  return `Client profile context:
- Name: ${ctx.personalInfo?.name ?? 'N/A'}
- Date of birth: ${ctx.personalInfo?.dob ?? 'N/A'}
- Resume summary: ${ctx.resumeSummary ?? 'N/A'}
- Spouse: ${ctx.spouseInfo ? JSON.stringify(ctx.spouseInfo) : 'None'}
- Visa profile data on file for this country: ${ctx.visaProfileInfo ? JSON.stringify(ctx.visaProfileInfo) : 'None on file'}
`;
}

// ===========================================================================
// AUSTRALIA
// ===========================================================================

const AU_EXECUTIVE_SUMMARY = {
  key: 'executiveSummary',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'australia_executive_summary',
    {
      purpose: str('One paragraph stating the purpose of this report for this client.'),
      topVisaPathways: arrOf(
        obj(
          { name: str('Pathway name'), subclass: str('Visa subclass number'), description: str('One-sentence description') },
          'Top visa pathway'
        ),
        'Top 2-4 recommended visa pathways'
      ),
      whyAustralia: strArr('Reasons Australia suits this client'),
      keyHighlights: strArr('Key highlights of this client profile for Australia'),
      profileStrengths: strArr("This client's profile strengths"),
      marketTrends: str('Short paragraph on current AU skilled-migration market trends relevant to this occupation'),
    },
    'Executive summary section for the Australia Global Opportunities report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are an Australian skilled-migration consultant writing a client-facing report section. Be specific, factual, and avoid generic filler.',
      user: `${clientContextBlock(ctx)}\nWrite the Executive Summary section for this client's Australia Global Opportunities report.`,
    };
  },
};

const AU_PROFESSIONAL_PROFILE = {
  key: 'professionalProfile',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'australia_professional_profile',
    {
      primaryOccupation: str("Client's primary occupation title"),
      anzscoCode: str('ANZSCO code for the primary occupation'),
      profileDescription: str("One paragraph describing the client's professional profile"),
      unitGroup: str('ANZSCO unit group'),
      alternativeCodes: str('Alternative ANZSCO codes that could also apply, comma-separated, or "None"'),
      skillLevel: str('ANZSCO skill level'),
      occupationCeiling: str('Occupation ceiling status for this ANZSCO code, or "N/A"'),
      labourMarketInfo: str('Short labour market note for this occupation'),
    },
    'Professional profile section for the Australia report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are an Australian skilled-migration consultant. Map the client profile to the correct ANZSCO occupation classification precisely.',
      user: `${clientContextBlock(ctx)}\nWrite the Professional Profile section, correctly identifying the ANZSCO code and skill level from the resume summary and any visa-profile data on file.`,
    };
  },
};

const AU_VISA_PATHWAY_DETAIL = obj(
  {
    name: str('Pathway name, e.g. "Skilled Independent visa"'),
    subclass: str('Visa subclass number, e.g. "189"'),
    pointsRequirement: str('Minimum points threshold for this pathway'),
    ageRequirement: str('Age requirement/limit for this pathway'),
    employerSponsorship: str('Whether employer sponsorship is required, and details'),
    stateSponsorship: str('Whether state/territory sponsorship applies, and details'),
    keyRequirements: strArr('Key eligibility requirements for this pathway'),
    processingTime: str('Typical processing time for this pathway'),
    pathway: str('The route to permanent residency this visa leads to'),
    whySuitable: str('Why this pathway suits this specific client, based on their profile'),
    additionalInfo: str('Any additional relevant detail, or an empty string if none'),
    keyStates: strArr('States/territories actively nominating for this pathway, or an empty array if not state-specific'),
    regionalRequirements: str('Regional-area requirements for this pathway, or an empty string if none'),
    duration: str('Initial visa duration, or an empty string if not applicable'),
    prPathway: str('The path to permanent residency from this visa, or an empty string if not applicable'),
    keyAdvantage: str('The single standout advantage of this pathway for this client, or an empty string if none'),
  },
  'Detailed visa pathway'
);

const AU_VISA_PATHWAY_CATEGORY = obj(
  {
    description: str('Short introduction to this category of pathways, or an empty string if none'),
    pathways: arrOf(AU_VISA_PATHWAY_DETAIL, 'Pathways in this category'),
  },
  'A category of visa pathways with full detail per pathway'
);

const AU_VISA_PATHWAYS = {
  key: 'visaPathways',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'australia_visa_pathways',
    {
      conceptOverview: str("Overview of Australia's points-based visa system"),
      withJobOffer: AU_VISA_PATHWAY_CATEGORY,
      withoutJobOffer: AU_VISA_PATHWAY_CATEGORY,
      recommended: AU_VISA_PATHWAY_CATEGORY,
    },
    'Visa pathways section, personalized to this client'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are an Australian skilled-migration consultant assessing which visa pathways best suit this specific client. Provide full, accurate detail for every pathway -- subclass numbers, points thresholds, processing times, and eligibility requirements must be current and correct.',
      user: `${clientContextBlock(ctx)}\nAssess and detail Australia's skilled-migration visa pathways for this client, across three categories:\n- withoutJobOffer: independent (points-tested) pathways, e.g. Skilled Independent (subclass 189), Skilled Nominated (subclass 190), Skilled Work Regional (subclass 491).\n- withJobOffer: employer-sponsored pathways, e.g. Employer Nomination Scheme (subclass 186), Skilled Employer Sponsored Regional (subclass 494).\n- recommended: the pathway(s) from either category most suitable for this specific client, with reasoning for the fit.\nGive full per-pathway detail per the schema for every pathway listed. Use an empty string/array for any field genuinely not applicable to a given pathway.`,
    };
  },
};

const AU_SKILL_DEMAND = {
  key: 'skillDemand',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'australia_skill_demand',
    {
      primaryOccupationCode: str('ANZSCO code this analysis covers'),
      skillMappingTable: arrOf(
        obj({ skill: str('Skill name'), anzscoCategory: str('ANZSCO category'), demandLevel: str('Demand level: High/Medium/Low') }, 'Skill mapping row'),
        'Skill-to-demand mapping rows'
      ),
      occupationLists: arrOf(
        obj({ listName: str('Occupation list name, e.g. MLTSSL/STSOL/ROL'), occupations: strArr('Occupations on this list relevant to this code') }, 'Occupation list'),
        'Relevant occupation lists'
      ),
      statePriorityLists: arrOf(
        obj({ state: str('Australian state'), status: str('Priority status for this occupation in this state') }, 'State priority'),
        'Per-state occupation priority status'
      ),
      availabilityNote: str('Overall note on occupation-list availability for this code'),
    },
    'Skill demand mapping, general to this occupation+country (not client-specific)'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are an Australian skilled-migration market analyst. Use web search for current occupation-list and state-nomination data. Cite only official current sources.',
      user: `Occupation: ${occupationTitle} (ANZSCO ${occupationCode}). Produce current skill demand mapping data for this occupation across Australia's skilled occupation lists and state nomination priorities.`,
    };
  },
};

const AU_TOP_EMPLOYERS = {
  key: 'topEmployers',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'australia_top_employers',
    {
      tiers: arrOf(
        obj(
          {
            tierName: str('Tier name, e.g. "Tier 1: Enterprise"'),
            tierDescription: str('Short description of this tier'),
            companies: arrOf(obj({ name: str('Company name'), location: str('City/region'), description: str('Why this company is relevant') }, 'Company'), 'Companies in this tier'),
          },
          'Employer tier'
        ),
        '2-3 tiers of target employers'
      ),
      whyActivelyHiring: str('Why these companies are actively hiring for this occupation'),
      whySponsorMigrants: str('Why these companies sponsor skilled migrants'),
      whyGrowthTrajectory: str('Growth trajectory of these companies/sector'),
      whyYourFit: str('Why this occupation profile fits these employers'),
      whyLearningOpportunity: str('Learning/career growth opportunity at these employers'),
    },
    'Top employers section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are an Australian recruitment market analyst. Use web search to name real, currently-hiring companies. Never invent company names.',
      user: `Occupation: ${occupationTitle} (ANZSCO ${occupationCode}). Identify real, currently active Australian employers actively hiring and sponsoring for this occupation, tiered by company size/profile.`,
    };
  },
};

const AU_SALARY_VARIATION = {
  key: 'salaryVariation',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'australia_salary_variation',
    {
      roleName: str('Role name this salary data covers'),
      cities: arrOf(
        obj(
          {
            cityName: str('City name'),
            midLevelRoleName: str('Mid-level role title'),
            seniorLevelRoleName: str('Senior-level role title'),
            midLevelRange: str('Mid-level salary range, AUD'),
            seniorLevelRange: str('Senior-level salary range, AUD'),
            costOfLiving: str('Relative cost of living note'),
            taxRate: str('Approximate effective tax rate'),
            takeHomeSalary: str('Approximate take-home salary range'),
          },
          'City salary row'
        ),
        'Per-city salary comparison, major AU cities'
      ),
    },
    'Salary variation section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are an Australian compensation market analyst. Use web search for current salary benchmark data. Cite only official/current sources, do not invent figures.',
      user: `Occupation: ${occupationTitle} (ANZSCO ${occupationCode}). Produce current salary benchmarking across major Australian cities for this occupation.`,
    };
  },
};

// NOTE: Section7_Timeline and Section8_RegulatoryAdvisor are rendered as
// `<Section7_Timeline />` / `<Section8_RegulatoryAdvisor />` in AustraliaReport.tsx
// -- zero props, fully static company-boilerplate content baked into the
// template itself (confirmed by reading the .tsx files directly). No AI
// generation needed or possible for these; they are intentionally absent here.

const AUSTRALIA_SECTIONS = [
  AU_EXECUTIVE_SUMMARY,
  AU_PROFESSIONAL_PROFILE,
  AU_VISA_PATHWAYS,
  AU_SKILL_DEMAND,
  AU_TOP_EMPLOYERS,
  AU_SALARY_VARIATION,
];

// ===========================================================================
// CANADA
// ===========================================================================

const CA_EXECUTIVE_SUMMARY = {
  key: 'executiveSummary',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'canada_executive_summary',
    {
      purpose: str('One paragraph stating the purpose of this report for this client'),
      whyCanada: str('Why Canada suits this client'),
      topProvinces: arrOf(
        obj(
          {
            rank: { type: 'integer', description: 'Rank' },
            province: str('Province name'),
            pathway: str('Recommended pathway for this province'),
            crsAdvantage: str('CRS/points advantage this province offers'),
            jobDemand: str('Job demand note'),
            costOfLiving: str('Cost of living note'),
            recommendation: str('Recommendation summary'),
          },
          'Top province row'
        ),
        'Top recommended provinces for this client'
      ),
      riskReward: arrOf(
        obj({ factor: str('Factor'), riskLevel: str('Risk level'), rewardLevel: str('Reward level'), mitigation: str('Mitigation approach') }, 'Risk/reward row'),
        'Risk vs reward factors'
      ),
    },
    'Executive summary for the Canada Global Opportunities report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a Canadian immigration consultant writing a client-facing report section. Be specific and factual.',
      user: `${clientContextBlock(ctx)}\nWrite the Executive Summary section for this client's Canada Global Opportunities report.`,
    };
  },
};

const CA_PROFESSIONAL_PROFILE = {
  key: 'professionalProfile',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'canada_professional_profile',
    {
      nocCodes: arrOf(
        obj(
          {
            type: str('"Primary" or "Secondary"'),
            code: str('NOC code'),
            title: str('NOC title'),
            definition: str('NOC definition'),
            alignment: strArr('How this client aligns with this NOC'),
            credentialMatch: strArr('Credential match points'),
          },
          'NOC code mapping'
        ),
        'Primary and secondary NOC code mappings'
      ),
      experienceMetrics: obj(
        {
          totalYears: str('Total years of experience'),
          currentRole: str('Current role title'),
          seniorityLevel: str('Seniority level'),
          age: str("Client's age"),
          ageAdvantage: str('CRS age-points advantage note'),
          crsAdvantage: str('Overall CRS advantage summary'),
        },
        "Client's experience/age metrics relevant to CRS"
      ),
    },
    'Professional profile section for the Canada report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a Canadian immigration consultant. Map the client profile to the correct NOC occupation classification precisely.',
      user: `${clientContextBlock(ctx)}\nWrite the Professional Profile section, correctly identifying primary/secondary NOC codes from the resume summary and any visa-profile data on file.`,
    };
  },
};

const CA_NO_JOB_OFFER = {
  key: 'noJobOffer',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'canada_no_job_offer',
    {
      conceptOverview: str('Overview of moving to Canada without a job offer'),
      visaCategories: arrOf(
        obj(
          {
            name: str('Category name'),
            type: str('"Primary" or "Secondary"'),
            description: str('Description'),
            estimatedCRS: obj(
              {
                age: { type: 'integer', description: 'CRS points for age' },
                education: { type: 'integer', description: 'CRS points for education' },
                language: { type: 'integer', description: 'CRS points for language' },
                workExperience: { type: 'integer', description: 'CRS points for work experience' },
                spouse: { type: 'integer', description: 'CRS points for spouse factors, 0 if not applicable' },
                subtotal: { type: 'integer', description: 'Subtotal CRS points' },
              },
              "Estimated CRS point breakdown for this category, if CRS-scored (Express Entry programs); all zero if this category doesn't use CRS scoring"
            ),
            cutOffScores: str('Recent CRS cut-off scores, or "N/A"'),
            improvements: arrOf(
              obj({ action: str('Action to take'), boost: str('CRS point boost from this action') }, 'CRS improvement action'),
              'Actions this client could take to improve their CRS score for this category, empty array if not applicable'
            ),
            options: arrOf(
              obj(
                {
                  name: str('Option/stream name'),
                  province: str('Province, or "N/A" if not province-specific'),
                  details: strArr('Key details of this option'),
                  crsBonus: str('CRS bonus points from this option, or "N/A"'),
                  advantages: strArr('Advantages of this option'),
                  process: strArr('Process steps for this option'),
                  timeline: str('Timeline for this option'),
                  disadvantages: strArr('Disadvantages of this option, empty array if none'),
                },
                'Specific option/stream within this category'
              ),
              'Specific options/streams within this category, empty array if not applicable'
            ),
          },
          'Visa category'
        ),
        'Applicable categories for this client'
      ),
      comparativeSummary: arrOf(
        obj(
          {
            pathway: str('Pathway'),
            timeline: str('Timeline'),
            ease: str('Ease of process'),
            jobOfferRequired: str('Job offer required?'),
            cost: str('Approximate cost'),
            longTermPR: str('Long-term PR prospects'),
            recommendation: str('Recommendation'),
          },
          'Pathway comparison row'
        ),
        'Comparison of no-job-offer pathways'
      ),
    },
    "Assessment of client's no-job-offer pathway options"
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a Canadian immigration consultant assessing no-job-offer pathway eligibility for this specific client.',
      user: `${clientContextBlock(ctx)}\nAssess this client's no-job-offer Canadian immigration pathway options. For each category, give an estimated CRS breakdown (zero fields if CRS scoring doesn't apply), concrete actions to improve their CRS score, and any specific streams/options (e.g. Provincial Nominee Program streams) relevant to this client.`,
    };
  },
};

const CA_NO_SPONSOR = {
  key: 'noSponsor',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'canada_no_sponsor',
    {
      concept: str('Overview of moving to Canada without an employer sponsor'),
      selfSponsoredRoutes: arrOf(
        obj({ route: str('Route name'), sponsorRequired: str('Sponsor required?'), jobOfferRequired: str('Job offer required?'), viability: str('Viability for this client') }, 'Self-sponsored route'),
        'Self-sponsored route options'
      ),
      matrix: arrOf(
        obj({ option: str('Option name'), type: str('Option type'), details: str('Details') }, 'Options comparison row'),
        'Comparison matrix of self-sponsored options'
      ),
      settlementPathway: obj(
        {
          stages: arrOf(obj({ stage: str('Stage name'), duration: str('Duration'), status: str('Status for this client') }, 'Settlement stage'), 'Settlement pathway stages'),
        },
        'PR-to-citizenship settlement pathway'
      ),
    },
    "Assessment of client's no-sponsor pathway options"
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a Canadian immigration consultant assessing self-sponsored pathway eligibility for this specific client.',
      user: `${clientContextBlock(ctx)}\nAssess this client's no-sponsor Canadian immigration pathway options, including a comparison matrix of the available options and the long-term settlement-to-citizenship timeline.`,
    };
  },
};

const CA_SKILL_DEMAND = {
  key: 'skillDemand',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'canada_skill_demand',
    {
      skillMapping: arrOf(
        obj({ skill: str('Skill'), noc21231: str('Relevance to NOC 21231, or "N/A"'), noc21234: str('Relevance to NOC 21234, or "N/A"'), weightInMarket: str('Market weight') }, 'Skill NOC mapping'),
        'Skill-to-NOC mapping rows'
      ),
      shortageListInfo: str('Shortage-list status note'),
      jobVacancyData: strArr('Job vacancy data points'),
      demandByProvince: arrOf(
        obj(
          {
            province: str('Province'),
            noc21231: str('Relevance to NOC 21231, or "N/A"'),
            noc21234: str('Relevance to NOC 21234, or "N/A"'),
            overallDemand: str('Overall demand'),
            jobs: str('Job count note'),
            growth: str('Growth trend'),
          },
          'Province demand row'
        ),
        'Demand by province'
      ),
      provinceContexts: arrOf(
        obj(
          {
            province: str('Province'),
            city: str('Major city in this province'),
            techHubStatus: str('Tech/industry hub status note'),
            companies: strArr('Notable companies in this province for this occupation'),
            salaryRange: str('Salary range in this province'),
            jobOpenings: str('Job openings note'),
            visaTechEmployers: str('Note on visa-sponsoring employers in this sector'),
            costOfLiving: str('Cost of living note, or "N/A"'),
          },
          'Province context detail'
        ),
        'Per-province market context detail'
      ),
    },
    'Skill demand mapping, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a Canadian labour-market analyst. Use web search for current NOC shortage and provincial demand data. Cite only official/current sources.',
      user: `Occupation: ${occupationTitle} (NOC ${occupationCode}). Produce current skill demand mapping across Canadian provinces for this occupation, including per-province market context (tech-hub status, notable companies, salary range, job openings).`,
    };
  },
};

const CA_TOP_EMPLOYERS = {
  key: 'topEmployers',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'canada_top_employers',
    {
      provinces: arrOf(
        obj(
          {
            province: str('Province'),
            city: str('Major city'),
            employers: arrOf(
              obj(
                {
                  rank: { type: 'integer', description: 'Rank' },
                  company: str('Company name'),
                  industry: str('Industry'),
                  salary: str('Approximate salary range'),
                  visaSponsorship: str('Sponsorship likelihood note'),
                  whyHireYou: str('Why this employer would hire this occupation profile'),
                },
                'Employer detail'
              ),
              'Top employers in this province'
            ),
          },
          'Province employers'
        ),
        'Top employers grouped by province'
      ),
    },
    'Top employers section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a Canadian recruitment market analyst. Use web search to name real, currently-hiring companies. Never invent company names.',
      user: `Occupation: ${occupationTitle} (NOC ${occupationCode}). Identify real, currently active Canadian employers hiring for this occupation, grouped by province.`,
    };
  },
};

const CA_SALARY_VARIATION = {
  key: 'salaryVariation',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'canada_salary_variation',
    {
      cities: arrOf(
        obj(
          {
            city: str('City name'),
            factors: arrOf(
              obj(
                {
                  factor: str('Factor name, e.g. "Mid-level salary"'),
                  toronto: str('Value for Toronto'),
                  vancouver: str('Value for Vancouver'),
                  montreal: str('Value for Montreal'),
                  winner: str('Which city wins on this factor'),
                },
                'Factor comparison row'
              ),
              'Salary factors compared across cities'
            ),
          },
          'City salary comparison'
        ),
        'Toronto/Vancouver/Montreal salary comparison'
      ),
      recommendation: obj(
        {
          priorities: arrOf(
            obj(
              {
                priority: str('A general decision priority for this occupation, e.g. "Highest salary", "Lowest cost of living", "Fastest job market entry"'),
                toronto: str('How Toronto ranks on this priority'),
                vancouver: str('How Vancouver ranks on this priority'),
                montreal: str('How Montreal ranks on this priority'),
              },
              'Priority comparison row'
            ),
            'Common decision priorities compared across the three cities for this occupation'
          ),
        },
        'General recommendation summary framework for choosing between cities, occupation-based (not client-specific, this section is cached per occupation)'
      ),
    },
    'Salary variation section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a Canadian compensation market analyst. Use web search for current salary benchmark data. Cite only official/current sources, do not invent figures.',
      user: `Occupation: ${occupationTitle} (NOC ${occupationCode}). Produce current salary benchmarking across Toronto, Vancouver and Montreal for this occupation, plus a general decision-priorities comparison (salary, cost of living, job market) across the three cities.`,
    };
  },
};

const CA_VISA_PATHWAYS = {
  key: 'visaPathways',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'canada_visa_pathways',
    {
      overview: arrOf(
        obj(
          {
            route: str('Route'),
            type: str('Type'),
            processingTime: str('Processing time'),
            jobOffer: str('Job offer required?'),
            prTimeline: str('PR timeline'),
            cost: str('Approximate cost'),
            recommendation: str('Recommendation'),
          },
          'Visa route overview'
        ),
        'Visa route overview rows'
      ),
      eligibilitySnapshot: arrOf(
        obj(
          {
            criterion: str('Eligibility criterion'),
            requirement: str('Requirement for this criterion'),
            yourProfile: str("This client's profile value for this criterion"),
            status: str('Whether this client meets this criterion'),
          },
          'Eligibility snapshot row'
        ),
        "Snapshot of this client's eligibility against key criteria"
      ),
      crsScoring: obj(
        {
          breakdown: str("This client's estimated CRS score breakdown"),
          scenarios: arrOf(
            obj({ scenario: str('Scenario name'), points: str('Estimated CRS points in this scenario'), competitive: str('Whether this score is competitive in recent draws') }, 'CRS scenario'),
            'CRS scenarios for this client'
          ),
          improvements: arrOf(
            obj({ action: str('Action to take'), boost: str('CRS point boost from this action') }, 'CRS improvement action'),
            "Actions this client could take to improve their CRS score"
          ),
          bestStrategy: str('Best-fit strategy recommendation for this client'),
        },
        "This client's CRS scoring analysis"
      ),
      statusComparison: arrOf(
        obj(
          {
            status: str('Visa/permit status type'),
            processing: str('Processing note'),
            duration: str('Duration'),
            workPermit: str('Work permit implications'),
            changeJobs: str('Whether the client can change jobs under this status'),
            prPathway: str('PR pathway implications'),
            recommendation: str('Recommendation'),
          },
          'Status comparison row'
        ),
        'Comparison of PR vs temporary vs work permit routes'
      ),
    },
    "Visa pathways section, personalized to this client's CRS profile"
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a Canadian immigration consultant assessing which visa pathways best suit this specific client, including an estimated CRS breakdown.',
      user: `${clientContextBlock(ctx)}\nRecommend and explain visa pathways for this client: give a route overview, an eligibility snapshot against key criteria, a full CRS scoring analysis (breakdown, scenarios, improvement actions, best strategy), and a status comparison of PR vs temporary vs work-permit routes -- all based on this client's actual profile.`,
    };
  },
};

// NOTE: Section9_AboutWorldVisa / Section10_WorldVisaTimeline are rendered as
// zero-prop static components in CanadaReport.tsx (same pattern as Australia's
// Section7/8) -- no AI generation needed or possible, intentionally absent here.

const CANADA_SECTIONS = [
  CA_EXECUTIVE_SUMMARY,
  CA_PROFESSIONAL_PROFILE,
  CA_NO_JOB_OFFER,
  CA_NO_SPONSOR,
  CA_SKILL_DEMAND,
  CA_TOP_EMPLOYERS,
  CA_SALARY_VARIATION,
  CA_VISA_PATHWAYS,
];

// ===========================================================================
// GERMANY
// ===========================================================================

const DE_EXECUTIVE_SUMMARY = {
  key: 'executiveSummary',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'germany_executive_summary',
    {
      purpose: str('One paragraph stating the purpose of this report for this client'),
      globalMobility: obj(
        { keyAdvantages: strArr('Key advantages of Germany for this client') },
        'Global mobility advantages'
      ),
      topCities: arrOf(
        obj(
          {
            rank: { type: 'integer', description: 'Rank' },
            city: str('City name'),
            techHub: str('Tech/industry hub note'),
            jobDemand: str('Job demand note'),
            salaryRange: str('Salary range note'),
            recommendation: str('Recommendation'),
          },
          'Top city row'
        ),
        'Top recommended German cities for this client'
      ),
    },
    'Executive summary for the Germany Global Opportunities report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a German immigration consultant writing a client-facing report section. Be specific and factual.',
      user: `${clientContextBlock(ctx)}\nWrite the Executive Summary section for this client's Germany Global Opportunities report.`,
    };
  },
};

const DE_PROFESSIONAL_PROFILE = {
  key: 'professionalProfile',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'germany_professional_profile',
    {
      coreSkills: obj(
        {
          primaryRole: obj(
            { title: str('Primary role title'), responsibilities: strArr('Primary role responsibilities') },
            'Primary German occupation mapping'
          ),
          secondaryRole: obj(
            { title: str('Closest secondary/alternative role title'), responsibilities: strArr('Secondary role responsibilities') },
            'Secondary German occupation mapping'
          ),
          verdict: str('Overall verdict on occupation fit for the German market'),
        },
        'Core skills and occupation mapping to German classifications'
      ),
      experience: arrOf(obj({ metric: str('Metric name'), yourProfile: str('This client\'s value for this metric') }, 'Experience metric'), 'Experience metrics'),
      languageAndEducation: obj(
        {
          englishProficiency: arrOf(obj({ requirement: str('Requirement'), status: str('Status for this client'), actionNeeded: str('Action needed, if any') }, 'Language row'), 'English proficiency assessment'),
          germanNote: str('Note on German-language requirement/benefit for this client'),
          education: arrOf(
            obj({ qualification: str('Qualification'), details: str('Details'), germanyRecognition: str('Recognition status in Germany'), status: str('Status') }, 'Education qualification'),
            'Education qualification recognition assessment'
          ),
        },
        'Language proficiency and education recognition assessment'
      ),
    },
    'Professional profile section for the Germany report'
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a German immigration consultant assessing occupation fit, language readiness, and qualification recognition for this specific client.',
      user: `${clientContextBlock(ctx)}\nWrite the Professional Profile section for this client's German immigration prospects.`,
    };
  },
};

const DE_VISA_CATEGORIES = {
  key: 'visaCategories',
  cacheable: false,
  cacheScope: null,
  ...schemaFor(
    'germany_visa_categories',
    {
      conceptOverview: str("Overview of Germany's points/demand-based visa categories relevant to this client"),
      opportunityCard: obj(
        {
          title: str('Opportunity Card (Chancenkarte) pathway title'),
          description: str('Opportunity Card suitability description for this client'),
          advantages: strArr('Opportunity Card advantages for this client'),
          successProbability: str('Estimated success probability for this client'),
        },
        'Opportunity Card pathway detail'
      ),
      euBlueCard: obj(
        {
          title: str('EU Blue Card pathway title'),
          description: str('EU Blue Card suitability description for this client'),
          advantages: strArr('EU Blue Card advantages for this client'),
          successProbability: str('Estimated success probability for this client'),
        },
        'EU Blue Card pathway detail'
      ),
    },
    "Visa categories section, personalized to this client's eligibility"
  ),
  buildMessages(ctx) {
    return {
      system: 'You are a German immigration consultant assessing Opportunity Card and EU Blue Card eligibility for this specific client.',
      user: `${clientContextBlock(ctx)}\nAssess this client's suitability for the Opportunity Card and EU Blue Card pathways -- give each pathway its own title, description, advantages, and estimated success probability.`,
    };
  },
};

const DE_SKILL_DEMAND = {
  key: 'skillDemand',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'germany_skill_demand',
    {
      skillMapping: arrOf(obj({ skill: str('Skill'), marketDemand: str('Market demand level'), salaryImpact: str('Salary impact note'), shortageStatus: str('Shortage-occupation status') }, 'Skill map row'), 'Skill demand rows'),
      techShortage: obj(
        {
          description: str('Description of the shortage situation for this occupation'),
          marketFacts: strArr('Market facts supporting the shortage claim'),
          conclusion: str('Conclusion on shortage-occupation status'),
        },
        'Shortage-occupation analysis'
      ),
      demandByCity: arrOf(
        obj({ city: str('City'), techMarket: str('Market note'), jobOpportunities: str('Job opportunities note'), salaryRange: str('Salary range'), type: str('City/market type note, e.g. "Tech hub"') }, 'City demand row'),
        'Demand by German city'
      ),
    },
    'Skill demand mapping, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a German labour-market analyst. Use web search for current shortage-occupation and city demand data. Cite only official/current sources.',
      user: `Occupation: ${occupationTitle}${occupationCode ? ` (${occupationCode})` : ''}. Produce current skill demand mapping across German cities for this occupation.`,
    };
  },
};

const DE_JOB_OPPORTUNITIES = {
  key: 'jobOpportunities',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'germany_job_opportunities',
    {
      cities: arrOf(
        obj(
          {
            cityKey: str('Lowercase city key, e.g. "berlin", "munich", "frankfurt"'),
            name: str('City name'),
            jobTitles: strArr('Relevant job titles available in this city'),
            specializedRoles: strArr('Specialized/niche roles available in this city, empty array if none'),
            targetCompanies: strArr('Real, currently hiring target companies in this city'),
            advantage: str('Advantage of this city for this occupation, or an empty string if none'),
          },
          'City job data'
        ),
        'Per-city job opportunity data'
      ),
      keyIndustries: arrOf(
        obj({ industry: str('Industry'), demand: str('Demand level'), growth: str('Growth trend'), exampleCompanies: str('Example companies'), yourFit: str('Fit for this occupation profile') }, 'Industry'),
        'Key industries hiring for this occupation'
      ),
    },
    'Job opportunities section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a German recruitment market analyst. Use web search to name real, currently-hiring companies. Never invent company names.',
      user: `Occupation: ${occupationTitle}${occupationCode ? ` (${occupationCode})` : ''}. Identify real, currently active German employers and cities hiring for this occupation, including any specialized/niche roles available per city.`,
    };
  },
};

const DE_COMPENSATION = {
  key: 'compensation',
  cacheable: true,
  cacheScope: 'occupation',
  useWebSearch: true,
  ...schemaFor(
    'germany_compensation',
    {
      salaryRanges: arrOf(obj({ level: str('Seniority level'), location: str('Location'), eurAnnual: str('Annual salary range in EUR'), inrEquivalent: str('Approximate INR equivalent') }, 'Salary range'), 'Salary ranges by level/location'),
      cityComparison: arrOf(
        obj({ factor: str('Factor, e.g. "Rent"'), berlin: str('Berlin value'), munich: str('Munich value'), frankfurt: str('Frankfurt value'), winner: str('Best city for this factor') }, 'City comparison row'),
        'Berlin/Munich/Frankfurt comparison'
      ),
    },
    'Compensation benchmarking section, general to this occupation+country'
  ),
  buildMessages({ occupationCode, occupationTitle }) {
    return {
      system: 'You are a German compensation market analyst. Use web search for current salary benchmark data. Cite only official/current sources, do not invent figures.',
      user: `Occupation: ${occupationTitle}${occupationCode ? ` (${occupationCode})` : ''}. Produce current salary benchmarking across Berlin, Munich and Frankfurt for this occupation.`,
    };
  },
};

// NOTE: Section7_AboutWorldVisa / Section8_WorldVisaTimeline are rendered as
// zero-prop static components in GermanyReport.tsx (same pattern as Australia's
// Section7/8 and Canada's Section9/10) -- no AI generation needed, absent here.

const GERMANY_SECTIONS = [
  DE_EXECUTIVE_SUMMARY,
  DE_PROFESSIONAL_PROFILE,
  DE_VISA_CATEGORIES,
  DE_SKILL_DEMAND,
  DE_JOB_OPPORTUNITIES,
  DE_COMPENSATION,
];

// ===========================================================================

const COUNTRY_SECTIONS = {
  australia: AUSTRALIA_SECTIONS,
  canada: CANADA_SECTIONS,
  germany: GERMANY_SECTIONS,
};

module.exports = {
  COUNTRY_SECTIONS,
  resumeSummaryPrompt,
};
