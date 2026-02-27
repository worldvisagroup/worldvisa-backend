const { zohoRequest } = require('./zohoDms/zohoApi');
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { ADMIN_ROLES } = require('./helper/constants');

// Format JS Date → Zoho COQL date string (YYYY-MM-DDTHH:mm:ss+00:00)
function toZohoDate(date) {
  return date.toISOString().slice(0, 19) + '+00:00';
}

// Month-over-month growth %
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Extract COUNT result from Zoho COQL response
function extractCount(response) {
  return response?.data?.[0]?.total || 0;
}

const getAdminDashboardStats = async (req, res) => {
  try {
    // Restrict to elevated admin roles only
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build date ranges using UTC
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    const currentMonthStart = toZohoDate(new Date(Date.UTC(y, m, 1)));
    const currentMonthEnd   = toZohoDate(new Date(Date.UTC(y, m + 1, 0, 23, 59, 59)));
    const prevMonthStart    = toZohoDate(new Date(Date.UTC(y, m - 1, 1)));
    const prevMonthEnd      = toZohoDate(new Date(Date.UTC(y, m, 0, 23, 59, 59)));

    const coql = (query) => zohoRequest('coql', 'POST', { select_query: query });

    // All 11 queries run in parallel
    const [
      mainTotalRes,
      spouseTotalRes,
      mainQCRes,
      spouseQCRes,
      mainCurrMonthRes,
      spouseCurrMonthRes,
      mainPrevMonthRes,
      spousePrevMonthRes,
      recentMainRes,
      recentSpouseRes,
      pendingReviewResult,
    ] = await Promise.all([
      // 1-2: Total counts
      coql(`select COUNT(id) as total from Visa_Applications where id is not null`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where id is not null`),

      // 3-4: Quality check counts (Quality_Check_From is set = awaiting quality check)
      coql(`select COUNT(id) as total from Visa_Applications where Quality_Check_From is not null`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where Quality_Check_From is not null`),

      // 5-6: Current month application counts
      coql(`select COUNT(id) as total from Visa_Applications where (Created_Time >= '${currentMonthStart}' and Created_Time <= '${currentMonthEnd}')`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where (Created_Time >= '${currentMonthStart}' and Created_Time <= '${currentMonthEnd}')`),

      // 7-8: Previous month application counts
      coql(`select COUNT(id) as total from Visa_Applications where (Created_Time >= '${prevMonthStart}' and Created_Time <= '${prevMonthEnd}')`),
      coql(`select COUNT(id) as total from Spouse_Skill_Assessment where (Created_Time >= '${prevMonthStart}' and Created_Time <= '${prevMonthEnd}')`),

      // 9-10: Recent applications (fetch top 10 each, merge + re-sort below)
      coql(`select Name, id, Application_Handled_By, Created_Time, Email, Phone, Application_Stage, DMS_Application_Status, Qualified_Country from Visa_Applications where id is not null order by Created_Time desc limit 10 offset 0`),
      coql(`select Name, id, Application_Handled_By, Created_Time, Email, Phone, Application_Stage, DMS_Application_Status from Spouse_Skill_Assessment where id is not null order by Created_Time desc limit 10 offset 0`),

      // 11: Pending review documents count from MongoDB
      dmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.status': 'pending' } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.status': 'pending' } },
        { $count: 'total' },
      ]),
    ]);

    // Calculate totals
    const totalMain   = extractCount(mainTotalRes);
    const totalSpouse = extractCount(spouseTotalRes);

    const qualityCheckMain   = extractCount(mainQCRes);
    const qualityCheckSpouse = extractCount(spouseQCRes);

    const currentMonthTotal = extractCount(mainCurrMonthRes) + extractCount(spouseCurrMonthRes);
    const prevMonthTotal    = extractCount(mainPrevMonthRes) + extractCount(spousePrevMonthRes);

    // Combine + sort recent applications by newest first, take top 10
    const recentMain   = (recentMainRes?.data   || []).map(a => ({ ...a, type: 'main' }));
    const recentSpouse = (recentSpouseRes?.data  || []).map(a => ({ ...a, type: 'spouse' }));
    const recentApplications = [...recentMain, ...recentSpouse]
      .sort((a, b) => new Date(b.Created_Time) - new Date(a.Created_Time))
      .slice(0, 10);

    res.json({
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
      pendingReviews: pendingReviewResult[0]?.total || 0,
      monthlyStats: {
        currentMonth: currentMonthTotal,
        previousMonth: prevMonthTotal,
        growthPercent: calculateGrowth(currentMonthTotal, prevMonthTotal),
      },
      recentApplications,
    });

  } catch (err) {
    console.error('Admin dashboard error:', err.response?.data || err.message);

    if (err.response?.status === 401) {
      return res.status(503).json({ error: 'External service authentication failed' });
    }
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Rate limit exceeded. Please retry in a few minutes.' });
    }

    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = { getAdminDashboardStats };
