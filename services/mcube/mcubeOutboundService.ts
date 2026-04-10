import { McubeOutboundRequest } from '../../types/mcube';

const logger = require('../../utils/logger');

const MCUBE_OUTBOUND_URL = 'https://api.mcube.com/Restmcube-api/outbound-calls';

/**
 * Initiate an outbound call via the MCube REST API.
 *
 * We do NOT create a CallLog here. MCube will fire On Call and On Hangup
 * webhook events (with its own real callid) to our webhook endpoint, which
 * persists the CallLog naturally — same as inbound calls.
 *
 * refurl is set to our webhook URL so MCube delivers outbound call events
 * back to the same handler.
 */
export async function initiateOutboundCall(params: McubeOutboundRequest): Promise<void> {
  const token = process.env.MCUBE_API_TOKEN;
  if (!token) throw new Error('MCUBE_API_TOKEN is not configured');

  const body = {
    HTTP_AUTHORIZATION: token,
    exenumber: params.exenumber,
    custnumber: params.custnumber,
    refurl:    params.refurl ?? 1,
    ...(params.refid ? { refid: params.refid } : {}),
  };

  const response = await fetch(MCUBE_OUTBOUND_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`MCube API error ${response.status}: ${text}`);
  }

  logger.info('[MCube] Outbound call initiated — awaiting webhook events', {
    exenumber: params.exenumber,
    custnumber: params.custnumber,
  });
}
