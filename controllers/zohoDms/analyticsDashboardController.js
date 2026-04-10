'use strict';

const { zohoRequest } = require('./zohoApi');
const dmsZohoDocument = require('../../models/dmsZohoDocument');
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
const ApplicationActivityLog = require('../../models/applicationActivityLog');
const CallLog = require('../../models/callLog');
const ChatMessage = require('../../models/chatMessage');
const Email = require('../../models/email');
const { ADMIN_ROLES } = require('../helper/constants');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format JS Date → Zoho COQL date string */
function toZohoDate(date) {
  return date.toISOString().slice(0, 19) + '+00:00';
}

/** Build current + previous period date ranges */
function buildDateRange(now, periodDays) {
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const periodStart = new Date(now - periodMs);
  const prevPeriodEnd = new Date(periodStart - 1);
  const prevPeriodStart = new Date(prevPeriodEnd - periodMs);
  return { periodStart, prevPeriodStart, prevPeriodEnd };
}

/** Extract COUNT result from Zoho COQL response */
function extractCount(response) {
  return response?.data?.[0]?.total || 0;
}

/** Calculate percentage change between two periods */
function calcChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Group documents from a MongoDB aggregate by day.
 * Expects aggregate pipeline to produce: [{ _id: "YYYY-MM-DD", count: N }]
 */
function buildDayMap(aggregateResult) {
  const map = new Map();
  for (const entry of aggregateResult) {
    map.set(entry._id, entry.count);
  }
  return map;
}

/** Fill a contiguous daily range with zero-padded entries */
function fillDailyRange(periodStart, now, ...dayMaps) {
  const result = [];
  const cursor = new Date(periodStart);
  cursor.setUTCHours(0, 0, 0, 0);

  const endDay = new Date(now);
  endDay.setUTCHours(0, 0, 0, 0);

  while (cursor <= endDay) {
    const key = cursor.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const displayDate = cursor.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const entry = { date: displayDate, timestamp: cursor.toISOString() };
    for (const map of dayMaps) {
      if (map.label && map.values) {
        entry[map.label] = map.values.get(key) || 0;
      }
    }
    result.push(entry);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/** MongoDB $group pipeline to count documents per day (UTC) */
function dailyGroupPipeline(dateField) {
  return {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: `$${dateField}`, timezone: 'UTC' },
      },
      count: { $sum: 1 },
    },
  };
}

/** Categorise applications by deadline proximity (copied from applicationStatsService) */
function categoriseByDeadline(apps) {
  const now = Date.now();
  const MS_PER_DAY = 86_400_000;
  const counts = { total: 0, approaching: 0, overdue: 0, future: 0, noDeadline: 0 };

  for (const app of apps) {
    counts.total++;
    const raw = app.Deadline_For_Lodgment;
    if (!raw) {
      counts.noDeadline++;
      continue;
    }
    const deadline = new Date(raw);
    if (Number.isNaN(deadline.getTime())) {
      counts.noDeadline++;
      continue;
    }
    const daysUntil = Math.ceil((deadline.getTime() - now) / MS_PER_DAY);
    if (daysUntil < 0) counts.overdue++;
    else if (daysUntil <= 30) counts.approaching++;
    else counts.future++;
  }
  return counts;
}

// ─── Controller ───────────────────────────────────────────────────────────────

