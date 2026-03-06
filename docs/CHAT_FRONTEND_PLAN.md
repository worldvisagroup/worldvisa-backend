# Chat — Frontend API & Implementation Plan

**Base URL:** `GET/POST /api/zoho_dms/chats`  
**Auth:** Same as existing app. Send **Bearer token** (admin or client JWT) in `Authorization` header.  
**Content-Type:** `application/json` for JSON bodies; `multipart/form-data` for file uploads and for **send message with files** (one request).

**Attachments:** You can either (1) **send message with files in one request** — `POST /chats/:id/messages` as multipart with `content` + `files` — or (2) upload first with `POST /chats/attachments` and then send message with JSON `attachments: [...]`. Use (1) for the main “send message + attach” flow.

---

## 0. Client identity & get-conversation response (clarifications)

**1. Client identity in chat**

For client–staff DMs, the backend uses the **same id everywhere** for the client:

- **`conversation.participants[].id`** (when `type === 'client'`) = **MongoDB `_id`** of the **DmsZohoClient** document.
- **`message.sender.id`** (when `sender.type === 'client'`) = same **MongoDB `_id`** (DmsZohoClient).

So: **it is the client’s document `_id`**, not `lead_id`. The client JWT is signed with this same id (`decoded.id` = client `_id`). On the frontend, use the **same id you use for the logged-in client** (e.g. from decoding the JWT or from your “current user” object). If your frontend stores `user._id` as the MongoDB id, that’s the one to use for comparing with `participants[].id` and `message.sender.id`. Do **not** use `lead_id` for chat identity (lead_id is a separate Zoho lead string).

**2. “Get conversation by id” response**

`GET /api/zoho_dms/chats/:conversationId` returns:

- **`participants`** — array of `{ type, id }` (always present; it’s part of the conversation document).
- **`members`** — array of `{ type, id, displayName }` (resolved display names for each participant).
- Plus the rest of the conversation (e.g. `_id`, `type`, `name`, `description`, `imageUrl`, `createdBy`, `lastMessageAt`, `archivedBy`, `createdAt`, `updatedAt`) and **`unreadCount`**.

So you can rely on **`data.participants`** to find the client in a DM (the one with `type === 'client'`); use **`data.members`** when you need display names.

**3. Who can create a DM with a client**

- **master_admin, supervisor, team_leader:** Can create a chat (DM) with **any** client.
- **admin:** Can create a chat with a client **only if** that client is their “handling” client (client’s lead_owner = this admin’s username).
- **Client:** Can only start a DM with their own lead_owner.

---

## 1. API Reference (URLs + Payloads)

### 1.1 List conversations (single endpoint: list + filter + search)

| Item | Value |
|------|--------|
| **URL** | `GET /api/zoho_dms/chats` |
| **Query** | `page` (default 1), `limit` (default 20, max 50), `type` (`dm` \| `group`), `search` (string), `archived` (`true` to show only archived) |
| **Body** | None |
| **Response** | `{ status: 'success', data: [...], total, page, limit }` |

**Each item in `data`:**
- `_id`, `type` (`dm` \| `group`), `participants`, `name` (groups), `description`, `imageUrl`, `createdBy`, `lastMessageAt`, `archivedBy`, `createdAt`, `updatedAt`
- **`unreadCount`** (number)
- **`lastMessage`** — `{ content, sender: { type, id }, createdAt }` or `null`
- **`otherDisplayName`** — only for DM: display name of the other participant

---

### 1.2 Get one conversation (with members)

| Item | Value |
|------|--------|
| **URL** | `GET /api/zoho_dms/chats/:conversationId` |
| **Params** | `conversationId` (MongoDB ObjectId string) |
| **Response** | `{ status: 'success', data: { ...conversation, unreadCount, members } }` |

**`data`** includes the full conversation (so **`participants`** is present: array of `{ type, id }`) plus **`unreadCount`** and **`members`** (array of `{ type, id, displayName }`).

---

### 1.3 Get messages (paginated)

