/**
 * TypeScript interfaces for Global Opportunities Report
 * These types define the structure for all report data
 * Used by both mock data and AI-generated content
 */
export interface ReportMeta {
    country: string;
    userName: string;
    generatedDate: string;
    reportVersion: string;
}
export interface CoverPageData {
    title: string;
    subtitle: string;
}
export interface VisaPathwayBrief {
    name: string;
    subclass: string;
    description: string;
}
export interface ExecutiveSummaryData {
    purpose: string;
    topVisaPathways: VisaPathwayBrief[];
    whyAustralia?: string[];
    keyHighlights?: string[];
    profileStrengths?: string[];
    marketTrends?: string;
}
export interface AnzscoCodeDetail {
    code: string;
    title: string;
    description: string;
    keyResponsibilities?: string[];
    skillsRequired?: string[];
}
export interface SkillsAssessmentInfo {
    authority: string;
    process: string;
    timeline: string;
    requirements: string[];
}
export interface ProfessionalProfileData {
    primaryOccupation: string;
    anzscoCode: string;
    profileDescription: string;
    unitGroup: string;
    alternativeCodes: string;
    skillLevel: string;
    anzscoDetails?: AnzscoCodeDetail[];
    skillsAssessment?: SkillsAssessmentInfo;
    occupationCeiling?: string;
    labourMarketInfo?: string;
}
export interface VisaRequirement {
    label: string;
    value: string;
}
export interface VisaPathwayDetail {
    name: string;
    subclass: string;
    pointsRequirement: string;
    ageRequirement: string;
    employerSponsorship: string;
    stateSponsorship: string;
    keyRequirements: string[];
    processingTime: string;
    pathway: string;
    whySuitable: string;
    additionalInfo?: string;
    keyStates?: string[];
    regionalRequirements?: string;
    duration?: string;
    prPathway?: string;
    keyAdvantage?: string;
}
export interface VisaPathwaysData {
    conceptOverview: string;
    pathways: VisaPathwayDetail[];
}
export interface SkillMappingRow {
    skill: string;
    anzscoCategory: string;
    demandLevel: string;
}
export interface OccupationListItem {
    listName: string;
    occupations: string[];
}
export interface StateListItem {
    state: string;
    status: string;
}
export interface SkillDemandData {
    primaryOccupationCode: string;
    skillMappingTable: SkillMappingRow[];
    occupationLists: OccupationListItem[];
    statePriorityLists: StateListItem[];
    availabilityNote: string;
}
export interface Company {
    name: string;
    location: string;
    description: string;
}
export interface EmployerTier {
    tierName: string;
    tierDescription: string;
    companies: Company[];
}
export interface TopEmployersData {
    tiers: EmployerTier[];
    whyTheseCompanies: {
        activelyHiring: string;
        sponsorMigrants: string;
        growthTrajectory: string;
        yourFit: string;
        learningOpportunity: string;
    };
}
export interface Citysalary {
    midLevelRoleName: string;
    seniorLevelRoleName: string;
    cityName: string;
    midLevelRange: string;
    seniorLevelRange: string;
    premium?: string;
    costOfLiving: string;
    additionalNotes?: string;
    nicheOpportunity?: string;
    yourAdvantage?: string;
    techHub?: string;
    taxRate: string;
    takeHomeSalary: string;
    housingCost?: string;
    qualityOfLife?: string;
}
export interface SalaryVariationData {
    roleName: string;
    cities: Citysalary[];
}
export interface TimelinePhase {
    phaseName: string;
    duration: string;
    steps: string[];
}
export interface TimelineData {
    pathwayName?: string;
    phases: TimelinePhase[];
    totalTimeline: string;
    optimisticTimeline: string;
    pessimisticTimeline: string;
}
export interface RegulatoryAdvisorData {
    sectionTitle: string;
    maraNumber?: string;
    agentCredentials?: string[];
    successRate?: string;
    yearsOfExperience?: string;
    whatIsMara: {
        heading: string;
        items: string[];
    };
    whyRegulatedAgentsMatter: {
        heading: string;
        reasons: Array<{
            title: string;
            description: string;
        }>;
    };
    whatMaraAgentDoes: {
        heading: string;
        services: string[];
    };
}
export interface ThankYouPageData {
    heading: string;
    thankYouMessage: string;
    aboutWorldVisa: string;
    services: string[];
    successStats?: {
        yearsOfExperience: string;
        clientsServed: string;
        successRate: string;
    };
    contactInfo: {
        email: string;
        phone: string;
        website: string;
        office?: string;
    };
    socialMedia: string[];
    ctaButton: {
        text: string;
        link: string;
    };
    footer: {
        companyTagline: string;
        copyright: string;
    };
}
export interface AustraliaReportData {
    meta: ReportMeta;
    coverPage: CoverPageData;
    executiveSummary: ExecutiveSummaryData;
    professionalProfile: ProfessionalProfileData;
    visaPathways: VisaPathwaysData;
    skillDemand: SkillDemandData;
    topEmployers: TopEmployersData;
    salaryVariation: SalaryVariationData;
}
export interface TocItem {
    sectionNumber: string;
    title: string;
    pageNumber: number;
}
export interface CanadaExecutiveSummaryData {
    purpose: string;
    whyCanada: string;
    topProvinces: ProvinceRecommendation[];
    riskReward: RiskRewardRow[];
}
export interface ProvinceRecommendation {
    rank: number;
    province: string;
    pathway: string;
    crsAdvantage: string;
    jobDemand: string;
    costOfLiving: string;
    recommendation: string;
}
export interface RiskRewardRow {
    factor: string;
    riskLevel: string;
    rewardLevel: string;
    mitigation: string;
}
export interface CanadaProfessionalProfileData {
    nocCodes: NOCCodeMapping[];
    experienceMetrics: ExperienceMetrics;
}
export interface NOCCodeMapping {
    type: 'Primary' | 'Secondary';
    code: string;
    title: string;
    definition: string;
    alignment: string[];
    credentialMatch: string[];
}
export interface ExperienceMetrics {
    totalYears: string;
    currentRole: string;
    seniorityLevel: string;
    age: string;
    ageAdvantage: string;
    crsAdvantage: string;
}
export interface NoJobOfferData {
    conceptOverview: string;
    visaCategories: CanadaVisaCategory[];
    comparativeSummary: PathwayComparison[];
}
export interface CanadaVisaCategory {
    name: string;
    type: 'Primary' | 'Secondary';
    description: string;
    estimatedCRS?: CRSBreakdown;
    cutOffScores?: string;
    improvements?: CRSImprovement[];
    options?: PNPOption[];
}
export interface CRSBreakdown {
    age: number;
    education: number;
    language: number;
    workExperience: number;
    spouse: number;
    subtotal: number;
}
export interface CRSImprovement {
    action: string;
    boost: string;
}
export interface PNPOption {
    name: string;
    province: string;
    details: string[];
    crsBonus: string;
    advantages: string[];
    process: string[];
    timeline: string;
    disadvantages?: string[];
}
export interface PathwayComparison {
    pathway: string;
    timeline: string;
    ease: string;
    jobOfferRequired: string;
    cost: string;
    longTermPR: string;
    recommendation: string;
}
export interface NoSponsorData {
    concept: string;
    selfSponsoredRoutes: SelfSponsoredRoute[];
    matrix: SponsorMatrix[];
    settlementPathway: SettlementPathway;
}
export interface SelfSponsoredRoute {
    route: string;
    sponsorRequired: string;
    jobOfferRequired: string;
    viability: string;
}
export interface SponsorMatrix {
    option: string;
    type: string;
    details: string;
}
export interface SettlementPathway {
    stages: SettlementStage[];
}
export interface SettlementStage {
    stage: string;
    duration: string;
    status: string;
}
export interface CanadaSkillDemandData {
    skillMapping: SkillNOCMapping[];
    shortageListInfo: string;
    jobVacancyData: string[];
    demandByProvince: ProvinceDemand[];
    provinceContexts: ProvinceContext[];
}
export interface SkillNOCMapping {
    skill: string;
    noc21231: string;
    noc21234: string;
    weightInMarket: string;
}
export interface ProvinceDemand {
    province: string;
    noc21231: string;
    noc21234: string;
    overallDemand: string;
    jobs: string;
    growth: string;
}
export interface ProvinceContext {
    province: string;
    city: string;
    techHubStatus: string;
    companies: string[];
    salaryRange: string;
    jobOpenings: string;
    visaTechEmployers: string;
    costOfLiving?: string;
}
export interface CanadaTopEmployersData {
    provinces: ProvinceEmployers[];
}
export interface ProvinceEmployers {
    province: string;
    city: string;
    employers: EmployerDetail[];
}
export interface EmployerDetail {
    rank: number;
    company: string;
    industry: string;
    salary: string;
    visaSponsorship: string;
    whyHireYou: string;
}
export interface CanadaSalaryVariationData {
    cities: CitySalaryComparison[];
    recommendation: CityRecommendation;
}
export interface CitySalaryComparison {
    city: string;
    factors: SalaryFactor[];
}
export interface SalaryFactor {
    factor: string;
    toronto: string;
    vancouver: string;
    montreal: string;
    winner: string;
}
export interface CityRecommendation {
    priorities: CityPriority[];
}
export interface CityPriority {
    priority: string;
    toronto: string;
    vancouver: string;
    montreal: string;
}
export interface CanadaVisaPathwaysData {
    overview: VisaRouteOverview[];
    eligibilitySnapshot: EligibilityRow[];
    crsScoring: CRSScoring;
    statusComparison: StatusComparison[];
}
export interface VisaRouteOverview {
    route: string;
    type: string;
    processingTime: string;
    jobOffer: string;
    prTimeline: string;
    cost: string;
    recommendation: string;
}
export interface EligibilityRow {
    criterion: string;
    requirement: string;
    yourProfile: string;
    status: string;
}
export interface CRSScoring {
    breakdown: string;
    scenarios: CRSScenario[];
    improvements: CRSImprovement[];
    bestStrategy: string;
}
export interface CRSScenario {
    scenario: string;
    points: string;
    competitive: string;
}
export interface StatusComparison {
    status: string;
    processing: string;
    duration: string;
    workPermit: string;
    changeJobs: string;
    prPathway: string;
    recommendation: string;
}
export interface AboutWorldVisaData {
    prVisa: string;
    workVisa: string;
}
export interface WorldVisaTimelineData {
    phases: WorldVisaTimelinePhase[];
}
export interface WorldVisaTimelinePhase {
    name: string;
    duration: string;
    steps: string[];
}
export interface CanadaReportData {
    meta: ReportMeta;
    coverPage: CoverPageData;
    executiveSummary: CanadaExecutiveSummaryData;
    professionalProfile: CanadaProfessionalProfileData;
    noJobOffer: NoJobOfferData;
    noSponsor: NoSponsorData;
    skillDemand: CanadaSkillDemandData;
    topEmployers: CanadaTopEmployersData;
    salaryVariation: CanadaSalaryVariationData;
    visaPathways: CanadaVisaPathwaysData;
    thankYou: ThankYouPageData;
}
export interface GermanyExecutiveSummaryData {
    purpose: string;
    globalMobility: {
        keyAdvantages: string[];
    };
    topCities: TopGermanCity[];
}
export interface TopGermanCity {
    rank: number;
    city: string;
    techHub: string;
    jobDemand: string;
    salaryRange: string;
    recommendation: string;
}
export interface GermanyProfessionalProfileData {
    coreSkills: {
        primaryRole: {
            title: string;
            responsibilities: string[];
        };
        secondaryRole: {
            title: string;
            responsibilities: string[];
        };
        verdict: string;
    };
    experience: ExperienceLevel[];
    languageAndEducation: {
        englishProficiency: LanguageProficiency[];
        germanNote: string;
        education: EducationQualification[];
    };
}
export interface ExperienceLevel {
    metric: string;
    yourProfile: string;
}
export interface LanguageProficiency {
    requirement: string;
    status: string;
    actionNeeded: string;
}
export interface EducationQualification {
    qualification: string;
    details: string;
    germanyRecognition: string;
    status: string;
}
export interface GermanyVisaCategoriesData {
    conceptOverview: string;
    opportunityCard: {
        title: string;
        description: string;
        advantages: string[];
        successProbability: string;
    };
    euBlueCard: {
        title: string;
        description: string;
        advantages: string[];
        successProbability: string;
    };
}
export interface GermanySkillDemandData {
    skillMapping: GermanySkillMap[];
    techShortage: {
        description: string;
        marketFacts: string[];
        conclusion: string;
    };
    demandByCity: GermanyCityDemand[];
}
export interface GermanySkillMap {
    skill: string;
    marketDemand: string;
    salaryImpact: string;
    shortageStatus: string;
}
export interface GermanyCityDemand {
    city: string;
    techMarket: string;
    jobOpportunities: string;
    salaryRange: string;
    type: string;
}
export interface CityJobData {
    name: string;
    jobTitles: string[];
    specializedRoles?: string[];
    targetCompanies: string[];
    advantage?: string;
}
export interface GermanyJobOpportunitiesData {
    cities: Record<string, CityJobData>;
    keyIndustries: GermanyIndustry[];
}
export interface GermanyIndustry {
    industry: string;
    demand: string;
    growth: string;
    exampleCompanies: string;
    yourFit: string;
}
export interface GermanyCompensationData {
    salaryRanges: GermanySalaryRange[];
    cityComparison: GermanyCityComparison[];
}
export interface GermanySalaryRange {
    level: string;
    location: string;
    eurAnnual: string;
    inrEquivalent: string;
}
export interface GermanyCityComparison {
    factor: string;
    berlin: string;
    munich: string;
    frankfurt: string;
    winner: string;
}
export interface GermanyReportData {
    meta: ReportMeta;
    coverPage: CoverPageData;
    executiveSummary: GermanyExecutiveSummaryData;
    professionalProfile: GermanyProfessionalProfileData;
    visaCategories: GermanyVisaCategoriesData;
    skillDemand: GermanySkillDemandData;
    jobOpportunities: GermanyJobOpportunitiesData;
    compensation: GermanyCompensationData;
    thankYou: ThankYouPageData;
}
