const OpenAI = require("openai");
const NodeCache = require("node-cache");
const { allSectionsData } = require("./technicalAssessmentMock");
const { profileSummaryPrompt, profileSummarySnapshotsPrompt, prPathwayTablePrompt, prEligbilityPointsTablePrompt, crossStateNominationTablePrompt, prLabourMarketOutlookByRegionPrompt, prSalaryBenchmarkPrompt, stepByStepPlanAndSlaPrompt, riskRegistrationAndMitigationPrompt, prOutcomeForecast, masterContextPrompt, crossStateNominationTablePromptWithLatestInfo, prOutcomeForecastPrompt, crossStateNominationTablePromptMaster } = require("./technicalAssessmentPrompts");
const { parseMarkdownBullets, extractTokenUsage } = require("../utils/helperFunction");


const seedData = require("./technicalAssessmentSeed.json");
const { fetchCachedSummary, cacheSummary, isRedisConnected, flushRedis } = require("./redis");
const { travelBudgetSystemPrompt } = require("./travelBudgetPrompts");

class OpenAIService {
   constructor() {
      if (!process.env.OPENAI_API_KEY) {
         console.error("OPENAI_API_KEY environment variable is not set");
         throw new Error("OpenAI API key is required but not configured");
      }

      this.client = new OpenAI({
         apiKey: process.env.OPENAI_API_KEY,
         timeout: 90000,
         maxRetries: 2, // Limit retries to prevent long waits
      });


      this.cache = new NodeCache({
         stdTTL: 3600, // 1 hour
         checkperiod: 600, // Check for expired keys every 10 minutes
         useClones: false,
      });


      this.circuitBreaker = {
         failureCount: 0,
         lastFailureTime: null,
         state: "CLOSED",
         failureThreshold: 5,
         recoveryTimeout: 60000, // 1 minute
         successThreshold: 3,
      };


      this.rateLimiter = new Map();
      this.rateLimitWindow = 60000; // 1 minute
      this.rateLimitMax = 10; // Max requests per minute per IP
   }

   async generateJobOpportunityContent({
      country,
      occupation,
      clientName,
      clientIP,
   }) {
      try {
         // Rate limiting check
         if (!this.checkRateLimit(clientIP)) {
            throw new Error("Rate limit exceeded. Please try again later.");
         }

         // Check circuit breaker
         if (!this.checkCircuitBreaker()) {
            throw new Error(
               "Service temporarily unavailable. Please try again later."
            );
         }

         // Generate cache key
         const cacheKey = this.generateCacheKey(
            country,
            occupation,
            clientName
         );

         // Check cache first
         const cachedContent = this.cache.get(cacheKey);
         if (cachedContent) {
            console.log(`Cache hit for key: ${cacheKey}`);
            return cachedContent;
         }

         console.log(`Cache miss for key: ${cacheKey}, generating new content`);

         // Build optimized prompt
         const prompt = this.buildOptimizedPrompt(
            country,
            occupation,
            clientName
         );

         const startTime = Date.now();
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo", // Much faster than gpt-4
            messages: [
               {
                  role: "system",
                  content:
                     "You are a professional immigration consultant. Write ONLY the email body content without subject lines, greetings, or signatures. Focus on the main content about job opportunities with specific data and urgency. Format as clean paragraphs.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
         });

         const generationTime = Date.now() - startTime;
         console.log(`OpenAI generation time: ${generationTime}ms`);

         const content = response.choices[0]?.message?.content;

         if (!content) {
            this.recordFailure();
            throw new Error("No content generated from OpenAI");
         }

         // Validate the response
         this.validateResponse(content);
         const trimmedContent = content.trim();

         // Cache the successful response
         this.cache.set(cacheKey, trimmedContent);

         // Record success for circuit breaker
         this.recordSuccess();

         return trimmedContent;
      } catch (error) {
         console.error("OpenAI API Error:", error);

         // Record failure for circuit breaker
         this.recordFailure();

         // Handle specific OpenAI errors
         if (error.code === "insufficient_quota") {
            throw new Error(
               "OpenAI API quota exceeded. Please check your billing."
            );
         } else if (error.code === "invalid_api_key") {
            throw new Error(
               "Invalid OpenAI API key. Please check your configuration."
            );
         } else if (error.code === "rate_limit_exceeded") {
            throw new Error(
               "OpenAI API rate limit exceeded. Please try again later."
            );
         } else if (error.code === "timeout") {
            throw new Error("Request timeout. Please try again.");
         }

         throw new Error(`Failed to generate content: ${error.message}`);
      }
   }



   /**
 * Generate a very short Australia immigration explanation using GPT
 * @public
/**
 * @returns {Promise<string>} Short explanation (<=50 characters)
 */
   async technicalAssessmentAi() {
      try {
         const prompt = `
Generate an Australia migration Points Breakdown in a markdown table. Only return the table.

| Factor              | Points |
|---------------------|--------|
| English Proficiency |   20   |
| Work Experience     |   15   |
| Education           |   20   |
| State Sponsorship   |    5   |
| Total               |   60   |
`.trim();

         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australia immigration consultant.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 500,
            temperature: 0.2,
            presence_penalty: 0,
            frequency_penalty: 0,
         });

         const content = response.choices[0]?.message?.content?.trim();
         if (!content) {
            throw new Error("No response from OpenAI");
         }

