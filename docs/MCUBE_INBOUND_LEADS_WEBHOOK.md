# MCube Inbound Call Webhook Integration Guide

## 1. Overview
This webhook receives real-time call events from MCube for inbound IVR calls to log call activities and automatically synchronize lead records with Zoho CRM.

---

## 2. Webhook Endpoint Details

| Property | Value |
| :--- | :--- |
| **HTTP Method** | `POST` |
| **URL** | `https://<YOUR_BACKEND_DOMAIN>/api/mcube/webhook/inbound-leads` |
| **Content-Type** | `application/json` |
| **Authentication Header** | `x-mcube-secret: <SHARED_SECRET_KEY>` |

> **Security Requirement**: Every webhook request from MCube must include the `x-mcube-secret` header. Requests with a missing or incorrect secret will be rejected with `HTTP 401 Unauthorized`.

---

## 3. Supported Events

MCube should send webhook requests for two events:
1. **`callstarted`**: Triggered when the incoming call starts ringing / connects to the IVR.
2. **`callended`**: Triggered immediately after the call disconnects (hangup) with call duration, agent, and tracking details.

---

## 4. Automatic Lead Source Classification

The webhook automatically sets the Zoho CRM `Lead_Source` field based on campaign and UTM parameters:

| Lead Source Value | Trigger Condition |
| :--- | :--- |
| **`IVR - Facebook`** | If `fbclid` is present, OR if any UTM field (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`) contains `"facebook"`, `"meta"`, `"instagram"`, `"fb"`, or `"ig"`. |
| **`IVR - Google`** | If `gclid` is present, OR if UTM fields contain `"google"`, `"adwords"`, `"gads"`, OR any other paid campaign parameters are present. |
| **`IVR- Website`** | If no UTM parameters or click IDs (`gclid` / `fbclid`) are present. |

> **Note**: For existing leads in Zoho CRM, `Lead_Source` is only updated if it is currently blank, preserving any existing source already established.

---

## 5. Payload Specification

All JSON keys must follow `camelCase` (or `snake_case` for UTM parameters as specified below).

### 5.1 Mandatory Fields

| Field | Type | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- |
| `event` | `string` | `"callstarted"` \| `"callended"` | Webhook event type |
| `callType` | `string` | `"inbound"` | Call direction (only `"inbound"` calls are processed) |
| `countryCode` | `string` | e.g. `"+91"`, `"+1"`, `"91"` | Country code of customer |
| `customerNumber` | `string` | e.g. `"9876543210"` | Customer phone number (10 digits) |

### 5.2 Optional Call Details

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `customerName` | `string` | `"Rahul Sharma"` | Caller name (if captured via IVR or CRM) |
| `callStatus` | `string` | `"ANSWER"`, `"NOANSWER"`, `"BUSY"`, `"CANCEL"` | Call outcome status |
| `startTime` | `string` | `"2026-10-10 12:00:00"` | Call initiation timestamp (`YYYY-MM-DD HH:MM:SS`) |
| `endTime` | `string` | `"2026-10-10 12:02:15"` | Call termination timestamp (`YYYY-MM-DD HH:MM:SS`) |
| `callDuration` | `string` / `number` | `"135"` | Total call duration in seconds |
| `answerTime` | `string` / `number` | `"15"` | Answer duration in seconds |
| `customerRingTime` | `string` / `number` | `"8"` | Ring duration before answer |
| `agent` | `string` | `"Jyothi"` | Executive / Agent name who attended |
| `groupName` | `string` | `"Sales"`, `"Support"` | MCube group name |
| `region` | `string` | `"Delhi"`, `"Mumbai"` | Region / circle of caller |
| `disconnectedBy` | `string` | `"Customer"`, `"Agent"` | Party who terminated the call |
| `did` | `string` | `"08047101234"` | Virtual DID number dialed by caller |

### 5.3 Digital Campaign & Tracking Parameters (Optional)

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `utm_source` | `string` | `"facebook"`, `"google"`, `"cpc"` | Campaign source |
| `utm_medium` | `string` | `"paid_social"`, `"cpc"` | Campaign medium |
| `utm_campaign` | `string` | `"Canada_PR_2026"` | Campaign name |
| `utm_term` | `string` | `"australia skilled visa"` | Paid keyword search term |
| `gclid` | `string` | `"CjwKCAjw..._GCLID"` | Google Click Identifier |
| `fbclid` | `string` | `"fb.1.123456789"` | Meta / Facebook Click Identifier |

---

## 6. Sample JSON Payloads

### 6.1 Meta / Facebook Campaign Call (`callended`) -> sets `IVR - Facebook`
```json
{
  "event": "callended",
  "callType": "inbound",
  "countryCode": "+91",
  "customerNumber": "9876543210",
  "customerName": "Rahul Sharma",
  "callStatus": "ANSWER",
  "startTime": "2026-10-10 12:00:00",
  "endTime": "2026-10-10 12:02:15",
  "callDuration": "135",
  "answerTime": "15",
  "agent": "Jyothi",
  "groupName": "Sales",
  "region": "Delhi",
  "did": "08047101234",
  "utm_source": "facebook",
  "utm_medium": "paid_social",
  "utm_campaign": "Canada_PR_FB_LeadGen",
  "fbclid": "fb.1.123456789"
}
```

### 6.2 Google Ads Campaign Call (`callended`) -> sets `IVR - Google`
```json
{
  "event": "callended",
  "callType": "inbound",
  "countryCode": "+91",
  "customerNumber": "9876543210",
  "customerName": "Rahul Sharma",
  "callStatus": "ANSWER",
  "startTime": "2026-10-10 12:00:00",
  "endTime": "2026-10-10 12:02:15",
  "callDuration": "135",
  "answerTime": "15",
  "agent": "Jyothi",
  "groupName": "Sales",
  "region": "Delhi",
  "did": "08047101234",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "Canada_PR_Search",
  "gclid": "CjwKCAjwTEST_GCLID"
}
```

### 6.3 Direct / Website Organic Call (`callended`) -> sets `IVR- Website`
```json
{
  "event": "callended",
  "callType": "inbound",
  "countryCode": "+91",
  "customerNumber": "9876543210",
  "customerName": "Rahul Sharma",
  "callStatus": "ANSWER",
  "startTime": "2026-10-10 12:00:00",
  "endTime": "2026-10-10 12:02:15",
  "callDuration": "135",
  "answerTime": "15",
  "agent": "Jyothi",
  "groupName": "Sales",
  "region": "Delhi",
  "did": "08047101234"
}
```

### 6.4 Call Started Event (`callstarted`)
```json
{
  "event": "callstarted",
  "callType": "inbound",
  "countryCode": "+91",
  "customerNumber": "9876543210",
  "customerName": "Rahul Sharma",
  "startTime": "2026-10-10 12:00:00",
  "did": "08047101234",
  "agent": "Jyothi"
}
```

---

## 7. Expected HTTP Status Codes & Responses

### 7.1 Success Responses (`HTTP 200 OK`)

* **When a new lead is created in CRM**:
  ```json
  {
    "success": true,
    "action": "created",
    "module": "Leads",
    "recordId": "48923000001234567"
  }
  ```

* **When an existing lead/contact is updated**:
  ```json
  {
    "success": true,
    "action": "updated",
    "module": "Leads",
    "recordId": "48923000001234567",
    "updatedFields": ["Re_Contacted_Date", "Call_Count"]
  }
  ```

* **For `callstarted` event**:
  ```json
  {
    "success": true,
    "message": "Call started logged"
  }
  ```

* **For non-inbound calls (ignored)**:
  ```json
  {
    "success": true,
    "message": "Not an inbound call — no action needed"
  }
  ```

### 7.2 Error Responses

* **`HTTP 400 Bad Request`**: Missing any mandatory fields (`event`, `callType`, `countryCode`, `customerNumber`).
* **`HTTP 401 Unauthorized`**: Missing or invalid `x-mcube-secret` header.
* **`HTTP 500 Internal Server Error`**: Processing error when synchronizing with CRM.
