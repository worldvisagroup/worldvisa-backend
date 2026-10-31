import { MigratedLeadEntity } from '../sample-data/zoho-lead-schema';
import {
  createLead as createZohoLead,
  getRecordById,
  searchRecordByEmail,
  searchRecordByPhone,
  updateRecord as updateZohoRecord,
  uploadRecordAttachmentFromUrl,
} from './zohoLeadService';

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
  zc_gad?: string;
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
  targetCountry?: 'Australia' | 'Canada' | 'Germany' | string;
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
  targetCountry?: 'Australia' | 'Canada' | 'Germany' | string;
  totalPoints?: number;
  threshold?: number;
  isEligible?: boolean;
  leadStatus?: 'Pre-Qualified' | 'Not Qualified' | string;
  rawAnswers?: RawAssessmentAnswers | Record<string, unknown>;
  mappedZohoFields?: Record<string, any>;
  pdfUrl?: string;

  // Optional contact, tracking, and geo fields for direct flows (e.g. /check-eligibility)
  // where the lead has not yet been pre-captured via Stage 1 form
  fullName?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  nationalNumber?: string;
  tracking?: LandingTracking;
  geoInfo?: LandingGeoInfo;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return true;
    const lower = trimmed.toLowerCase();
    if (
      lower === 'null' ||
      lower === 'undefined' ||
      lower === '-' ||
      lower === '--' ||
      lower === 'n/a' ||
      lower === 'na' ||
      lower === 'none'
    ) {
      return true;
    }
    return false;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Checks if a name value is blank or a generic placeholder created by early capture flows.
 */
export function isGenericName(name?: unknown): boolean {
  if (isBlank(name)) return true;
  if (typeof name !== 'string') return false;
  const lower = name.trim().toLowerCase();
  return (
    lower === 'applicant' ||
    lower === 'valued applicant' ||
    lower === 'valued' ||
    lower === 'individual' ||
    lower === 'user' ||
    lower === 'lead' ||
    lower === 'unknown'
  );
}

/**
 * Computes updates for existing Zoho lead/contact without overwriting any already-populated fields.
 * If a field already has a value in `existingRecord`, it is preserved (skipped).
 * Only missing / blank fields in `existingRecord` will be filled from incoming parameters.
 */
