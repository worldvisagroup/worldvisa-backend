import { Request, Response } from 'express';
import mongoose from 'mongoose';
import type {
  ZohoRecord,
  ZohoApiResponse,
  OnboardingStatus,
  ApplicationFilterResult,
} from '../types/visaApplication.types';
import { VISA_SERVICE_TYPE_VALUES } from '../constants/checklistDocument';
import { isVisaApplicationCountry, VISA_APPLICATION_STATUS_VALUES } from '../constants/visaApplication';

// ─── JS Module Imports ────────────────────────────────────────────────────────

const { zohoRequest } = require('./zohoDms/zohoApi.js') as {
  zohoRequest: (module: string, method: string, body: unknown) => Promise<ZohoApiResponse>;
};
const dmsZohoDocument    = require('../models/dmsZohoDocument')    as unknown as mongoose.Model<mongoose.Document>;
const DmsZohoClient      = require('../models/dmsZohoClient')      as unknown as mongoose.Model<mongoose.Document>;
const ZohoDmsUser        = require('../models/zohoDmsUser')        as unknown as mongoose.Model<mongoose.Document>;
const QualityCheckRequest = require('../models/qualityCheckRequest') as unknown as mongoose.Model<mongoose.Document>;
const { addActivityLog } = require('./helper/service/activityLog') as {
  addActivityLog: (p: unknown) => void;
};
const logger = require('../utils/logger') as {
  error: (msg: string, ctx?: unknown) => void;
};
const {
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STAGES,
  APPLICATION_STAGES_CANADA,
  SUPPORTED_COUNTRIES,
  SEARCH_TERM_MAX_LENGTH,
  VISA_LIST_SEARCH_COQL_MAX,
} = require('./helper/constants.js') as {
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT: string;
  MODULE_VISA_APPLICATION: string;
  MODULE_SPOUSE_SKILL_ASSESSMENT: string;
  APPLICATION_STAGES: string[];
  APPLICATION_STAGES_CANADA: string[];
  SUPPORTED_COUNTRIES: string[];
  SEARCH_TERM_MAX_LENGTH: number;
  VISA_LIST_SEARCH_COQL_MAX: number;
};
const {
  buildVisaApplicationCountQuery,
  buildVisaApplicationListQuery,
  buildVisaApplicationDetailQuery,
  buildSpouseApplicationCountQuery,
  buildSpouseApplicationListQuery,
  buildSpouseApplicationDetailQuery,
  buildClientApplicationDetailQuery,
} = require('../queries/visaApplicationCoql') as {
  buildVisaApplicationCountQuery:   (whereClause: string, coreFilters: string) => string;
  buildVisaApplicationListQuery:    (whereClause: string, coreFilters: string, orderBy: string, limit: number, offset: number) => string;
  buildVisaApplicationDetailQuery:  (applicationId: string) => string;
  buildSpouseApplicationCountQuery: (whereClause: string, additionalFilters: string) => string;
  buildSpouseApplicationListQuery:  (whereClause: string, additionalFilters: string, orderBy: string, limit: number, offset: number) => string;
  buildSpouseApplicationDetailQuery:(applicationId: string) => string;
  buildClientApplicationDetailQuery:(applicationId: string, moduleName: string) => string;
};
const { sanitizeSearchTerm, escapeString } = require('../utils/querySanitizer.js') as {
  sanitizeSearchTerm: (value: string | null | undefined, maxLength?: number) => string | null;
  escapeString: (value: string) => string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SERVICE_TYPES = VISA_SERVICE_TYPE_VALUES.filter(v => v !== 'All');
const VALID_SERVICE_TYPES_COQL = VALID_SERVICE_TYPES.map(s => `'${escapeString(s)}'`).join(', ');

function buildWhereClause(
  username: string,
  role: string,
  giveMine: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): string {
  const conditions: string[] = [];

  if (role === 'admin' || giveMine === 'true') {
    conditions.push(`Application_Handled_By like '%${username}%'`);
  }

  if (startDate && endDate) {
    conditions.push(`(Created_Time >= '${startDate}T00:00:00+00:00' and Created_Time <= '${endDate}T23:59:59+00:00')`);
  } else if (startDate) {
    conditions.push(`Created_Time >= '${startDate}T00:00:00+00:00'`);
  } else if (endDate) {
    conditions.push(`Created_Time <= '${endDate}T23:59:59+00:00'`);
  }

  return conditions.length > 0 ? ` where ${conditions.join(' and ')}` : '';
}

async function fetchOnboardingMap(recordIds: string[]): Promise<Map<string, Record<string, unknown>>> {
  const records = (await DmsZohoClient
    .find({ lead_id: { $in: recordIds } })
    .select('lead_id clerk_id clerk_invitation_id account_status email_verified')
    .lean()) as unknown as Array<Record<string, unknown> & { lead_id: string }>;
  return new Map(records.map(c => [c.lead_id, c]));
}

function buildOnboardingStatus(clientRecord: Record<string, unknown> | null): OnboardingStatus {
  return {
    client_record_exists: clientRecord !== null,
    clerk_id:            (clientRecord?.clerk_id            as string  | null) ?? null,
    clerk_invitation_id: (clientRecord?.clerk_invitation_id as string  | null) ?? null,
    account_status:      (clientRecord?.account_status      as string  | null) ?? null,
    email_verified:      (clientRecord?.email_verified      as boolean | null) ?? null,
  };
}

async function getProfileImageUrlMap(
  usernames: string[]
): Promise<Record<string, { username: string; profile_image_url: string | null }>> {
  const unique = [...new Set(usernames.filter(Boolean))];
  if (!unique.length) return {};
  const users = await ZohoDmsUser.find({ username: { $in: unique } })
    .select('username profile_image_url')
    .lean();
  return Object.fromEntries((users as any[]).map((u) => [u.username, u]));
}

// ─── Visa Application Filter ──────────────────────────────────────────────────


function buildVisaListWhereClauseAndCoreFilters(
  username: string,
  role: string,
  giveMine: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  handledBy: string | undefined,
  applicationStage: string | undefined,
  applicationState: string | undefined,
  country: string,
  extraAndCondition?: string,
  serviceType?: string,
): { whereClause: string; coreFilters: string } {
  const userWhere = buildWhereClause(username, role, giveMine, startDate, endDate);
  const whereClause = extraAndCondition
    ? (userWhere ? `${userWhere} and ${extraAndCondition}` : ` where ${extraAndCondition}`)
    : userWhere;

  const filterJoin = whereClause ? ' and' : ' where';
  let coreFilters = `${filterJoin} (((`;

  if (applicationState) {
    coreFilters += `(Application_State = '${applicationState}')`;
  } else {
    coreFilters += `(Application_State = 'Active')`;
  }

  coreFilters += ` and (Qualified_Country = '${country}'))`;

  const normalizedServiceType = typeof serviceType === 'string' ? serviceType.trim() : '';
  const serviceFilter = normalizedServiceType && VALID_SERVICE_TYPES.includes(normalizedServiceType as any)
    ? `Service_Finalized = '${escapeString(normalizedServiceType)}'`
    : `Service_Finalized in (${VALID_SERVICE_TYPES_COQL})`;

  if ((role === 'admin' || role === 'master_admin') && handledBy) {
    coreFilters += ` and ((${serviceFilter}`;
    const handledByList = handledBy.split(',').map(h => h.trim()).join("', '");
    coreFilters += ` and (Application_Handled_By in ('${handledByList}'))))`;
  } else {
    coreFilters += ` and (${serviceFilter}))`;
  }

  if (applicationStage) {
    const stages = applicationStage.split(',').map(s => s.trim()).join("', '");
    coreFilters += ` and (Application_Stage in ('${stages}'))`;
  } else {
    const defaultStageValues =
      country === 'Germany'
        ? VISA_APPLICATION_STATUS_VALUES
        : (country === 'Canada' ? APPLICATION_STAGES_CANADA : APPLICATION_STAGES);

    const defaultStages = defaultStageValues
      .map(s => `'${escapeString(s)}'`).join(', ');
    coreFilters += ` and (Application_Stage in (${defaultStages}))`;
  }

  coreFilters += `)`;

  return { whereClause, coreFilters };
}

async function getFilteredVisaApplications(
  username: string,
  role: string,
  page: number,
  limit: number,
  startDate: string | undefined,
  endDate: string | undefined,
  giveMine: string | undefined,
  recentActivity: string | undefined,
  handledBy: string | undefined,
  applicationStage: string | undefined,
  applicationState: string | undefined,
  country: string,
  serviceType: string | undefined,
): Promise<ApplicationFilterResult> {
  const offset = (page - 1) * limit;
  const { whereClause, coreFilters } = buildVisaListWhereClauseAndCoreFilters(
    username, role, giveMine, startDate, endDate,
    handledBy, applicationStage, applicationState, country,
    undefined,
    serviceType,
  );

  const countQuery = buildVisaApplicationCountQuery(whereClause, coreFilters);
  const orderBy    = recentActivity === 'false' ? 'Created_Time' : 'Recent_Activity';
  const listQuery  = buildVisaApplicationListQuery(whereClause, coreFilters, orderBy, limit, offset);

  const [countResponse, zohoResponse] = await Promise.all([
    zohoRequest('coql', 'POST', { select_query: countQuery }),
    zohoRequest('coql', 'POST', { select_query: listQuery }),
  ]);

  return {
    data: (zohoResponse?.data as ZohoRecord[]) || [],
    info: { count: (countResponse?.data?.[0] as Record<string, unknown>)?.total as number || 0 },
  };
}


async function getFilteredVisaApplicationsByUnifiedSearch(
  username: string,
  role: string,
  page: number,
  limit: number,
  startDate: string | undefined,
  endDate: string | undefined,
  giveMine: string | undefined,
  recentActivity: string | undefined,
  handledBy: string | undefined,
  applicationStage: string | undefined,
  applicationState: string | undefined,
  country: string,
  escapedSearch: string,
  serviceType: string | undefined,
): Promise<ApplicationFilterResult> {
  const orderBy = recentActivity === 'false' ? 'Created_Time' : 'Recent_Activity';
  const perQueryLimit = Math.min(
    VISA_LIST_SEARCH_COQL_MAX,
    Math.max(limit, page * limit),
  );

  const fields = ['Name', 'Email', 'Phone'] as const;
  const selectQueries = fields.map((field) => {
    const { whereClause, coreFilters } = buildVisaListWhereClauseAndCoreFilters(
      username, role, giveMine, startDate, endDate,
      handledBy, applicationStage, applicationState, country,
      `(${field} like '%${escapedSearch}%')`,
      serviceType,
    );
    return buildVisaApplicationListQuery(whereClause, coreFilters, orderBy, perQueryLimit, 0);
  });

  const responses = await Promise.all(
    selectQueries.map((select_query) => zohoRequest('coql', 'POST', { select_query })),
  );

  const sortKey = (app: ZohoRecord): number => {
    const v = app[orderBy];
    if (v == null) return 0;
    const t = new Date(String(v)).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const byId = new Map<string, ZohoRecord>();
  for (const resp of responses) {
    const rows = (resp?.data as ZohoRecord[]) || [];
    for (const app of rows) {
      if (!app?.id) continue;
      const existing = byId.get(app.id);
      if (!existing || sortKey(app) > sortKey(existing)) {
        byId.set(app.id, app);
      }
    }
  }

  const merged = [...byId.values()].sort((a, b) => sortKey(b) - sortKey(a));
  const offset = (page - 1) * limit;

  return {
    data: merged.slice(offset, offset + limit),
    info: { count: merged.length },
  };
}

// ─── Spouse Application Filter ────────────────────────────────────────────────

function buildSpouseListWhereClauseAndAdditionalFilters(
  username: string,
  role: string,
  giveMine: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  applicationStage: string | undefined,
  handledBy: string | undefined,
  country: string,
  extraAndCondition?: string,
): { whereClause: string; additionalFilters: string } {
  const userWhere = buildWhereClause(username, role, giveMine, startDate, endDate);
  const whereClause = extraAndCondition
    ? (userWhere ? `${userWhere} and ${extraAndCondition}` : ` where ${extraAndCondition}`)
    : userWhere;

  const additionalConditions: string[] = [];
  additionalConditions.push(`(Qualified_Country = '${escapeString(country)}')`);

  if (applicationStage) {
    const stages = applicationStage.split(',').map(s => s.trim()).join("', '");
    additionalConditions.push(`Application_Stage in ('${stages}')`);
  }

  if (handledBy) {
    const handledByList = handledBy.split(',').map(h => h.trim()).filter(Boolean).join("', '");
    if (handledByList) {
      additionalConditions.push(`(Application_Handled_By in ('${handledByList}'))`);
    }
  }

  let additionalFilters = '';
  if (additionalConditions.length > 0) {
    const join = whereClause ? ' and' : ' where';
    additionalFilters = `${join} ${additionalConditions.join(' and ')}`;
  } else if (!whereClause) {
    additionalFilters = ` where Created_Time >= '2000-01-01T00:00:00+00:00'`;
  }

  return { whereClause, additionalFilters };
}

async function getFilteredSpouseApplications(
  username: string,
  role: string,
  page: number,
  limit: number,
  startDate: string | undefined,
  endDate: string | undefined,
  giveMine: string | undefined,
  recentActivity: string | undefined,
  applicationStage: string | undefined,
  handledBy: string | undefined,
  country: string,
): Promise<ApplicationFilterResult> {
  const offset = (page - 1) * limit;
  const { whereClause, additionalFilters } = buildSpouseListWhereClauseAndAdditionalFilters(
    username, role, giveMine, startDate, endDate,
    applicationStage, handledBy, country,
  );

  const countQuery = buildSpouseApplicationCountQuery(whereClause, additionalFilters);
  const orderBy    = recentActivity === 'false' ? 'Created_Time' : 'Recent_Activity';
  const listQuery  = buildSpouseApplicationListQuery(whereClause, additionalFilters, orderBy, limit, offset);

  const [countResponse, zohoResponse] = await Promise.all([
    zohoRequest('coql', 'POST', { select_query: countQuery }),
    zohoRequest('coql', 'POST', { select_query: listQuery }),
  ]);

  return {
    data: (zohoResponse?.data as ZohoRecord[]) || [],
    info: { count: (countResponse?.data?.[0] as Record<string, unknown>)?.total as number || 0 },
  };
}


async function getFilteredSpouseApplicationsByUnifiedSearch(
  username: string,
  role: string,
  page: number,
  limit: number,
  startDate: string | undefined,
  endDate: string | undefined,
  giveMine: string | undefined,
  recentActivity: string | undefined,
  applicationStage: string | undefined,
  handledBy: string | undefined,
  country: string,
  escapedSearch: string,
): Promise<ApplicationFilterResult> {
  const orderBy = recentActivity === 'false' ? 'Created_Time' : 'Recent_Activity';
  const perQueryLimit = Math.min(
    VISA_LIST_SEARCH_COQL_MAX,
    Math.max(limit, page * limit),
  );

  const fields = ['Name', 'Email', 'Phone'] as const;
  const selectQueries = fields.map((field) => {
    const { whereClause, additionalFilters } = buildSpouseListWhereClauseAndAdditionalFilters(
      username, role, giveMine, startDate, endDate,
      applicationStage, handledBy, country,
      `(${field} like '%${escapedSearch}%')`,
    );
    return buildSpouseApplicationListQuery(whereClause, additionalFilters, orderBy, perQueryLimit, 0);
  });

  const responses = await Promise.all(
    selectQueries.map((select_query) => zohoRequest('coql', 'POST', { select_query })),
  );

  const sortKey = (app: ZohoRecord): number => {
    const v = app[orderBy];
    if (v == null) return 0;
    const t = new Date(String(v)).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const byId = new Map<string, ZohoRecord>();
  for (const resp of responses) {
    const rows = (resp?.data as ZohoRecord[]) || [];
    for (const app of rows) {
      if (!app?.id) continue;
      const existing = byId.get(app.id);
      if (!existing || sortKey(app) > sortKey(existing)) {
        byId.set(app.id, app);
      }
    }
  }

  const merged = [...byId.values()].sort((a, b) => sortKey(b) - sortKey(a));
  const offset = (page - 1) * limit;

  return {
    data: merged.slice(offset, offset + limit),
    info: { count: merged.length },
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getApplicationsWithAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }

    const page  = parseInt(req.query.page  as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const {
      startDate, endDate, giveMine, recentActivity,
      handledBy, applicationStage, applicationState,
      serviceType,
    } = req.query as Record<string, string | undefined>;
    const country = (req.query.country as string) || 'Australia';

    if (!isVisaApplicationCountry(country)) {
      res.status(400).json({ error: 'Invalid country parameter. Provide a valid country name.' });
      return;
    }

    const hasSearchParam = Object.prototype.hasOwnProperty.call(req.query, 'search');
    const rawSearchValue = hasSearchParam && typeof req.query.search === 'string' ? req.query.search : '';
    const trimmedSearch  = sanitizeSearchTerm(
      hasSearchParam ? rawSearchValue : null,
      SEARCH_TERM_MAX_LENGTH,
    );

    if (hasSearchParam && !trimmedSearch) {
      res.status(400).json({
        error:   'Invalid search parameter',
        message: `search must be non-empty and at most ${SEARCH_TERM_MAX_LENGTH} characters.`,
      });
      return;
    }

    const username = req.user.username ?? '';
    const role     = req.user.role     ?? '';

    const { data: filteredApplications, info } = trimmedSearch
      ? await getFilteredVisaApplicationsByUnifiedSearch(
          username, role,
          page, limit,
          startDate, endDate,
          giveMine, recentActivity,
          handledBy, applicationStage, applicationState,
          country,
          escapeString(trimmedSearch),
          serviceType,
        )
      : await getFilteredVisaApplications(
          username, role,
          page, limit,
          startDate, endDate,
          giveMine, recentActivity,
          handledBy, applicationStage, applicationState,
          country,
          serviceType,
        );

    if (!filteredApplications.length) {
      res.json({
        data: [],
        pagination: { currentPage: page, totalPages: 0, totalRecords: 0, limit },
      });
      return;
    }

    const recordIds = filteredApplications.map(app => app.id);

    const [attachmentCounts, onboardingMap] = await Promise.all([
      dmsZohoDocument.aggregate([
        { $match: { record_id: { $in: recordIds } } },
        { $group: { _id: '$record_id', count: { $sum: 1 } } },
      ]) as Promise<Array<{ _id: string; count: number }>>,
      fetchOnboardingMap(recordIds),
    ]);

    const countMap = new Map((attachmentCounts as Array<{ _id: string; count: number }>).map(item => [item._id, item.count]));

    const data = filteredApplications.map(app => ({
      ...app,
      AttachmentCount:        countMap.get(app.id) || 0,
      application_onboarding: buildOnboardingStatus(onboardingMap.get(app.id) ?? null),
    }));

    res.json({
      data,
      pagination: {
        currentPage:  page,
        totalPages:   Math.ceil(info.count / limit),
        totalRecords: info.count,
        limit,
      },
    });
  } catch (err) {
    const error = err as { response?: { status?: number; data?: unknown }; message?: string };
    logger.error('[VisaApplications] Error fetching visa applications', {
      status:   error.response?.status,
      zohoData: error.response?.data,
      message:  error.message,
    });
    res.status(500).json({
      error:   'Failed to fetch visa applications',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getVisaApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationId = req.params.id as string;

    const { data: zohoResponseData } = await zohoRequest('coql', 'POST', {
      select_query: buildVisaApplicationDetailQuery(applicationId),
    });

    if (!zohoResponseData || zohoResponseData.length === 0) {
      res.status(404).send('Visa application not found');
      return;
    }

    const application = zohoResponseData[0] as ZohoRecord;
    const record_id   = application.id;
    const spouseName  = (application.Spouse_Name as string | undefined)?.trim() || null;

    const [documentsCount, client, spouseClient, qcRequest] = await Promise.all([
      dmsZohoDocument.countDocuments({ record_id }),
      DmsZohoClient.findOne({ lead_id: record_id })
        .select('notes online_status last_communication_activity last_communication_provider clerk_id clerk_invitation_id account_status email_verified deadline_extensions')
        .lean() as Promise<Record<string, unknown> | null>,
      spouseName
        ? DmsZohoClient.findOne({
            name: new RegExp(`^${spouseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            record_type: 'spouse_skill_assessment',
          }).select('lead_id').lean() as Promise<Record<string, unknown> | null>
        : Promise.resolve(null),
      QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
        .select('_id status requested_at requested_by requested_to')
        .lean() as Promise<Record<string, unknown> | null>,
    ]);

    res.json({
      data: {
        ...application,
        AttachmentCount:             documentsCount,
        notes:                       (client as Record<string, unknown> | null)?.notes ?? [],
        online_status:               (client as Record<string, unknown> | null)?.online_status ?? false,
        last_communication_activity: {
          date:     (client as Record<string, unknown> | null)?.last_communication_activity     ?? null,
          provider: (client as Record<string, unknown> | null)?.last_communication_provider ?? null,
        },
        deadline_extensions:         (client as Record<string, unknown> | null)?.deadline_extensions ?? [],
        spouse_lead_id:              (spouseClient as Record<string, unknown> | null)?.lead_id ?? null,
        qc_requested: qcRequest
          ? {
              qcId:         qcRequest._id,
              status:       qcRequest.status,
              requested_at: qcRequest.requested_at,
              requested_by: qcRequest.requested_by,
              requested_to: qcRequest.requested_to,
            }
          : null,
        application_onboarding: buildOnboardingStatus(client),
      },
    });
  } catch (err) {
    const error = err as { response?: { data?: unknown }; message?: string };
    logger.error('[VisaApplications] Error fetching visa application by id', {
      message: error.response?.data || error.message,
    });
    res.status(500).send('Failed to fetch visa application');
  }
};

export const getVisaApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }

    const applicationId = req.user.lead_id ?? '';
    const recordType    = req.user.record_type;

    const moduleName = recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT
      ? MODULE_SPOUSE_SKILL_ASSESSMENT
      : MODULE_VISA_APPLICATION;

    const { data: zohoResponseData } = await zohoRequest('coql', 'POST', {
      select_query: buildClientApplicationDetailQuery(applicationId, moduleName),
    });

    if (!zohoResponseData || zohoResponseData.length === 0) {
      res.status(404).send('Visa application not found');
      return;
    }

    const application    = zohoResponseData[0] as ZohoRecord;
    const recordId = application.id as string;

    const [documentsCount, clientDoc] = await Promise.all([
      dmsZohoDocument.countDocuments({ record_id: recordId }),
      DmsZohoClient.findOne({ lead_id: recordId }).select('deadline_extensions').lean() as Promise<Record<string, unknown> | null>,
    ]);

    const deadline_extensions = ((clientDoc as any)?.deadline_extensions as any[]) ?? [];
    const approvedByUsernames = deadline_extensions.map((e) => e?.approvedBy).filter(Boolean);
    const approvedByMap = await getProfileImageUrlMap(approvedByUsernames);

    const enrichedDeadlineExtensions = deadline_extensions.map((e) => ({
      ...e,
      approvedByInfo: e?.approvedBy
        ? {
            username: e.approvedBy,
            profile_image_url: approvedByMap[e.approvedBy]?.profile_image_url ?? null,
          }
        : null,
    }));

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
        deadline_extensions: enrichedDeadlineExtensions,
      },
    });
  } catch (err) {
    const error = err as { response?: { data?: unknown }; message?: string };
    logger.error('[VisaApplications] Error fetching client visa application', {
      message: error.response?.data || error.message,
    });
    res.status(500).send('Failed to fetch visa application');
  }
};

export const getSpouseApplicationsWithAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }

    const page  = parseInt(req.query.page  as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { startDate, endDate, giveMine, recentActivity, applicationStage, handledBy } =
      req.query as Record<string, string | undefined>;
    const country = (req.query.country as string) || 'Australia';

    if (!SUPPORTED_COUNTRIES.includes(country)) {
      res.status(400).json({ error: `Invalid country parameter. Supported values: ${SUPPORTED_COUNTRIES.join(', ')}` });
      return;
    }

    const hasSearchParam = Object.prototype.hasOwnProperty.call(req.query, 'search');
    const rawSearchValue = hasSearchParam && typeof req.query.search === 'string' ? req.query.search : '';
    const trimmedSearch  = sanitizeSearchTerm(
      hasSearchParam ? rawSearchValue : null,
      SEARCH_TERM_MAX_LENGTH,
    );

    if (hasSearchParam && !trimmedSearch) {
      res.status(400).json({
        error:   'Invalid search parameter',
        message: `search must be non-empty and at most ${SEARCH_TERM_MAX_LENGTH} characters.`,
      });
      return;
    }

    const username = req.user.username ?? '';
    const role     = req.user.role     ?? '';

    const { data: filteredApplications, info } = trimmedSearch
      ? await getFilteredSpouseApplicationsByUnifiedSearch(
          username, role,
          page, limit,
          startDate, endDate,
          giveMine, recentActivity,
          applicationStage, handledBy,
          country,
          escapeString(trimmedSearch),
        )
      : await getFilteredSpouseApplications(
          username, role,
          page, limit,
          startDate, endDate,
          giveMine, recentActivity,
          applicationStage, handledBy,
          country,
        );

    if (!filteredApplications.length) {
      res.json({
        data: [],
        pagination: { currentPage: page, totalPages: 0, totalRecords: 0, limit },
      });
      return;
    }

    const recordIds = filteredApplications.map(app => app.id);

    const [attachmentCounts, onboardingMap] = await Promise.all([
      dmsZohoDocument.aggregate([
        { $match: { record_id: { $in: recordIds } } },
        { $group: { _id: '$record_id', count: { $sum: 1 } } },
      ]) as Promise<Array<{ _id: string; count: number }>>,
      fetchOnboardingMap(recordIds),
    ]);

    const countMap = new Map((attachmentCounts as Array<{ _id: string; count: number }>).map(item => [item._id, item.count]));

    const data = filteredApplications.map(app => ({
      ...app,
      AttachmentCount:        countMap.get(app.id) || 0,
      application_onboarding: buildOnboardingStatus(onboardingMap.get(app.id) ?? null),
    }));

    res.json({
      data,
      pagination: {
        currentPage:  page,
        totalPages:   Math.ceil(info.count / limit),
        totalRecords: info.count,
        limit,
      },
    });
  } catch (err) {
    const error = err as { response?: { data?: unknown }; message?: string; stack?: string };
    logger.error('[SpouseApplications] Error fetching spouse applications', {
      message: error.response?.data || error.message,
      stack:   error.stack,
    });
    res.status(500).json({
      error:   'Failed to fetch spouse applications',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getSpouseVisaApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationId = req.params.id as string;

    const { data: zohoResponseData } = await zohoRequest('coql', 'POST', {
      select_query: buildSpouseApplicationDetailQuery(applicationId),
    });

    if (!zohoResponseData || zohoResponseData.length === 0) {
      res.status(404).send('Visa application not found');
      return;
    }

    const application = zohoResponseData[0] as ZohoRecord;
    const record_id   = application.id;

    const [documentsCount, client, qcRequest] = await Promise.all([
      dmsZohoDocument.countDocuments({ record_id }),
      DmsZohoClient.findOne({ lead_id: record_id })
        .select('notes online_status last_communication_activity last_communication_provider clerk_id clerk_invitation_id account_status email_verified deadline_extensions')
        .lean() as Promise<Record<string, unknown> | null>,
      QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
        .select('_id status requested_at requested_by requested_to')
        .lean() as Promise<Record<string, unknown> | null>,
    ]);

    res.json({
      data: {
        ...application,
        AttachmentCount:             documentsCount,
        notes:                       (client as Record<string, unknown> | null)?.notes ?? [],
        online_status:               (client as Record<string, unknown> | null)?.online_status ?? false,
        last_communication_activity: {
          date:     (client as Record<string, unknown> | null)?.last_communication_activity     ?? null,
          provider: (client as Record<string, unknown> | null)?.last_communication_provider ?? null,
        },
        deadline_extensions:         (client as Record<string, unknown> | null)?.deadline_extensions ?? [],
        qc_requested: qcRequest
          ? {
              qcId:         qcRequest._id,
              status:       qcRequest.status,
              requested_at: qcRequest.requested_at,
              requested_by: qcRequest.requested_by,
              requested_to: qcRequest.requested_to,
            }
          : null,
        application_onboarding: buildOnboardingStatus(client),
      },
    });
  } catch (err) {
    const error = err as { response?: { data?: unknown }; message?: string };
    logger.error('[SpouseApplications] Error fetching spouse application by id', {
      message: error.response?.data || error.message,
    });
    res.status(500).send('Failed to fetch visa application');
  }
};

// ─── Notes CRUD ───────────────────────────────────────────────────────────────

export const getApplicationNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id;
    const client = await DmsZohoClient.findOne({ lead_id: leadId }).select('notes').lean() as Record<string, unknown> | null;
    if (!client) {
      res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
      return;
    }
    res.status(200).json({
      status: 'success',
      data: { notes: (client.notes as unknown[]) || [] },
    });
  } catch (err) {
    const error = err as { message?: string };
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

export const addApplicationNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id;
    let { note } = req.body as { note?: unknown };
    if (note !== undefined) note = typeof note === 'string' ? note.trim() : '';
    if (!note) {
      res.status(400).json({ status: 'fail', message: 'Note text is required and cannot be empty' });
      return;
    }
    if ((note as string).length > 2000) {
      res.status(400).json({ status: 'fail', message: 'Note cannot exceed 2000 characters' });
      return;
    }
    const addedBy = req.user?.username ?? 'Unknown';
    const addedAt = new Date();
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId },
      { $push: { notes: { note, addedBy, addedAt } } },
      { new: true, runValidators: true },
    ).select('notes') as (mongoose.Document & { notes: Array<Record<string, unknown>> }) | null;

    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
      return;
    }
    const newNote = updated.notes[updated.notes.length - 1];

    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_added',
      summary:       `${addedBy} added a note to this application`,
      actor_type:    'staff',
      actor_name:    addedBy,
      actor_role:    req.user?.role ?? null,
    });

    res.status(201).json({
      status: 'success',
      data: { note: newNote, notes: updated.notes },
    });
  } catch (err) {
    const error = err as { message?: string };
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

export const updateApplicationNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId   = req.params.id as string;
    const noteId   = req.params.noteId as string;
    let { note } = req.body as { note?: unknown };
    if (note !== undefined) note = typeof note === 'string' ? note.trim() : '';
    if (!note) {
      res.status(400).json({ status: 'fail', message: 'Note text is required and cannot be empty' });
      return;
    }
    if ((note as string).length > 2000) {
      res.status(400).json({ status: 'fail', message: 'Note cannot exceed 2000 characters' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ status: 'fail', message: 'Invalid note id' });
      return;
    }
    const noteObjectId = new mongoose.Types.ObjectId(noteId);
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId, 'notes._id': noteObjectId },
      { $set: { 'notes.$.note': note } },
      { new: true, runValidators: true },
    ).select('notes') as (mongoose.Document & { notes: mongoose.Types.DocumentArray<mongoose.Types.Subdocument> }) | null;

    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Client or note not found for this application' });
      return;
    }
    const updatedNote = updated.notes.id(noteId);

    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_updated',
      summary:       `${req.user?.username ?? 'Unknown'} updated a note on this application`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
    });

    res.status(200).json({
      status: 'success',
      data: { note: updatedNote, notes: updated.notes },
    });
  } catch (err) {
    const error = err as { message?: string };
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

export const deleteApplicationNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId   = req.params.id as string;
    const noteId   = req.params.noteId as string;
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ status: 'fail', message: 'Invalid note id' });
      return;
    }
    const noteObjectId = new mongoose.Types.ObjectId(noteId);
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId },
      { $pull: { notes: { _id: noteObjectId } } },
      { new: true },
    ).select('notes') as (mongoose.Document & { notes: unknown[] }) | null;

    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
      return;
    }

    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_deleted',
      summary:       `${req.user?.username ?? 'Unknown'} deleted a note from this application`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
    });

    res.status(200).json({
      status: 'success',
      data: { notes: updated.notes },
    });
  } catch (err) {
    const error = err as { message?: string };
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};
