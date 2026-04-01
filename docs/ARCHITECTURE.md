# Architecture Overview

## Services

- `client`: React dashboard for organizations.
- `server`: API gateway, auth, business logic, orchestration.
- `ml-service`: fingerprinting, scraping, matching pipelines.
- `mongo`: primary data store.

## Communication

- `client -> server` via REST and WebSocket.
- `server -> ml-service` via internal HTTP calls.
- `server/ml-service -> mongo` for storage and job tracking.

## Conventions

- Keep route/controller/service/model separation in `server`.
- Keep page/component/service/hook separation in `client`.
- Keep domain modules separated in `ml-service`.
