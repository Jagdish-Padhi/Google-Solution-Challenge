# API Reference

## Navigation

- [Architecture Overview](Architecture.md)
- [Database Schemas](Database.md)
- [Deployment Guide](Deployment.md)
- [Scraper System](Scraper-System.md)

---

## Base Path

All backend REST API endpoints are mounted under the `/api` prefix.

## Response Envelope

All API endpoints return responses encapsulated in a standardized envelope:

| Field | Type | Description |
| --- | --- | --- |
| `success` | `Boolean` | Indicates if the request was successfully processed. |
| `statusCode` | `Number` | The HTTP status code of the response. |
| `message` | `String` | A human-readable description of the result or error. |
| `data` | `Object / Array` | The actual payload data returned by the server. |

Example:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Asset keywords generated successfully",
  "data": {
    "keywords": ["IPL 2026 live stream", "BCCI highlights match 4", "cricket streaming free"]
  }
}
```

---

## Authentication

Protected endpoints require a JSON Web Token (JWT) sent via the `Authorization` header:

`Authorization: Bearer <your_access_token>`

Sub-users are assigned granular roles (`admin`, `analyst`, `legal`) that dictate permission scopes.

---

## API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Register a new broadcaster organization. | Public |
| `POST` | `/auth/login` | Log in via email and password credentials. | Public |
| `POST` | `/auth/google` | Sign in or register via Google One-Tap SSO. | Public |
| `POST` | `/auth/refresh` | Obtain a new access token using a refresh token. | Public |
| `POST` | `/auth/logout` | Revoke tokens and sign out. | Public |

### 📂 Asset Management

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/assets/upload` | Ingest a video/image asset and calculate its DNA. | Protected |
| `GET` | `/assets/` | List all reference assets owned by the organization. | Protected |
| `GET` | `/assets/:id` | Fetch single asset details (including licensed domains). | Protected |
| `PATCH` | `/assets/:id/update` | Update license permissions and partner lists. | Protected |
| `DELETE` | `/assets/:id` | Remove an asset from matching databases. | Admin |
| `POST` | `/assets/:id/suggest-keywords` | Generate search queries for scanning using Gemini. | Protected |
| `POST` | `/assets/:id/retry` | Re-run ML fingerprint generation on failed uploads. | Protected |

### 🔍 Discovery Scans

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/scans/start` | Kick off a scanning run (custom keywords, platform filters). | Protected |
| `GET` | `/scans/` | List all historical scan jobs. | Protected |
| `GET` | `/scans/:jobId/status` | Fetch real-time scan job status and stats. | Protected |
| `GET` | `/scans/:jobId/results` | List matches flagged during a specific scan. | Protected |
| `POST` | `/scans/:jobId/stop` | Cancel a running scan or livestream scanner. | Protected |
| `POST` | `/scans/:jobId/retry` | Restart a failed scan job. | Protected |
| `POST` | `/scans/run-scheduled` | Force-run background scheduled scans. | Admin |

### 🚨 Violations & Enforcement

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/violations/` | List flagged violations (supports filtering by confidence, platform, status). | Protected |
| `GET` | `/violations/:id` | Fetch similarity metrics, keypoint alignment, and Vision tags. | Protected |
| `PATCH` | `/violations/:id/status` | Resolve status (`OPEN`, `REPORTED`, `RESOLVED`, `LICENSED`). | Legal / Admin |
| `POST` | `/violations/:id/screenshot` | Generate visual screenshot evidence using Puppeteer. | Protected |
| `POST` | `/violations/:id/draft-dmca` | Draft a legally binding DMCA notice using Gemini. | Legal / Admin |

### 🏢 Organization & Team Settings

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/organization/me` | Fetch organization details and sub-user roles. | Protected |
| `POST` | `/organization/invite` | Invite a user to join the organization (role-based). | Admin |
| `DELETE` | `/organization/member/:email` | Remove a member from the team. | Admin |
| `PATCH` | `/organization/member/:email/role` | Update access roles (`admin`, `analyst`, `legal`). | Admin |
| `PATCH` | `/organization/notification-prefs` | Configure email alert and digest criteria. | Protected |
| `POST` | `/organization/send-digest` | Trigger immediate generation/sending of weekly digest. | Protected |

### 🔔 In-App Alerts

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/alerts/` | Fetch historical alerts. | Protected |
| `GET` | `/alerts/unread-count` | Retrieve the count of unread notifications. | Protected |
| `PATCH` | `/alerts/read` | Mark a batch of alert IDs as read. | Protected |
| `PATCH` | `/alerts/read-all` | Mark all notifications as read. | Protected |
| `PATCH` | `/alerts/:id/read` | Mark an individual alert as read. | Protected |

### 📊 Reports & Digests

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/reports/generate` | Start a Puppeteer background task to compile a PDF report. | Protected |
| `GET` | `/reports/` | List all completed PDF reports. | Protected |
| `POST` | `/digest/trigger` | Scheduled system trigger to send weekly email updates. | System Cron |
