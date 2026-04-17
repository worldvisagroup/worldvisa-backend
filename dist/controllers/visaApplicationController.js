"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApplicationNote = exports.updateApplicationNote = exports.addApplicationNote = exports.getApplicationNotes = exports.getSpouseVisaApplicationById = exports.getSpouseApplicationsWithAttachments = exports.getVisaApplication = exports.getVisaApplicationById = exports.getApplicationsWithAttachments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const checklistDocument_1 = require("../constants/checklistDocument");
const visaApplication_1 = require("../constants/visaApplication");
const dmsZohoDocument = require('../models/dmsZohoDocument');
const DmsZohoClient = require('../models/dmsZohoClient');
const ZohoDmsUser = require('../models/zohoDmsUser');
const QualityCheckRequest = require('../models/qualityCheckRequest');
const { addActivityLog } = require('./helper/service/activityLog');
const logger = require('../utils/logger');
const { SUPPORTED_COUNTRIES, SEARCH_TERM_MAX_LENGTH, } = require('./helper/constants.js');
const { sanitizeSearchTerm, escapeString } = require('../utils/querySanitizer.js');
// ─── Module constants ─────────────────────────────────────────────────────────
const VALID_SERVICE_TYPES = checklistDocument_1.VISA_SERVICE_TYPE_VALUES.filter((v) => v !== 'All');
const VISA_APPLICATION_LIST_SELECT = 'lead_id name email phone record_type lead_owner application_stage application_state qualified_country service_type recent_activity zoho_created_time created_at deadline_for_lodgment assessing_authority suggested_anzsco send_check_list package_finalize spouse_name spouse_skill_assessment main_applicant zoho_modified_time';
const SPOUSE_APPLICATION_LIST_SELECT = 'lead_id name email phone record_type lead_owner application_stage application_state qualified_country recent_activity zoho_created_time created_at deadline_for_lodgment assessing_authority suggested_anzsco send_check_list package_finalize spouse_name spouse_skill_assessment main_applicant zoho_modified_time quality_check_from dms_application_status checklist_requested service_type';
// ─── Route handlers ───────────────────────────────────────────────────────────
const getApplicationsWithAttachments = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, serviceType, } = req.query;
        const country = req.query.country || 'Australia';
        if (!(0, visaApplication_1.isVisaApplicationCountry)(country)) {
            res.status(400).json({ error: 'Invalid country parameter. Provide a valid country name.' });
            return;
        }
        const hasSearchParam = Object.prototype.hasOwnProperty.call(req.query, 'search');
        const rawSearchValue = hasSearchParam && typeof req.query.search === 'string' ? req.query.search : '';
        const trimmedSearch = sanitizeSearchTerm(hasSearchParam ? rawSearchValue : null, SEARCH_TERM_MAX_LENGTH);
        if (hasSearchParam && !trimmedSearch) {
            res.status(400).json({
                error: 'Invalid search parameter',
                message: `search must be non-empty and at most ${SEARCH_TERM_MAX_LENGTH} characters.`,
            });
            return;
        }
        const username = req.user.username ?? '';
        const role = req.user.role ?? '';
        const { data: filteredApplications, info } = trimmedSearch
            ? await getFilteredVisaApplicationsByUnifiedSearch(username, role, page, limit, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country, escapeString(trimmedSearch), serviceType)
            : await getFilteredVisaApplications(username, role, page, limit, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country, serviceType);
        if (!filteredApplications.length) {
            res.json({
                data: [],
                pagination: { currentPage: page, totalPages: 0, totalRecords: 0, limit },
            });
            return;
        }
        const recordIds = filteredApplications.map((app) => app.id);
        const [attachmentCounts, onboardingMap] = await Promise.all([
            dmsZohoDocument.aggregate([
                { $match: { record_id: { $in: recordIds } } },
                { $group: { _id: '$record_id', count: { $sum: 1 } } },
            ]),
            fetchOnboardingMap(recordIds),
        ]);
        const countMap = new Map(attachmentCounts.map((item) => [item._id, item.count]));
        const data = filteredApplications.map((app) => ({
            ...app,
            AttachmentCount: countMap.get(app.id) || 0,
            application_onboarding: buildOnboardingStatus(onboardingMap.get(app.id) ?? null),
        }));
        res.json({
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(info.count / limit),
                totalRecords: info.count,
                limit,
            },
        });
    }
    catch (err) {
        const error = err;
        logger.error('[VisaApplications] Error fetching visa applications', {
            status: error.response?.status,
            zohoData: error.response?.data,
            message: error.message,
        });
        res.status(500).json({
            error: 'Failed to fetch visa applications',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.getApplicationsWithAttachments = getApplicationsWithAttachments;
const getVisaApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const applicationDoc = (await DmsZohoClient.findOne({
            lead_id: applicationId,
            record_type: 'visa_application',
        }).lean());
        if (!applicationDoc) {
            res.status(404).send('Visa application not found');
            return;
        }
        const application = toZohoVisaRecord(applicationDoc);
        const record_id = application.id;
        const spouseName = applicationDoc.spouse_name?.trim() || null;
        const [documentsCount, client, spouseClient, qcRequest] = await Promise.all([
            dmsZohoDocument.countDocuments({ record_id }),
            DmsZohoClient.findOne({ lead_id: record_id })
                .select('notes online_status last_communication_activity last_communication_provider clerk_id clerk_invitation_id account_status email_verified deadline_extensions')
                .lean(),
            spouseName
                ? DmsZohoClient.findOne({
                    name: new RegExp(`^${escapeRegExp(spouseName)}$`, 'i'),
                    record_type: 'spouse_skill_assessment',
                })
                    .select('lead_id')
                    .lean()
                : Promise.resolve(null),
            QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
                .select('_id status requested_at requested_by requested_to')
                .lean(),
        ]);
        res.json({
            data: {
                ...application,
                AttachmentCount: documentsCount,
                notes: client?.notes ?? [],
                online_status: client?.online_status ?? false,
                last_communication_activity: {
                    date: client?.last_communication_activity ?? null,
                    provider: client?.last_communication_provider ?? null,
                },
                deadline_extensions: client?.deadline_extensions ?? [],
                spouse_lead_id: spouseClient?.lead_id ?? null,
                qc_requested: qcRequest
                    ? {
                        qcId: qcRequest._id,
                        status: qcRequest.status,
                        requested_at: qcRequest.requested_at,
                        requested_by: qcRequest.requested_by,
                        requested_to: qcRequest.requested_to,
                    }
                    : null,
                application_onboarding: buildOnboardingStatus(client),
            },
        });
    }
    catch (err) {
        const error = err;
        logger.error('[VisaApplications] Error fetching visa application by id', {
            message: error.response?.data || error.message,
        });
        res.status(500).send('Failed to fetch visa application');
    }
};
exports.getVisaApplicationById = getVisaApplicationById;
const getVisaApplication = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const applicationId = req.user.lead_id ?? '';
        const recordType = req.user.record_type;
        const applicationDoc = (await DmsZohoClient.findOne({
            lead_id: applicationId,
            record_type: recordType,
        })
            .select('lead_id name email phone record_type lead_owner application_stage application_state qualified_country service_type recent_activity zoho_created_time created_at deadline_for_lodgment assessing_authority suggested_anzsco send_check_list package_finalize spouse_name spouse_skill_assessment main_applicant zoho_modified_time deadline_extensions')
            .lean());
        if (!applicationDoc) {
            res.status(404).send('Visa application not found');
            return;
        }
        const application = toZohoVisaRecord(applicationDoc);
        const recordId = application.id;
        const documentsCount = await dmsZohoDocument.countDocuments({ record_id: recordId });
        const deadline_extensions = (applicationDoc?.deadline_extensions ??
            []);
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
    }
    catch (err) {
        const error = err;
        logger.error('[VisaApplications] Error fetching client visa application', {
            message: error.response?.data || error.message,
        });
        res.status(500).send('Failed to fetch visa application');
    }
};
exports.getVisaApplication = getVisaApplication;
const getSpouseApplicationsWithAttachments = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { startDate, endDate, giveMine, recentActivity, applicationStage, handledBy } = req.query;
        const country = req.query.country || 'Australia';
        if (!SUPPORTED_COUNTRIES.includes(country)) {
            res.status(400).json({
                error: `Invalid country parameter. Supported values: ${SUPPORTED_COUNTRIES.join(', ')}`,
            });
            return;
        }
        const hasSearchParam = Object.prototype.hasOwnProperty.call(req.query, 'search');
        const rawSearchValue = hasSearchParam && typeof req.query.search === 'string' ? req.query.search : '';
        const trimmedSearch = sanitizeSearchTerm(hasSearchParam ? rawSearchValue : null, SEARCH_TERM_MAX_LENGTH);
        if (hasSearchParam && !trimmedSearch) {
            res.status(400).json({
                error: 'Invalid search parameter',
                message: `search must be non-empty and at most ${SEARCH_TERM_MAX_LENGTH} characters.`,
            });
            return;
        }
        const username = req.user.username ?? '';
        const role = req.user.role ?? '';
        const { data: filteredApplications, info } = trimmedSearch
            ? await getFilteredSpouseApplicationsByUnifiedSearch(username, role, page, limit, startDate, endDate, giveMine, recentActivity, applicationStage, handledBy, country, escapeString(trimmedSearch))
            : await getFilteredSpouseApplications(username, role, page, limit, startDate, endDate, giveMine, recentActivity, applicationStage, handledBy, country);
        if (!filteredApplications.length) {
            res.json({
                data: [],
                pagination: { currentPage: page, totalPages: 0, totalRecords: 0, limit },
            });
            return;
        }
        const recordIds = filteredApplications.map((app) => app.id);
        const [attachmentCounts, onboardingMap] = await Promise.all([
            dmsZohoDocument.aggregate([
                { $match: { record_id: { $in: recordIds } } },
                { $group: { _id: '$record_id', count: { $sum: 1 } } },
            ]),
            fetchOnboardingMap(recordIds),
        ]);
        const countMap = new Map(attachmentCounts.map((item) => [item._id, item.count]));
        const data = filteredApplications.map((app) => ({
            ...app,
            AttachmentCount: countMap.get(app.id) || 0,
            application_onboarding: buildOnboardingStatus(onboardingMap.get(app.id) ?? null),
        }));
        res.json({
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(info.count / limit),
                totalRecords: info.count,
                limit,
            },
        });
    }
    catch (err) {
        const error = err;
        logger.error('[SpouseApplications] Error fetching spouse applications', {
            message: error.response?.data || error.message,
            stack: error.stack,
        });
        res.status(500).json({
            error: 'Failed to fetch spouse applications',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.getSpouseApplicationsWithAttachments = getSpouseApplicationsWithAttachments;
const getSpouseVisaApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const applicationDoc = (await DmsZohoClient.findOne({
            lead_id: applicationId,
            record_type: 'spouse_skill_assessment',
        }).lean());
        if (!applicationDoc) {
            res.status(404).send('Visa application not found');
            return;
        }
        const application = toZohoVisaRecord(applicationDoc);
        const record_id = application.id;
        const [documentsCount, client, qcRequest] = await Promise.all([
            dmsZohoDocument.countDocuments({ record_id }),
            DmsZohoClient.findOne({ lead_id: record_id })
                .select('notes online_status last_communication_activity last_communication_provider clerk_id clerk_invitation_id account_status email_verified deadline_extensions')
                .lean(),
            QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
                .select('_id status requested_at requested_by requested_to')
                .lean(),
        ]);
        res.json({
            data: {
                ...application,
                AttachmentCount: documentsCount,
                notes: client?.notes ?? [],
                online_status: client?.online_status ?? false,
                last_communication_activity: {
                    date: client?.last_communication_activity ?? null,
                    provider: client?.last_communication_provider ?? null,
                },
                deadline_extensions: client?.deadline_extensions ?? [],
                qc_requested: qcRequest
                    ? {
                        qcId: qcRequest._id,
                        status: qcRequest.status,
                        requested_at: qcRequest.requested_at,
                        requested_by: qcRequest.requested_by,
                        requested_to: qcRequest.requested_to,
                    }
                    : null,
                application_onboarding: buildOnboardingStatus(client),
            },
        });
    }
    catch (err) {
        const error = err;
        logger.error('[SpouseApplications] Error fetching spouse application by id', {
            message: error.response?.data || error.message,
        });
        res.status(500).send('Failed to fetch visa application');
    }
};
exports.getSpouseVisaApplicationById = getSpouseVisaApplicationById;
const getApplicationNotes = async (req, res) => {
    try {
        const leadId = req.params.id;
        const client = (await DmsZohoClient.findOne({ lead_id: leadId }).select('notes').lean());
        if (!client) {
            res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: { notes: client.notes || [] },
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};
exports.getApplicationNotes = getApplicationNotes;
const addApplicationNote = async (req, res) => {
    try {
        const leadId = req.params.id;
        let { note } = req.body;
        if (note !== undefined)
            note = typeof note === 'string' ? note.trim() : '';
        if (!note) {
            res.status(400).json({ status: 'fail', message: 'Note text is required and cannot be empty' });
            return;
        }
        if (note.length > 2000) {
            res.status(400).json({ status: 'fail', message: 'Note cannot exceed 2000 characters' });
            return;
        }
        const addedBy = req.user?.username ?? 'Unknown';
        const addedAt = new Date();
        const updated = (await DmsZohoClient.findOneAndUpdate({ lead_id: leadId }, { $push: { notes: { note, addedBy, addedAt } } }, { new: true, runValidators: true }).select('notes'));
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
            return;
        }
        const newNote = updated.notes[updated.notes.length - 1];
        addActivityLog({
            lead_id: leadId,
            activity_type: 'note_added',
            summary: `${addedBy} added a note to this application`,
            actor_type: 'staff',
            actor_name: addedBy,
            actor_role: req.user?.role ?? null,
        });
        res.status(201).json({
            status: 'success',
            data: { note: newNote, notes: updated.notes },
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};
exports.addApplicationNote = addApplicationNote;
const updateApplicationNote = async (req, res) => {
    try {
        const leadId = req.params.id;
        const noteId = req.params.noteId;
        let { note } = req.body;
        if (note !== undefined)
            note = typeof note === 'string' ? note.trim() : '';
        if (!note) {
            res.status(400).json({ status: 'fail', message: 'Note text is required and cannot be empty' });
            return;
        }
        if (note.length > 2000) {
            res.status(400).json({ status: 'fail', message: 'Note cannot exceed 2000 characters' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(noteId)) {
            res.status(400).json({ status: 'fail', message: 'Invalid note id' });
            return;
        }
        const noteObjectId = new mongoose_1.default.Types.ObjectId(noteId);
        const updated = (await DmsZohoClient.findOneAndUpdate({ lead_id: leadId, 'notes._id': noteObjectId }, { $set: { 'notes.$.note': note } }, { new: true, runValidators: true }).select('notes'));
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Client or note not found for this application' });
            return;
        }
        const updatedNote = updated.notes.id(noteId);
        addActivityLog({
            lead_id: leadId,
            activity_type: 'note_updated',
            summary: `${req.user?.username ?? 'Unknown'} updated a note on this application`,
            actor_type: 'staff',
            actor_name: req.user?.username ?? 'Unknown',
            actor_role: req.user?.role ?? null,
        });
        res.status(200).json({
            status: 'success',
            data: { note: updatedNote, notes: updated.notes },
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};
exports.updateApplicationNote = updateApplicationNote;
const deleteApplicationNote = async (req, res) => {
    try {
        const leadId = req.params.id;
        const noteId = req.params.noteId;
        if (!mongoose_1.default.Types.ObjectId.isValid(noteId)) {
            res.status(400).json({ status: 'fail', message: 'Invalid note id' });
            return;
        }
        const noteObjectId = new mongoose_1.default.Types.ObjectId(noteId);
        const updated = (await DmsZohoClient.findOneAndUpdate({ lead_id: leadId }, { $pull: { notes: { _id: noteObjectId } } }, { new: true }).select('notes'));
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
            return;
        }
        addActivityLog({
            lead_id: leadId,
            activity_type: 'note_deleted',
            summary: `${req.user?.username ?? 'Unknown'} deleted a note from this application`,
            actor_type: 'staff',
            actor_name: req.user?.username ?? 'Unknown',
            actor_role: req.user?.role ?? null,
        });
        res.status(200).json({
            status: 'success',
            data: { notes: updated.notes },
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};
exports.deleteApplicationNote = deleteApplicationNote;
// ─── List / filter (Mongo) ────────────────────────────────────────────────────
async function getFilteredVisaApplications(username, role, page, limit, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country, serviceType) {
    const offset = (page - 1) * limit;
    const query = {
        record_type: 'visa_application',
        qualified_country: country,
    };
    const trimmedApplicationState = typeof applicationState === 'string' ? applicationState.trim() : '';
    if (trimmedApplicationState) {
        query.application_state = trimmedApplicationState;
    }
    const normalizedServiceType = typeof serviceType === 'string' ? serviceType.trim() : '';
    if (normalizedServiceType && VALID_SERVICE_TYPES.includes(normalizedServiceType)) {
        query.service_type = normalizedServiceType;
    }
    else {
        query.service_type = { $in: VALID_SERVICE_TYPES };
    }
    if (role === 'admin' || giveMine === 'true') {
        query.lead_owner = leadOwnerMatchUser(username);
    }
    if (role === 'master_admin' && handledBy) {
        const handledByList = handledBy.split(',').map((h) => h.trim()).filter(Boolean);
        if (handledByList.length) {
            query.lead_owner = {
                $in: handledByList.map((h) => new RegExp(`^${escapeRegExp(h)}$`, 'i')),
            };
        }
    }
    if (applicationStage) {
        const stages = applicationStage.split(',').map((s) => s.trim()).filter(Boolean);
        if (stages.length)
            query.application_stage = { $in: stages };
    }
    const createdRange = buildUtcDayRange(startDate, endDate);
    if (createdRange)
        query.zoho_created_time = createdRange;
    const sortField = recentActivity === 'false' ? 'zoho_created_time' : 'recent_activity';
    const sort = { [sortField]: -1, _id: -1 };
    const [count, rows] = await Promise.all([
        DmsZohoClient.countDocuments(query),
        DmsZohoClient.find(query).select(VISA_APPLICATION_LIST_SELECT).sort(sort).skip(offset).limit(limit).lean(),
    ]);
    return {
        data: rows.map(toZohoVisaRecord),
        info: { count: count || 0 },
    };
}
async function getFilteredVisaApplicationsByUnifiedSearch(username, role, page, limit, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country, escapedSearch, serviceType) {
    const offset = (page - 1) * limit;
    const query = {
        record_type: 'visa_application',
        qualified_country: country,
    };
    const trimmedApplicationStateSearch = typeof applicationState === 'string' ? applicationState.trim() : '';
    if (trimmedApplicationStateSearch) {
        query.application_state = trimmedApplicationStateSearch;
    }
    const normalizedServiceType = typeof serviceType === 'string' ? serviceType.trim() : '';
    if (normalizedServiceType && VALID_SERVICE_TYPES.includes(normalizedServiceType)) {
        query.service_type = normalizedServiceType;
    }
    else {
        query.service_type = { $in: VALID_SERVICE_TYPES };
    }
    if (role === 'admin' || giveMine === 'true') {
        query.lead_owner = leadOwnerMatchUser(username);
    }
    if (role === 'master_admin' && handledBy) {
        const handledByList = handledBy.split(',').map((h) => h.trim()).filter(Boolean);
        if (handledByList.length) {
            query.lead_owner = {
                $in: handledByList.map((h) => new RegExp(`^${escapeRegExp(h)}$`, 'i')),
            };
        }
    }
    if (applicationStage) {
        const stages = applicationStage.split(',').map((s) => s.trim()).filter(Boolean);
        if (stages.length)
            query.application_stage = { $in: stages };
    }
    const createdRange = buildUtcDayRange(startDate, endDate);
    if (createdRange)
        query.zoho_created_time = createdRange;
    const safe = escapeRegExp(escapedSearch);
    const re = new RegExp(safe, 'i');
    query.$or = [{ name: re }, { email: re }, { phone: re }];
    const sortField = recentActivity === 'false' ? 'zoho_created_time' : 'recent_activity';
    const sort = { [sortField]: -1, _id: -1 };
    const [count, rows] = await Promise.all([
        DmsZohoClient.countDocuments(query),
        DmsZohoClient.find(query).select(VISA_APPLICATION_LIST_SELECT).sort(sort).skip(offset).limit(limit).lean(),
    ]);
    return {
        data: rows.map(toZohoVisaRecord),
        info: { count: count || 0 },
    };
}
async function getFilteredSpouseApplications(username, role, page, limit, startDate, endDate, giveMine, recentActivity, applicationStage, handledBy, country) {
    const offset = (page - 1) * limit;
    const query = {
        record_type: 'spouse_skill_assessment',
        qualified_country: country,
    };
    if (role === 'admin' || giveMine === 'true') {
        query.lead_owner = leadOwnerMatchUser(username);
    }
    if (role === 'master_admin' && handledBy) {
        const handledByList = handledBy.split(',').map((h) => h.trim()).filter(Boolean);
        if (handledByList.length) {
            query.lead_owner = {
                $in: handledByList.map((h) => new RegExp(`^${escapeRegExp(h)}$`, 'i')),
            };
        }
    }
    if (applicationStage) {
        const stages = applicationStage.split(',').map((s) => s.trim()).filter(Boolean);
        if (stages.length)
            query.application_stage = { $in: stages };
    }
    const createdRange = buildUtcDayRange(startDate, endDate);
    if (createdRange)
        query.zoho_created_time = createdRange;
    const sortField = recentActivity === 'false' ? 'zoho_created_time' : 'recent_activity';
    const sort = { [sortField]: -1, _id: -1 };
    const [count, rows] = await Promise.all([
        DmsZohoClient.countDocuments(query),
        DmsZohoClient.find(query).select(SPOUSE_APPLICATION_LIST_SELECT).sort(sort).skip(offset).limit(limit).lean(),
    ]);
    return {
        data: rows.map(toZohoVisaRecord),
        info: { count: count || 0 },
    };
}
async function getFilteredSpouseApplicationsByUnifiedSearch(username, role, page, limit, startDate, endDate, giveMine, recentActivity, applicationStage, handledBy, country, escapedSearch) {
    const offset = (page - 1) * limit;
    const query = {
        record_type: 'spouse_skill_assessment',
        qualified_country: country,
    };
    if (role === 'admin' || giveMine === 'true') {
        query.lead_owner = leadOwnerMatchUser(username);
    }
    if (role === 'master_admin' && handledBy) {
        const handledByList = handledBy.split(',').map((h) => h.trim()).filter(Boolean);
        if (handledByList.length) {
            query.lead_owner = {
                $in: handledByList.map((h) => new RegExp(`^${escapeRegExp(h)}$`, 'i')),
            };
        }
    }
    if (applicationStage) {
        const stages = applicationStage.split(',').map((s) => s.trim()).filter(Boolean);
        if (stages.length)
            query.application_stage = { $in: stages };
    }
    const createdRange = buildUtcDayRange(startDate, endDate);
    if (createdRange)
        query.zoho_created_time = createdRange;
    const safe = escapeRegExp(escapedSearch);
    const re = new RegExp(safe, 'i');
    query.$or = [{ name: re }, { email: re }, { phone: re }];
    const sortField = recentActivity === 'false' ? 'zoho_created_time' : 'recent_activity';
    const sort = { [sortField]: -1, _id: -1 };
    const [count, rows] = await Promise.all([
        DmsZohoClient.countDocuments(query),
        DmsZohoClient.find(query).select(SPOUSE_APPLICATION_LIST_SELECT).sort(sort).skip(offset).limit(limit).lean(),
    ]);
    return {
        data: rows.map(toZohoVisaRecord),
        info: { count: count || 0 },
    };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function leadOwnerMatchUser(username) {
    return new RegExp(`^${escapeRegExp(username.trim())}$`, 'i');
}
function toZohoOffsetDateTime(value, offsetMinutes) {
    if (value == null)
        return null;
    if (typeof value === 'string')
        return value;
    const asDate = value instanceof Date ? value : typeof value === 'number' ? new Date(value) : new Date(String(value));
    if (Number.isNaN(asDate.getTime()))
        return null;
    const shifted = new Date(asDate.getTime() + offsetMinutes * 60000);
    const pad2 = (n) => String(n).padStart(2, '0');
    const yyyy = shifted.getUTCFullYear();
    const mm = pad2(shifted.getUTCMonth() + 1);
    const dd = pad2(shifted.getUTCDate());
    const hh = pad2(shifted.getUTCHours());
    const min = pad2(shifted.getUTCMinutes());
    const ss = pad2(shifted.getUTCSeconds());
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const offH = pad2(Math.floor(abs / 60));
    const offM = pad2(abs % 60);
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${sign}${offH}:${offM}`;
}
function toZohoVisaRecord(doc) {
    const leadId = String(doc.lead_id ?? '');
    return {
        id: leadId,
        Name: doc.name ?? null,
        Email: doc.email ?? null,
        Phone: doc.phone ?? null,
        Record_Type: doc.record_type ?? null,
        Application_Handled_By: doc.lead_owner ?? null,
        Application_Stage: doc.application_stage ?? null,
        Application_State: doc.application_state ?? null,
        Qualified_Country: doc.qualified_country ?? null,
        Service_Finalized: doc.service_type ?? null,
        Package_Finalize: doc.package_finalize ?? null,
        Quality_Check_From: doc.quality_check_from ?? null,
        DMS_Application_Status: doc.dms_application_status ?? null,
        Checklist_Requested: doc.checklist_requested ?? false,
        Deadline_For_Lodgment: doc.deadline_for_lodgment ?? null,
        Assessing_Authority: doc.assessing_authority ?? null,
        Suggested_Anzsco: doc.suggested_anzsco ?? null,
        Send_Check_List: doc.send_check_list ?? null,
        Spouse_Name: doc.spouse_name ?? null,
        Spouse_Skill_Assessment: doc.spouse_skill_assessment ?? null,
        Main_Applicant: doc.main_applicant ?? null,
        Recent_Activity: toZohoOffsetDateTime(doc.recent_activity, 330),
        Created_Time: toZohoOffsetDateTime(doc.zoho_created_time ?? doc.created_at, 330),
        Modified_Time: toZohoOffsetDateTime(doc.zoho_modified_time, 330),
    };
}
function buildUtcDayRange(startDate, endDate) {
    if (!startDate && !endDate)
        return null;
    const range = {};
    if (startDate) {
        const d = new Date(`${startDate}T00:00:00.000Z`);
        if (!Number.isNaN(d.getTime()))
            range.$gte = d;
    }
    if (endDate) {
        const d = new Date(`${endDate}T23:59:59.999Z`);
        if (!Number.isNaN(d.getTime()))
            range.$lte = d;
    }
    return Object.keys(range).length ? range : null;
}
async function fetchOnboardingMap(recordIds) {
    const records = (await DmsZohoClient.find({ lead_id: { $in: recordIds } })
        .select('lead_id clerk_id clerk_invitation_id account_status email_verified')
        .lean());
    return new Map(records.map((c) => [c.lead_id, c]));
}
function buildOnboardingStatus(clientRecord) {
    return {
        client_record_exists: clientRecord !== null,
        clerk_id: clientRecord?.clerk_id ?? null,
        clerk_invitation_id: clientRecord?.clerk_invitation_id ?? null,
        account_status: clientRecord?.account_status ?? null,
        email_verified: clientRecord?.email_verified ?? null,
    };
}
async function getProfileImageUrlMap(usernames) {
    const unique = [...new Set(usernames.filter(Boolean))];
    if (!unique.length)
        return {};
    const users = await ZohoDmsUser.find({ username: { $in: unique } }).select('username profile_image_url').lean();
    return Object.fromEntries(users.map((u) => [u.username, u]));
}
