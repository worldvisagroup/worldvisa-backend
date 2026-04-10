import { McubeOutboundRequest } from '../../types/mcube';
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
export declare function initiateOutboundCall(params: McubeOutboundRequest): Promise<void>;
