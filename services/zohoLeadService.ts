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
      token = await refreshAccessToken();
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
 */
export async function createLead(leadData: Record<string, any>): Promise<any> {
  logger.info('[Zoho CRM] Creating new Lead record', {
    phone: leadData.Phone,
    lastName: leadData.Last_Name,
    source: leadData.Lead_Source,
  });

  const payload = {
    data: [leadData],
  };

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
