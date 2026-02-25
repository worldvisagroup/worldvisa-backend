# Frontend implementation: Packages + listing, filters, detail, checkout, and payment

This doc reflects the **current** packages API and payment flow so you can implement listing, search, filters, detail page, checkout (pricing), and post-payment APIs on the frontend.

---

## 1. Base URLs and auth

- **Packages API:** `GET/POST/PUT/DELETE` → `{BACKEND_URL}/api/packages`
  - All requests need your **API key** (as required by `apiKeyMiddleware` — check how it reads the key, e.g. header or query).
- **Payment:** `{BACKEND_URL}/payment` (no `/api` prefix).
- **Razorpay:** `{BACKEND_URL}/razorpay` (webhook/callback; usually not called from frontend directly).

---

## 2. Packages API (updated)

### 2.1 List + search + filters (one endpoint)

**GET** `/api/packages`

Single endpoint for listing, search, and filters. All parameters are optional.

| Query param   | Type   | Description |
|---------------|--------|-------------|
| `page`        | number | Page number (default 1). |
| `limit`       | number | Page size (default 10, max 100). |
| `search` or `q` or `searchTerm` | string | Search in `title` and `subtitle` (case-insensitive). |
| `country`     | string | One country or comma-separated, e.g. `australia` or `australia,canada`. |
| `type` or `visaType` | string | Visa type(s): `pr`, `tourist`, `work`, `study`. Comma-separated for multiple, e.g. `pr,tourist`. |
| `addOn` / `addOns` | string | ZohoBooksItem ObjectIds (comma-separated) to filter packages that have these in `addOns`. |
| `hasAddOn`    | string | `true` or `false` — filter by whether package has add-on items. |

**Response:**

