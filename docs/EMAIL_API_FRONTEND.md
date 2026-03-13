# Email APIs — Frontend Reference

Base path: **`/api/email`**. All endpoints that require auth use **Bearer token** in the `Authorization` header unless noted.

---

## 1. List emails (inbox-style, one row per thread)

**GET** `/api/email`

Returns **one row per thread** (like Gmail): the latest message in each thread. When the user opens a row, use the thread or single-email APIs to load the full conversation.

### Query parameters

| Parameter   | Type   | Description |
|------------|--------|-------------|
| `page`     | number | Page number (1-based). Default: `1`. |
| `limit`    | number | Items per page. Default: `20`. Max: `50`. |
| `direction`| string | Filter: `inbound` or `outbound`. |
| `client_id`| string | Filter by client ObjectId. |
| `provider` | string | Filter: `resend` or `gmail`. |
| `email`    | string | Filter by participant (matches from/to/cc). |
| `q`        | string | Search in subject and body (and optionally from/to). |

### Example

```
GET /api/email?page=1&limit=20&direction=inbound&q=visa
```

### Response (200)

```json
{
  "data": [
    {
      "_id": "...",
      "thread_id": "thread_abc",
      "subject": "Re: Visa enquiry",
      "from": "client@example.com",
      "to": ["support@worldvisa.in"],
      "direction": "inbound",
      "created_at": "2025-03-10T12:00:00.000Z",
      "last_event": "received",
      "client_id": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
```

---

## 2. Get a single email

**GET** `/api/email/:id`

Returns the full email by MongoDB `_id`. Use when the user opens an email (and that email is the only message in the thread, or you only need this one).

### Response (200)

```json
{
  "_id": "...",
  "provider": "resend",
  "provider_email_id": "resend_xxx",
  "thread_id": "thread_abc",
  "direction": "inbound",
  "email_type": "client",
  "from": "client@example.com",
  "to": ["support@worldvisa.in"],
  "cc": [],
  "bcc": [],
  "subject": "Re: Visa enquiry",
  "html": "<p>...</p>",
  "text": null,
  "attachments": [
    {
      "filename": "doc.pdf",
      "content_type": "application/pdf",
      "size": 1024,
      "storage_url": "https://..."
    }
  ],
  "last_event": "received",
  "created_at": "2025-03-10T12:00:00.000Z",
  "received_at": "2025-03-10T12:00:00.000Z",
  "client_id": "...",
  "message_id": "...",
  "in_reply_to": "..."
}
```

- **404** — Email not found.

---

## 3. Get email with full thread (open email in container)

**GET** `/api/email/:id/with-thread`

Returns the requested email **plus** all messages in its thread in one call. Use when the user clicks a row in the list so the container can show the main email and all replies.

### Response (200)

```json
{
  "email": {
    "_id": "...",
    "subject": "...",
    "from": "...",
    "to": [...],
    "html": "...",
    "attachments": [...],
    "created_at": "...",
    "direction": "inbound",
    ...
  },
  "thread": [
    {
      "_id": "...",
      "subject": "...",
      "from": "...",
      "to": [...],
      "html": "...",
      "attachments": [...],
      "created_at": "...",
      "direction": "inbound"
    },
    {
      "_id": "...",
      "subject": "Re: ...",
      "from": "...",
      "to": [...],
      "html": "...",
      "created_at": "...",
      "direction": "outbound"
    }
  ]
}
```

- `thread` is ordered by time (oldest first). If the thread has only one message, `thread` is a one-element array.
- **404** — Email not found.

---

## 4. Get thread by thread ID

**GET** `/api/email/threads/:threadId`

Returns all messages in a thread. Use when you already have `thread_id` (e.g. from the list row) and only need the thread messages.

### Response (200)

```json
{
  "threadId": "thread_abc",
  "messages": [
    {
      "_id": "...",
      "subject": "...",
      "from": "...",
      "to": [...],
      "html": "...",
      "attachments": [...],
      "created_at": "...",
      "direction": "inbound"
    },
    ...
  ]
}
```

- **404** — Thread not found or empty.

---

## 5. Send email (with optional attachments)

**POST** `/api/email/send`  
**Auth:** Required (Bearer).  
**Content-Type:** `multipart/form-data`.

Sends an email via Resend, uploads attachments to R2, and stores the email in the system.

### Form fields

| Field        | Required | Description |
|-------------|----------|-------------|
| `to`        | Yes      | Recipient(s). Comma-separated for multiple. |
| `subject`   | Yes      | Subject line. |
| `html`      | One of   | HTML body. |
| `text`      | html/text| Plain-text body. |
| `cc`        | No       | CC (comma-separated). |
| `bcc`       | No       | BCC (comma-separated). |
| `client_id` | No       | Client ObjectId (for linking to a client). |
| `in_reply_to` | No     | Message-ID for threading (reply). |
| `message_id`  | No     | References for threading. |

### Files

- Field name: **`attachments`**.
- Multiple files allowed; max **10** files, **10 MB** each, **25 MB** total.

### Example (curl)

```bash
curl -X POST "https://your-api/api/email/send" \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "to=recipient@example.com" \
  -F "subject=Hello" \
  -F "html=<p>Body here</p>" \
  -F "client_id=OPTIONAL_CLIENT_OBJECT_ID" \
  -F "attachments=@/path/to/file1.pdf" \
  -F "attachments=@/path/to/file2.png"
```

### Response (200)

```json
{
  "success": true,
  "id": "resend_email_id_from_provider",
  "message": "Sent"
}
```

### Errors

- **400** — Missing `to`/`subject`/body, invalid `client_id`, or attachment count/size over limit.  
  Body: `{ "error": "Message describing the issue" }`.
- **500** — Send or storage failed.  
  Body: `{ "error": "Failed to send email", "message": "..." }`.

---

## 6. Gmail OAuth and sync (admin)

- **GET** `/api/email/oauth` — Redirects to Google OAuth. Used once to obtain a refresh token.
- **GET** `/api/email/oauth/callback` — OAuth callback; do not call directly from the app.
- **POST** `/api/email/sync/gmail` — **Admin only.** Triggers Gmail history sync.  
  Response (200): `{ "message": "...", "nextRunAfterDate": "..." }` or error.

---

## Summary

| Purpose                    | Method | Path                      |
|---------------------------|--------|---------------------------|
| List (one per thread)     | GET    | `/api/email`              |
| Single email              | GET    | `/api/email/:id`          |
| Email + thread (open view)| GET    | `/api/email/:id/with-thread` |
| Thread by ID              | GET    | `/api/email/threads/:threadId` |
| Send (with attachments)   | POST   | `/api/email/send`         |
| Gmail sync (admin)        | POST   | `/api/email/sync/gmail`   |

**Recommended flow for “open email from list”:**  
Call **GET** `/api/email/:id/with-thread` with the list row’s `_id`. Use `email` for the opened message and `thread` to render the conversation below.
