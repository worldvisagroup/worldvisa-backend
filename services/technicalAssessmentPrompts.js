const masterContextPrompt = (profile) => {
  const masterPrompt = `
You are an Australian immigration expert. The following profile is for an offshore candidate. Based on this profile: ${JSON.stringify(profile)}, analyze skilled migration eligibility for Australia, focusing on "currentDesignation" and "anzsco".

Today's date is: ${new Date().toISOString().slice(0, 10)}.

Important: Do NOT take DAMA (Designated Area Migration Agreement) results into consideration for any eligibility assessment.

web search instructions:
1. Before executing the web search, carefully review the profile and assess all relevant details.

2. Use web search ONLY for subclass 189, 190, and 491 when checking state eligibility. Only use information from live official sources:
   - https://worldvisagroup.searchmyanzsco.com.au/

3. For PR subclasses 189, 190, 491:
   - Mark each as "eligible" or "not eligible", and cite the relevant URLs.

4. For each state (New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, Northern Territory, Australian Capital Territory):
   - For each state, check ALL THREE subclasses (189, 190, 491) for eligibility using web search.
   - If the candidate's ANZSCO code is "Human Resource Adviser", ensure that all states reflect "not eligible" for subclass 189 and update accordingly for subclass 491 based on the latest data.
   - If the candidate is eligible for ANY one of the subclasses for a particular state, mark that state as "eligible" (with cited URLs).
   - If the candidate is NOT eligible for ANY of the subclasses for a particular state, mark that state as "not eligible" (with cited URLs).

Return only a strict JSON object in this format:
{
  "subclassEligibility": { "189": {}, "190": {}, "491": {} },
  "stateEligibility": { "New South Wales": {}, "Victoria": {}, "Queensland": {}, "South Australia": {}, "Western Australia": {}, "Tasmania": {}, "Northern Territory": {}, "ACT": {} },
  "notes": ""
}
Do not include the client profile. No extra text, only JSON. Use only official live sources. Do NOT consider DAMA results in your assessment.
`;


  return masterPrompt;
}

const profileSummaryPrompt = `
Using the client profile details provided in the system context, produce ONLY a markdown table with exactly two columns: Field and Value(in that order).

Always list these fields in the following order:
  1. Client Name
  2. Date of Birth / Age
  3. Nationality
  4. Marital Status
  5. Primary Occupation
  6. ANZSCO Code
  7. Assessing Authority
  8. Total Experience
  9. Current Employer
  10. Report Date
  11. Consultant / Case Owner

  Important: For "Primary Occupation", always use the value of 'currentDesignation' from the profile as the Primary Occupation field.

    Today's date is: ${new Date().toISOString().slice(0, 10)}.

If the date of birth is given in a format like "1986-07-23", use today's date to calculate the age and display as "Date of Birth / Age" (e.g., "1986-07-23 / 39"). If age cannot be calculated, show only the date of birth or leave blank if missing.

If any of these extra fields have a value, include them in the order shown(after the main list):
  - Partner Skills
    - NAATI Credential
      - Credentialled Community Language
        - Australian Study
          - Australian Regional Study
            - Australian Work Experience

Leave the Value cell blank for any missing, null, or empty values.Return only the markdown table, no commentary or explanations.
`;

const profileSummarySnapshotsPrompt = `Based on the JSON profile, produce up to 4 concise bullet points as a 'Profile Snapshot' for Australia PR technical assessment. Each point must be fact-focused (max 25 words) and use a dash (-) at the start. Cover, as relevant: education, work experience, English proficiency, skill assessment status/authority, partner status/English, Australian study/work experience. For education, if the field of study is available in the profile, show it as 'Bachelor Degree in [field]' (or appropriate degree level). If the field of study is not available or blank, show only the degree level (e.g., 'Bachelor Degree', 'Master Degree', 'PhD') without mentioning 'relevant field' or any placeholder text. Do NOT mention anything about medical notes or "spouse eligible for assessment" in any point, even if present in the input. Omit fields that are blank in the input. Return only the markdown bullet list—no commentary, intro, summary, or formatting characters. No asterisks, no special styles. If generating a markdown table, never exceed 11 rows (including the header row).`;


