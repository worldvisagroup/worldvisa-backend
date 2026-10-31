import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const { getAccessToken, refreshAccessToken } = require('../controllers/zohoDms/zohoAuth');
const logger = require('../utils/logger');

const ZOHO_CRM_BASE = `https://www.zohoapis.${process.env.ZOHO_DC || 'in'}/crm/v5`;

/**
 * Execute an authenticated HTTP request to Zoho CRM v5 with automatic token refresh on 401.
 */
async function executeZohoRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = null
): Promise<T | null> {
  let token = await getAccessToken();
  if (!token) {
    throw new Error('[Zoho CRM] No access token available from zohoAuth');
  }

  const url = `${ZOHO_CRM_BASE}/${endpoint}`;

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  };

  try {
    const response = await axios(config);
    if (response.status === 204 || !response.data) {
      return null;
    }
    return response.data as T;
  } catch (err: any) {
    const axiosError = err as AxiosError<any>;

    if (axiosError.response && axiosError.response.status === 401) {
      logger.warn('[Zoho CRM] Token expired (401) — refreshing token and retrying request', { endpoint });
      token = await refreshAccessToken(true);
      config.headers = {
        ...config.headers,
        Authorization: `Zoho-oauthtoken ${token}`,
      };
      const retryResponse = await axios(config);
      if (retryResponse.status === 204 || !retryResponse.data) {
        return null;
      }
      return retryResponse.data as T;
    }

    // Zoho returns 204 or sometimes 404/204 on search not found
    if (axiosError.response && (axiosError.response.status === 204 || axiosError.response.status === 404)) {
      return null;
    }

    const errorDetails = axiosError.response?.data || axiosError.message;
    logger.error('[Zoho CRM] API request failed', {
      endpoint,
      method,
      status: axiosError.response?.status,
      details: errorDetails,
    });
    throw err;
  }
}

/**
 * Search for a record in Leads or Contacts by phone number.
 * Note: Zoho CRM /search?phone= automatically matches both Phone and Mobile fields.
 */