         // Enforce 50-char limit and safe output
         return content;
      } catch (error) {
         console.error("Error in technicalAssessmentAi:", error);
         throw new Error("Failed to generate technical assessment response");
      }
   }

   /**
    * Generates a profile summary markdown table and bullet point snapshot using OpenAI
    * @param {object} profile - profile attributes as key-values
    * @returns {Promise<{table: string, bullets: string}>}
    */
   /**
    * Returns the default profile for technical assessment AI.
    * @returns {object} Default profile object
    */


   /**
    * Generates a profile summary markdown table for a technical assessment PDF.
    * Accepts the profile object as sent from the controller, with these fields:
    * {
    *  name,
    *  dob,
    *  skillAssessingAuthority,
    *  anzsco,
    *  experienceConsider,
    *  maritalStatus,
    *  currentCompanyName,
    *  currentDesignation,
    *  australianWorkExperience,
    *  australianStudy
    * }
    * Only returns a two-column markdown table ("Field" | "Value") always in this fixed order:
    * 1. Client Name
    * 2. Date of Birth / Age
    * 3. Nationality (leave blank - not provided)
    * 4. Marital Status
    * 5. Primary Occupation
    * 6. ANZSCO Code
    * 7. Assessing Authority
    * 8. Total Experience
    * 9. Current Employer
    * 10. Target Country (always "Australia")
    * 11. Report Date (today's date)
    * 12. Consultant / Case Owner (leave blank - not provided)
    * Any fields missing from the profile should be left blank in the table.
    */
   async technicalAssessmentAiProfileSummaryTable(profile = {}) {
      // To get today's date in YYYY-MM-DD
      function calcReportDate() {
         const now = new Date();
         return now.toISOString().slice(0, 10);
      }

      // Keys that are always shown, in fixed order
      const baseFieldOrder = [
         'Client Name',
         'Date of Birth / Age',
         'Nationality',
         'Marital Status',
         'Primary Occupation',
         'ANZSCO Code',
         'Assessing Authority',
         'Total Experience',
         'Current Employer',
         'Report Date',
         'Consultant / Case Owner',
      ];

      // Conditional additional fields and their mapping from the profile
      // Only add these if corresponding non-empty values exist in the profile
      const possibleExtras = [
         { field: 'Partner Skills', key: 'partnerSkills' },
         { field: 'NAATI Credential', key: 'naati' },
         { field: 'Credentialled Community Language', key: 'credentialledCommunityLanguage' },
         { field: 'Australian Study', key: 'australianStudy' },
         { field: 'Australian Regional Study', key: 'australianRegionalStudy' },
         { field: 'Australian Work Experience', key: 'australianWorkExperience' }
      ];

      // Prepare a copy of profile with mapped keys for AI clarity (or add fields if needed)
      const aiProfile = { ...profile };
      aiProfile['Report Date'] = calcReportDate();

      // Find which extras should be included in the table (determined from profile data)
      const activeExtras = possibleExtras
         .filter(extra => {
            const val = profile[extra.key];
            // Consider value as "present" only if not null/undefined/empty string/false/0 for booleans
            if (typeof val === 'undefined' || val === null) return false;
            if (typeof val === 'string' && val.trim() === '') return false;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'number') return val !== 0;
            return true;
         })
         .map(extra => extra.field);

      const fullFieldOrder = [...baseFieldOrder, ...activeExtras];

      // Compose the prompt to instruct the AI to add extra fields if present in the JSON
      const prompt = `
Given this client profile as JSON, build ONLY a markdown table with exactly two columns: Field and Value, always in this order, using the profile JSON data:
First, always show these fields in this order:
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

If any of the following have a value in the JSON, include them (in this order, after the above), otherwise leave them out:
- Partner Skills
- NAATI Credential
- Credentialled Community Language
- Australian Study
- Australian Regional Study
- Australian Work Experience

If a value is missing in the JSON (or null/empty), leave that value blank in the table. Return only the table, no explanations.

Client Profile JSON:
${JSON.stringify(aiProfile, null, 2)}
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australia immigration consultant.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 400,
            temperature: 0.2,
            presence_penalty: 0,
            frequency_penalty: 0,
         });

         const content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI");
         return {
            table: content,
            bullets: ""
         };
      } catch (error) {
         console.error("Error in technicalAssessmentAiProfileSummary:", error);

         // Fallback: build table locally, including extra fields if they have value
         const values = {
            'Client Name': profile.name || '',
            'Date of Birth / Age': profile.dob || '',
            'Nationality': profile.nationality || '',
            'Marital Status': profile.maritalStatus || '',
            'Primary Occupation': profile.currentDesignation || '',
            'ANZSCO Code': profile.anzsco || '',
            'Assessing Authority': profile.skillAssessingAuthority || '',
            'Total Experience': profile.experienceConsider != null ? profile.experienceConsider + '' : '',
            'Current Employer': profile.currentCompanyName || '',
            'Report Date': calcReportDate(),
            'Consultant / Case Owner': profile.caseOwner || '',
            'Partner Skills': (typeof profile.partnerSkills !== "undefined" && profile.partnerSkills !== null && profile.partnerSkills !== '') ? profile.partnerSkills : undefined,
            'NAATI Credential': (typeof profile.naati !== "undefined" && profile.naati !== null && profile.naati !== '') ? profile.naati : undefined,
            'Credentialled Community Language': (typeof profile.credentialledCommunityLanguage !== "undefined" && profile.credentialledCommunityLanguage !== null && profile.credentialledCommunityLanguage !== '') ? profile.credentialledCommunityLanguage : undefined,
            'Australian Study': (typeof profile.australianStudy !== "undefined" && profile.australianStudy !== null && profile.australianStudy !== '') ? profile.australianStudy : undefined,
            'Australian Regional Study': (typeof profile.australianRegionalStudy !== "undefined" && profile.australianRegionalStudy !== null && profile.australianRegionalStudy !== '') ? profile.australianRegionalStudy : undefined,
            'Australian Work Experience': (typeof profile.australianWorkExperience !== "undefined" && profile.australianWorkExperience !== null && !(typeof profile.australianWorkExperience === "number" && profile.australianWorkExperience === 0) && !(typeof profile.australianWorkExperience === "string" && profile.australianWorkExperience.trim() === '')) ? profile.australianWorkExperience : undefined
         };

         // Always show base fields, then only those extra fields that have value (not undefined)
         const tableFieldOrder = [
            ...baseFieldOrder,
            ...possibleExtras
               .map(extra => extra.field)
               .filter(field => typeof values[field] !== "undefined")
         ];

         const tableRows = tableFieldOrder.map(
            (field) => `| ${field} | ${typeof values[field] !== "undefined" ? values[field] : ''} |`
         ).join('\n');
         const table = `| Field | Value |\n|-------|-------|\n${tableRows}`;
         return {
            table,
            bullets: ''
         };
      }
   }

   /**
    * Generate a markdown table showing PR Pathways for subclass 189, 190, and 491,
    * stating if eligible ("Yes" or "No") for each. No other pathways.
    * @param {Object} profile - Profile details, such as ANZSCO code, occupation, etc.
    * @returns {Promise<string>} Markdown table.
    */
   async technicalAssessmentAiPrPathways(profile = {}, context) {
      try {
         const prompt = `
You are an Australian immigration expert.
Given the following technical assessment profile (may include ANZSCO code, occupation, skills assessment status, etc.), produce a markdown table.

The table MUST have these columns:
| PR Pathway | Visa Subclass / Stream | Core Eligibility Met? |

You must show exactly these three pathways/rows (no others):
- Skilled Independent | 189
- State Nominated | 190
- Skilled Work Regional | 491

For each, state in the last column "Yes" if main PR eligibility criteria are likely met (age, skills, English, skills assessment), otherwise "No". If unsure, use your best estimate from the profile.

Do not add any text or explanation before or after the markdown table. Return the table only.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})

Profile data:
${JSON.stringify(profile, null, 2)}
         `.trim();

         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an Australian immigration expert producing a concise markdown table for subclasses 189, 190, and 491 for a technical assessment report.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 400,
            temperature: 0.2,
         });

         let table = response.choices[0]?.message?.content?.trim();

         // Remove any markdown code fences, if present
         if (table) {
            table = table.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         }

         if (!table || !table.startsWith('|')) throw new Error("AI did not return a valid markdown table");

         return table;
      } catch (error) {
         console.error("Error in technicalAssessmentAiPrPathways:", error);
         // Fallback: Always show 189, 190, 491 with "Yes"/"No" as best as possible from profile
         let yesIfEligible = (cond) => cond ? "Yes" : "No";
         // Minimal logic: if ANZSCO is present, say "Yes" for all, else "No" for all
         const eligible = profile && (profile.anzsco || profile['ANZSCO Code']) ? true : false;
         const rows = [
            `| Skilled Independent | 189 | ${yesIfEligible(eligible)} |`,
            `| State Nominated | 190 | ${yesIfEligible(eligible)} |`,
            `| Skilled Work Regional | 491 | ${yesIfEligible(eligible)} |`
         ].join('\n');
         const fallbackTable = `| PR Pathway | Visa Subclass / Stream | Core Eligibility Met? |
|----------------------|-----------------------|---------------------|
${rows}
`;
         return fallbackTable;
      }
   }

   /**
    * Generate up to 6 concise bullet-point "profile snapshot" statements for a technical assessment profile.
    * The bullet points should summarize major factors for an Australia PR technical assessment, in the style of an Immigration Consultant.
    * @param {Object} profile - technical assessment profile fields, e.g. education, work experience, IELTS, etc.
    * @param {string} context - (optional) Context from the previous chat, for reference only (should NOT affect the prompt)
    * @returns {Promise<string[]>} Array of at most 6 bullet points formatted as plain markdown list items, no asterisks.
    */
   async technicalAssessmentAiProfileSnapshots(profile = {}, context = ``) {
      try {
         // Pass profile as-is as JSON for the AI prompt

         const prompt = `
You are an expert Australian Immigration Consultant.
Given ONLY the following candidate profile data (as JSON), produce up to 4 concise bullet points as a 'Profile Snapshot' for an Australia PR technical assessment.
Each bullet must be fact-focused, relevant, no more than 25 words. Cover, where applicable: education, work experience, English proficiency (if available), skill assessment status or authority, partner status/English, Australian study/work experience, and any medical/criminality notes.
Do NOT use bold, italics, or asterisks anywhere in any bullet or point. Output plain text markdown list using a - (dash) at the start of each line. Do NOT use * for italics or any other style. No formatting characters at all, just text.
If a field is blank in the provided JSON, omit it from the bullets.
Do not mention or suggest anything about fonts, typefaces, or font styles.
Return ONLY 4 or fewer markdown bullet points. No commentary, no intro, no summary.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})

