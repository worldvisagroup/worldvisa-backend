const mockAiProfileSummaryTable = '| Field | Value |\n' +
  '|-------|-------|\n' +
  '| Client Name | John Doe |\n' +
  '| Date of Birth / Age | 01/01/1990 / 34 |\n' +
  '| Nationality | Indian |\n' +
  '| Marital Status | Married |\n' +
  '| Primary Occupation | Software Engineer |\n' +
  '| ANZSCO Code | 261313 |\n' +
  '| Assessing Authority | ACS |\n' +
  '| Total Experience | 8 years |\n' +
  '| Current Employer | Tech Solutions Pty Ltd |\n' +
  '| Target Country | Australia |\n' +
  '| Report Date | 2024-06-01 |\n';


const mockProfileSummarySnapshots = [
  "- Bachelor's in Computer Science, 5 years IT experience",
  '- IELTS 8 in each band, ACS positive skills assessment',
  '- Partner has competent English, no medical/criminal issues',
  '- Skilled in Java, Python, and cloud computing',
  '- Worked as a software developer and team lead',
  '- No health or character concerns in personal history'
];

const prPathwayTable = `| PR Pathway        | Visa Subclass / Stream | Core Eligibility Met? |
|-------------------|------------------------|-----------------------|
| Skilled Independent | Subclass 189 | Yes |
| State Nominated | Subclass 190 | No |`;

const prPathwayEligibilityTableData = `| Component | Description | Points |
|-----------|-------------|--------|
| Age | 30-34 years | 25 |
| English Language Proficiency | Competent English | 0 |
| Skilled Employment | 3-5 years | 5 |`;

const prPathwayTotalPointsByVisaSubclass = `| Visa Subclass | Description | Total Points |
|---------------|-------------|--------------|
| 189           | Skilled Independent visa | 65 points |
| 190           | Skilled Nominated visa (State/Territory) | 70 points |
| 491           | Skilled Work Regional (Provisional) visa | 70 points |`;

const prPathwayInterpretations = [
  "- Master's in Business Administration from Australia, 3 years' relevant work experience",
  '- Proficient in English (overall 7 in IELTS)',
  '- Positive skills assessment for Management occupation',
  '- Partner has competent English (overall 6 in IELTS)',
  '- Clear medical and criminal record'
];

const crossStateNominationTableData = `| State / Territory | Current Status | Competitiveness | Key Sectors (Software Engineering – ANZSCO 261313) |
|-------------------|----------------|-----------------|--------------------------------------------------|
| NSW               | Open           | High            | Technology, Financial Services, Telecommunications |
| VIC               | Open           | High            | Information Technology, Healthcare, Education |
| QLD               | Open           | Moderate        | Mining, Agriculture, Tourism |
| SA                | Open           | Moderate        | Defense, Health, Energy |
| WA                | Open           | Moderate        | Mining, Energy, Construction |
| TAS               | Open           | Low-Moderate    | Tourism, Agriculture, Aquaculture |
| NT                | Open           | Low-Moderate    | Mining, Construction, Government |
| ACT               | Open           | High            | Information Technology, Government, Education |`;

const aiPrLabourMarketOutlookByRegionData = `| Region           | Demand Level        | Typical Job Titles        | Key Industries                  | Hiring Channels        |
|------------------|---------------------|---------------------------|---------------------------------|------------------------|
| New South Wales  | High                | Software Engineer, DevOps Engineer | Technology, Finance, Healthcare | Online job portals, Networking events |
| Victoria         | High                | Full Stack Developer, Software Developer | Technology, Education, Retail | Company career pages, Referrals |
| Queensland       | Moderate            | Frontend Developer, Backend Developer | Technology, Mining, Tourism | Recruitment agencies, Social media |
| South Australia  | Moderate            | Software Architect, Systems Analyst | Technology, Defence, Manufacturing | Job boards, Industry events |
| Western Australia| Moderate            | Cloud Engineer, Data Engineer | Technology, Mining, Energy | Direct applications, Professional networks |
| Tasmania         | Low                 | Junior Software Engineer, IT Support | Technology, Agriculture, Tourism | Internship programs, University career fairs |
| Northern Territory| Low                | Mobile App Developer, Embedded Systems Engineer | Technology, Government, Construction | Local job boards, Community referrals |
| ACT              | High                | Machine Learning Engineer, Cybersecurity Analyst | Technology, Government, Research | Graduate programs, Tech conferences |`;

const aiPrSalaryBenchmarkData = `| Region | Start (P25) | Median (P50) | Top (P75/P90) | Source / Year |
|--------|-------------|--------------|---------------|---------------|
| NSW    | 85,000      | 115,000      | 145,000       | Hays 2025     |
| VIC    | 82,000      | 112,000      | 140,000       | SEEK 2025     |
| QLD    | 78,000      | 108,000      | 135,000       | Hays 2025     |
| SA     | 76,000      | 105,000      | 130,000       | Indeed 2025   |
| WA     | 82,000      | 118,000      | 145,000       | SEEK 2025     |
| TAS    | 70,000      | 92,000       | 115,000       | JobOutlook 2025 |
| NT     | 75,000      | 98,000       | 120,000       | Territory Jobs 2025`;