export function getNonDestructiveUpdateFields(
  existingRecord: Record<string, any>,
  incoming: {
    leadSource?: string;
    tracking?: LandingTracking;
    geoInfo?: LandingGeoInfo;
    targetCountry?: string;
    countryCode?: string;
    phone?: string;
    mobile?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    serviceRequired?: string;
  }
): Record<string, any> {
  const updateFields: Record<string, any> = {};

  // 1. Lead Source: NEVER overwrite if already present in Zoho CRM
  if (isBlank(existingRecord.Lead_Source) && !isBlank(incoming.leadSource)) {
    updateFields.Lead_Source = incoming.leadSource;
  }

  // 2. Tracking: GCLID (support gclid or zc_gad)
  const effectiveGclid = incoming.tracking?.gclid || incoming.tracking?.zc_gad;
  if (isBlank(existingRecord.GCLID) && !isBlank(effectiveGclid)) {
    updateFields.GCLID = effectiveGclid;
  }

  // 3. Tracking: FBCLID
  if (isBlank(existingRecord.FBCLID) && !isBlank(incoming.tracking?.fbclid)) {
    updateFields.FBCLID = incoming.tracking!.fbclid;
  }

  // 4. Tracking: UTM parameters
  if (isBlank(existingRecord.UTM_Campaign_Name) && !isBlank(incoming.tracking?.utm_campaign)) {
    updateFields.UTM_Campaign_Name = incoming.tracking!.utm_campaign;
  }
  if (isBlank(existingRecord.Campaigns_Name) && !isBlank(incoming.tracking?.utm_campaign)) {
    updateFields.Campaigns_Name = incoming.tracking!.utm_campaign;
  }
  if (isBlank(existingRecord.UTM_Medium) && !isBlank(incoming.tracking?.utm_medium)) {
    updateFields.UTM_Medium = incoming.tracking!.utm_medium;
  }
  if (isBlank(existingRecord.UTM_Lead_Source) && !isBlank(incoming.tracking?.utm_source)) {
    updateFields.UTM_Lead_Source = incoming.tracking!.utm_source;
  }
  if (isBlank(existingRecord.UTM_Term) && !isBlank(incoming.tracking?.utm_term)) {
    updateFields.UTM_Term = incoming.tracking!.utm_term;
  }
  if (isBlank(existingRecord.UTM_Content) && !isBlank(incoming.tracking?.utm_content)) {
    updateFields.UTM_Content = incoming.tracking!.utm_content;
  }

  // 5. Data Source
  if (isBlank(existingRecord.Data_Source)) {
    updateFields.Data_Source = 'Webform';
  }

  // 6. Geo-location fields
  if (isBlank(existingRecord.City) && !isBlank(incoming.geoInfo?.city)) {
    updateFields.City = incoming.geoInfo!.city;
  }
  const effectiveRegion = incoming.geoInfo?.region;
  if (isBlank(existingRecord.State) && !isBlank(effectiveRegion)) {
    updateFields.State = effectiveRegion;
  }
  if (isBlank(existingRecord.Lead_Originated_Region) && !isBlank(effectiveRegion)) {
    updateFields.Lead_Originated_Region = effectiveRegion;
  }
  if (isBlank(existingRecord.Country) && !isBlank(incoming.geoInfo?.country)) {
    updateFields.Country = incoming.geoInfo!.country;
  }
  if (isBlank(existingRecord.Lead_Originated_Country) && !isBlank(incoming.geoInfo?.country)) {
    updateFields.Lead_Originated_Country = incoming.geoInfo!.country;
  }
  if (isBlank(existingRecord.IP_Address) && !isBlank(incoming.geoInfo?.ip)) {
    updateFields.IP_Address = incoming.geoInfo!.ip;
  }

  // 7. Contact / Phone fields
  if (isBlank(existingRecord.Country_Code) && !isBlank(incoming.countryCode)) {
    updateFields.Country_Code = incoming.countryCode;
  }
  if (isBlank(existingRecord.Phone) && !isBlank(incoming.phone)) {
    updateFields.Phone = incoming.phone;
  }
  if (isBlank(existingRecord.Mobile) && !isBlank(incoming.mobile)) {
    updateFields.Mobile = incoming.mobile;
  }

  // 8. Name fields (only update if existing record has blank or generic placeholder like "Valued Applicant")
  if (isGenericName(existingRecord.First_Name) && !isGenericName(incoming.firstName)) {
    updateFields.First_Name = incoming.firstName;
  }
  if (isGenericName(existingRecord.Last_Name) && !isGenericName(incoming.lastName)) {
    updateFields.Last_Name = incoming.lastName;
  }
  if (isGenericName(existingRecord.Full_Name) && !isGenericName(incoming.fullName)) {
    updateFields.Full_Name = incoming.fullName;
  }

  // 9. Destination and Service
  if (isBlank(existingRecord.intended_Countrys) && !isBlank(incoming.targetCountry)) {
    updateFields.intended_Countrys = incoming.targetCountry;
  }
  if (isBlank(existingRecord.Service_Required1)) {
    updateFields.Service_Required1 = incoming.serviceRequired || 'Permanent Residency';
  }

  // 10. Landing Page in Description (append without duplication)
  if (incoming.tracking?.pageUrl) {
    const pageUrl = incoming.tracking.pageUrl.trim();
    const currentDesc = (existingRecord.Description || '').toString();
    if (pageUrl && !currentDesc.includes(pageUrl)) {
      updateFields.Description = currentDesc
        ? `${currentDesc}\nLanding Page: ${pageUrl}`
        : `Landing Page: ${pageUrl}`;
    }
  }

  return updateFields;
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
  zc_gad?: string;
  fbclid?: string;
}): string {
  const explicit = params.leadSource?.toLowerCase().trim() || '';
  const source = params.utmSource?.toLowerCase().trim() || '';
  const medium = params.utmMedium?.toLowerCase().trim() || '';
  const campaign = params.utmCampaign?.toLowerCase().trim() || '';
  const term = params.utmTerm?.toLowerCase().trim() || '';
  const gclid = params.gclid?.trim() || params.zc_gad?.trim() || '';
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
      return 'Dual Degrees';
    case 'bachelors':
      return 'Bachelor Degree';
    case 'diploma_3':
      return 'Diploma';
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
 * - If exists: Updates only empty / blank fields, preserving established values (tracking, geo, lead source).
 * - If new: Creates a new Lead in Zoho CRM with non-blank fields.
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
    gclid: tracking.gclid || tracking.zc_gad,
    zc_gad: tracking.zc_gad,
    fbclid: tracking.fbclid,
  });

  // ── Step 1: Search Zoho CRM for existing record in Leads ONLY (by phone or email) ──
  let existingRecord = await searchRecordByPhone('Leads', phone);
  const targetModule: 'Leads' = 'Leads';

  if (!existingRecord && email) {
    const existingLeadByEmail = await searchRecordByEmail('Leads', email);
    if (existingLeadByEmail) {
      existingRecord = existingLeadByEmail;
    }
  }

  // ── Step 2A: Record Exists in Zoho → Update ONLY blank / missing fields ────
  if (existingRecord) {
    const recordId = String(existingRecord.id);
    const fullRecord = existingRecord;

    const updateFields = getNonDestructiveUpdateFields(fullRecord, {
      leadSource,
      tracking,
      geoInfo,
      targetCountry: payload.targetCountry,
      countryCode,
      phone,
      mobile,
      firstName,
      lastName,
      fullName,
    });

    updateFields.Last_Activity_Time = new Date().toISOString();

    logger.info(`[Landing Lead] Updating existing ${targetModule} in Zoho CRM (preserving established fields)`, {
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

  if (!isBlank(firstName)) newLeadData.First_Name = firstName;
  if (!isBlank(lastName)) newLeadData.Last_Name = lastName;
  if (!isBlank(fullName)) newLeadData.Full_Name = fullName;

  if (!isBlank(geoInfo.city)) newLeadData.City = geoInfo.city;
  if (!isBlank(geoInfo.region)) {
    newLeadData.State = geoInfo.region;
    newLeadData.Lead_Originated_Region = geoInfo.region;
  }
  if (!isBlank(geoInfo.country)) {
    newLeadData.Country = geoInfo.country;
    newLeadData.Lead_Originated_Country = geoInfo.country;
  }
  if (!isBlank(geoInfo.ip)) newLeadData.IP_Address = geoInfo.ip;

  const effectiveGclid = tracking.gclid || tracking.zc_gad;
  if (!isBlank(effectiveGclid)) newLeadData.GCLID = effectiveGclid;
  if (!isBlank(tracking.fbclid)) newLeadData.FBCLID = tracking.fbclid;
  if (!isBlank(tracking.utm_campaign)) {
    newLeadData.UTM_Campaign_Name = tracking.utm_campaign;
    newLeadData.Campaigns_Name = tracking.utm_campaign;
  }
  if (!isBlank(tracking.utm_medium)) newLeadData.UTM_Medium = tracking.utm_medium;
  if (!isBlank(tracking.utm_source)) newLeadData.UTM_Lead_Source = tracking.utm_source;
  if (!isBlank(tracking.utm_term)) newLeadData.UTM_Term = tracking.utm_term;
  if (!isBlank(tracking.utm_content)) newLeadData.UTM_Content = tracking.utm_content;
  if (!isBlank(tracking.pageUrl)) newLeadData.Description = `Landing Page: ${tracking.pageUrl}`;

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
 * - If record exists: Updates assessment results, preserving existing tracking, geo, and lead source data.
 * - If record does not exist: Auto-creates lead first via captureLandingLead, then saves assessment results.
 */
export async function updateLandingAssessment(payload: LandingAssessmentPayload) {
  let existingRecord: Record<string, any> | null = null;
  const targetModule: 'Leads' = 'Leads';

  // 1. Search by leadId (Zoho ID) in Leads if provided
  if (payload.leadId) {
    existingRecord = await getRecordById('Leads', payload.leadId);
  }

  // 2. Fallback search by email in Leads
  if (!existingRecord && payload.email) {
    const cleanEmail = payload.email.trim();
    existingRecord = await searchRecordByEmail('Leads', cleanEmail);
  }

  // 3. Fallback search by phone in Leads
  if (!existingRecord && payload.phone) {
    const rawDigits = payload.phone.replace(/\D/g, '');
    const nationalDigits = rawDigits.slice(-10);
    existingRecord = await searchRecordByPhone('Leads', nationalDigits);
  }

  // 4. Auto-create Lead if record does not exist in Zoho CRM (e.g. direct /check-eligibility flow)
  let isNewLead = false;
  if (!existingRecord) {
    const email = payload.email?.trim();
    const phone = payload.phone?.trim();

    if (!email || !phone) {
      const error: any = new Error(
        'Lead not found in Zoho CRM for the provided leadId, and cannot be auto-created without both email and phone'
      );
      error.statusCode = 404;
      throw error;
    }

    logger.info('[Landing Assessment] Record not found in Zoho CRM — creating new Lead via captureLandingLead', {
      email,
      phone,
      targetCountry: payload.targetCountry,
    });

    const captureResult = await captureLandingLead({
      fullName: payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'Valued Applicant',
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      phone,
      countryCode: payload.countryCode,
      nationalNumber: payload.nationalNumber,
      targetCountry: payload.targetCountry,
      tracking: payload.tracking,
      geoInfo: payload.geoInfo,
    });

    if (captureResult && captureResult.leadId) {
      existingRecord = (await getRecordById('Leads', captureResult.leadId)) || {
        id: captureResult.leadId,
        Description: '',
      };
      isNewLead = Boolean(captureResult.isNew);
    }
  }

  if (!existingRecord) {
    const error: any = new Error('Lead could not be found or created in Zoho CRM');
    error.statusCode = 500;
    throw error;
  }

  const recordId = String(existingRecord.id);

  // ── Step 5: Retrieve full record only if not already retrieved by ID ───
  const fullRecord = payload.leadId ? existingRecord : ((await getRecordById(targetModule, recordId)) || existingRecord);

  // ── Step 6: Non-destructively backfill missing tracking/geo fields without overwriting existing data ─
  const tracking = payload.tracking || {};
  const geoInfo = payload.geoInfo || {};

  const effectiveLeadSource = determineLandingLeadSource({
    leadSource: tracking.leadSource,
    utmSource: tracking.utm_source,
    utmMedium: tracking.utm_medium,
    utmCampaign: tracking.utm_campaign,
    utmTerm: tracking.utm_term,
    gclid: tracking.gclid || tracking.zc_gad,
    zc_gad: tracking.zc_gad,
    fbclid: tracking.fbclid,
  });

  const { mobile, phone, countryCode } = normalizePhone({
    phone: payload.phone,
    nationalNumber: payload.nationalNumber,
    countryCode: payload.countryCode,
  });

  const nonDestructiveUpdates = getNonDestructiveUpdateFields(fullRecord, {
    leadSource: effectiveLeadSource,
    tracking,
    geoInfo,
    targetCountry: payload.targetCountry,
    countryCode: countryCode || undefined,
    phone: phone || undefined,
    mobile: mobile || undefined,
    firstName: payload.firstName,
    lastName: payload.lastName,
    fullName: payload.fullName,
  });

  const rawAnswers = (payload.rawAnswers || {}) as Record<string, any>;
  const isEligible = Boolean(payload.isEligible);
  const totalPoints = Number(payload.totalPoints) || 0;
  const leadStatus = payload.leadStatus || (isEligible ? 'Pre-Qualified' : 'Not Qualified');

  const updateFields: Record<string, any> = {
    ...nonDestructiveUpdates,
    Last_Activity_Time: new Date().toISOString(),
  };

  // Protect mature lead statuses from being downgraded
  const matureStatuses = ['Converted to Deal', 'Offer Accepted', 'Ready to Sign Up', 'Offer Made', 'Done'];
  if (!fullRecord.Lead_Status || !matureStatuses.includes(fullRecord.Lead_Status)) {
    updateFields.Lead_Status = leadStatus;
  }

  // ── Map Questionnaire Answers to Zoho Schema (only if provided in rawAnswers) ─
  if (!isBlank(rawAnswers.highestQualification)) {
    updateFields.education = mapEducationToZoho(rawAnswers.highestQualification);
  }

  if (rawAnswers.indianWorkExperience !== undefined && !isBlank(rawAnswers.indianWorkExperience)) {
    updateFields.work_experience = parseExperience(rawAnswers.indianWorkExperience);
  }

  if (rawAnswers.overseasWorkExperience !== undefined && !isBlank(rawAnswers.overseasWorkExperience)) {
    updateFields.work_overseas_experience = parseExperience(rawAnswers.overseasWorkExperience);
  }

  if (!isBlank(rawAnswers.englishAbility)) {
    updateFields.english_language_ability = mapEnglishAbility(rawAnswers.englishAbility);
  }

  if (!isBlank(rawAnswers.maritalStatus)) {
    updateFields.marital_status = mapMaritalStatus(rawAnswers.maritalStatus);
  }

  // Spouse fields if married
  const isMarried = rawAnswers.maritalStatus?.toLowerCase() === 'married';
  if (isMarried) {
    if (!isBlank(rawAnswers.spouseQualification)) {
      updateFields.spouse_education = mapSpouseEducationToZoho(rawAnswers.spouseQualification);
    }
    if (rawAnswers.spouseWorkExperience !== undefined && !isBlank(rawAnswers.spouseWorkExperience)) {
      updateFields.spouse_work_experience = parseExperience(rawAnswers.spouseWorkExperience);
    }
    if (!isBlank(rawAnswers.spouseEnglishAbility)) {
      updateFields.spouse_english_language_ability = mapEnglishAbility(rawAnswers.spouseEnglishAbility);
    }
  }

  // German ability
  if (!isBlank(rawAnswers.germanAbility) && rawAnswers.germanAbility.toLowerCase() !== 'none') {
    updateFields.Germany_Language = rawAnswers.germanAbility.toUpperCase();
  }

  // ── Overall Destination Points (Architecture Rule 1: No category breakdown) ─
  const country = (
    payload.targetCountry ||
    rawAnswers.country ||
    fullRecord.intended_Countrys ||
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

  // ── Readable summary appended to Description without overwriting existing history ─
  const summaryLines = [
    '',
    '─── LANDING ASSESSMENT SUBMISSION ───',
    `Destination: ${payload.targetCountry || rawAnswers.country || fullRecord.intended_Countrys || 'General'}`,
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
  if (payload.pdfUrl) {
    summaryLines.push(`PDF Report: ${payload.pdfUrl}`);
  }
  summaryLines.push(`Submitted: ${new Date().toISOString()}`);

  const assessmentSummary = summaryLines.join('\n');
  const baseDescription = updateFields.Description || fullRecord.Description || '';
  updateFields.Description = baseDescription
    ? `${baseDescription}\n${assessmentSummary}`
    : assessmentSummary;

  logger.info(`[Landing Assessment] Updating assessment in Zoho CRM ${targetModule} (preserving established fields)`, {
    recordId,
    totalPoints,
    isEligible,
    leadStatus,
    hasPdfUrl: Boolean(payload.pdfUrl),
    updatedFields: Object.keys(updateFields),
  });

  const updateResult = await updateZohoRecord(targetModule, recordId, updateFields);

  // ── Upload Assessment PDF as attachment to Zoho CRM if pdfUrl is provided ──
  let attachmentResult: any = null;
  if (payload.pdfUrl && typeof payload.pdfUrl === 'string' && payload.pdfUrl.trim()) {
    const rawPdfUrl = payload.pdfUrl.trim();
    const cleanCountry = country
      ? country.trim().charAt(0).toUpperCase() + country.trim().slice(1).toLowerCase()
      : '';
    const attachmentFileName = cleanCountry
      ? `Assessment-Report-${cleanCountry}.pdf`
      : 'Assessment-Report.pdf';

    try {
      logger.info(`[Landing Assessment] Uploading assessment PDF attachment to Zoho CRM ${targetModule}`, {
        recordId,
        targetModule,
        fileName: attachmentFileName,
        pdfUrl: rawPdfUrl,
      });

      attachmentResult = await uploadRecordAttachmentFromUrl(
        targetModule,
        recordId,
        rawPdfUrl,
        attachmentFileName
      );

      logger.info(`[Landing Assessment] PDF attachment uploaded successfully to Zoho CRM`, {
        recordId,
        targetModule,
        attachmentResult,
      });
    } catch (attachErr: any) {
      logger.error(`[Landing Assessment] Failed to upload PDF attachment to Zoho CRM`, {
        recordId,
        targetModule,
        pdfUrl: rawPdfUrl,
        error: attachErr.message,
        details: attachErr.response?.data,
      });
    }
  }

  return {
    success: true,
    leadId: recordId,
    isNew: isNewLead,
    totalPoints,
    isEligible,
    leadStatus,
    message: isNewLead
      ? 'Lead created and assessment recorded in Zoho CRM successfully'
      : 'Assessment recorded in Zoho CRM successfully',
    result: updateResult,
    ...(attachmentResult ? { attachment: attachmentResult } : {}),
  };
}