| Item | Value |
|------|--------|
| **URL** | `GET /api/zoho_dms/chats/:conversationId/messages` |
| **Query** | `before` (message `_id` or ISO date for cursor), `limit` (default 30, max 50) |
| **Response** | `{ status: 'success', data: [ message, ... ] }` (oldest first in array) |

**Message shape:** `_id`, `conversationId`, `sender` (`{ type, id }`), `content`, `attachments` (`[{ url, name, contentType, size }]`), `forwardedFromMessageId`, `createdAt`, `deletedAt` (null if not deleted).

---

### 1.4 Create conversation (DM or group)

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats` |
| **Body (DM)** | `{ type: 'dm', participant: { type: 'staff'|'client', id: '<ObjectId>' } }` |
| **Body (Group)** | `{ type: 'group', name: string, description?: string, imageUrl?: string, participants: [{ type, id }, ...] }` |
| **Response** | `{ status: 'success', data: conversation }` |

---

### 1.5 Update group (name, description, image)

| Item | Value |
|------|--------|
| **URL** | `PATCH /api/zoho_dms/chats/:conversationId` |
| **Body** | `{ name?: string, description?: string, imageUrl?: string }` (all optional) |
| **Response** | `{ status: 'success', data: conversation }` |

---

### 1.6 Add/remove group participants

| Item | Value |
|------|--------|
| **URL** | `PATCH /api/zoho_dms/chats/:conversationId/participants` |
| **Body** | `{ add?: [{ type, id }, ...], remove?: [{ type, id }, ...] }` |
| **Response** | `{ status: 'success', data: conversation }` |

---

### 1.7 Send message (one API: text and/or attachments)

This endpoint supports **two ways** to send; use one per request.

**Option A — JSON (text and/or pre-uploaded attachment refs)**

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/messages` |
| **Headers** | `Content-Type: application/json` |
| **Body** | `{ content?: string, attachments?: [{ url, name, contentType, size }, ...], forwardedFromMessageId?: '<ObjectId>' }` |
| **Response** | `{ status: 'success', data: message }` |

**Option B — Multipart (text + files in one request; recommended for “send with attach”)**

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/messages` |
| **Headers** | `Content-Type: multipart/form-data` |
| **Body** | Form fields: **`content`** (optional text), **`files`** (multiple files; same field name for each). Optional: **`forwardedFromMessageId`**. |
| **Response** | `{ status: 'success', data: message }` |

Backend uploads the files to R2 and creates one message with that text and those attachments. Max 10 files per request; each file max 20 MB.

---

### 1.8 Upload attachment(s) (standalone)

Use this when you need a URL **without** sending a message (e.g. group image, or pre-upload for a later message).

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/attachments` |
| **Body** | `multipart/form-data`. Field name: **`file`** (one file per request; call multiple times for multiple files). |
| **Response** | `{ status: 'success', data: { url, name, contentType, size } }` |

Use returned `data` in **1.7 Option A** as `attachments: [ data ]`, or in **1.4 / 1.5** as `imageUrl` for groups.

---

### 1.9 Mark as read (call when user opens the chat)

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/read` |
| **Body** | `{}` or `{ lastReadAt?: '<ISO date>' }` (omit to use “now”) |
| **Response** | `{ status: 'success', data: { lastReadAt } }` |

---

### 1.10 Clear conversation (for current user only)

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/clear` |
| **Body** | None |
| **Response** | `{ status: 'success', message: 'Conversation cleared' }` |

---

### 1.11 Archive / unarchive conversation (for current user)

