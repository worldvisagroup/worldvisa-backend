# Webhook Instructions 

## Quick Summary

**Two-way communication:**

1. **We send you** user booking data → Your Zoho Deluge function receives this
2. **You create** Zoho meeting using the data
3. **You send us** the meeting URL → Call our webhook with the result (secured with HMAC signature)

---

## Part 1: What You Will Receive (User Booking Data)

When a user books a meeting, our system will call your Zoho Deluge function with this data:

### Data Format:
```json
{
  "requestId": "abc123def456",
  "usersName": "John Doe",
  "normalizedDateTime": "2024-12-25T10:30:00.000Z",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "source": "website"
}
```

### Field Descriptions:
- `requestId` - Unique identifier (use this when calling back)
- `usersName` - Full name of the user
- `normalizedDateTime` - ISO 8601 datetime for the meeting
- `phoneNumber` - User's phone number
- `email` - User's email address
- `source` - Where the booking came from (e.g., "website")

**Your task:** Use this data to create a Zoho meeting, then call our webhook back with the result.

---

## Part 2: What You Need to Send Back (Meeting URL)

After creating the meeting, call our webhook with the result.

### 1. Webhook URL

```
https://worldvisagroup-19a980221060.herokuapp.com/api/worldvisaV2/schedule-meeting/webhook
```

**Important:**
- Use **POST** method
- Use **HTTPS** (not HTTP)
- Include signature in header (see below)

---

### 2. Webhook Secret

```
db5cb951900770eadeecb1e6e01033afe5c07a262cc0fac7b834a0ff6ad0207b
```

**Keep this secret secure!** Use it to generate the signature.

---

### 3. What to Send (Payload Format)

After creating the meeting, send this JSON payload:

### Success Case:
```json
{
  "requestId": "abc123def456",
  "status": "success",
  "meetingUrl": "https://meet.zoho.com/xyz789",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

### Failure Case:
```json
{
  "requestId": "abc123def456",
  "status": "failed",
  "errorMessage": "Meeting creation failed: reason here",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

**Required Fields:**
- `requestId` - Must match the requestId you received from us
- `status` - Either `"success"` or `"failed"`
- `meetingUrl` - Required if status is `"success"`
- `errorMessage` - Required if status is `"failed"`
- `timestamp` - ISO 8601 format (e.g., "2024-12-25T10:30:00.000Z")

---

### 4. Signature Generation (IMPORTANT!)

You **must** include the `X-Zoho-Signature` header with an HMAC-SHA256 signature.

### Steps to Generate Signature:

1. **Sort the JSON keys alphabetically**
   - Example: `["errorMessage", "meetingUrl", "requestId", "status", "timestamp"]`

2. **Create JSON string with sorted keys**
   ```json
   {"errorMessage":"","meetingUrl":"https://meet.zoho.com/xyz789","requestId":"abc123","status":"success","timestamp":"2024-12-25T10:30:00.000Z"}
   ```

3. **Generate HMAC-SHA256**
   - Algorithm: HMAC-SHA256
   - Secret: `db5cb951900770eadeecb1e6e01033afe5c07a262cc0fac7b834a0ff6ad0207b`
   - Input: The JSON string from step 2
   - Output: Hexadecimal string (lowercase)

4. **Add to Header**
   ```
   X-Zoho-Signature: <generated-signature>
   ```

### Example in Zoho Deluge:

```javascript
// Prepare payload
callbackPayload = {
  "requestId": requestId,
  "status": "success",
  "meetingUrl": meetingUrl,
  "timestamp": timestamp
};

// Sort keys alphabetically and create JSON string
sortedKeys = ["meetingUrl", "requestId", "status", "timestamp"];
payloadString = "{";
for each key in sortedKeys {
  payloadString = payloadString + "\"" + key + "\":\"" + callbackPayload[key] + "\",";
}
payloadString = payloadString.substring(0, payloadString.length() - 1) + "}";

// Generate signature
secret = "db5cb951900770eadeecb1e6e01033afe5c07a262cc0fac7b834a0ff6ad0207b";
signature = zoho.encryption.hmacsha256(secret, payloadString);

// Call webhook
webhookUrl = "https://worldvisagroup-19a980221060.herokuapp.com/api/worldvisaV2/schedule-meeting/webhook";

response = invokeurl [
  url: webhookUrl
  type: POST
  parameters: callbackPayload
  headers: {
    "Content-Type": "application/json",
    "X-Zoho-Signature": signature
  }
];
```

---

### 5. Expected Response

If signature is valid, you'll receive:
```json
{
  "success": true,
  "message": "Webhook received",
  "requestId": "abc123def456"
}
```

If signature is invalid, you'll receive:
```json
{
  "success": false,
  "error": "Invalid signature",
  "requestId": "abc123def456"
}
```

**Status Codes:**
- `200 OK` - Webhook received successfully
- `401 Unauthorized` - Invalid signature
- `400 Bad Request` - Invalid payload format

---

## Complete Flow (Step by Step)

### Step 1: You Receive Booking Data
Our system calls your Zoho Deluge function with user booking information:
```json
{
  "requestId": "abc123",
  "usersName": "John Doe",
  "normalizedDateTime": "2024-12-25T10:30:00.000Z",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "source": "website"
}
```

### Step 2: You Create Zoho Meeting
Use the received data to create a Zoho meeting:
- Use `normalizedDateTime` for meeting time
- Use `email` for participant
- Use `usersName` for meeting title/description

### Step 3: You Call Our Webhook Back
After creating the meeting, call our webhook with the result:
- Include `requestId` (same as received in Step 1)
- Include `status` ("success" or "failed")
- Include `meetingUrl` (if success) or `errorMessage` (if failed)
- Include `timestamp`
- Include `X-Zoho-Signature` header (see Signature Generation above)

### Step 4: We Validate and Log
We validate the signature and log the meeting URL for tracking.

---

## Complete Zoho Deluge Function Example

Here's a complete example showing how to receive booking data and send back the meeting URL:

```javascript
// ============================================
// Zoho Deluge Function: createMeetingAndCallback
// ============================================

// STEP 1: Receive booking data from our system
requestId = input.requestId;
usersName = input.usersName;
normalizedDateTime = input.normalizedDateTime;
phoneNumber = input.phoneNumber;
email = input.email;
source = input.source;

// STEP 2: Create Zoho Meeting
try {
  // Create meeting using Zoho Meeting API
  meetingResponse = zoho.meeting.create({
    topic: usersName + " - Consultation",
    start_time: normalizedDateTime,
    duration: 30, // 30 minutes
    participants: [email],
    timezone: "UTC"
  });
  
  meetingUrl = meetingResponse.join_url;
  status = "success";
  errorMessage = "";
  
} catch (e) {
  // Meeting creation failed
  status = "failed";
  errorMessage = "Meeting creation failed: " + e.toString();
  meetingUrl = "";
}

// STEP 3: Prepare callback payload
timestamp = zoho.currenttime.toString("yyyy-MM-dd'T'HH:mm:ss'Z'");

callbackPayload = {};
callbackPayload.put("requestId", requestId);
callbackPayload.put("status", status);
callbackPayload.put("timestamp", timestamp);

if (status == "success") {
  callbackPayload.put("meetingUrl", meetingUrl);
} else {
  callbackPayload.put("errorMessage", errorMessage);
}

// STEP 4: Generate HMAC-SHA256 signature
secret = "db5cb951900770eadeecb1e6e01033afe5c07a262cc0fac7b834a0ff6ad0207b";

// Sort keys alphabetically and create JSON string
sortedKeys = callbackPayload.keys().sort();
payloadString = "{";
for each key in sortedKeys {
  value = callbackPayload.get(key);
  if (value != null && value != "") {
    payloadString = payloadString + "\"" + key + "\":\"" + value + "\",";
  }
}
// Remove trailing comma
if (payloadString.endsWith(",")) {
  payloadString = payloadString.substring(0, payloadString.length() - 1);
}
payloadString = payloadString + "}";

// Generate signature
signature = zoho.encryption.hmacsha256(secret, payloadString);

// STEP 5: Call our webhook
webhookUrl = "https://worldvisagroup-19a980221060.herokuapp.com/api/worldvisaV2/schedule-meeting/webhook";

response = invokeurl [
  url: webhookUrl
  type: POST
  parameters: callbackPayload
  headers: {
    "Content-Type": "application/json",
    "X-Zoho-Signature": signature
  }
];

// Log response for debugging
info "Webhook response: " + response;
info "Meeting created: " + meetingUrl;
```

---

## Testing

### Test Payload:
```json
{
  "requestId": "test123",
  "status": "success",
  "meetingUrl": "https://meet.zoho.com/test",
  "timestamp": "2024-01-06T10:30:00.000Z"
}
```

### Test Signature:
Generate HMAC-SHA256 signature for the above payload using the secret. If signature matches, you'll get `200 OK`.

---

## Important Notes

- ✅ **Always include `requestId`** - This links the callback to the original request
- ✅ **Signature is mandatory** - Requests without valid signature are rejected
- ✅ **Use HTTPS only** - HTTP is not supported
- ✅ **Handle errors** - Send `status: "failed"` if meeting creation fails
- ✅ **Timeout** - Complete within 5 seconds (our backend times out at 5s)

---

## Questions?

If you need help:
- Check that signature generation matches our algorithm (sorted keys, HMAC-SHA256)
- Verify the webhook URL is correct
- Ensure all required fields are included
- Check that `requestId` matches the one you received

---