const aiPrStepByStepPlanAndSlaData = `| Step | Action | Owner | Prerequisites / Docs | ETA |
|------|--------|-------|---------------------|-----|
| 1 | Obtain Positive Skills Assessment from ACS | Client | Degree certificate, Employment references, CV | 2-3 months |
| 2 | Take English Language Test (e.g., IELTS) | Client | Test booking, Identification documents | 1 month |
| 3 | Submit Expression of Interest (EOI) in SkillSelect | Client | Skills assessment, English test results | 1 week |
| 4 | Receive State Nomination (if applicable) | World Visa | State Nomination application, EOI | 1-3 months |
| 5 | Lodge Visa Application (Subclass 189 or 190) | World Visa | Health check, Character clearance, Financial documents | 6-9 months |`;

const aiPrRiskRegisterMitigationsData = `| Risk                                      | Likelihood | Impact   | Mitigation                                                                 |
|-------------------------------------------|------------|----------|---------------------------------------------------------------------------|
| Delay in ACS skills assessment             | High       | Severe   | Submit a complete and accurate application to avoid unnecessary delays.  |
| Insufficient English language proficiency  | Medium     | Moderate | Prepare and practice well for the language proficiency tests in advance.  |
| State nomination quota restrictions        | Medium     | Moderate | Research and understand the specific requirements and timelines of each state. |
| Changes in immigration policies            | Low        | Severe   | Stay updated with the latest immigration news and seek professional advice. |`;

const aiPrOutcomeForecastData = [
  '- Best Case: Subclass 190 nomination (NSW/VIC) → PR in 9–12 months.',
  '- Base Case: Subclass 491 nomination (SA/TAS) → regional work → PR after 3 years.',
  '- Conservative Case: Assessment or nomination delays → 12–18 months overall.',
  '- Recommendation: Proceed immediately with ACS assessment and maintain parallel EOIs for 189, 190 & 491.'
];

const allSectionsData = {
  "profileSummaryTable": { title: "Profile Summary", content: mockAiProfileSummaryTable },
  "profileSummarySnapshots": { title: "Snapshot", content: mockProfileSummarySnapshots },
  "prPathwayTable": { title: "PR Pathways Considered (Australia)", content: prPathwayTable },
  "prPathwayEligibilityTable": { title: "Points Eligibility Computation (Australia SkillSelect)", subheading: "Points Breakdown by Component", content: prPathwayEligibilityTableData },
  "prPathwayTotalPointsByVisaSubclass": {
    title: "Total Points by Visa Subclass",
    content: prPathwayTotalPointsByVisaSubclass
  },
  "crossStateNominationMatrix": {
    title: "Cross-State Nomination Matrix (All 8 Australian States & Territories)",
    content: crossStateNominationTableData
  },
  "prPathwayInterpretation": {
    title: "Interpretation",
    content: prPathwayInterpretations
  },
  "labourMarketOutlookByRegion": {
    title: "Labour Market Outlook (by Region)",
    content: aiPrLabourMarketOutlookByRegionData
  },
  "salaryBenchmarks": {
    title: "Salary Benchmarks (Annual – AUD)",
    content: aiPrSalaryBenchmarkData
  },
  "stepByStepPlanAndSLA": {
    title: "Step-by-Step Plan & SLA",
    content: aiPrStepByStepPlanAndSlaData
  },
  "riskRegisterMitigations": {
    title: "Risk Register & Mitigations",
    content: aiPrRiskRegisterMitigationsData
  },
  "outcomeForecast": {
    title: "Outcome Forecast",
    content: aiPrOutcomeForecastData
  },
  "whyMaraAdvantage": {
    title: "Why Choose a MARA-Registered Migration Agent",
    content: "When your visa shapes your future, trust only those legally authorised to guide it. A MARA-registered agent brings legal precision, accountability, and expertise — not guesswork."
  },
  "legalAuthorityAccountability": {
    title: "Legal Authority & Accountability",
    content: "Only MARA agents can lawfully provide migration advice in Australia. They’re trained in migration law, licensed by the Migration Agents Registration Authority, and answerable under Australian law for every recommendation made."
  },
  "upToDateExpertise": {
    title: "Up-to-Date Expertise",
    content: "MARA agents complete mandatory annual training (CPD) to stay current on migration legislation, visa policies, and program updates — ensuring every application meets the latest compliance standards."
  },
  "riskMitigation": {
    title: "Risk Mitigation & Success",
    content: [
      '- Selecting the right visa subclass',
      '- Ensuring accurate and complete documentation',
      '- Timing applications strategically',
      '- Representing clients when required'
    ]
  },
  "timeCostPeaceOfMind": {
    title: "Time, Cost & Peace of Mind",
    content: [
      "- Faster processing times",
      "- Higher success rates",
      "- Less stress and uncertainty",
      "- Savings from avoiding costly re-applications"
    ]
  },
  "maraSummary": {
    title: "In Summary",
    content: "A MARA-registered agent is your licensed legal expert, trusted advisor, and success partner — transforming your migration journey into a compliant, confident, and stress-free experience."
  },
  "worldVisaAdvantage": {
    title: "World Visa Advantage",
    content: "With 21 years of success, MARA-Registered Experts, and comprehensive documentation execution support, World Visa ensures your Australian PR journey is handled with legal accuracy, ethical integrity, and professional excellence — from ACS assessment to visa approval."
  },
};

module.exports = {
  mockAiProfileSummaryTable,
  mockProfileSummarySnapshots,
  prPathwayTable,
  prPathwayEligibilityTableData,
  prPathwayTotalPointsByVisaSubclass,
  prPathwayInterpretations,
  crossStateNominationTableData,
  aiPrLabourMarketOutlookByRegionData,
  aiPrSalaryBenchmarkData,
  aiPrStepByStepPlanAndSlaData,
  aiPrRiskRegisterMitigationsData,
  aiPrOutcomeForecastData,
  allSectionsData,
};