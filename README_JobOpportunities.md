# Job Opportunities Generation API

A professional, scalable API for generating personalized job opportunity email content using OpenAI GPT-4 and Upstash QStash for background processing.

## 🚀 Features

- **Asynchronous Processing**: Uses QStash for reliable background job processing
- **GPT-4 Integration**: Generates professional, humanized email content
- **Input Validation**: Comprehensive validation with express-validator
- **Job Tracking**: MongoDB-based job status tracking with TTL cleanup
- **Error Handling**: Robust error handling with retry mechanisms
- **Performance Optimized**: Indexed database queries and efficient processing

## 📁 Project Structure

```
├── routes/ai/
│   └── generatejobopportunities.js    # Main route handler
├── controllers/
│   └── jobOpportunitiesController.js  # Business logic controller
├── services/
│   ├── openaiService.js              # OpenAI GPT-4 integration
│   └── qstashService.js              # Upstash QStash integration
├── models/
│   └── jobOpportunity.js             # MongoDB schema
├── middleware/
│   └── validation.js                 # Input validation middleware
└── app.js                            # Updated with new route
```

## 🔧 Environment Variables

Add these to your `.env.local` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Upstash QStash Configuration
QSTASH_TOKEN=your_qstash_token_here
QSTASH_URL=https://qstash.upstash.io/v2

# Application Configuration
BASE_URL=http://localhost:8080  # or your production URL
MONGODB_CONNECTION_STRING=your_mongodb_connection_string
```

## 📡 API Endpoints

### 1. Generate Job Opportunity Content

**POST** `/ai/generatejobopportunities`

Queues a job for background processing and returns immediately with a job ID.

**Request Body:**
```json
{
  "country": "Canada",
  "occupation": "Software Engineer",
  "clientName": "John Doe"
}
```

**Response:**
```json
{
  "message": "Job queued successfully",
  "jobId": "job_1703123456789_abc123def",
  "status": "queued",
  "estimatedCompletion": "2024-01-15T10:31:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Check Job Status

**GET** `/ai/generatejobopportunities/status/:jobId`

Check the status of a queued job.

**Response (Processing):**
```json
{
  "jobId": "job_1703123456789_abc123def",
  "status": "processing",
  "country": "Canada",
  "occupation": "Software Engineer",
  "clientName": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:15.000Z"
}
```

**Response (Completed):**
```json
{
  "jobId": "job_1703123456789_abc123def",
  "status": "completed",
  "country": "Canada",
  "occupation": "Software Engineer",
  "clientName": "John Doe",
  "content": "Dear John,\n\nI'm excited to share some promising opportunities for Software Engineers in Canada...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:30:45.000Z",
  "processingTime": 45000
}
```

**Response (Failed):**
```json
{
  "jobId": "job_1703123456789_abc123def",
  "status": "failed",
  "country": "Canada",
  "occupation": "Software Engineer",
  "clientName": "John Doe",
  "error": "OpenAI API rate limit exceeded",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:30:45.000Z"
}
```

### 3. Get All Jobs (Admin)

**GET** `/ai/generatejobopportunities/admin/jobs`

Get all jobs with pagination and filtering.

**Query Parameters:**
- `status`: Filter by status (queued, processing, completed, failed)
- `limit`: Number of results per page (default: 50)
- `page`: Page number (default: 1)

## 🔄 How It Works

1. **Client Request**: POST to `/ai/generatejobopportunities` with job parameters
2. **Immediate Response**: API returns job ID and status "queued"
3. **Background Processing**: QStash calls `/ai/generatejobopportunities/process`
4. **Content Generation**: OpenAI GPT-4 generates professional email content
5. **Status Update**: Job status updated to "completed" or "failed"
6. **Client Polling**: Client polls status endpoint until completion

## 🎯 Generated Content Features

- **Professional Tone**: Warm, personalized, and encouraging
- **Market-Specific**: Tailored to country and occupation
- **Humanized**: Sounds like a real person wrote it
- **Structured**: 2-3 paragraphs with clear flow
- **Action-Oriented**: Includes positive call-to-action

## 🛡️ Error Handling

- **Input Validation**: Comprehensive validation with detailed error messages
- **Retry Logic**: QStash automatically retries failed jobs (3 attempts)
- **Graceful Degradation**: Proper error responses for all failure scenarios
- **Logging**: Detailed logging for debugging and monitoring

## 📊 Database Schema

The `JobOpportunity` model includes:

- **Job Tracking**: Unique job ID, status, timestamps
- **Input Data**: Country, occupation, client name
- **Output Data**: Generated content, error messages
- **Performance**: Processing time, retry count
- **Cleanup**: TTL index for automatic cleanup after 7 days

## 🚀 Usage Example

```javascript
// 1. Submit job
const response = await fetch('/ai/generatejobopportunities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    country: 'Canada',
    occupation: 'Software Engineer',
    clientName: 'John Doe'
  })
});

const { jobId } = await response.json();

// 2. Poll for completion
const pollStatus = async () => {
  const statusResponse = await fetch(`/ai/generatejobopportunities/status/${jobId}`);
  const status = await statusResponse.json();
  
  if (status.status === 'completed') {
    return status.content; // Ready for Zoho CRM
  } else if (status.status === 'failed') {
    throw new Error(status.error);
  } else {
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return pollStatus();
  }
};

const emailContent = await pollStatus();
```

## 🔧 Integration with Zoho CRM

The generated content is ready to be used with Zoho CRM:

```javascript
const zohoEmailData = {
  to: clientEmail,
  subject: "Job Opportunities in Canada", // Set by Zoho
  body: emailContent, // Your generated content
  // Zoho handles header, footer, signature, etc.
};
```

## 📈 Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **TTL Cleanup**: Automatic cleanup of completed jobs
- **Connection Pooling**: Efficient database connections
- **Error Recovery**: Robust retry mechanisms
- **Monitoring**: Built-in job tracking and status monitoring

This implementation provides a production-ready, scalable solution for generating professional job opportunity content with excellent user experience and reliability.
