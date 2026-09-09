const axios = require('axios');
const logger = require('../utils/logger');
const { generateHmacSignature } = require('../utils/webhookSignature');
const { buildAndRenderGlobalOpportunitiesReport } = require('../services/global-opportunities-content.service');

async function postWebhook(callbackUrl, payload, maxAttempts = 3) {
  const signature = generateHmacSignature(payload, process.env.GO_WEBHOOK_SECRET);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await axios.post(callbackUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-GO-Report-Signature': signature,
        },
        timeout: 15000,
      });
      return;
    } catch (error) {
      logger.error('GO report webhook callback failed', {
        requestId: payload.requestId,
        versionId: payload.versionId,
        attempt,
        error: error.message,
      });
      if (attempt === maxAttempts) {
        throw error;
      }
      const delay = 5000 * 2 ** (attempt - 1); // 5s, 10s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function processGoReportJob({ requestId, versionId, organizationId, callbackUrl, ...payload }) {
  logger.info('GO report background generation started', { requestId, versionId, countries: payload.countries });

  let webhookPayload;
  try {
    const pdfBuffer = await buildAndRenderGlobalOpportunitiesReport({ ...payload, requestId });

    logger.info('GO report background generation succeeded', {
      requestId,
      versionId,
      sizeKB: Math.round(pdfBuffer.length / 1024),
    });

    webhookPayload = {
      requestId,
      organizationId,
      versionId,
      success: true,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  } catch (error) {
    logger.error('GO report background generation failed', {
      requestId,
      versionId,
      error: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
    });

    webhookPayload = { requestId, organizationId, versionId, success: false, error: error.message };
  }

  try {
    await postWebhook(callbackUrl, webhookPayload);
  } catch (error) {
    // Every retry failed -- the report's outcome (success or failure) is stuck undelivered.
    // Don't retry indefinitely here: the caller's own orphan-check fallback will mark the
    // report FAILED after its deadline, same as it would for any other lost webhook.
    logger.error('GO report webhook callback exhausted all retries; relying on orphan-check fallback', {
      requestId,
      versionId,
      callbackUrl,
      error: error.message,
    });
  }
}

module.exports = { processGoReportJob, postWebhook };