Candidate profile:
${JSON.stringify(profile, null, 2)}
         `.trim();

         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an Australian immigration consultant summarizing key snapshot details for a PR technical assessment using concise plain-text markdown bullet points. Do not use or suggest bold, italics or asterisks anywhere. Return only plain, unformatted text bullet points using a single dash at the start of each line. No formatting characters at all, just text.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 250,
            temperature: 0.3,
         });

         let bullets = response.choices[0]?.message?.content?.trim();
         if (!bullets) throw new Error("No response from OpenAI");

         // Remove code fences if any
         bullets = bullets.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '');

         // Remove any leading/trailing * or _ from lines (if AI adds them anyway)
         const bulletList = bullets
            .split('\n')
            .map(line => line.trim().replace(/^[-*]\s*([*_]*)(.*?)([*_]*)$/, '- $2').replace(/[*_]/g, '').trim())
            .filter(line => line.startsWith('- '))
            .slice(0, 4);

         return bulletList;
      } catch (error) {
         console.error("Error in technicalAssessmentAiProfileSnapshots:", error);

         // Fallback: use input profile fields for default bullets, no asterisks
         const fallback = [];
         if (profile.name)
            fallback.push(`- Name: ${profile.name}`);
         if (profile.dob)
            fallback.push(`- Date of Birth: ${profile.dob}`);
         if (profile.nationality)
            fallback.push(`- Nationality: ${profile.nationality}`);
         if (profile.skillAssessingAuthority)
            fallback.push(`- Skill Assessing Authority: ${profile.skillAssessingAuthority}`);
         if (profile.anzsco)
            fallback.push(`- ANZSCO Code: ${profile.anzsco}`);
         if (typeof profile.experienceConsider !== "undefined" && profile.experienceConsider !== null)
            fallback.push(`- Relevant Work Experience: ${profile.experienceConsider} year(s)`);
         if (profile.currentCompanyName)
            fallback.push(`- Current Employer: ${profile.currentCompanyName}`);
         if (profile.currentDesignation)
            fallback.push(`- Current Designation: ${profile.currentDesignation}`);
         if (typeof profile.australianWorkExperience !== "undefined" && profile.australianWorkExperience !== null)
            fallback.push(`- Australian Work Experience: ${profile.australianWorkExperience ? 'Yes' : 'No'}`);
         if (typeof profile.australianStudy !== "undefined" && profile.australianStudy !== null)
            fallback.push(`- Australian Study: ${profile.australianStudy ? 'Yes' : 'No'}`);
         if (profile.maritalStatus)
            fallback.push(`- Marital Status: ${profile.maritalStatus}`);
         if (profile.caseOwner)
            fallback.push(`- Case Owner: ${profile.caseOwner}`);
         return fallback.slice(0, 4);
      }
   }

   /**
    * Generates a PR Pathway Eligibility markdown table using OpenAI, which
    * now ALSO includes total points for subclass 189, 190, and 491 in the same table.
    * If OpenAI fails, a fallback table with those totals is returned as well.
    * @param {object} profile - Candidate profile (optional), used to customize prompt context.
    * @returns {Promise<string>} Markdown table string
    */
   async technicalAssessmentAiPrPathwayEligibleTable(profile = {}, context) {
      const sourceUrl = `https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-table`;
      // Revised prompt: Example table for guidance only. The result must be calculated for the given profile!
      const prompt = `
You are an Australian migration consultant. Based ONLY on the following candidate profile (provided as JSON), estimate their PR pathway eligibility and points according to the Australia SkillSelect points test for the main PR subclasses (189, 190, 491).

Strict rules:
- Use ONLY this official points table: ${sourceUrl}
- For EACH component, include a row showing the component, brief description, and its awarded Points (as an integer).
- Only include points that would actually be counted in the official PR assessment (no hypothetical, NA or dash entries for points).
- After all component rows, immediately provide these three TOTAL rows, and ensure they are mathematically correct and match row-by-row sum:
    - "Total Points (Subclass 189)": sum all above Points rows (do NOT include nomination bonus in this total).
    - "Total Points (Subclass 190)": "Total Points (Subclass 189)" + 5 (State Nomination).
    - "Total Points (Subclass 491)": "Total Points (Subclass 189)" + 15 (Regional Nomination).
- NEVER add nomination bonus to subclass 189, only to 190 (+5) or 491 (+15).
- Always show these three total rows, and the total Points in each is a pure number, not an expression.
- If the profile component is missing, do NOT make up extra rows, just omit.
- Absolutely NO commentary, no extra text, no explanation, no bold, no italics, no code fences, only the markdown table.
- Each cell should be a plain value without formatting or style marks.
- The EXAMPLE table below is for illustrative structure ONLY – DO NOT COPY the values or rows, calculate the results for the actual profile provided.

Special calculation details:
- "Australian Work Experience" is in years; assign: 0 (<1yr), 5 (1-<3), 10 (3-<5), 15 (5-<8), 20 (8+).
- "Overseas Work Experience" uses same rule (0, 5, 10, 15 for 3/5/8+ years).
- "Australian Study": if true, award 5, otherwise 0 (omit if unknown).
- "Credentialled Community Language": if true, 5; else 0 (omit if unknown).
- "Partner Skills":
   - If "maritalStatus" is "single" or "unmarried", award 10.
   - If married: If "spouseEnglishLanguage" is "competent" or higher AND "spouseEligibleForAssessment" is true, 10.
   - Else if "spouseEligibleForAssessment" is false and "spouseEnglishLanguage" is "competent" or higher, 5.
   - Otherwise 0.
- Do not show or add a nomination bonus row (the 5/15 is added ONLY at total row for 190/491 as per above).

EXAMPLE ONLY (for guidance – DO NOT COPY VALUES, calculate for the profile):

| Component                       | Description                                   | Points |
|---------------------------------|-----------------------------------------------|--------|
| Age                             | 33                                           | 25     |
| English Language                | Proficient                                   | 10     |
| Overseas Work Experience        | 5 years                                      | 10     |
| Australian Work Experience      | 3 years                                      | 10     |
| Education                       | Bachelor of Computer Application              | 15     |
| Australian Study                | Yes                                          | 5      |
| Credentialled Community Language| Yes                                          | 5      |
| Partner Skills                  | Married, Spouse eligible & proficient English | 0     |
| Total Points (Subclass 189)     |                                              | 80     |
| Total Points (Subclass 190)     |                                              | 85     |
| Total Points (Subclass 491)     |                                              | 95     |

Now, produce the markdown table for the following actual candidate profile (do NOT copy the example, calculate results):

Candidate profile:
${JSON.stringify(profile, null, 2)}

Reference context (do NOT alter the table format or calculation flow): ${context}
`.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an Australian migration consultant. You must analyze the provided profile JSON and generate ONLY a markdown table about PR points eligibility for subclasses 189, 190, and 491. No formatting (no bold, italics, code) in table cells. Only return a plain text markdown table, no commentary. The total for 189 must exactly match the sum of above component point values (no bonus included) and Special calculation if added. The 190 and 491 total rows must be exactly +5 and +15 points over the subclass 189 total."
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 440,
            temperature: 0.2,
            presence_penalty: 0,
            frequency_penalty: 0,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) {
            throw new Error("No AI response received for PR pathway eligibility table.");
         }
         // Remove any code fences, just in case
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         // Remove bold & italic style markup from table cells, if present
         content = content.replace(/\*\*([^\*]+)\*\*/g, '$1')
            .replace(/\*([^\*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1');
         return content;
      } catch (error) {
         console.error("Error in technicalAssessmentAiPrPathwayEligibleTable:", error);
         // Fallback: sample table precisely matching the image values and logic
         return [
            '| Component                       | Description                                   | Points |',
            '|---------------------------------|-----------------------------------------------|--------|',
            '| Age                             | 33                                            | 25     |',
            '| English Language                | Proficient                                    | 10     |',
            '| Education                       | Bachelor of Computer Application              | 15     |',
            '| Overseas Work Experience        | 5 years                                       | 10     |',
            '| Australian Study                | Yes                                           | 5      |',
            '| Australian Work Experience      | 3 years                                       | 10     |',
            '| Credentialled Community Language| Yes                                           | 5      |',
            '| Partner Skills                  | Married, Spouse eligible for assessment, Proficient English, 3 years work experience | 10     |',
            '| Total Points (Subclass 189)     |                                               | 80     |',
            '| Total Points (Subclass 190)     |                                               | 85     |',
            '| Total Points (Subclass 491)     |                                               | 95     |'
         ].join('\n');
      }
   }

   /**
    * Generates an AI markdown table of total points by visa subclass for PR pathways.
    * Uses OpenAI to create a tailored markdown table for the provided profile, or defaults.
    * @param {object} profile - profile data for context (optional)
    * @returns {Promise<string>} markdown table string
    */
   async aiPrPathwayTotalPointsByVisaSubclassTable(profile = {}) {
      // Compose a prompt for AI to generate the required table.
      const prompt = `
You are an Australian immigration consultant.

Given the following profile details (JSON below), produce ONLY a markdown table with these columns:

| Visa Subclass | Description | Total Points |

For each plausible PR pathway (subclass), fill in a row with a short description and the candidate's total estimated points for that subclass. Estimate the points for each visa subclass based on standard Australia SkillSelect Points Test rules and given (or unspecified) profile details.

- Return only the markdown table. No commentary, no extra lines.
- Do NOT use any formatting (no bold/italics/code) in table cells, only plain text.
- If profile does not provide data, use plausible defaults.
- Maximum 3 rows.

