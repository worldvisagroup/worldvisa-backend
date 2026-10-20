import {
  createLead as createZohoLead,
  getRecordById,
  searchRecordByEmail,
  searchRecordByPhone,
  updateRecord as updateZohoRecord,
} from './zohoLeadService';
import { MigratedLeadEntity } from '../sample-data/zoho-lead-schema';

const logger = require('../utils/logger');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LandingTracking {
  leadSource?: string;
  pageUrl?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
}

export interface LandingGeoInfo {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface LandingCapturePayload {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  countryCode?: string;
  nationalNumber?: string;
  targetCountry?: string;
  tracking?: LandingTracking;
  geoInfo?: LandingGeoInfo;
}

export interface RawAssessmentAnswers {
  country?: string;
  highestQualification?: string;
  indianWorkExperience?: string;
  overseasWorkExperience?: string;
  englishAbility?: string;
  germanAbility?: string;
  maritalStatus?: string;
  spouseQualification?: string;
  spouseWorkExperience?: string;
  spouseEnglishAbility?: string;
  spouseGermanAbility?: string;
  [key: string]: any;
}

export interface LandingAssessmentPayload {
  leadId?: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  targetCountry?: string;
  totalPoints?: number;
  threshold?: number;
  isEligible?: boolean;
  leadStatus?: string;
  rawAnswers?: RawAssessmentAnswers;
  mappedZohoFields?: Record<string, any>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Determine Lead_Source for landing pages based on campaign & UTM parameters:
 * 1. 'Facebook Ads': If fbclid exists or any UTM field references Facebook, Meta, or Instagram.
 * 2. 'Google Ads': If gclid exists or UTM fields reference Google / other campaign parameters.
 * 3. 'WebSite Visit': Direct or organic website visit without ad tracking parameters.
 */
export function determineLandingLeadSource(params: {
  leadSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
}): string {
  const explicit = params.leadSource?.toLowerCase().trim() || '';
  const source = params.utmSource?.toLowerCase().trim() || '';
  const medium = params.utmMedium?.toLowerCase().trim() || '';
  const campaign = params.utmCampaign?.toLowerCase().trim() || '';
  const term = params.utmTerm?.toLowerCase().trim() || '';
  const gclid = params.gclid?.trim() || '';
  const fbclid = params.fbclid?.trim() || '';

  const allText = `${explicit} ${source} ${medium} ${campaign} ${term}`;

  const isMeta =
    Boolean(fbclid) ||
    allText.includes('facebook') ||
    allText.includes('meta') ||
    allText.includes('instagram') ||
    /\b(fb|ig)\b/i.test(source) ||
    /\b(fb|ig)\b/i.test(medium) ||
    /\b(fb|ig)\b/i.test(campaign);

  if (isMeta) {
    return 'Facebook Ads';
  }

  const isGoogle =
    Boolean(gclid) ||
    allText.includes('google') ||
    allText.includes('adwords') ||
    allText.includes('gads');

  if (isGoogle) {
    return 'Google Ads';
  }

  const hasAnyUtm = Boolean(source || medium || campaign || term);
  if (hasAnyUtm) {
    return 'Google Ads';
  }

  return 'WebSite Visit';
}

/**
 * Normalizes phone inputs into standardized E.164 Mobile and national Phone number.
 */
function normalizePhone(data: {
  phone?: string;
  nationalNumber?: string;
  countryCode?: string;
}) {
  const rawNational = (data.nationalNumber || '').replace(/\D/g, '');
  const rawPhone = (data.phone || '').trim();

  let countryCode = (data.countryCode || '').trim();
  let nationalNumber = rawNational;

  if (!nationalNumber) {
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      countryCode = '+91';
      nationalNumber = digitsOnly.slice(2);
    } else if (digitsOnly.length > 10 && rawPhone.startsWith('+')) {
      nationalNumber = digitsOnly.slice(-10);
      countryCode = `+${digitsOnly.slice(0, digitsOnly.length - 10)}`;
    } else {
      nationalNumber = digitsOnly;
      if (!countryCode) countryCode = '+91';
    }
  }

  if (countryCode && !countryCode.startsWith('+')) {
    countryCode = `+${countryCode}`;
  }
  if (!countryCode) {
    countryCode = '+91';
  }

  const mobile = `${countryCode}${nationalNumber}`;
  const phone = nationalNumber;