function prPathwayTablePrompt(eligibilityTableData) {
  return `
You are an Australian PR technical assessment assistant.

Instructions:
- ONLY use these three rows from the table below:
    - Total Points (Subclass 189)
    - Total Points (Subclass 190)
    - Total Points (Subclass 491)
${eligibilityTableData.content}

- Create a markdown table with exactly these columns: PR Pathway | Visa Subclass / Stream | Core Eligibility Met?
- Include a row for each subclass: 189, 190, 491 (even if not eligible).

Eligibility rules:
- If the client's age is 45 or above (as provided in the master context), they are NOT eligible for any subclass (mark "No" for all three).
- Otherwise, for a subclass to be eligible ("Yes" in "Core Eligibility Met?"), BOTH the following must be true:
    1. Total points for that subclass are at least the minimum for that subclass:
       - Subclass 189: minimum eligible points = 65
       - Subclass 190: minimum eligible points = 60
       - Subclass 491: minimum eligible points = 55
    2. The master context confirms the occupation is in demand for that subclass.
- If either requirement is NOT met (points below the relevant minimum or the occupation is not in demand), mark as "No" for that subclass.
- Never show "Yes" if points are less than the minimum required for the subclass, even if the occupation is in demand.

Return only the markdown table with a single correct header row. No commentary, no explanations, no code fences.
  `;
}


const prEligbilityPointsTablePrompt = `You are an Australian migration consultant. Based ONLY on the candidate profile provided in this chat context, estimate their PR points according to the official Australia SkillSelect points test for subclasses 189, 190, and 491.

STRICT TABLE RULES:
- Output ONE markdown table only.
- Columns must be exactly: Component | Description | Points
- Include rows ONLY for components that actually earn points:
  Age, English Language, Overseas Work Experience, Australian Work Experience,
  Education, Australian Study, Specialist Education Qualification,
  Credentialled Community Language, Professional Year in Australia,
  Partner Skills (if spouse information exists or candidate is single)
- Every Points cell must contain only a plain integer (positive, zero, or negative).
- Every Description cell must be ≤ 50 characters and contain no point values.
- DO NOT assume, guess, or auto-include any extra points for components that are not explicitly provided or indicated as “applicable”, “eligible”, or “yes”.

AGE CALCULATION RULES:
- If Date of Birth (DOB) exists:
  • Calculate the exact age using TODAY’S DATE and round down to full years.
  • Determine age using TODAY'S DATE = ${new Date().toISOString().slice(0, 10)} based on Date of Birth (DOB). Apply the following point allocation:
    - If age is between 18 and 24 → 25 points
    - If age is between 25 and 32 → 30 points
    - If age is between 33 and 39 → 25 points
    - If age is between 40 and 44 → 15 points
    - If age is 45 or older → -65 points
- If DOB is not provided → do not assign points for age.

WORK EXPERIENCE RULES:
- Overseas Work Experience:
    - <3 yrs → 0
    - 3–<5 yrs → 5
    - 5–<8 yrs → 10
    - 8+ yrs → 15
- Australian Work Experience:
    - <1 yr → 0
    - 1–<3 yrs → 5
    - 3–<5 yrs → 10
    - 5–<8 yrs → 15
    - 8+ yrs → 20

OTHER COMPONENT RULES:
- English Language:
    - Competent → 0
    - Proficient → 10
    - Superior → 20
- Education: assign points only if qualification exists (Bachelor → 15, Masters → 15, PhD → 20).
- If the field "australianStudy" includes the value "Yes" or "Applicable", assign 5 points.
  If it includes "Professional Year", assign 5 points.
  If it includes "Research" or "PhD (2 years)", assign 10 points.
  If it is "N/A", empty, or has no value, assign 0 points.
- Specialist Education Qualification → 10 only if explicitly marked as “Yes” or “Eligible”.
- Credentialled Community Language → 5 only if explicitly marked as “Yes” or “Applicable”.
- Professional Year in Australia → 5 only if explicitly marked as “Yes” or “Applicable”.

PARTNER SKILLS RULES:
- If single → 10 points (always include this when no spouse data is provided).
- If married/de facto:
    - spouseEnglishLanguage ≥ competent AND spouseEligibleForAssessment = yes → 10
    - spouseEnglishLanguage ≥ competent AND spouseEligibleForAssessment = no → 5
    - spouseEnglishLanguage < competent AND spouseEligibleForAssessment = yes → 5
    - spouseEnglishLanguage < competent AND spouseEligibleForAssessment = no → 0
- In Description, state spouseEnglishLanguage + spouseEligibleForAssessment (“yes”/“no”).
- If spouseEligibleForAssessment = no → add “Assessment: n/a” in the description (within 50-character limit).

TOTAL CALCULATION RULES (STRICT):
- Let S = SUM of all integer values in the Points column (excluding total rows).
  Use:
  S = Age + English Language + Overseas Work Experience + Australian Work Experience + Education
      + Australian Study + Specialist Education Qualification + Credentialled Community Language
      + Professional Year in Australia + Partner Skills
      + 0 (if no points assigned for any component)
- DO NOT add any other numbers or implicit bonuses outside these listed components.
- Always include Partner Skills (either spouse-based or single-based).
- + add communityLanguage points in the total”.
- + Parntner skills points

- Append exactly these 3 rows at the end:
  - Total Points (Subclass 189) |  | S
  - Total Points (Subclass 190) |  | S + 5
  - Total Points (Subclass 491) |  | S + 15

OUTPUT FORMAT RULES:
- Output ONLY one markdown table — no headings, no commentary, no code fences.
- The 3 total rows must appear once and at the very end.
- No Description cell may contain total or calculated values.
- If a field in the input is “N/A”, “No”, “null”, or missing → treat as 0 points.
- Include all components in the Points column, showing 0 if applicable.
- Strictly ensure no component is skipped or omitted from the total sum.
- Do NOT add or infer any extra 5 or 10 points unless clearly justified by rules above.
`;