One API to archive or unarchive. Use `GET /chats?archived=true` to list archived chats.

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/archive` |
| **Body** | `{ archived: true }` to archive, `{ archived: false }` to unarchive |
| **Response** | `{ status: 'success', data: conversation, message: 'Conversation archived' \| 'Conversation unarchived' \| 'Already archived' \| 'Already unarchived' }` |

---

### 1.12 Leave conversation

| Item | Value |
|------|--------|
| **URL** | `POST /api/zoho_dms/chats/:conversationId/leave` |
| **Body** | None |
| **Response** | `{ status: 'success', data?, message }` — DM: adds you to archived; Group: you leave (conversation deleted if last participant). |

---

### 1.13 Delete entire conversation (for everyone)

Removes the conversation and all its messages for all participants. Any participant can call this.

| Item | Value |
|------|--------|
| **URL** | `DELETE /api/zoho_dms/chats/:conversationId` |
| **Body** | None |
| **Response** | `{ status: 'success', message: 'Conversation deleted' }` |

---

### 1.14 Delete message (own message only)

| Item | Value |
|------|--------|
| **URL** | `DELETE /api/zoho_dms/chats/:conversationId/messages/:messageId` |
| **Response** | `{ status: 'success', data: message }` (message has `deletedAt` set). |

---

## 2. Features (for UI)

| Feature | How |
|--------|-----|
| **List chats** | `GET /chats` with optional `type`, `search`, `archived`, `page`, `limit`. Show `unreadCount`, `lastMessage`, `otherDisplayName` (DM) or `name` (group). |
| **Open chat** | `GET /chats/:id` for details + members. Then `GET /chats/:id/messages`. Call **mark as read** when opening: `POST /chats/:id/read`. |
| **Start DM** | `POST /chats` with `type: 'dm'`, `participant: { type, id }`. |
| **Create group** | `POST /chats` with `type: 'group'`, `name`, optional `description`, `imageUrl`, `participants`. |
| **Edit group** | `PATCH /chats/:id` (name, description, imageUrl). |
| **Group members** | Shown in `GET /chats/:id` as `members`. Add/remove via `PATCH /chats/:id/participants`. |
| **Send text** | `POST /chats/:id/messages` with JSON `content`. |
| **Send message with attachments** | **One request:** `POST /chats/:id/messages` as multipart with `content` + `files` (recommended). Or: upload via `POST /chats/attachments`, then send with JSON `attachments: [ ... ]`. |
| **Forward** | `POST /chats/:id/messages` with `forwardedFromMessageId` (and optional `content`). |
| **Read state** | Use `unreadCount` from list/detail. Mark read when opening chat with `POST /chats/:id/read`. |
| **Clear chat** | `POST /chats/:id/clear`. |
| **Archive / unarchive chat** | `POST /chats/:id/archive` with body `{ archived: true }` or `{ archived: false }`. Use `GET /chats?archived=true` to list archived. |
| **Leave** | `POST /chats/:id/leave` (DM: archive for you; Group: leave, or delete if last participant). |
| **Delete entire chat** | `DELETE /chats/:id` (removes conversation and all messages for everyone). |
| **Delete message** | `DELETE /chats/:id/messages/:messageId`. |

---

## 3. Real-time (Socket.io)

- **Connect** with same auth: e.g. `socket = io(url, { auth: { token: '<JWT>' } })`.
- **Events to listen:**
  - **`chat:message`** — `{ conversationId, message }`. Append or update message in the right conversation.
  - **`chat:read`** — `{ conversationId, participant, lastReadAt }`. Update read state for that conversation (e.g. “read” indicator in DM or in group).
- No need to join rooms; backend targets the user by `chat:client:id` or `chat:staff:id` from the JWT.

---

## 4. Simple frontend implementation plan

### 4.1 Data / state

- **Current user:** You already have JWT and user type (client vs staff). Derive `chatActor`: `{ type: 'client'|'staff', id: user._id }` for creating DMs/groups and comparing with `sender`/`participants`.
- **Conversations:** One list (from `GET /chats`). Cache by `_id`; refresh list when opening app or when `chat:message` / `chat:read` affects the list order or unread.
- **Active conversation:** One `conversationId` (and full conversation + `members` from `GET /chats/:id`). Messages for that conversation (from `GET /chats/:id/messages`), append new ones on `chat:message` for that `conversationId`.

### 4.2 Screens / flows

1. **Chat list**
   - On load: `GET /chats?page=1&limit=20`. Render rows: avatar (group image or other user), title (group name or `otherDisplayName`), last message snippet, time, unread badge (`unreadCount`).
   - Optional: tabs or filter for “All / DMs / Groups” (`type=dm` or `type=group`), search box (`search=`), “Archived” (`archived=true`).
   - On row click: set active conversation, navigate to chat thread; call `POST /chats/:id/read` and fetch `GET /chats/:id` + `GET /chats/:id/messages`.

2. **Chat thread**
   - Show header (name, members count or other user), then message list (oldest at top or bottom by design). Load more with `GET /chats/:id/messages?before=<lastMessageId>&limit=30`.
   - Input: text + “attach”. On send: **one request** `POST /chats/:id/messages` as multipart with `content` and `files` (or JSON with `content` and/or `attachments` if you pre-uploaded). Optimistically add message and confirm with `chat:message` or response.
   - Optional: long-press message → Delete (call `DELETE .../messages/:messageId`) or Forward (open “choose conversation”, then `POST /chats/:targetId/messages` with `forwardedFromMessageId`).

3. **New chat**
   - **New DM:** Pick a user (from your existing “handling clients” or “staff” list), then `POST /chats` with `type: 'dm'`, `participant: { type, id }`. Navigate to thread.
   - **New group:** (Only for master_admin / supervisor / team_leader.) `POST /chats` with `type: 'group'`, `name`, optional `description`, `imageUrl`, `participants`. Then open thread; optionally `PATCH /chats/:id` for image/description later.

4. **Group settings (from thread)**
   - Show name, description, image, members (from `GET /chats/:id` → `members`). Edit: `PATCH /chats/:id` (name, description, imageUrl). Add/remove members: `PATCH /chats/:id/participants` with `add` / `remove`. Leave: `POST /chats/:id/leave`.

5. **Clear / archive / leave / delete**
   - “Clear conversation” → `POST /chats/:id/clear`. “Archive” / “Unarchive” → `POST /chats/:id/archive` with `{ archived: true }` or `{ archived: false }`. “Leave” → `POST /chats/:id/leave`. “Delete entire chat” → `DELETE /chats/:id`. Refresh list after.

### 4.3 Errors

- All APIs return `{ status: 'fail', message: '...' }` on 4xx/5xx. Show `message` in a toast or inline. Handle 401 (re-login) and 403 (not allowed) explicitly.

---

## 5. Quick reference table

| Action | Method | URL | Key payload |
|--------|--------|-----|-------------|
| List/filter/search | GET | `/api/zoho_dms/chats` | `page`, `limit`, `type`, `search`, `archived` |
| Get conversation | GET | `/api/zoho_dms/chats/:id` | — |
| Get messages | GET | `/api/zoho_dms/chats/:id/messages` | `before`, `limit` |
| Create DM/group | POST | `/api/zoho_dms/chats` | `type`, `participant` or `name`+`participants` |
| Update group | PATCH | `/api/zoho_dms/chats/:id` | `name`, `description`, `imageUrl` |
| Group participants | PATCH | `/api/zoho_dms/chats/:id/participants` | `add`, `remove` |
| Send message (JSON) | POST | `/api/zoho_dms/chats/:id/messages` | JSON: `content`, `attachments`, `forwardedFromMessageId` |
| Send message (multipart) | POST | `/api/zoho_dms/chats/:id/messages` | multipart: `content`, `files` (up to 10), optional `forwardedFromMessageId` |
| Upload file (standalone) | POST | `/api/zoho_dms/chats/attachments` | multipart `file` |
| Mark read | POST | `/api/zoho_dms/chats/:id/read` | `{}` or `lastReadAt` |
| Clear | POST | `/api/zoho_dms/chats/:id/clear` | — |
| Archive / unarchive | POST | `/api/zoho_dms/chats/:id/archive` | `{ archived: true }` or `{ archived: false }` |
| Leave | POST | `/api/zoho_dms/chats/:id/leave` | — |
| Delete entire chat | DELETE | `/api/zoho_dms/chats/:id` | — |
| Delete message | DELETE | `/api/zoho_dms/chats/:id/messages/:messageId` | — |

All requests: **Header** `Authorization: Bearer <JWT>`.