  return { mobile, phone, countryCode };
}

/**
 * Extracts and formats First Name and Last Name.
 */
function extractNames(data: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
}) {
  let firstName = (data.firstName || '').trim();
  let lastName = (data.lastName || '').trim();
  const fullName = (data.fullName || '').trim();

  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts[0] || 'Applicant';
    lastName = parts.slice(1).join(' ') || lastName || 'Applicant';
  }

  if (!firstName) firstName = 'Applicant';
  if (!lastName) lastName = 'Applicant';

  const resolvedFullName = fullName || `${firstName} ${lastName}`.trim();

  return { firstName, lastName, fullName: resolvedFullName };
}

/**
 * Maps frontend highestQualification to exact Zoho CRM education picklist values.
 * Reference: MigratedLeadEntity.education
 */
function mapEducationToZoho(qualification?: string): string {
  if (!qualification) return '';
  switch (qualification.toLowerCase().trim()) {
    case 'doctoral':
      return 'Doctoral Level';
    case 'masters':
      return "Master's Level or Professional Degree";
    case 'dual_degree':
      return 'Two or more post-secondary credentials, one of which is a three-year or longer post-secondary credential';
    case 'bachelors':
      return 'Three-year or longer post-secondary credential';
    case 'diploma_3':
      return 'Three-year or longer post-secondary credential';
    case 'diploma_2':
      return 'Two-year post-secondary credential';
    case 'diploma_1':
      return 'One-year post-secondary credential';
    case 'vocational':
      return 'Secondary school';
    default:
      return qualification;
  }
}

/**
 * Maps spouse qualification to exact Zoho CRM spouse_education picklist values.
 * Reference: MigratedLeadEntity.spouse_education
 */
function mapSpouseEducationToZoho(qualification?: string): string {
  if (!qualification) return '';
  switch (qualification.toLowerCase().trim()) {
    case 'doctoral':
      return 'Doctoral Level';
    case 'masters':
      return 'Masters Degree';
    case 'dual_degree':
      return 'Dual Degrees';
    case 'bachelors':
      return 'Bachelor Degree';
    case 'diploma_3':
      return 'Three Year Diploma';
    case 'diploma_2':
      return 'Two Year Diploma/Post Secondary';
    case 'diploma_1':
      return 'One Year Diploma/Post Secondary';
    case 'vocational':
      return 'Secondary school';
    default:
      return qualification;
  }
}

/**
 * Maps frontend englishAbility string to exact Zoho CRM english_language_ability picklist.
 * Reference: MigratedLeadEntity.english_language_ability: 'Expert' | 'Proficient' | 'Competent' | 'Basic'
 */
function mapEnglishAbility(ability?: string): string {
  if (!ability) return '';
  switch (ability.toLowerCase().trim()) {
    case 'expert':
      return 'Expert';
    case 'proficient':
      return 'Proficient';
    case 'competent':
      return 'Competent';
    case 'basic':
      return 'Basic';
    default:
      return ability;
  }
}

/**
 * Maps frontend marital status to exact Zoho CRM marital_status picklist.
 * Reference: MigratedLeadEntity.marital_status: 'Married' | 'Un-married' | 'Divorced / Separated'
 */
function mapMaritalStatus(status?: string): string {
  if (!status) return '';
  switch (status.toLowerCase().trim()) {
    case 'married':
      return 'Married';
    case 'unmarried':
    case 'single':
      return 'Un-married';
    case 'divorced':
    case 'separated':
      return 'Divorced / Separated';
    default:
      return status;
  }
}

/**
 * Parse experience string (e.g. "5", "8+") into integer.
 */