```json
{
  "data": [
    {
      "_id": "...",
      "country": "australia",
      "title": "EOI and DHA Australia",
      "slug": "australia-permanent-residency-basic-68ff5e6bebf932df00a9e29d",
      "shortDescription": "...",
      "type": "pr",
      "tiers": [
        {
          "_id": "...",
          "itemName": "EOI & State Nomination (MARA) SIP",
          "itemDescription": "...",
          "itemId": "445172000005023193",
          "amount": 40000,
          "country": "australia",
          "service": "pr",
          "addOn": false
        }
      ],
      "addOns": []
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Frontend usage:**

- **Listing:** `GET /api/packages?page=1&limit=12`
- **Country filter:** `GET /api/packages?country=australia`
- **Visa type filter:** `GET /api/packages?type=pr` or `?visaType=tourist,work`
- **Search:** `GET /api/packages?search=Australia PR` or `?q=skill assessment`
- **Combined:** `GET /api/packages?country=australia&type=pr&page=1&limit=12&search=EOI`

---

### 2.2 Package by slug (detail page)

**GET** `/api/packages/:slug`

Example: `GET /api/packages/australia-permanent-residency-basic-68ff5e6bebf932df00a9e29d`

Returns the full package with `tiers` and `addOns` populated (same shape as in list, but full document including `longDescription`, `benefits`, `validity`, etc.). Use this for the **package detail page** and for **checkout** (to show pricing and build `itemsData`).

---

### 2.3 Checkout URL by Zoho itemId (optional)

**GET** `/api/packages/package-url/:itemId`

Example: `GET /api/packages/package-url/445172000005023193`

Use when you only have a Zoho **itemId** (e.g. from a link or post-payment) and need the frontend checkout URL. Response: `{ "url": "https://your-frontend.com/packages/australia/australia-permanent-residency-basic-.../checkout?..." }`. Any query params you send are appended to that URL.

---

## 3. Checkout page: pricing

- Get package: **GET** `/api/packages/:slug` (you already have `slug` from your route, e.g. `/packages/:country/:slug/checkout`).
- Response includes:
  - **tiers:** main selling options (each has `itemId`, `itemName`, `amount`).
  - **addOns:** optional extras (each has `itemId`, `itemName`, `amount`).
- User selects **one tier** and optionally **some addOns**.
- **Total (before tax):** sum of selected tier `amount` + each selected add-on `amount`.
- Backend applies **18% tax** when creating the invoice; you can show “Subtotal” and “Tax (18%)” / “Total” on the frontend if you want (Total = Subtotal × 1.18).

---

## 4. APIs to use after pricing (payment flow)

After the user sees pricing and clicks “Pay”, use these in order.

### 4.1 Create Razorpay order

**POST** `/payment/orders`

**Body (JSON):**

```json
{
  "price": 40000,
  "name": "John Doe",
  "email": "john@example.com",
  "number": "9876543210"
}
```

- `price`: **total amount in INR (rupees)** — same as the total you show on checkout (backend will convert to paisa for Razorpay).
- `name`, `email`, `number`: customer details.

**Response:** Razorpay order object (includes `id`, `amount`, `currency`, etc.) and optionally `contact_record_id`. Use `id` to open Razorpay checkout on the frontend.

**Frontend:** Open Razorpay SDK with this `id`; on success you get `razorpay_payment_id` and `razorpay_order_id` and `razorpay_signature`. Then call the success API.

---

### 4.2 Payment success (verify and create invoice / deal / record payment)

**POST** `/payment/success`

**Body (JSON):**

```json
{
  "orderCreationId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpayOrderId": "order_xxx",
  "razorpaySignature": "...",
  "amount": 47200,
  "contactLeadId": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "number": "9876543210",
  "country": "australia",
  "package": "EOI and DHA Australia",
  "service": "pr",
  "itemId": "445172000005023193",
  "itemsData": [
    { "itemId": "445172000005023193", "amount": 40000 }
  ]
}
```

- **Verification:** `orderCreationId`, `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature` — from Razorpay success handler; backend verifies signature.
- **Customer:** `name`, `email`, `number`, `contactLeadId` (from create order response if you stored it).
- **Context:** `country`, `package` (package title), `service` (visa type, e.g. `pr`), `itemId` (primary selected tier’s Zoho `itemId`).
- **itemsData:** **Required.** Array of objects with Zoho Books `itemId` and `amount` (in rupees) for **every** line item to be on the invoice: the selected **tier** plus any selected **addOns**. Example: one tier + two addOns → three elements in `itemsData`.

Backend will:

- Verify the Razorpay signature.
- Create/use Zoho CRM contact and create a Deal.
- Create Zoho Books contact, create an **invoice** with the given `itemsData` (item_ids + amounts), apply 18% tax.
- Record payment against that invoice and send success invoice email.

---

## 5. Suggested frontend flow (summary)

| Step | Screen / action | API / data |
|------|------------------|------------|
| 1 | List packages | GET `/api/packages?page=1&limit=12` |
| 2 | Filter by country | Add `?country=australia` (or multiple comma-separated). |
| 3 | Filter by visa type | Add `?type=pr` or `?visaType=tourist,work`. |
| 4 | Search | Add `?search=...` or `?q=...`. |
| 5 | Open package detail | GET `/api/packages/:slug` |
| 6 | Checkout page | Use same package; show `tiers` and `addOns`; user selects one tier + optional addOns; total = sum(amounts). |
| 7 | Pay button | POST `/payment/orders` with `{ price: total, name, email, number }` → get Razorpay order `id` → open Razorpay. |
| 8 | After Razorpay success | POST `/payment/success` with signature + same customer + `country`, `package`, `service`, `itemId` (tier), and `itemsData`: `[{ itemId, amount }, ...]` for tier + selected addOns. |

---

## 6. Response shapes (quick reference)

- **List:** `{ data: Package[], pagination: { total, page, limit, totalPages } }`
- **Detail / by slug:** `{ data: Package }` (full package with populated `tiers` and `addOns`)
- **Package URL by itemId:** `{ url: string }`
- **Create order:** `{ id, amount, currency, ... }` (Razorpay order)
- **Payment success:** `{ msg: "success", orderId, paymentId }`

This is the structure to use on the frontend for search, listing, filters (country, visa type), detail page, checkout pricing, and the APIs after pricing (create order → Razorpay → payment success).