export async function searchRecordByPhone(
  module: 'Leads' | 'Contacts',
  phone: string
): Promise<Record<string, any> | null> {
  try {
    const encodedPhone = encodeURIComponent(phone.trim());
    const result = await executeZohoRequest<{ data?: Record<string, any>[] }>(
      `${module}/search?phone=${encodedPhone}`,
      'GET'
    );

    if (result && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch (error: any) {
    logger.warn(`[Zoho CRM] Search by phone in ${module} failed or returned no results`, {
      phone,
      error: error.message,
    });
    return null;
  }
}

/**
 * Retrieve a full record by its Zoho ID to inspect all existing fields.
 */
export async function getRecordById(
  module: 'Leads' | 'Contacts',
  id: string
): Promise<Record<string, any> | null> {
  try {
    const result = await executeZohoRequest<{ data?: Record<string, any>[] }>(
      `${module}/${id}`,
      'GET'
    );

    if (result && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch (error: any) {
    logger.warn(`[Zoho CRM] Failed to fetch record by ID from ${module}`, {
      id,
      error: error.message,
    });
    return null;
  }
}

/**
 * Create a new Lead record in Zoho CRM.
 * If disableTriggers is true, passes trigger: [] to suppress Zoho's automated assignment/workflow rules.
 * If disableTriggers is false/omitted, trigger is omitted so Zoho executes its default round-robin rules.
 */
export async function createLead(
  leadData: Record<string, any>,
  disableTriggers: boolean = false
): Promise<any> {
  logger.info('[Zoho CRM] Creating new Lead record', {
    phone: leadData.Phone,
    lastName: leadData.Last_Name,
    source: leadData.Lead_Source,
    owner: leadData.Owner?.id,
    disableTriggers,
  });

  const payload: Record<string, any> = {
    data: [leadData],
  };

  if (disableTriggers) {
    payload.trigger = [];
  }

  const response = await executeZohoRequest<{ data?: any[] }>(
    'Leads',
    'POST',
    payload
  );

  const firstResult = response?.data?.[0];
  if (firstResult && firstResult.status === 'error') {
    throw new Error(`Zoho Lead creation failed: ${JSON.stringify(firstResult)}`);
  }

  return firstResult;
}

/**
 * Update an existing record in Leads or Contacts.
 */
export async function updateRecord(
  module: 'Leads' | 'Contacts',
  id: string,
  updateFields: Record<string, any>
): Promise<any> {
  logger.info(`[Zoho CRM] Updating ${module} record`, {
    id,
    fieldsToUpdate: Object.keys(updateFields),
  });

  const payload = {
    data: [
      {
        id,
        ...updateFields,
      },
    ],
  };

  const response = await executeZohoRequest<{ data?: any[] }>(
    `${module}/${id}`,
    'PUT',
    payload
  );

  const firstResult = response?.data?.[0];
  if (firstResult && firstResult.status === 'error') {
    throw new Error(`Zoho ${module} update failed: ${JSON.stringify(firstResult)}`);
  }

  return firstResult;
}


/**
 * Search for a record in Leads or Contacts by email address.
 */
export async function searchRecordByEmail(
  module: 'Leads' | 'Contacts',
  email: string
): Promise<Record<string, any> | null> {
  try {
    const encodedEmail = encodeURIComponent(email.trim());
    const result = await executeZohoRequest<{ data?: Record<string, any>[] }>(
      `${module}/search?email=${encodedEmail}`,
      'GET'
    );

    if (result && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch (error: any) {
    logger.warn(`[Zoho CRM] Search by email in ${module} failed or returned no results`, {
      email,
      error: error.message,
    });
    return null;
  }
}

/**
 * Upload a file attachment (Buffer or external URL) to a Zoho CRM record (Leads or Contacts).
 */
export async function uploadRecordAttachment(
  module: 'Leads' | 'Contacts',
  recordId: string,
  file: Buffer | { url: string },
  fileName: string = 'Assessment-Report.pdf'
): Promise<any> {
  const FormData = require('form-data');
  let token = await getAccessToken();
  if (!token) {
    throw new Error('[Zoho CRM] No access token available from zohoAuth');
  }

  const endpoint = `${module}/${recordId}/Attachments`;
  const url = `${ZOHO_CRM_BASE}/${endpoint}`;

  const createFormData = () => {
    const fd = new FormData();
    if (Buffer.isBuffer(file)) {
      fd.append('file', file, {
        filename: fileName,
        contentType: 'application/pdf',
      });
    } else if (file && typeof file.url === 'string') {
      fd.append('attachmentUrl', file.url);
      fd.append('title', fileName);
    }
    return fd;
  };

  const executeUpload = async (authToken: string) => {
    const fd = createFormData();
    return await axios.post(url, fd, {
      headers: {
        Authorization: `Zoho-oauthtoken ${authToken}`,
        ...fd.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });
  };

  try {
    const response = await executeUpload(token);
    const firstResult = response?.data?.data?.[0] || response?.data?.[0];
    if (firstResult && firstResult.status === 'error') {
      throw new Error(`Zoho attachment upload failed: ${JSON.stringify(firstResult)}`);
    }

    logger.info(`[Zoho CRM] Attachment uploaded successfully to ${module}/${recordId}`, {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (err: any) {
    const axiosError = err as AxiosError<any>;

    if (axiosError.response && axiosError.response.status === 401) {
      logger.warn('[Zoho CRM] Token expired (401) during attachment upload — refreshing token and retrying', {
        endpoint,
      });
      token = await refreshAccessToken(true);
      const retryResponse = await executeUpload(token);
      const retryFirstResult = retryResponse?.data?.data?.[0] || retryResponse?.data?.[0];
      if (retryFirstResult && retryFirstResult.status === 'error') {
        throw new Error(`Zoho attachment upload failed on retry: ${JSON.stringify(retryFirstResult)}`);
      }
      return retryResponse.data;
    }

    const errorDetails = axiosError.response?.data || axiosError.message;
    logger.error('[Zoho CRM] Attachment upload failed', {
      endpoint,
      status: axiosError.response?.status,
      details: errorDetails,
    });
    throw err;
  }
}

/**
 * Downloads a file from a URL (e.g. S3/R2/Cloudinary or base64) and uploads it as an attachment to Zoho CRM.
 * Falls back to attaching the URL directly if downloading the bytes fails.
 */
export async function uploadRecordAttachmentFromUrl(
  module: 'Leads' | 'Contacts',
  recordId: string,
  fileUrl: string,
  fileName: string = 'Assessment-Report.pdf'
): Promise<any> {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  const trimmedUrl = fileUrl.trim();
  if (!trimmedUrl) return null;

  // Handle data URI base64
  if (trimmedUrl.startsWith('data:')) {
    const base64Index = trimmedUrl.indexOf('base64,');
    if (base64Index !== -1) {
      const base64Data = trimmedUrl.slice(base64Index + 7);
      const buffer = Buffer.from(base64Data, 'base64');
      return await uploadRecordAttachment(module, recordId, buffer, fileName);
    }
  }

  // Attempt to download the buffer over HTTP/HTTPS
  try {
    logger.info(`[Zoho CRM] Fetching attachment bytes from URL`, {
      module,
      recordId,
      url: trimmedUrl,
    });
    const downloadResponse = await axios.get(trimmedUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });
    const fileBuffer = Buffer.from(downloadResponse.data);
    return await uploadRecordAttachment(module, recordId, fileBuffer, fileName);
  } catch (downloadErr: any) {
    logger.warn(`[Zoho CRM] Could not download file buffer from URL, falling back to Zoho URL attachment`, {
      module,
      recordId,
      url: trimmedUrl,
      error: downloadErr.message,
    });
    // Fallback: attach URL directly in Zoho CRM
    return await uploadRecordAttachment(module, recordId, { url: trimmedUrl }, fileName);
  }
}

export interface ZohoUserSummary {
  id: string;
  fullName: string;
  email: string;
  status: string;
}

const zohoUserCache = new Map<string, { user: ZohoUserSummary; expiresAt: number }>();

/**
 * Search for an active user in Zoho CRM by name or keyword with 24-hour in-memory cache.
 */
export async function findZohoUserByName(agentName?: string): Promise<ZohoUserSummary | null> {
  if (!agentName || !agentName.trim()) return null;
  const key = agentName.trim().toLowerCase();

  // 1. In-memory cache check
  const cached = zohoUserCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  // 2. Query Zoho CRM v5 /users/search?word=
  try {
    const encodedWord = encodeURIComponent(agentName.trim());
    const res = await executeZohoRequest<{ users?: any[] }>(
      `users/search?word=${encodedWord}`,
      'GET'
    );

    if (res?.users && Array.isArray(res.users) && res.users.length > 0) {
      const matched =
        res.users.find(
          (u) =>
            u.status === 'active' &&
            (u.full_name?.toLowerCase().includes(key) ||
              u.first_name?.toLowerCase().includes(key) ||
              u.email?.toLowerCase().includes(key))
        ) || res.users[0];

      if (matched?.id) {
        const summary: ZohoUserSummary = {
          id: String(matched.id),
          fullName: matched.full_name || agentName,
          email: matched.email || '',
          status: matched.status || 'active',
        };
        zohoUserCache.set(key, { user: summary, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
        return summary;
      }
    }
  } catch (err: any) {
    logger.warn('[Zoho CRM] Failed to search user by word in Zoho', { agentName, error: err.message });
  }

  return null;
}

