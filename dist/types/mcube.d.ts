export type McubeDialStatus = 'ANSWER' | 'CANCEL' | 'EXECUTIVE BUSY' | 'Executive Busy' | 'Busy' | 'NoAnswer';
export type McubeDirection = 'inbound' | 'outbound';
export type McubeDisconnectedBy = 'Customer' | 'Agent';
/**
 * Payload delivered by MCube for both On Call and On Hangup events.
 * On Call  → endtime, filename, disconnectedby, answeredtime are absent.
 * On Hangup → all fields are present.
 */
export interface McubeInboundPayload {
    /** Unique identifier for every call */
    callid: string;
    /** Call start time — "YYYY-MM-DD HH:MM:SS" */
    starttime: string;
    /** Call end time — present only on On Hangup — "YYYY-MM-DD HH:MM:SS" */
    endtime?: string;
    /** Agent/executive phone number */
    emp_phone: string;
    /** MCube DID (Direct Inward Dialing) number */
    clicktocalldid: string;
    /** Customer phone number */
    callto: string;
    /** Dial outcome */
    dialstatus: McubeDialStatus;
    /** S3 recording URL — present only on On Hangup */
    filename?: string;
    /** Always "inbound" for this webhook */
    direction: McubeDirection;
    /** Who disconnected — present only on On Hangup */
    disconnectedby?: McubeDisconnectedBy;
    /** Duration until answered — "HH:MM:SS" — present only on On Hangup */
    answeredtime?: string;
    /** Call group (e.g. "Integration", "Inbound") */
    groupname: string;
    /** Name of the handling agent */
    agentname: string;
}
/** Body for initiating an outbound call via MCube REST API */
export interface McubeOutboundRequest {
    /** Agent/executive phone number */
    exenumber: string;
    /** Customer phone number */
    custnumber: string;
    /** Callback URL or MCube default (1) */
    refurl?: string | number;
    /** Optional reference ID for external tracking */
    refid?: string;
}
