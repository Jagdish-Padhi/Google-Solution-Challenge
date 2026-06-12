# SportShield Major Update Plan

This document outlines a phased execution plan to integrate deep, mentor-driven feedback into the SportShield platform. These changes transition the project from a standard "piracy detector" into a nuanced, enterprise-grade rights management suite tailored for Indian broadcasters (IPL/BCCI) and global sports networks.

---

## Phase 1: Foundational Credibility & Localization (Fastest Impact)
*Goal: Ground the project in the judges' reality and prove our ML accuracy visually.*

### 1.1 The IPL / BCCI Use Case — India-Specific Framing (2 hrs)
- **Action:** Update landing page copy to explicitly mention protecting "IPL, T20, and ISL broadcast rights".
- **Action:** Modify the backend seed script to generate Indian-specific piracy examples (Hindi Telegram channels `टी20 वर्ल्ड कप लाइव`, domains like `cricfree.sc`, `mylivecricket.com`, `smartcric.com`).
- **Action:** Update the Gemini DMCA prompt to specifically reference BCCI/ICC rights frameworks when generating notices.

### 1.2 Confidence Score Visual Breakdown (2 hrs)
- **Action:** Add a transparent, credible breakdown of the 95%+ accuracy claim on the `DashboardViolationsPage`.
- **Action:** Display a component showing exactly how the score is calculated:
  - pHash match (X%) -> points
  - Color match (Y%) -> points
  - Frame match (Z%) -> points
  - ORB verified (✓) -> +boost
  - Mirror detect (✓)
  - Vision API (✓) -> +boost

---

## Phase 2: Operations, Rights Nuance, & Legal Workflow
*Goal: Solve real business problems like team access, licensed distribution vs. piracy, and court-ready evidence.*

### 2.1 Sub-user / Team Roles (8 hrs)
- **Backend:** Update `organization.model.js` to include a `members` array `[{ email, role, inviteStatus, joinedAt }]`. Roles: `admin`, `analyst`, `legal`.
- **Backend:** Add `POST /org/invite` route. Update JWT middleware to attach the user's role to requests and enforce role-based access control (RBAC).
- **Frontend:** Add a "Team" tab in `DashboardSettingsPage` for invites. Restrict the UI based on role (e.g., Legal only sees violations >85% confidence and DMCA tools; cannot run scans).

### 2.2 Asset Licensing Status (4 hrs)
- **Backend:** Update `asset.model.js` with `licensedDomains` array and `licensedPartners` array `[{ name, domain, expiresAt }]`.
- **Backend:** During scan/violation creation, if `sourceDomain` matches a licensed domain, set violation status to `'licensed'` instead of `'open'`.
- **Frontend:** Add a "Licensed Partners" section to asset details. Add a "Licensed Distribution" badge variant and separate them from piracy stats in analytics.

### 2.3 Evidence Package Download — ZIP (3 hrs)
- **Action:** Add `jszip` or `archiver` dependency.
- **Backend/Frontend:** Implement a "Download Evidence Package" button on the violation detail view.
- **Payload:** Generates and downloads a ZIP containing:
  - `dmca_notice.txt` (Gemini draft)
  - `evidence_report.pdf` (Puppeteer screenshot/report)
  - `metadata.json` (Raw Hamming distance, timestamps, ORB/Vision results)

---

## Phase 3: Deep Analytics & Threat Intelligence
*Goal: Provide actionable intelligence that rights holders actually pay for.*

### 3.1 Content DNA — Propagation Timeline Per Asset (4 hrs)
- **Frontend:** On the violation detail/asset detail view, render a vertical chronological timeline showing how the piracy spread (e.g., First Telegram, then YouTube 14 mins later, then Web domains).
- **Backend:** Create a query that groups violations for an asset by `detectedAt` and returns time deltas.

### 3.2 Piracy Surge Intelligence — The "Broadcast Window" (4 hrs)
- **Backend:** Add `eventContext` to `asset.model.js` (match name, kickoff time, sport). Calculate `minutesSinceEvent` on violations.
- **Frontend:** Add a "Surge Pattern" chart in analytics showing violations vs. time-since-kickoff to identify when 90% of revenue damage occurs.
- **AI Integration:** Use Gemini to read this data and generate a natural language "Piracy Intelligence Report" (e.g., "Peak sharing occurred 47 mins post-broadcast on Telegram...").

### 3.3 Repeat Offender Domain Intelligence (3 hrs)
- **Backend:** Create `GET /api/analytics/offenders` endpoint that groups violations by `sourceDomain`, aggregating a total "Threat Score", violation count, and first/last seen dates.
- **Frontend:** Create a new "Threat Actors" analytics tab. Render a ranked data table.
- **Action:** Add a "Block Domain" button to add domains to an org-level blocklist/allowlist, simulating ISP-level blocking priorities.

---

## Execution Strategy
We will execute this plan sequentially by Phase. 
Does this phased approach look correct, and are we clear to begin **Phase 1** immediately?