function parseExperience(exp?: string | number): number {
  if (exp === undefined || exp === null) return 0;
  if (typeof exp === 'number') return exp;
  const match = String(exp).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * Stage 1: Capture initial lead directly into Zoho CRM.
 * Checks if lead exists in Zoho CRM (by phone or email).
 * - If exists: Updates only empty / blank fields, preserving established values.
 * - If new: Creates a new Lead in Zoho CRM.
 */
export async function captureLandingLead(payload: LandingCapturePayload) {
  const email = (payload.email || '').toLowerCase().trim();
  if (!email) {
    throw new Error('Email is required');
  }

  const { mobile, phone, countryCode } = normalizePhone({
    phone: payload.phone,
    nationalNumber: payload.nationalNumber,
    countryCode: payload.countryCode,
  });

  if (!phone) {
    throw new Error('Phone number is required');
  }

  const { firstName, lastName, fullName } = extractNames({
    fullName: payload.fullName,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });

  const tracking = payload.tracking || {};
  const geoInfo = payload.geoInfo || {};

  const leadSource = determineLandingLeadSource({
    leadSource: tracking.leadSource,
    utmSource: tracking.utm_source,
    utmMedium: tracking.utm_medium,
    utmCampaign: tracking.utm_campaign,
    utmTerm: tracking.utm_term,
    gclid: tracking.gclid,
    fbclid: tracking.fbclid,
  });

  // ── Step 1: Search Zoho CRM for existing record by phone or email ──────────
  let existingRecord = await searchRecordByPhone('Leads', phone);
  let targetModule: 'Leads' | 'Contacts' = 'Leads';

  if (!existingRecord) {
    const existingContact = await searchRecordByPhone('Contacts', phone);
    if (existingContact) {
      existingRecord = existingContact;
      targetModule = 'Contacts';
    }
  }

  if (!existingRecord && email) {
    const existingLeadByEmail = await searchRecordByEmail('Leads', email);
    if (existingLeadByEmail) {
      existingRecord = existingLeadByEmail;
      targetModule = 'Leads';
    } else {
      const existingContactByEmail = await searchRecordByEmail('Contacts', email);
      if (existingContactByEmail) {
        existingRecord = existingContactByEmail;
        targetModule = 'Contacts';
      }
    }
  }

  // ── Step 2A: Record Exists in Zoho → Update blank / missing fields ─────────
  if (existingRecord) {
    const recordId = String(existingRecord.id);
    const fullRecord = (await getRecordById(targetModule, recordId)) || existingRecord;

    const updateFields: Record<string, any> = {};

    // Only update fields that are currently blank in Zoho
    if (isBlank(fullRecord.Lead_Source)) updateFields.Lead_Source = leadSource;
    if (isBlank(fullRecord.Country_Code)) updateFields.Country_Code = countryCode;
    if (isBlank(fullRecord.Mobile)) updateFields.Mobile = mobile;
    if (isBlank(fullRecord.Phone)) updateFields.Phone = phone;

    if (isBlank(fullRecord.intended_Countrys) && payload.targetCountry) {
      updateFields.intended_Countrys = payload.targetCountry;
    }
    if (isBlank(fullRecord.Service_Required1)) {
      updateFields.Service_Required1 = 'Permanent Residency';
    }

    if (isBlank(fullRecord.GCLID) && tracking.gclid) updateFields.GCLID = tracking.gclid;
    if (isBlank(fullRecord.FBCLID) && tracking.fbclid) updateFields.FBCLID = tracking.fbclid;
    if (isBlank(fullRecord.UTM_Campaign_Name) && tracking.utm_campaign) {
      updateFields.UTM_Campaign_Name = tracking.utm_campaign;
    }
    if (isBlank(fullRecord.UTM_Medium) && tracking.utm_medium) updateFields.UTM_Medium = tracking.utm_medium;
    if (isBlank(fullRecord.UTM_Lead_Source) && tracking.utm_source) updateFields.UTM_Lead_Source = tracking.utm_source;
    if (isBlank(fullRecord.UTM_Term) && tracking.utm_term) updateFields.UTM_Term = tracking.utm_term;
    if (isBlank(fullRecord.UTM_Content) && tracking.utm_content) updateFields.UTM_Content = tracking.utm_content;

    if (isBlank(fullRecord.City) && geoInfo.city) updateFields.City = geoInfo.city;
    if (isBlank(fullRecord.State) && geoInfo.region) updateFields.State = geoInfo.region;
    if (isBlank(fullRecord.Country) && geoInfo.country) updateFields.Country = geoInfo.country;
    if (isBlank(fullRecord.IP_Address) && geoInfo.ip) updateFields.IP_Address = geoInfo.ip;

    if (tracking.pageUrl && (!fullRecord.Description || !fullRecord.Description.includes(tracking.pageUrl))) {
      updateFields.Description = fullRecord.Description
        ? `${fullRecord.Description}\nLanding Page: ${tracking.pageUrl}`
        : `Landing Page: ${tracking.pageUrl}`;
    }

    updateFields.Last_Activity_Time = new Date().toISOString();

    logger.info(`[Landing Lead] Updating existing ${targetModule} in Zoho CRM`, {
      recordId,
      phone,
      updatedFields: Object.keys(updateFields),
    });

    const updateResult = await updateZohoRecord(targetModule, recordId, updateFields);

    return {
      success: true,
      leadId: recordId,
      isNew: false,
      module: targetModule,
      message: 'Lead updated in Zoho CRM successfully',
      result: updateResult,
    };
  }

  // ── Step 2B: Record does NOT exist in Zoho → Create new Lead in Zoho CRM ───
  const newLeadData: Partial<MigratedLeadEntity> & Record<string, any> = {
    First_Name: firstName,
    Last_Name: lastName,
    Full_Name: fullName,
    Company: 'Individual',
    Email: email,
    Phone: phone,
    Mobile: mobile,
    Country_Code: countryCode,
    Lead_Source: leadSource,
    Lead_Status: 'New',
    Data_Source: 'Webform',
    intended_Countrys: payload.targetCountry || 'Australia',
    Service_Required1: 'Permanent Residency',
    Last_Activity_Time: new Date().toISOString(),
  };

  if (geoInfo.city) newLeadData.City = geoInfo.city;
  if (geoInfo.region) newLeadData.State = geoInfo.region;
  if (geoInfo.country) newLeadData.Country = geoInfo.country;
  if (geoInfo.ip) newLeadData.IP_Address = geoInfo.ip;

  if (tracking.gclid) newLeadData.GCLID = tracking.gclid;
  if (tracking.fbclid) newLeadData.FBCLID = tracking.fbclid;
  if (tracking.utm_campaign) newLeadData.UTM_Campaign_Name = tracking.utm_campaign;
  if (tracking.utm_medium) newLeadData.UTM_Medium = tracking.utm_medium;
  if (tracking.utm_source) newLeadData.UTM_Lead_Source = tracking.utm_source;
  if (tracking.utm_term) newLeadData.UTM_Term = tracking.utm_term;
  if (tracking.utm_content) newLeadData.UTM_Content = tracking.utm_content;
  if (tracking.pageUrl) newLeadData.Description = `Landing Page: ${tracking.pageUrl}`;

  logger.info('[Landing Lead] Creating new Lead in Zoho CRM', {
    phone,
    email,
    leadSource,
    targetCountry: newLeadData.intended_Countrys,
  });

  const createResult = await createZohoLead(newLeadData);
  const createdId = createResult?.details?.id || createResult?.id;

  if (!createdId) {
    throw new Error(`Failed to create Lead in Zoho CRM: ${JSON.stringify(createResult)}`);
  }

  return {
    success: true,
    leadId: String(createdId),
    isNew: true,
    message: 'Lead captured in Zoho CRM successfully',
    result: createResult,
  };
}

/**
 * Stage 2: Record assessment questionnaire results and qualification scores directly in Zoho CRM.
 */
export async function updateLandingAssessment(payload: LandingAssessmentPayload) {
  let existingRecord: Record<string, any> | null = null;
  let targetModule: 'Leads' | 'Contacts' = 'Leads';

  // 1. Search by leadId (Zoho ID) if provided
  if (payload.leadId) {
    existingRecord = await getRecordById('Leads', payload.leadId);
    if (!existingRecord) {
      existingRecord = await getRecordById('Contacts', payload.leadId);
      if (existingRecord) targetModule = 'Contacts';
    }
  }

  // 2. Fallback search by phone
  if (!existingRecord && payload.phone) {
    const rawDigits = payload.phone.replace(/\D/g, '');
    const nationalDigits = rawDigits.slice(-10);
    existingRecord = await searchRecordByPhone('Leads', nationalDigits);
    if (!existingRecord) {
      existingRecord = await searchRecordByPhone('Contacts', nationalDigits);
      if (existingRecord) targetModule = 'Contacts';
    }
  }

  // 3. Fallback search by email
  if (!existingRecord && payload.email) {
    const cleanEmail = payload.email.trim();
    existingRecord = await searchRecordByEmail('Leads', cleanEmail);
    if (!existingRecord) {
      existingRecord = await searchRecordByEmail('Contacts', cleanEmail);
      if (existingRecord) targetModule = 'Contacts';
    }
  }

  if (!existingRecord) {
    const error: any = new Error('Lead not found in Zoho CRM for the provided leadId, email, or phone');
    error.statusCode = 404;
    throw error;
  }

  const recordId = String(existingRecord.id);
  const rawAnswers = payload.rawAnswers || {};
  const isEligible = Boolean(payload.isEligible);
  const totalPoints = Number(payload.totalPoints) || 0;
  const leadStatus = payload.leadStatus || (isEligible ? 'Pre-Qualified' : 'Not Qualified');

  const updateFields: Record<string, any> = {
    Lead_Status: leadStatus,
    Last_Activity_Time: new Date().toISOString(),
  };

  // ── Map Questionnaire Answers to Zoho Schema ──────────────────────────────
  if (rawAnswers.highestQualification) {
    updateFields.education = mapEducationToZoho(rawAnswers.highestQualification);
  }

  if (rawAnswers.indianWorkExperience !== undefined) {
    updateFields.work_experience = parseExperience(rawAnswers.indianWorkExperience);
  }

  if (rawAnswers.overseasWorkExperience !== undefined) {
    updateFields.work_overseas_experience = parseExperience(rawAnswers.overseasWorkExperience);
  }

  if (rawAnswers.englishAbility) {
    updateFields.english_language_ability = mapEnglishAbility(rawAnswers.englishAbility);
  }

  if (rawAnswers.maritalStatus) {
    updateFields.marital_status = mapMaritalStatus(rawAnswers.maritalStatus);
  }

  // Spouse fields if married
  const isMarried = rawAnswers.maritalStatus?.toLowerCase() === 'married';
  if (isMarried) {
    if (rawAnswers.spouseQualification) {
      updateFields.spouse_education = mapSpouseEducationToZoho(rawAnswers.spouseQualification);
    }
    if (rawAnswers.spouseWorkExperience !== undefined) {
      updateFields.spouse_work_experience = parseExperience(rawAnswers.spouseWorkExperience);
    }
    if (rawAnswers.spouseEnglishAbility) {
      updateFields.spouse_english_language_ability = mapEnglishAbility(rawAnswers.spouseEnglishAbility);
    }
  }

  // German ability
  if (rawAnswers.germanAbility && rawAnswers.germanAbility.toLowerCase() !== 'none') {
    updateFields.Germany_Language = rawAnswers.germanAbility.toUpperCase();
  }

  // ── Overall Destination Points (Architecture Rule 1: No category breakdown) ─
  const country = (
    payload.targetCountry ||
    rawAnswers.country ||
    existingRecord.intended_Countrys ||
    ''
  ).toLowerCase();

  if (country.includes('australia')) {
    updateFields.total_points_australia = totalPoints;
    updateFields.Australian_Eligibility = isEligible;
    updateFields.Australia_Assesment_Report = true;
  } else if (country.includes('canada')) {
    updateFields.total_points_canada = totalPoints;
    updateFields.Canada_Eligibility = isEligible;
    updateFields.Assessment_Report_Canada = true;
  } else if (country.includes('germany')) {
    updateFields.Total_Points_Germany = totalPoints;
    updateFields.Assessment_Report_Germany = true;
  }

  // ── Readable summary appended to Description ──────────────────────────────
  const summaryLines = [
    '',
    '─── LANDING ASSESSMENT SUBMISSION ───',
    `Destination: ${payload.targetCountry || rawAnswers.country || existingRecord.intended_Countrys || 'General'}`,
    `Result: ${leadStatus} (Points: ${totalPoints})`,
    `Education: ${updateFields.education || rawAnswers.highestQualification || 'N/A'}`,
    `Work Exp: ${updateFields.work_experience ?? 'N/A'} yrs (Overseas: ${updateFields.work_overseas_experience ?? 0} yrs)`,
    `English: ${updateFields.english_language_ability || rawAnswers.englishAbility || 'N/A'}`,
    `Marital: ${updateFields.marital_status || rawAnswers.maritalStatus || 'N/A'}`,
  ];

  if (isMarried) {
    summaryLines.push(
      `Spouse Edu: ${updateFields.spouse_education || 'N/A'}`,
      `Spouse Exp: ${updateFields.spouse_work_experience ?? 0} yrs`,
      `Spouse English: ${updateFields.spouse_english_language_ability || 'N/A'}`
    );
  }
  if (updateFields.Germany_Language) {
    summaryLines.push(`German Level: ${updateFields.Germany_Language}`);
  }
  summaryLines.push(`Submitted: ${new Date().toISOString()}`);

  const assessmentSummary = summaryLines.join('\n');
  updateFields.Description = existingRecord.Description
    ? `${existingRecord.Description}\n${assessmentSummary}`
    : assessmentSummary;

  logger.info(`[Landing Assessment] Updating assessment in Zoho CRM ${targetModule}`, {
    recordId,
    totalPoints,
    isEligible,
    leadStatus,
    updatedFields: Object.keys(updateFields),
  });

  const updateResult = await updateZohoRecord(targetModule, recordId, updateFields);

  return {
    success: true,
    leadId: recordId,
    totalPoints,
    isEligible,
    leadStatus,
    message: 'Assessment recorded in Zoho CRM successfully',
    result: updateResult,
  };
}
