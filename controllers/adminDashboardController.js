const DmsZohoClient = require('../models/dmsZohoClient');
const QualityCheckRequest = require('../models/qualityCheckRequest');
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { ADMIN_ROLES } = require('./helper/constants');

// Month-over-month growth %
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const DASHBOARD_CACHE_TTL_MS = 60_000;
let cachedDashboard = null;

function getUtcMonthRange(now, monthOffset = 0) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + monthOffset;
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

const getAdminDashboardStats = async (req, res) => {
  try {
    // Restrict to elevated admin roles only
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 60s cache (dashboard is not real-time; reduces DB load).
    if (cachedDashboard && Date.now() - cachedDashboard.createdAt < DASHBOARD_CACHE_TTL_MS) {
      return res.json(cachedDashboard.payload);
    }

    const now = new Date();
    const { start: currentStart, end: currentEnd } = getUtcMonthRange(now, 0);
    const { start: prevStart, end: prevEnd } = getUtcMonthRange(now, -1);

    const createdAtExpr = { $ifNull: ['$zoho_created_time', '$created_at'] };

    const statsPromise = DmsZohoClient.aggregate([
      { $addFields: { __created_at: createdAtExpr } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: '$record_type',
                count: { $sum: 1 },
              },
            },
          ],
          currentMonth: [
            { $match: { __created_at: { $gte: currentStart, $lte: currentEnd } } },
            { $count: 'total' },
          ],
          previousMonth: [
            { $match: { __created_at: { $gte: prevStart, $lte: prevEnd } } },
            { $count: 'total' },
          ],
          recent: [
            { $sort: { __created_at: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                Name: '$name',
                id: '$lead_id',
                Application_Handled_By: '$lead_owner',
                Created_Time: '$__created_at',
                Email: '$email',
                Phone: '$phone',
                Application_Stage: '$application_stage',
                DMS_Application_Status: '$dms_application_status',
                Qualified_Country: '$qualified_country',
                type: {
                  $cond: [{ $eq: ['$record_type', 'visa_application'] }, 'main', 'spouse'],
                },
              },
            },
          ],
        },
      },
    ]);

    const qcCountsPromise = QualityCheckRequest.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingReviewsPromise = dmsZohoDocument.aggregate([
      { $match: { 'requested_reviews.status': 'pending' } },
      { $unwind: '$requested_reviews' },
      { $match: { 'requested_reviews.status': 'pending' } },
      { $count: 'total' },
    ]);

    const [statsArr, qcBuckets, pendingReviewResult] = await Promise.all([
      statsPromise,
      qcCountsPromise,
      pendingReviewsPromise,
    ]);

    const stats = statsArr?.[0] || {};
    const totalsBuckets = Array.isArray(stats.totals) ? stats.totals : [];
    const totalByType = new Map(totalsBuckets.map((b) => [b._id, b.count]));

    const totalMain = totalByType.get('visa_application') || 0;
    const totalSpouse = totalByType.get('spouse_skill_assessment') || 0;

    const currentMonthTotal = stats.currentMonth?.[0]?.total || 0;
    const prevMonthTotal = stats.previousMonth?.[0]?.total || 0;

    const qcByRecordType = new Map((qcBuckets || []).map((b) => [b._id, b.count]));
    const qualityCheckMain = qcByRecordType.get('Visa_Applications') || 0;
    const qualityCheckSpouse = qcByRecordType.get('Spouse_Skill_Assessment') || 0;

    const payload = {
      totalApplications: {
        total: totalMain + totalSpouse,
        main: totalMain,
        spouse: totalSpouse,
      },
      qualityCheck: {
        total: qualityCheckMain + qualityCheckSpouse,
        main: qualityCheckMain,
        spouse: qualityCheckSpouse,
      },
      pendingReviews: pendingReviewResult?.[0]?.total || 0,
      monthlyStats: {
        currentMonth: currentMonthTotal,
        previousMonth: prevMonthTotal,
        growthPercent: calculateGrowth(currentMonthTotal, prevMonthTotal),
      },
      recentApplications: stats.recent || [],
    };

    cachedDashboard = { createdAt: Date.now(), payload };
    return res.json(payload);

  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = { getAdminDashboardStats };