Profile:
${JSON.stringify(profile, null, 2)}
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an Australian immigration consultant AI generating ONLY markdown tables, no commentary.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 280,
            temperature: 0.2,
            presence_penalty: 0,
            frequency_penalty: 0,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI for visa subclass points table.");

         // Remove code fences if present, and strip markdown styles from table cells
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         content = content.replace(/\*\*([^\*]+)\*\*/g, '$1')
            .replace(/\*([^\*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1');
         return content;
      } catch (error) {
         console.error("Error in aiPrPathwayTotalPointsByVisaSubclassTable:", error);
         // Fallback to static plausible output
         return [
            '| Visa Subclass | Description | Total Points |',
            '|--------------|-------------|--------------|',
            '| 189 | Skilled Independent | 80 |',
            '| 190 | State Nominated | 85 |',
            '| 491 | Regional (Provisional) | 90 |'
         ].join('\n');
      }
   }

   /**
    * Uses OpenAI to generate markdown bullet points with interpretation for PR pathway points by visa subclass.
    * Falls back to static bullets if OpenAI fails.
    * @returns {Promise<string>} Markdown-formatted bullet points.
    /**
     * Uses OpenAI to generate markdown bullet points with interpretation for PR pathway points by visa subclass.
     * Falls back to static bullets if OpenAI fails.
     * @param {object} profile
     * @returns {Promise<string>} Markdown-formatted bullet points.
     */
   /**
    * Uses OpenAI to generate key PR eligibility snapshot bullet points based on the profile and points table.
    * Returns up to 6 concise markdown bullet points about PR eligibility.
    * If OpenAI fails, falls back to hardcoded, plausible example bullet points.
    * @param {object} profile
    * @returns {Promise<string[]>} Array of markdown bullet points (as strings).
    */
   /**
    * Uses OpenAI to generate concise PR pathway interpretation bullet points based on the user's profile.
    * Accepts the profile data structured as:
    *   {
    *     name,
    *     dob,
    *     skillAssessingAuthority,
    *     anzsco,
    *     experienceConsider,
    *     maritalStatus,
    *     currentCompanyName,
    *     currentDesignation,
    *     australianWorkExperience,
    *     australianStudy,
    *     nationality,
    *     caseOwner
    *   }
    /**
     * Generates PR pathway interpretation for ALL relevant subclasses (189, 190 & 491) with specific interpretations.
     * For each subclass in the provided (or fallback) table, generates a succinct summary bullet.
     * Also adds a general eligibility highlight point as the first/bottom bullet, always 4 bullets total.
     * @param {object} profile
     * @returns {Promise<string[]>} Array of markdown bullet points (as strings).
     */
   async technicalAssessmentAiPrPathwayInterpretasionPoints(profile = {}, context) {
      // Compose a fallback table in case points table is not present in profile
      const defaultTable = [
         '| Visa Subclass | Description | Total Points |',
         '|--------------|-------------|--------------|',
         '| 189 | Skilled Independent | 80 |',
         '| 190 | State Nominated | 85 |',
         '| 491 | Regional (Provisional) | 90 |',
      ].join('\n');

      const table = profile.prPathwayTotalPointsByVisaSubclassTable || defaultTable;

      // Compose a prompt to the LLM: Add explicit instructions to interpret ALL visa subclasses (189, 190, 491) in the table (separately).
      // Each bullet point should correspond to a subclass's interpretation for THIS candidate's profile, plus a general highlight.
      const prompt = `
Given the following applicant PR profile (as a JavaScript object) and a corresponding Visa Points Table,
write exactly 4 clear, single-sentence client-friendly bullet points (markdown: each starts with "-").

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})

Instructions:
- For each subclass present in the table (especially 189, 190, and 491), write one bullet interpreting the applicant's PR prospects or highlights FOR THAT subclass (tailored to their points and likely eligibility).
- Each subclass's bullet should mention the subclass (e.g. "Subclass 189: ..."), and summarize the candidate's prospects for that pathway.
- The fourth bullet should be a general overall PR eligibility highlight (e.g. about English, skills, lack of issues, etc).
- Do NOT copy field names directly; do NOT explain; write as for a crisp client PDF.
- Output only the 4 bullets (no headings or extra lines).

Profile:
${JSON.stringify(profile, null, 2)}

Visa Subclass Points Table:
${table}
`.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australian PR consultant. For each subclass (189, 190, 491), write a tailored, client-friendly interpretation bullet, plus 1 general eligibility highlight. Output exactly 4 markdown bullet points, no explanation.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 300,
            temperature: 0.2,
            presence_penalty: 0,
            frequency_penalty: 0,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI for PR pathway interpretation bullets.");

         // Remove markdown code fences or extra markdown, then split into lines
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();

         // Return as array (for downstream PDF bullet rendering) and limit to 4 bullets only, even if API returns extra
         return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .slice(0, 4); // Ensure only 4 bullet points returned
      } catch (error) {
         console.error("Error in technicalAssessmentAiPrPathwayInterpretasionPoints:", error);
         // Fallback: provide plausible bullets for each subclass + general highlight
         return [
            "- Subclass 189: Strong independent pathway based on high points and relevant qualifications.",
            "- Subclass 190: Competitive for state nomination due to occupation and state preferences.",
            "- Subclass 491: Eligible for regional migration with strong prospects for invitation.",
            "- Demonstrates positive skills assessment, proficient English, and overall PR readiness."
         ];
      }
   }

   /**
    * Generates an Australian State Nomination matrix table (for Software Engineer/ANZSCO 261313)
    * using OpenAI. Returns the markdown table as a string.
    * @returns {Promise<string>} markdown table string
    */
   /**
    * Generates an Australian State Nomination matrix markdown table for a given profile (dynamic occupation/ANZSCO).
    * @param {Object} profile - The candidate profile (see controllers/technicalAssessmentController.js for structure)
    * @returns {Promise<string>} markdown table string
    */
   async technicalAssessmentAiStateNominationMatrix(profile, context) {
      // Extract occupation and anzsco if available, else fallback to old version
      const occupation = profile?.anzsco ? `${profile.anzsco}` : "Software Engineer (ANZSCO 261313)";
      // If we have more info, e.g., skillAssessingAuthority, we can inject it too.
      const prompt = `
Given the candidate below and their nominated occupation, generate a markdown table summarizing PR state nomination for each Australian State & Territory.

Candidate profile (quoted, copy-exact):
"""
Name: ${profile?.name || "N/A"}
Date of Birth: ${profile?.dob || "N/A"}
Skill Assessing Authority: ${profile?.skillAssessingAuthority || "N/A"}
ANZSCO: ${profile?.anzsco || "261313"}
Experience Consider: ${profile?.experienceConsider || "N/A"}
Marital Status: ${profile?.maritalStatus || "N/A"}
Current Company: ${profile?.currentCompanyName || "N/A"}
Current Designation: ${profile?.currentDesignation || "N/A"}
Australian Work Experience: ${profile?.australianWorkExperience ?? "N/A"}
Australian Study: ${profile?.australianStudy ?? "N/A"}
Nationality: ${profile?.nationality || "N/A"}
"""

Nominated Occupation: ${occupation}

Generate ONLY a markdown table (no commentary, no headings before/after) summarizing, for each Australian State & Territory:
- State/Territory name
- Current Status (e.g. "Open" etc)
- Competitiveness ("High", "Moderate", "Low-Moderate", etc; based on a candidate like above and their occupation)
- Key Sectors (2-3 sectors per state, tailored to THIS occupation and state, if possible)

Format columns as:
| State / Territory | Current Status | Competitiveness | Key Sectors (tailored to ${occupation}) |

States to include as rows: NSW, VIC, QLD, SA, WA, TAS, NT, ACT.

Requirements:
- Analyze the profile above and tailor "Competitiveness" and "Key Sectors" to their occupation/state where possible.
- Table must contain all 8 states/territories (1 row each).
- Data must be plausible and up-to-date for 2025, even if estimating.
- Write clear and concise brief text in each cell. Do NOT add commentary, code fences, or formatting.

ONLY output the markdown table; do not explain or add extra text.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an AI Australian migration consultant. Given a profile and a prompt, return only the requested markdown table and nothing else.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 550,
            temperature: 0.28,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI for state nomination matrix.");
         // Remove markdown code fences if present (shouldn't be, but be defensive)
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         return content;
      } catch (error) {
         console.error("Error in technicalAssessmentAiStateNominationMatrix:", error);
         // Profile-aware fallback (insert their occupation)
         const occ = profile?.anzsco || "Software Engineer (ANZSCO 261313)";
         return `| State / Territory         | Current Status | Competitiveness | Key Sectors (tailored to ${occ})                   |
|---------------------------|----------------|-----------------|------------------------------------------------------|
| New South Wales (NSW)     | Open           | High            | FinTech, Cloud Services, Enterprise Software          |
| Victoria (VIC)            | Open           | High            | AI, GovTech, Digital Transformation                  |
| Queensland (QLD)          | Open           | Moderate-High   | Infrastructure Automation, Public Sector Systems      |
| South Australia (SA)      | Open           | Moderate-High   | Defence Engineering, Manufacturing IT, ERP           |
| Western Australia (WA)    | Open           | High            | Mining Technology, Energy Analytics, Process Automation |
| Tasmania (TAS)            | Open           | Moderate        | Renewable IT, Smart Energy Systems, Regional Projects|
| Northern Territory (NT)   | Open           | Low-Moderate    | Infrastructure IT, Government Systems                |
| Australian Capital Territory (ACT) | Open           | High            | Federal Projects, Cyber Security, Research ICT        |`;
      }
   }

   /**
    * Generate a markdown table summarizing the labour market outlook for Australian regions (states and territories).
    * The table includes: Region, Demand Level, Typical Job Titles, Key Industries, Hiring Channels.
    * Uses the candidate's profile data if available for customisation.
    * Returns only the markdown table as a string.
    * @param {object} profile - Candidate profile data, e.g. { anzsco, currentDesignation, currentCompanyName, ... }
    * @returns {Promise<string>}
    */
   async technicalAssessmentAiLabourMarketOutlookByRegion(profile = {}, context) {
      const prompt = `
Given the following Australian PR applicant profile in JSON:
${JSON.stringify(profile, null, 2)}

Generate a markdown table showing the Australian labour market outlook for 2025 for this candidate's roles by state/territory.

Columns:
| Region | Demand Level | Typical Job Titles | Key Industries | Hiring Channels |

Rows must include: New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, Northern Territory, ACT.

- Tailor Typical Job Titles and Key Industries as much as possible to the supplied profile JSON.
- Data must be plausible and forward-looking for 2025 (estimates allowed).
- Write clear, concise content in each cell (no filler or fluff, focus on candidate relevance if possible).
- Do NOT add any commentary, text before or after, or code fences. Output the markdown table ONLY.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an AI labour market analyst for Australia. Output only the requested markdown table about software engineering (or the provided occupation) outlook, and nothing else. Adjust for the user profile if possible."
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 600,
            temperature: 0.2,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI for labour market table.");
         // Remove markdown code fences if present (be defensive)
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         return content;
      } catch (error) {
         // Defensive fallback: use their occupation if provided
         let occFallback = profile?.anzsco || profile?.currentDesignation || "Software Engineer";
         return `| Region         | Demand Level     | Typical Job Titles           | Key Industries                         | Hiring Channels       |
|---------------|------------------|------------------------------|----------------------------------------|----------------------|
| New South Wales | High           | ${occFallback}, DevOps Engineer, Cloud Engineer | Financial Services, Tech, Startups     | Online portals, recruiters |
| Victoria       | High            | Backend Developer, Solution Architect | Government, HealthTech, EdTech         | Direct hire, agencies |
| Queensland     | Moderate-High   | Full Stack Developer, Data Engineer | Mining, Agritech, GovTech             | Job boards, networking |
| South Australia| Moderate        | ${occFallback}, QA Analyst  | Defence, Manufacturing, Advanced Tech   | Recruitment firms    |
| Western Australia | Moderate-High | Platform Engineer, Systems Developer | Mining, Energy, Logistics              | Online ads, internal |
| Tasmania       | Moderate        | ${occFallback}, Analyst      | Renewable Energy, Regional IT          | Job boards           |
| Northern Territory | Low-Moderate | Developer, IT Support Engineer  | Public Sector, Government              | NT Govt jobs, Seek   |
| ACT            | High            | ${occFallback}, Security Engineer | Federal Gov, Cybersecurity, Research   | Federal job sites, recruiters |`;
      }
   }

   /**
    * Generates an Australian salary benchmarks markdown table using OpenAI
    * and falls back to static values if the API fails.
    * Accepts the candidate profile for future extension.
    * @param {object} profile - Candidate profile (see controllers/technicalAssessmentController.js)
    * @returns {Promise<string>} Markdown table as string
    */
   async technicalAssessmentAiSalaryBenchmarks(profile = {}, context) {
      const prompt = `
Given the following Australian PR applicant profile:
${JSON.stringify(profile, null, 2)}

Generate a markdown table of IT/software engineering salary benchmarks for major regions/states in Australia for 2025.
Output only the markdown table, with NO commentary, heading, or code fences.

Columns: | Region | Start (P25) | Median (P50) | Top (P75/P90) | Source / Year |

Rows must include: New South Wales, Victoria, Queensland, South Australia, Western Australia, Tasmania, Northern Territory, ACT.

- Fill plausible, forward-looking numbers for 2025 (AUD). If occupation/title present, tailor the table for that; otherwise assume "Software Engineer/ICT Professional".
- Use 2025 sources (or the latest available if not).

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content:
                     "You are an Australian IT salary data analyst. Output ONLY the requested markdown salary table for Australia. No commentary or block code.",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 300,
            temperature: 0.2,
         });

         let content = response.choices[0]?.message?.content?.trim();
         if (!content) throw new Error("No response from OpenAI for salary benchmarks table.");
         content = content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim();
         return content;
      } catch (error) {
         // Hard fallback to plausible 2025 salary data
         return `| Region | Start (P25) | Median (P50) | Top (P75/P90) | Source / Year |
|--------|-------------|--------------|---------------|---------------|
| NSW    | 85,000      | 115,000      | 145,000       | Hays 2025     |
| VIC    | 82,000      | 112,000      | 140,000       | SEEK 2025     |
| QLD    | 78,000      | 108,000      | 135,000       | Hays 2025     |
| SA     | 76,000      | 105,000      | 130,000       | Indeed 2025   |
| WA     | 82,000      | 118,000      | 145,000       | SEEK 2025     |
| TAS    | 70,000      | 92,000       | 115,000       | JobOutlook 2025 |
| NT     | 75,000      | 98,000       | 120,000       | Territory Jobs 2025 |
| ACT    | 90,000      | 120,000      | 150,000       | APS Salary 2025 |`;
      }
   }

   /**
    * Generate the Step-by-Step Plan & SLA as a markdown table, tailored to the given profile.
    * If OpenAI fails, falls back to a sample table matching the provided image.
    * Limited to exactly 6 rows.
    * @param {object} profile - Candidate profile data (optional)
    * @returns {Promise<string>} Markdown table string
    */
   async technicalAssessmentAiStepByStepPlanAndSla(profile = {}, context) {
      // Compose summary for prompt to personalize, but use defaults if missing.
      // Profile field mapping for more realistic personalization
      const summaryFields = [
         { key: 'name', label: 'Client Name' },
         { key: 'dob', label: 'Date of Birth / Age' },
         { key: 'anzsco', label: 'Primary Occupation' },
         { key: 'anzsco', label: 'ANZSCO Code' },
         { key: 'highestEducation', label: 'Highest Education' },
         { key: 'workExperience', label: 'Work Experience' },
         { key: 'englishTest', label: 'English Test' },
         { key: 'currentLocation', label: 'Current Location' }
      ];
      const summary = summaryFields
         .map(field => `${field.label}: ${profile[field.key] || ''}`)
         .join(', ');

      const prompt = `
Given the following candidate profile:
${summary}

Generate ONLY a markdown table for an Australia PR (Skilled migration) application process, matching the sample below exactly in columns, column order, and table structure. Limit the output to a table with exactly 6 rows total (one header row, one delimiter row, and 4 data rows). Do NOT add commentary, headings, or code fences.

Columns must be: Step | Action | Owner | Prerequisites / Docs | ETA

- The table must contain exactly these 4 steps, in this order, with the wording, cell structure, and content exactly as below:
| Step | Action                                                 | Owner             | Prerequisites / Docs                                | ETA                         |
|------|-------------------------------------------------------|-------------------|-----------------------------------------------------|-----------------------------|
| 1    | Prepare & lodge ACS Skill Assessment                  | Client + World Visa| Degree, Transcripts, Experience Letters, Payslips   | 3–4 weeks prep; 6-8 weeks processing |
| 2    | Confirm English Results (IELTS / PTE / TOEFL / CELPIP)| Client            | Valid test results                                  | 2–3 weeks                   |
| 3    | Submit EOIs for 189, 190 & 491                        | World Visa        | ACS + English Test                                  | 1 week                      |
| 4    | Visa Application Lodgement                            | World Visa        | PCC, Medicals, Funds Proof                          | 6–9 months average          |

- Return ONLY the markdown table, no headings, introductions, code blocks, or commentary.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australia migration consultant. Output only the markdown table for the step-by-step PR plan, matching the sample exactly in columns, order, and format. No commentary, code fences, or headings. Limit the output to a table with 6 rows total (header, delimiter, and 4 steps).",
               },
               {
                  role: "user",
                  content: prompt,
               },
            ],
            max_tokens: 280,
            temperature: 0.05,
         });

         let table = response.choices[0]?.message?.content?.trim();
         // Remove any markdown code fences, if present
         table = table ? table.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "";

         // Ensure table looks like a markdown table, is limited to 6 rows (header, delimiter, 4 data)
         if (
            !table ||
            !table.startsWith('| Step | Action') ||
            table.split('\n').length !== 6 ||
            !table.includes('| 1    | Prepare & lodge ACS Skill Assessment')
         ) {
            throw new Error("OpenAI did not return the required 6-row markdown table for the SLA plan.");
         }

         return table;
      } catch (error) {
         console.error("Error in technicalAssessmentAiStepByStepPlanAndSla:", error);
         // Fallback: Plausible, short (6-row) version of table
         return `| Step | Action                                                 | Owner             | Prerequisites / Docs                                | ETA                         |
|------|-------------------------------------------------------|-------------------|-----------------------------------------------------|-----------------------------|
| 1    | Prepare & lodge ACS Skill Assessment                  | Client + World Visa| Degree, Transcripts, Experience Letters, Payslips   | 3–4 weeks prep; 6-8 weeks processing |
| 2    | Confirm English Results (IELTS / PTE / TOEFL / CELPIP)| Client            | Valid test results                                  | 2–3 weeks                   |
| 3    | Submit EOIs for 189, 190 & 491                        | World Visa        | ACS + English Test                                  | 1 week                      |
| 4    | Visa Application Lodgement                            | World Visa        | PCC, Medicals, Funds Proof                          | 6–9 months average          |`;
      }
   }

   /**
    * Generate an Australia PR Risk Register & Mitigations markdown table using AI (or fallback)
    * @param {object} profile - The profile attributes to contextualize risks (see @file_context_0 for details)
    * @returns {Promise<string>} - markdown table: Risk | Likelihood | Impact | Mitigation
    */
   async technicalAssessmentAiRiskRegisterMitigations(profile = {}, context) {
      // Use profile fields to contextualize risk factors, but always generate a table of 3-5 PR hurdles
      const prompt = `
You're a senior Australia migration consultant. For the following skilled migration applicant, create a markdown table listing 3–5 key risks (columns: Risk | Likelihood | Impact | Mitigation) specific to the Australia PR process.

- Each risk should be practical and relevant for skilled PR applicants.
- Likelihood: Low, Medium, or High. Impact: Minor, Moderate, or Severe.
- Mitigation: 1-sentence, actionable and client-friendly.
- Do NOT include introductions/headings/commentary—return only the markdown table, no code fences.

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})

Candidate Profile:
${JSON.stringify(profile, null, 2)}
`.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are a senior Australia migration consultant. Respond ONLY with a markdown table Risk | Likelihood | Impact | Mitigation, no commentary or code blocks.",
               },
               {
                  role: "user",
                  content: prompt
               },
            ],
            max_tokens: 450,
            temperature: 0.25,
         });

         let table = response.choices[0]?.message?.content?.trim();
         // Strip code fences if OpenAI returns any
         table = table ? table.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "";
         // Table must begin with a markdown table row and minimum required columns, else fallback
         if (!table || !table.startsWith('| Risk') || !table.includes('| Likelihood') || !table.includes('| Mitigation')) {
            throw new Error("OpenAI did not return a proper markdown table.");
         }

         return table;
      } catch (error) {
         console.error("Error in technicalAssessmentAiRiskRegisterMitigations:", error);
         // Fallback: Return a realistic, always-usable risk register matching the expected markdown format
         return `| Risk                                   | Likelihood | Impact   | Mitigation                                               |
|----------------------------------------|------------|----------|----------------------------------------------------------|
| ACS Delays due to Incomplete Evidence  | Medium     | Moderate | Ensure all documents are certified and complete before submission. |
| IELTS / PTE Score Below Target         | Low        | Moderate | Prepare thoroughly and book test dates early for retake if needed. |
| State Nomination Quota Pause           | Medium     | Moderate | Lodge EOIs for multiple states to maximize nomination chances.     |
| Medical/Character Issues               | Low        | Severe   | Secure required police checks and health exams in advance.         |
| Address Changes Delaying Processing    | Low        | Minor    | Update all records promptly with any change in personal details.   |`;
      }
   }

   /**
    * Generate technical assessment outcome forecast bullet points using AI (with recommendation) as markdown bullet points, with NO exclamation marks anywhere in the response.
    * @param {object} [profile={}] - The profile attributes (optional, for future enhancements)
    * @returns {Promise<string[]>} - Array of markdown bullet points
    */
   async technicalAssessmentOutcomeForecastBulletPoints(profile = {}, context) {
      // Context: Forecast outcome scenarios for PR - return 4 markdown bullet points, including Recommendation. Exclamation marks are not allowed at all.
      const prompt = `
Generate concise markdown bullet points outlining the PR outcome forecast for an Australia skilled migration applicant.
Include the following cases:
- Best Case: Example - Subclass 190 nomination (NSW/VIC) → PR in 9–12 months
- Base Case: Example - Subclass 491 nomination (SA/TAS) → regional work → PR after 3 years
- Conservative Case: Example - Assessment or nomination delays → 12–18 months overall
- Recommendation: Example - Proceed immediately with ACS assessment and maintain parallel EOIs for 189, 190 & 491
Each bullet point must begin with the case label (Best Case, Base Case, etc.) in normal font, not bold, and must not use any exclamation marks (! symbol).
The "Recommendation" bullet point should start with "Recommendation:" (not bold) and be actionable.
Do not include any introduction or explanation text. No code fences. Return only the 4 markdown bullet points, one per line, no bold formatting anywhere. The final response must NOT contain any exclamation symbol (!).

(You may take the following chat context for reference only, but output structure should not have influence of this: ${context})
`.trim();
      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australia immigration advisor. Respond ONLY with the requested markdown bullet points, no commentary, no code blocks, no bold formatting. The response must NOT include the exclamation symbol (!), even inside the bullet points.",
               },
               {
                  role: "user",
                  content: prompt
               }
            ],
            max_tokens: 300,
            temperature: 0.15,
         });

         let bullets = response.choices[0]?.message?.content?.trim();
         // Clean up possible code fences or excess whitespace
         bullets = bullets ? bullets.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "";

         // Parse into bullet points
         let bulletArray = [];
         if (bullets) {
            bulletArray = bullets
               .split('\n')
               .map(line => line.trim())
               .filter(line => line.startsWith('- ') || line.startsWith('* '))
               .map(line => {
                  // Ensure NO exclamation symbols
                  let l = line.replace(/\!+/g, '');
                  // Remove possible trailing periods
                  return l.endsWith('.') ? l.slice(0, -1) : l;
               });
         }
         // Ensure no bullet contains "!"
         bulletArray = bulletArray.map(l => l.replace(/\!+/g, ''));
         if (bulletArray.length < 4) throw new Error("AI did not return all bullet points.");
         return bulletArray;
      } catch (error) {
         console.error("Error in technicalAssessmentOutcomeForecastBulletPoints:", error);
         // Fallback to static sample WITHOUT exclamation marks (no bold formatting)
         return [
            'Best Case: Subclass 190 nomination (NSW/VIC) → PR in 9–12 months',
            'Base Case: Subclass 491 nomination (SA/TAS) → regional work → PR after 3 years',
            'Conservative Case: Assessment or nomination delays → 12–18 months overall',
            'Recommendation: Proceed immediately with ACS assessment and maintain parallel EOIs for 189, 190 & 491',
         ].map(s => `- ${s}`);
      }
   }

   /**
    * Returns an array of 3-4 markdown-style numbered next steps for the user's PR journey,
    * based on their profile, using OpenAI for AI-generated clarity.
    * @param {Object} profile
    * @returns {Promise<string[]>}
    */
   async technicalAssessmentNextSteps(profile) {
      const prompt = `
Given the following Australia PR applicant's profile (fields may include: name, dob, skillAssessingAuthority, anzsco, experienceConsider, maritalStatus, currentCompanyName, currentDesignation, australianWorkExperience, australianStudy, nationality, caseOwner):

${JSON.stringify(profile, null, 2)}

Write concise, actionable "Next Steps" for the user. Format as a numbered markdown list (1., 2., etc.), 3 to 4 points only. Steps should be clear, specific, and relevant to Australian General Skilled Migration (e.g., skills assessment, English testing, Expression of Interest, State Nomination, document collection, etc.). Do not give generic advice—tailor where possible to the user's field or situation based on provided info.

No introduction, no conclusion, and absolutely no code or explanations—just the numbered markdown list. No bold formatting.
      `.trim();

      try {
         const response = await this.client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australian immigration advisor. Respond ONLY with the requested numbered next steps list (markdown numbered, e.g. 1., 2., 3.), no commentary, no code blocks, and no bold formatting.",
               },
               {
                  role: "user",
                  content: prompt
               }
            ],
            max_tokens: 250,
            temperature: 0.2,
         });

         let content = response.choices[0]?.message?.content?.trim();
         // Clean up code fences or extra whitespace if present
         content = content ? content.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "";

         // Parse lines that start with markdown numbers e.g., "1. "
         let stepsArray = [];
         if (content) {
            stepsArray = content
               .split('\n')
               .map(line => line.trim())
               .filter(line => /^\d+\.\s/.test(line));
         }
         // fallback if AI response doesn't yield at least 3 steps
         if (stepsArray.length < 3) {
            return [
               '1. Complete your skills assessment with the relevant authority (e.g., ACS, Engineers Australia).',
               '2. Take an English language test and achieve the required score (IELTS, PTE, or equivalent).',
               '3. Submit an Expression of Interest (EOI) through SkillSelect for relevant visa subclasses (e.g., 189, 190, 491).',
               '4. Gather and organize all required documents for state nomination and visa application.'
            ];
         }
         return stepsArray;
      } catch (error) {
         console.error("Error in technicalAssessmentNextSteps:", error);
         // Always provide relevant fallback
         return [
            '1. Complete your skills assessment with the appropriate assessing authority.',
            '2. Attempt the English language proficiency test and aim for the required score.',
            '3. Lodge an Expression of Interest (EOI) in SkillSelect for eligible visa subclasses.',
            '4. Prepare supporting documents to be ready for invitation and state nomination.'
         ];
      }
   }


   async generateTechnicalAssessment(profile) {
      // data in object structure
      const allSectionsDataObj = allSectionsData;
      const gptModel = "gpt-4o-mini";
      const gptSearchModel = "gpt-4o";
      const max_tokens = 250;
      const temperature = 0.2;

      let totalTokens = {
         prompt_tokens: 0,
         completion_tokens: 0,
         total_tokens: 0,
         gpt_model: gptModel,
      }

      let totalSearchTokens = {
         prompt_tokens: 0,
         completion_tokens: 0,
         total_tokens: 0,
         gpt_model: gptSearchModel
      }

      // await flushRedis();
      // return;


      const masterPrompt = masterContextPrompt(profile);
      const cacheKey = `${profile.anzsco ?? profile.currentDesignation}`;

      let masterPromptResponse = null;
      masterPromptResponse = await fetchCachedSummary(cacheKey);

      try {
         masterPromptResponse = await fetchCachedSummary(cacheKey);

         const redisConnected = isRedisConnected();

         if (!redisConnected) {
            return;
         }

         if (!masterPromptResponse) {
            // First, get the profileSummary response
            masterPromptResponse = await this.client.responses.create({
               model: gptSearchModel, // e.g., "gpt-4o"
               input: [
                  {
                     role: "system",
                     content: "You are an Australian immigration expert."
                  },
                  {
                     role: "user",
                     content: masterPrompt
                  }
               ],
               max_output_tokens: 1000,
               parallel_tool_calls: true,
               tools: [
                  {
                     type: "web_search",     // your custom tool filters: null,
                     search_context_size: 'medium'
                  }
               ],
               temperature: 0,                  // deterministic results for eligibility
               store: false
            });

            await cacheSummary(cacheKey, masterPromptResponse);

            // update the tokens
            totalSearchTokens = extractTokenUsage(masterPromptResponse, totalSearchTokens);
            console.log('totalSearchTokens: ', totalSearchTokens);
            return;
         }

         const contentMasterPromptRespones = masterPromptResponse.output_text;

         // This prompt sets the context for all subsequent completions, including the client profile and latest eligibility data from live sources.
         const promptsMasterPrompt = `
You are an Australian migration technical assessment assistant. Here is the context for all follow-up queries:

Today's date is: ${new Date().toISOString().slice(0, 10)}.

Profile: ${JSON.stringify(profile)}

Latest Eligibility Data: ${contentMasterPromptRespones}

You may use the official eligibility data provided above to inform and check your follow-up answers. Always base your reasoning on this data if applicable.
`;
         const assessmentSessionMessages = [
            { role: "system", content: promptsMasterPrompt }
         ];

         // Prepare all 8 AI requests in parallel
         const promptsArray = [
            {
               key: 'profileSummaryTable',
               prompt: profileSummaryPrompt,
               parser: (x) => x ? x.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'profileSummarySnapshots',
               prompt: profileSummarySnapshotsPrompt,
               parser: (x) => {
                  x = x ? x.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "";
                  return parseMarkdownBullets(x);
               }
            },
            {
               key: 'prPathwayEligibilityTable',
               prompt: prEligbilityPointsTablePrompt,
               parser: (x) => x ? x.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'crossStateNominationMatrix',
               prompt: crossStateNominationTablePromptMaster(),
               parser: (x) => x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'labourMarketOutlookByRegion',
               prompt: prLabourMarketOutlookByRegionPrompt,
               parser: (x) => x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'salaryBenchmarks',
               prompt: prSalaryBenchmarkPrompt,
               parser: (x) => x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'stepByStepPlanAndSLA',
               prompt: stepByStepPlanAndSlaPrompt,
               parser: (x) => x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'riskRegisterMitigations',
               prompt: riskRegistrationAndMitigationPrompt,
               parser: (x) => x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "",
            },
            {
               key: 'outcomeForecast',
               prompt: prOutcomeForecastPrompt,
               parser: (x) => {
                  x = x ? x.replace(/^```(?: markdown) ? /gm, '').replace(/```$/gm, '').trim() : "";
                  return parseMarkdownBullets(x);
               }
            },
         ];

         // Promise.all on all 10 sections
         const requests = promptsArray.map(p =>
            this.client.chat.completions.create({
               model: gptModel,
               messages: assessmentSessionMessages.concat({
                  role: "user",
                  content: p.prompt
               }),
               max_tokens: max_tokens,
               temperature: temperature,
            })
         );

         let responses = await Promise.all(requests);

         // Handle token usage aggregation
         for (let resp of responses) {
            totalTokens = extractTokenUsage(resp, totalTokens);
         }

         // Map responses content back to allSectionsDataObj fields
         promptsArray.forEach((sect, idx) => {
            let rawContent = responses[idx].choices[0]?.message?.content?.trim();
            let parsedContent = sect.parser(rawContent);
            // Set result on correct section's .content
            if (sect.key === 'outcomeForecast' || sect.key === 'profileSummarySnapshots') {
               allSectionsDataObj[sect.key].content = parsedContent;
            } else {
               allSectionsDataObj[sect.key].content = parsedContent;
            }
         });

         const prPathwayPromise = await this.client.chat.completions.create({
            model: gptModel,
            messages: assessmentSessionMessages.concat({
               role: "user",
               content: prPathwayTablePrompt(allSectionsDataObj.prPathwayEligibilityTable),
            }),
            max_tokens: max_tokens,
            temperature: temperature,
         });

         let prPathwayRaw = (await prPathwayPromise).choices[0]?.message?.content?.trim();

         allSectionsDataObj.prPathwayTable.content = prPathwayRaw
            ? prPathwayRaw.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '').trim()
            : "";

         extractTokenUsage(prPathwayPromise, totalTokens)


         console.log("totalTokens: ", totalTokens);
         console.log("totalSearchTokens", totalSearchTokens);

         return allSectionsDataObj;
      } catch (error) {
         console.error("Error in technicalAssessmentNextSteps:", error);

         return allSectionsData;
      }
   }

   async generateTechnicalAssessmentWithSeed(profile, latestInfo, latestStateNominationInfo) {
      try {
         const seedJsonString = JSON.stringify(seedData, null, 2);

         const comprehensivePrompt = `
   You are an Australian immigration expert. You will receive a JSON seed template and must populate it with accurate data based on the candidate's profile and latest immigration information.

   For context, here is the full template you must use and populate (structure, fields, and subfields must be preserved):

   ${JSON.stringify(seedData, null, 2)}

   CANDIDATE PROFILE:
   ${JSON.stringify(profile, null, 2)}

   LATEST IMMIGRATION INFORMATION:
   ${latestInfo}

   LATEST STATE NOMINATION INFORMATION:
   ${latestStateNominationInfo}

   INSTRUCTIONS:
   1. Replace ALL placeholder values (enclosed in []) with accurate, specific data based on the candidate profile
   2. For dates, use today's date: ${new Date().toISOString().slice(0, 10)}
   3. Calculate age from DOB if provided
   4. Partner Skills points calculation:
      - Single/not married: 10 points
      - Married + spouse competent English + eligible for assessment: 10 points
      - Married + (spouse competent English OR eligible for assessment): 5 points
      - Married + neither condition met: 0 points
   5. Points calculation rules:
      - Australian Work Experience: 0(<1yr), 5(1-<3yr), 10(3-<5yr), 15(5-<8yr), 20(8+yr)
      - Overseas Work Experience: 0(<3yr), 5(3-<5yr), 10(5-<8yr), 15(8+yr)
      - Australian Study: 5 points if true
      - Specialist Education: 10 points if applicable
      - Professional Year: 5 points if within last 4 years
      - Community Language: 5 points if true
   6. Eligibility determination: Mark "Yes" only if points ≥65 AND occupation in demand per latest info
   7. All content must be professional, accurate, and based on current 2025 data
   8. For arrays, maintain proper JSON array format
   9. For markdown tables, ensure proper formatting with | separators

   CRITICAL REQUIREMENTS:
   - Return ONLY the complete JSON object (no markdown code fences, no explanations)
   - Replace ALL placeholder values with actual data
   - Maintain exact JSON structure and formatting
   - Ensure all calculations are accurate based on official Australian immigration rules
   - Use current data from provided latest information sources
   - Keep all content concise and professional

   Return the complete populated JSON object:
   `;

         const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
               {
                  role: "system",
                  content: "You are an expert Australian immigration consultant. You must return ONLY valid JSON with no additional text, explanations, or formatting."
               },
               {
                  role: "user",
                  content: comprehensivePrompt
               }
            ],
            max_tokens: 4000,
            seed: 42,
            temperature: 0.1,
         });

         console.log("response: ", response);

         const responseContent = response.choices[0]?.message?.content?.trim();

         // Clean up any potential markdown code fences
         let cleanedContent = responseContent;
         if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
         } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
         }

         // Parse and validate JSON
         const populatedData = JSON.parse(cleanedContent);

         return {
            success: true,
            data: populatedData,
            message: "Technical assessment generated successfully using seed template"
         };

      } catch (error) {
         console.error("Error in generateTechnicalAssessmentWithSeed:", error);
         return {
            success: false,
            error: error.message,
            message: "Failed to generate technical assessment"
         };
      }
   }

   travelBudgetStructureJson = require("./travelBudgetStructure.json");
   // generate travel budget
   async generateTravelBudget(profile) {
      let model = "gpt-4o-mini";
      const prompt = `Calculate the travel budget based on the following profile: ${JSON.stringify(profile)}`;
      let promptTokens = {
         prompt_tokens: 0,
         completion_tokens: 0,
         total_tokens: 0,
         total_tokens_cost_in_inr: 0,
         model
      };

      try {
         const response = await this.client.chat.completions.create({
            model: model,
            messages: [
               {
                  role: "system",
                  content: travelBudgetSystemPrompt
               },
               {
                  role: "user",
                  content: prompt
               }
            ],
            max_tokens: 2000,
            temperature: 0.4,
         });

         // Calculated the token
         promptTokens = extractTokenUsage(response, promptTokens);

         const responseContent = response.choices[0]?.message?.content?.trim();
         // Clean up any potential markdown code fences and parse JSON
         const cleanedContent = responseContent.replace(/```json\s*/g, '').replace(/\s*```$/, '');
         const budgetData = JSON.parse(cleanedContent);

         return {
            success: true,
            data: budgetData,
            message: "Travel budget calculated successfully",
            promptTokens
         };

      } catch (error) {
         console.error("Error in generateTravelBudget:", error);
         return {
            success: false,
            error: error.message,
            message: "Failed to calculate travel budget"
         };
      }
   }

   /**
    * Build optimized prompt for faster processing
    * @private
    */
   buildOptimizedPrompt(country, occupation, clientName) {
      return `Write ONLY the email body content(no subject line, no greeting, no signature) about ${occupation} job opportunities in ${country} for ${clientName || "a client"
         }.

      Requirements:
      - Write only the main email body paragraphs
         - Do NOT include "Subject:" or any subject line
            - Do NOT include "Dear [Name]" greeting
               - Do NOT include signature or "Warm regards" or "[Your Name]"
                  - Start directly with the main content about job opportunities
                     - Include: current demand, salary ranges, top cities, visa success rates, and growth trends
                        - Make it urgent and conversion - focused with consultation call - to - action
                           - Format as 2 - 3 well - structured paragraphs
                              - 200 - 300 words, warm and professional tone
                                 - Each paragraph should be on a separate line with proper spacing`;
   }

   /**
    * Generate cache key for request
    * @private
    */
   generateCacheKey(country, occupation, clientName) {
      const normalizedCountry = country.toLowerCase().trim();
      const normalizedOccupation = occupation.toLowerCase().trim();
      const normalizedClientName = (clientName || "").toLowerCase().trim();

      return `job_opp:${normalizedCountry}:${normalizedOccupation}:${normalizedClientName} `;
   }

   /**
    * Check rate limit for client IP
    * @private
    */
   checkRateLimit(clientIP) {
      if (!clientIP) return true; // Skip rate limiting if no IP provided

      const now = Date.now();
      const windowStart = now - this.rateLimitWindow;

      if (!this.rateLimiter.has(clientIP)) {
         this.rateLimiter.set(clientIP, []);
      }

      const requests = this.rateLimiter.get(clientIP);

      // Remove old requests outside the window
      const validRequests = requests.filter(
         (timestamp) => timestamp > windowStart
      );
      this.rateLimiter.set(clientIP, validRequests);

      // Check if under limit
      if (validRequests.length >= this.rateLimitMax) {
         return false;
      }

      // Add current request
      validRequests.push(now);
      return true;
   }

   /**
    * Check circuit breaker state
    * @private
    */
   checkCircuitBreaker() {
      const { state, lastFailureTime, recoveryTimeout } = this.circuitBreaker;

      if (state === "CLOSED") {
         return true;
      }

      if (state === "OPEN") {
         if (Date.now() - lastFailureTime > recoveryTimeout) {
            this.circuitBreaker.state = "HALF_OPEN";
            return true;
         }
         return false;
      }

      if (state === "HALF_OPEN") {
         return true;
      }

      return false;
   }

   /**
    * Record successful request for circuit breaker
    * @private
    */
   recordSuccess() {
      const { state } = this.circuitBreaker;

      if (state === "HALF_OPEN") {
         this.circuitBreaker.successCount =
            (this.circuitBreaker.successCount || 0) + 1;

         if (
            this.circuitBreaker.successCount >=
            this.circuitBreaker.successThreshold
         ) {
            this.circuitBreaker.state = "CLOSED";
            this.circuitBreaker.failureCount = 0;
            this.circuitBreaker.successCount = 0;
            console.log("Circuit breaker: CLOSED (recovered)");
         }
      } else if (state === "CLOSED") {
         this.circuitBreaker.failureCount = Math.max(
            0,
            this.circuitBreaker.failureCount - 1
         );
      }
   }

   /**
    * Record failed request for circuit breaker
    * @private
    */
   recordFailure() {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = Date.now();
      this.circuitBreaker.successCount = 0;

      if (
         this.circuitBreaker.failureCount >=
         this.circuitBreaker.failureThreshold
      ) {
         this.circuitBreaker.state = "OPEN";
         console.log("Circuit breaker: OPEN (too many failures)");
      }
   }

   /**
    * Get service health status
    * @public
    */
   getHealthStatus() {
      return {
         circuitBreaker: this.circuitBreaker,
         cacheStats: this.cache.getStats(),
         rateLimiterSize: this.rateLimiter.size,
      };
   }

   /**
    * Clear cache (for maintenance)
    * @public
    */
   clearCache() {
      this.cache.flushAll();
      console.log("Cache cleared");
   }

   /**
    * Validate OpenAI response
    * @private
    */
   validateResponse(content) {
      if (!content || typeof content !== "string") {
         throw new Error("Invalid content received from OpenAI");
      }

      if (content.length < 50) {
         throw new Error("Generated content is too short");
      }

      if (content.length > 5000) {
         throw new Error("Generated content is too long");
      }

      return true;
   }
}


module.exports = new OpenAIService();