const getAnalyticsDashboard = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const period = Math.min(Math.max(parseInt(req.query.period) || 30, 7), 90);
    const now = new Date();
    const { periodStart, prevPeriodStart, prevPeriodEnd } = buildDateRange(now, period);

    const coql = (query) => zohoRequest('coql', 'POST', { select_query: query });

    // ── BATCH A: Metric card counts ────────────────────────────────────────

    const [
      mainActiveNow,
      mainActivePrev,
      spouseActiveNow,
      spouseActivePrev,
      onboardedNow,
      onboardedPrev,
      pendingDocsNow,
      overdueAppsMainRes,
      overdueAppsSpouseRes,
    ] = await Promise.all([
      // Active main applications
      coql(`select COUNT(id) as total from Visa_Applications where id is not null`),
      coql(`select COUNT(id) as total from Visa_Applications where (Created_Time <= '${toZohoDate(prevPeriodEnd)}')`),

      // Active spouse applications
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where id is not null`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where (Created_Time <= '${toZohoDate(prevPeriodEnd)}')`),

      // Onboarded clients (account active now)
      DmsZohoClient.countDocuments({ account_status: 'active' }),
      // Onboarded clients at end of previous period
      DmsZohoClient.countDocuments({
        account_status: 'active',
        created_at: { $lte: prevPeriodEnd },
      }),

      // Pending document reviews now
      dmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.status': 'pending' } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.status': 'pending' } },
        { $count: 'total' },
      ]),

      // Overdue: fetch deadline field from Zoho for both modules
      coql(
        `select id, Deadline_For_Lodgment from Visa_Applications where Deadline_For_Lodgment is not null limit 200 offset 0`,
      ),
      coql(
        `select id, Deadline_For_Lodgment from Spouse_Skill_Assessment where Deadline_For_Lodgment is not null limit 200 offset 0`,
      ),
    ]);

    // Compute counts
    const activeAppsNow = extractCount(mainActiveNow) + extractCount(spouseActiveNow);
    const activeAppsPrev = extractCount(mainActivePrev) + extractCount(spouseActivePrev);

    const docsUnderReviewNow = pendingDocsNow[0]?.total || 0;

    // Categorise overdue
    const allDeadlineApps = [
      ...(overdueAppsMainRes?.data || []),
      ...(overdueAppsSpouseRes?.data || []),
    ];
    const deadlineCounts = categoriseByDeadline(allDeadlineApps);
    const overdueNow = deadlineCounts.overdue;

    // ── BATCH B: Time-series & supplementary data ──────────────────────────

    const INTERACTION_TYPES = [
      'document_uploaded',
      'document_status_changed',
      'comment_added',
      'quality_check_requested',
    ];

    const [
      emailDailyRes,
      chatDailyRes,
      callDailyRes,
      inAppDailyRes,
      interactionLogsRes,
      lodgementDailyRes,
      reviewDailyRes,
      activeAgentsRes,
      mainAusRes,
      mainCanRes,
      spouseAusRes,
    ] = await Promise.all([
      // Delivery trend: email
      Email.aggregate([
        { $match: { created_at: { $gte: periodStart } } },
        dailyGroupPipeline('created_at'),
        { $sort: { _id: 1 } },
      ]),

      // Delivery trend: chat
      ChatMessage.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        dailyGroupPipeline('createdAt'),
        { $sort: { _id: 1 } },
      ]),

      // Delivery trend: calls
      CallLog.aggregate([
        { $match: { created_at: { $gte: periodStart } } },
        dailyGroupPipeline('created_at'),
        { $sort: { _id: 1 } },
      ]),

      // Delivery trend: in-app (system-generated activity log entries)
      ApplicationActivityLog.aggregate([
        { $match: { createdAt: { $gte: periodStart }, actor_type: 'system' } },
        dailyGroupPipeline('createdAt'),
        { $sort: { _id: 1 } },
      ]),

      // Interaction trend: 4 activity types grouped by day + type
      ApplicationActivityLog.aggregate([
        { $match: { createdAt: { $gte: periodStart }, activity_type: { $in: INTERACTION_TYPES } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
              type: '$activity_type',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]),

      // Lodgement trend: new applications created
      ApplicationActivityLog.aggregate([
        { $match: { createdAt: { $gte: periodStart }, activity_type: 'application_created' } },
        dailyGroupPipeline('createdAt'),
        { $sort: { _id: 1 } },
      ]),

      // Lodgement trend: document reviews (status changes)
      ApplicationActivityLog.aggregate([
        { $match: { createdAt: { $gte: periodStart }, activity_type: 'document_status_changed' } },
        dailyGroupPipeline('createdAt'),
        { $sort: { _id: 1 } },
      ]),

      // Active agents
      ZohoDmsUser.find({ account_status: 'active' })
        .sort({ online_status: -1, full_name: 1 })
        .select('_id username full_name email role online_status profile_image_url')
        .lean(),

      // Applications by country
      coql(`select COUNT(id) as total from Visa_Applications where Qualified_Country = 'Australia'`),
      coql(`select COUNT(id) as total from Visa_Applications where Qualified_Country = 'Canada'`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where id is not null`),
    ]);

    // ── Build delivery trend ───────────────────────────────────────────────

    const emailMap = buildDayMap(emailDailyRes);
    const chatMap = buildDayMap(chatDailyRes);
    const callMap = buildDayMap(callDailyRes);
    const inAppMap = buildDayMap(inAppDailyRes);

    const deliveryTrend = [];
    const cursor = new Date(periodStart);
    cursor.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(now);
    endDay.setUTCHours(0, 0, 0, 0);

    while (cursor <= endDay) {
      const key = cursor.toISOString().slice(0, 10);
      deliveryTrend.push({
        date: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        timestamp: cursor.toISOString(),
        email: emailMap.get(key) || 0,
        chat: chatMap.get(key) || 0,
        call: callMap.get(key) || 0,
        inApp: inAppMap.get(key) || 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // ── Build interaction trend ────────────────────────────────────────────

    const interactionMap = new Map();
    for (const entry of interactionLogsRes) {
      const { day, type } = entry._id;
      if (!interactionMap.has(day)) interactionMap.set(day, {});
      interactionMap.get(day)[type] = entry.count;
    }

    const interactionTrend = [];
    const ic = new Date(periodStart);
    ic.setUTCHours(0, 0, 0, 0);
    while (ic <= endDay) {
      const key = ic.toISOString().slice(0, 10);
      const dayData = interactionMap.get(key) || {};
      interactionTrend.push({
        date: ic.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        timestamp: ic.toISOString(),
        documentsUploaded: dayData['document_uploaded'] || 0,
        documentsReviewed: dayData['document_status_changed'] || 0,
        commentsAdded: dayData['comment_added'] || 0,
        qualityChecks: dayData['quality_check_requested'] || 0,
      });
      ic.setUTCDate(ic.getUTCDate() + 1);
    }

    // ── Build lodgement trend ──────────────────────────────────────────────

    const lodgementMap = buildDayMap(lodgementDailyRes);
    const reviewMap = buildDayMap(reviewDailyRes);

    const lodgementTrend = [];
    const lc = new Date(periodStart);
    lc.setUTCHours(0, 0, 0, 0);
    while (lc <= endDay) {
      const key = lc.toISOString().slice(0, 10);
      lodgementTrend.push({
        date: lc.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        timestamp: lc.toISOString(),
        lodgements: lodgementMap.get(key) || 0,
        reviews: reviewMap.get(key) || 0,
      });
      lc.setUTCDate(lc.getUTCDate() + 1);
    }

    // ── Applications by category ───────────────────────────────────────────

    const CATEGORY_COLORS = {
      total: '#818cf8',
      approaching: '#22d3ee',
      overdue: '#fb923c',
      future: '#34d399',
      noDeadline: '#9ca3af',
    };

    const applicationsByCategory = [
      { label: 'All Lodgements', count: deadlineCounts.total, fill: CATEGORY_COLORS.total },
      { label: 'Approaching', count: deadlineCounts.approaching, fill: CATEGORY_COLORS.approaching },
      { label: 'Overdue', count: deadlineCounts.overdue, fill: CATEGORY_COLORS.overdue },
      { label: 'Future', count: deadlineCounts.future, fill: CATEGORY_COLORS.future },
      { label: 'No Deadline', count: deadlineCounts.noDeadline, fill: CATEGORY_COLORS.noDeadline },
    ];

    // ── Active agents ──────────────────────────────────────────────────────

    const activeAgents = activeAgentsRes.map((u) => ({
      id: String(u._id),
      username: u.username || '',
      fullName: u.full_name || u.username || '',
      email: u.email || '',
      role: u.role || '',
      onlineStatus: u.online_status ? 'online' : 'offline',
      profileImageUrl: u.profile_image_url || null,
    }));

    // ── Applications by country ────────────────────────────────────────────

    const australiaMain = extractCount(mainAusRes);
    const canadaMain = extractCount(mainCanRes);
    const australiaSpouse = extractCount(spouseAusRes); // all spouse apps → Australia

    const applicationsByCountry = [
      {
        country: 'Australia',
        main: australiaMain,
        spouse: australiaSpouse,
        total: australiaMain + australiaSpouse,
        fill: '#818cf8',
      },
      {
        country: 'Canada',
        main: canadaMain,
        spouse: 0,
        total: canadaMain,
        fill: '#22d3ee',
      },
    ];

    // ── Compose response ───────────────────────────────────────────────────

    return res.json({
      period,
      generatedAt: now.toISOString(),
      metrics: {
        activeApplications: {
          currentPeriod: activeAppsNow,
          previousPeriod: activeAppsPrev,
          changePercent: calcChange(activeAppsNow, activeAppsPrev),
        },
        onboardedApplicants: {
          currentPeriod: onboardedNow,
          previousPeriod: onboardedPrev,
          changePercent: calcChange(onboardedNow, onboardedPrev),
        },
        docsUnderReview: {
          currentPeriod: docsUnderReviewNow,
          previousPeriod: docsUnderReviewNow, // no historical snapshot — same value
          changePercent: 0,
        },
        overdueApplications: {
          currentPeriod: overdueNow,
          previousPeriod: overdueNow,
          changePercent: 0,
        },
      },
      deliveryTrend,
      applicationsByCategory,
      interactionTrend,
      lodgementTrend,
      activeAgents,
      applicationsByCountry,
    });
  } catch (err) {
    console.error('Analytics dashboard error:', err.response?.data || err.message);

    if (err.response?.status === 401) {
      return res.status(503).json({ error: 'External service authentication failed' });
    }
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Rate limit exceeded. Please retry.' });
    }

    return res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = { getAnalyticsDashboard };