function crossStateNominationTablePromptMaster() {
  return `
Using your master prompt and up-to-date expert knowledge of Australian migration, generate a markdown table (no commentary, no headings before/after) summarizing for each Australian State and Territory:
  - State name
  - Current Status ("Open", "Limited", "Closed", etc.; use the most current occupation availability for each subclass/state based on authoritative migration sources and the master prompt knowledge base)
  - Competitiveness ("High", "Moderate", "Low-Moderate", etc.; analyze based on candidate occupation, state priorities, and current policy settings)
  - Key Sectors (2–3 sectors per state, tailored to THIS occupation and matching migration focus, reflecting the latest known priorities and sectors per the master prompt)

Format the table columns exactly as:
| State | Current Status | Competitiveness | Key Sectors (tailored to {occupation}) |

Rows to include: New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, Northern Territory, ACT (one row for each, in that order; include all even if state is "Closed").

Requirements:
- For each state, use the most up-to-date occupation lists, migration policies, and sectorial focus per the master prompt and your expertise to determine "Current Status" for THIS role.
- "Competitiveness" and "Key Sectors" must clearly and briefly reflect the master prompt's evidence or the best available data.
- Each cell must be brief and clear.
- DO NOT add commentary, headings, code fences, or extra text before or after the table.
- Output ONLY the markdown table as described.
`;
}

const prLabourMarketOutlookByRegionPrompt = `
Generate a markdown table showing the Australian labour market outlook for 2025 for THIS candidate's roles by state/territory.

Format as:

| Region | Demand Level | Typical Job Titles | Key Industries | Hiring Channels |

    Include ALL of: New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, Northern Territory, ACT(one row for each—do not omit any).

  - Tailor Typical Job Titles and Key Industries to the candidate's occupation and background.
    - "Demand Level" is a brief(e.g.High, Moderate, Low), based on plausible trends for 2025.
      - "Hiring Channels" should be specific, e.g., "Online job portals, Referrals" or "Local agencies", etc; vary by state if appropriate.
- Data must be plausible, clear, concise, and relevant to the supplied occupation & context.
- Do NOT add commentary, ANY headings, code fences, or explanation—output just the markdown table.
`;

