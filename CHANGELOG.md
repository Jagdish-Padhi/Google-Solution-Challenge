# Changelog

All notable changes to this project will be documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Professional repository governance files: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and issue/PR templates under `.github/`.
- Deep technical documentation inside `docs/` detailing Architecture, API contracts, Database collections, Deployment instructions, and Scraper mechanics.

## [2.0.0] - 2026-06-16

### Added
- **Expanded Platform Coverage**: Scans extended to 6 major platforms: YouTube, X (Twitter), Telegram, the open web, Twitch, and Kick.
- **Real-Time Livestream Dashboard**: Dashboard tracking active RTMP/HLS livestream scan states and telemetry via Socket.io and Firestore `onSnapshot`.
- **Creator Portal & RBAC**: Specialized navigation flows and permissions for Admin, Analyst, Legal, and Independent Creator roles.
- **Upgraded ML Pipeline**: Mirror-aware pHash & flipped-pHash matching, ORB+RANSAC homography keypoint tie-breaker, and Google Cloud Vision AI semantic validation.
- **Smart Licensed Content Detection**: Support for licensed domains and partner filtering to prevent false-positive violation captures.
- **Violation Command Center & DMCA**: Cites ICC/BCCI broadcasting rights; creates evidence bundles and automated platform-specific ZIP downloads.
- **Professional Reporting**: PDF export functionality utilizing headless Puppeteer with interactive charts.

## [1.0.0] - 2026-02-14

### Added
- **Initial MVP release**: Core FastAPI service with pHash fingerprinting and media similarity index checks.
- **Basic Discovery**: Scraping pipelines for YouTube search, X (Twitter), and Telegram public groups.
- **Orchestration**: Express.js server backend API gateway, MongoDB persistence, and an basic React UI client dashboard.
- **Alerts**: Email-based notification system via Brevo (SMTP).