const prSalaryBenchmarkPrompt = `
Generate a markdown table of IT / software engineering salary benchmarks for major regions/states in Australia for 2025.
Output only the markdown table, with NO commentary, heading, or code fences.

Columns: | Region | Start(P25) | Median(P50) | Top(P75 / P90) | Source / Year |

Rows must include exactly 7 total: New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, and ACT. Omit Northern Territory.

- Fill plausible, forward-looking numbers for 2025 (AUD). If occupation/title present, tailor the table for that; otherwise, assume "Software Engineer/ICT Professional".
- Use 2025 sources (or the latest available if not).
`;

const stepByStepPlanAndSlaPrompt = `
Generate ONLY a markdown table for the Australia PR (Skilled migration) process, where NO cell value exceeds 30 characters. Customize the steps, skill assessing authority, prerequisites, and timelines for the candidate's skillAssessingAuthority from the profile context.

Columns (all <30 chars): | Step | Action | Owner | Docs | ETA |

- Use exactly these 4 steps:
    1. Skill assessment ("Lodge {skillAssessingAuthority} Assessment") will always be done by applicant + MARA
    2. Confirm English Result ("Confirm English Result")  applicant
    3. Submit EOIs ("Submit EOIs: 189/190/491")  applicant + MARA
    4. Visa Application ("Visa Application Lodgement")  applicant + MARA

- For every column and row: each entry must be 30 characters or fewer.
- For step 1: All fields must reference the skillAssessingAuthority and relevant docs, but always within 30 characters per cell (e.g., "Degree, transcripts", etc).
- Other steps: ensure all content (prereqs, ETA, etc.) fits 30 chars max per cell and is plausible, relevant for 2025.

Table must be exactly: 1 header, 1 delimiter row, and 4 rows—with concise text, NO commentary, headings, or code fences.

EXAMPLE (edit to suit skillAssessingAuthority and docs; always <=30 chars per cell):

| Step | Action | Owner | Docs | ETA |
|------|------------------------------|-------|------------------------|-----------|
| 1 | Lodge {skillAssessingAuthority} Assessment | Client | Degree, work docs | 8–12 weeks |
| 2 | Confirm English Result | Client | Test score | 2–3 weeks |
| 3 | Submit EOIs: 189/190/491 | WVisa | Assess + English | 1 week |
| 4 | Visa Application Lodgement | WVisa | PCC, Medicals | 6–9 months |

Do NOT include headings, commentary, introductions, or code fences—return ONLY the markdown table.
`;


const riskRegistrationAndMitigationPrompt = `
Create a markdown table listing 3–5 key risks for the Australia PR process, with columns: Risk | Likelihood | Impact | Mitigation.

- Each risk must be practical and relevant for skilled PR applicants and the given profile skillAssessingAuthority.
- Likelihood: Low, Medium, or High.Impact: Minor, Moderate, or Severe.
- Mitigation: 1 - sentence, actionable and client - friendly.
- Do NOT include introductions, commentary, or code fences—output the markdown table ONLY.
`;

const prOutcomeForecastPrompt = `
List 4 concise markdown bullet points forecasting likely assessment outcomes for this Australia PR case. The final point must be a clear, pragmatic Recommendation based on the prior points(not repeating them verbatim).Do NOT use exclamation marks, no commentary or headings, and do not introduce or explain—output only the bullet points.
`;

// Aliases for backward compatibility
const crossStateNominationTablePrompt = crossStateNominationTablePromptMaster;
const prOutcomeForecast = prOutcomeForecastPrompt;
const crossStateNominationTablePromptWithLatestInfo = crossStateNominationTablePromptMaster;

module.exports = {
  masterContextPrompt,
  profileSummaryPrompt,
  profileSummarySnapshotsPrompt,
  prPathwayTablePrompt,
  prEligbilityPointsTablePrompt,
  crossStateNominationTablePrompt,
  crossStateNominationTablePromptMaster,
  crossStateNominationTablePromptWithLatestInfo,
  prLabourMarketOutlookByRegionPrompt,
  prSalaryBenchmarkPrompt,
  stepByStepPlanAndSlaPrompt,
  riskRegistrationAndMitigationPrompt,
  prOutcomeForecast,
  prOutcomeForecastPrompt,
};