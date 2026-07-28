# Product Requirements Document (PRD v2)

## Product Overview
The next version of "Agendamento de Cortes" replaces the local `test.txt` reminder behavior with real web browser notifications for the barber. The existing local cron job must continue running `barbergscheck.sh`, but when the system detects a new confirmed schedule or a service that starts in 1 hour, it must notify every authorized barber device through browser push notifications.

This version introduces a persistent "barber list": every device that accesses `https://barbergs.vercel.app/`, opens "Painel do barbeiro", enters the correct password, and authorizes notifications becomes eligible to receive operational reminders.

## Source Requirement
This PRD is based on `modificationsv2.md`.

## Goals
- Keep the existing cron job and `barbergscheck.sh` execution model.
- Stop using `test.txt` as the main notification channel.
- Create and maintain a persistent "barber list" of authorized devices.
- Add devices to the barber list only after successful barber-panel authentication.
- Notify all devices in the barber list when a new schedule is detected.
- Notify all devices in the barber list when a confirmed service is scheduled to start in about 1 hour.
- Use browser notifications, keeping the solution zero-cost and aligned with the current React, serverless API, Firestore, and Vercel stack.

## Non-Goals
- Do not add paid SMS, email, or WhatsApp notification providers for this version.
- Do not redesign the customer booking flow.
- Do not replace the existing barber panel authentication model.
- Do not store unnecessary client details in notification logs or device records.
- Do not require manual action from the barber every time the cron job runs.

## Target Users
- Barber/admin who needs real-time operational reminders on trusted devices.
- Developer/operator maintaining the local cron script and production app.

## Functional Requirements

### FR1 - Preserve Cron Execution
- The existing cron job must continue executing `barbergscheck.sh`.
- The script must remain safe to run every 30 minutes.
- The script must detect:
  - newly confirmed schedules;
  - confirmed schedules scheduled to start in about 1 hour.
- The script must trigger browser notifications instead of appending the business messages to `test.txt`.

### FR2 - Barber List Creation
- The system must maintain a persistent list called "barber list".
- A device is added to the barber list only after this path:
  1. user accesses `https://barbergs.vercel.app/`;
  2. user opens "Painel do barbeiro";
  3. user enters the correct barber/admin password;
  4. user grants browser notification permission;
  5. the app registers the device push subscription.
- The barber list should be stored in Firestore using a dedicated collection, such as `push_inscricoes`.
- Each barber-list item must store only the push subscription data and minimal metadata needed for maintenance.

### FR3 - Device Notification Enrollment
- After successful admin login, the barber panel must offer or trigger the notification enrollment flow.
- If the browser does not support Service Workers, PushManager, or Notifications, the UI must show a clear Portuguese error.
- If the user denies notification permission, the device must not be added to the barber list.
- Re-enrolling the same device must update the existing subscription rather than creating duplicate device entries whenever a stable subscription endpoint is available.

### FR4 - New Schedule Notification
- When the cron-driven checker detects a confirmed schedule that was not detected before, it must notify every device in the barber list.
- The notification message must be:

```text
Novo agendamento confirmado!
```

- The same schedule must not generate repeated "new schedule" notifications across repeated cron executions.

### FR5 - 1-Hour Service Notification
- When the cron-driven checker detects a confirmed schedule that starts in approximately 1 hour, it must notify every device in the barber list.
- The notification message must be:

```text
Serviço a ser feito daqui a 1 hora!
```

- Because the cron job runs every 30 minutes, the implementation must use a practical detection window instead of exact equality.
- Recommended detection window: 55 to 65 minutes from the current local time.
- The same schedule must not generate repeated 1-hour notifications across repeated cron executions.

### FR6 - Push Notification Delivery
- The backend must expose or implement the API needed to:
  - return the public VAPID key to the frontend;
  - save authenticated barber push subscriptions;
  - list active barber subscriptions for notification dispatch;
  - remove invalid subscriptions when push delivery fails permanently.
- The notification sender must attempt delivery to every active device in the barber list.
- Invalid or expired push subscriptions should be removed to keep the barber list clean.

### FR7 - State and Duplicate Prevention
- The checker must persist state for:
  - schedules already detected as new;
  - schedules that already triggered the 1-hour reminder.
- State may be local to the cron script or persisted in Firestore, but it must survive repeated runs.
- Failed notification attempts must not corrupt schedule detection state.

### FR8 - Error Handling
- If schedule retrieval, authentication, state loading, or notification dispatch fails, the system must record a concise operational error.
- The implementation may still use logs for diagnostics, but the required business notification channel is browser push, not `test.txt`.
- Failures must not expose admin passwords, tokens, phone numbers, or private client details.

## Data Requirements

### Barber List Item
Each device record should contain:
- stable ID derived from the push subscription endpoint or generated server-side;
- push subscription payload;
- creation timestamp;
- last update timestamp;
- optional last delivery status.

### Schedule Detection State
Each schedule detection record should contain:
- appointment ID when available;
- fallback fingerprint when no ID exists;
- whether the new-schedule notification was sent;
- whether the 1-hour reminder notification was sent;
- timestamps for successful notification events.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: serverless API routes hosted on Vercel.
- Database: Firebase Firestore free tier.
- Notifications: Web Push using Service Worker, Push API, and VAPID keys.
- Localization: Portuguese-first user-facing messages.
- No paid external notification provider is required.
- Sensitive values such as VAPID private key, admin password, admin secret, and Firebase credentials must be stored in environment variables.

## Security Requirements
- Only authenticated barber/admin sessions may add devices to the barber list.
- Public VAPID key may be exposed; private VAPID key must never be exposed to the client.
- Push subscription records must not include unnecessary customer data.
- Cron/API authentication must not hard-code passwords or bearer tokens in committed files.
- Notification payloads should avoid sensitive client details unless explicitly approved later.

## User Flow
1. Barber accesses `https://barbergs.vercel.app/`.
2. Barber opens "Painel do barbeiro".
3. Barber enters the correct password.
4. Browser notification permission is requested.
5. If permission is granted, the device is added to the barber list.
6. Cron runs `barbergscheck.sh`.
7. The checker reads confirmed schedules.
8. If a new schedule is detected, all barber-list devices receive `Novo agendamento confirmado!`.
9. If a schedule starts in about 1 hour, all barber-list devices receive `Serviço a ser feito daqui a 1 hora!`.

## Acceptance Criteria
- A device is not added to the barber list before successful barber-panel login.
- A device that logs into the barber panel and grants notification permission is persisted in the barber list.
- A new confirmed schedule triggers one `Novo agendamento confirmado!` notification on every active barber-list device.
- A schedule about 1 hour away triggers one `Serviço a ser feito daqui a 1 hora!` notification on every active barber-list device.
- Repeated cron runs do not duplicate notifications for the same schedule/event type.
- Invalid push subscriptions are eventually removed or ignored after failed delivery.
- The implementation keeps working without paid services.

## Risks and Mitigations
- Some browsers or devices may not support Web Push.
  - Mitigation: show clear Portuguese feedback and keep the device out of the barber list.
- Notification permission can be denied by the user.
  - Mitigation: allow the barber to retry enrollment from the admin panel.
- Cron exact-time checks can miss the 1-hour reminder.
  - Mitigation: use a configurable time window and event-state tracking.
- Push subscriptions can expire.
  - Mitigation: clean invalid subscriptions after delivery failures.
- Local cron credentials can leak if stored incorrectly.
  - Mitigation: keep secrets in environment variables or ignored local config files.

## Open Questions
- Should notification enrollment happen automatically after login or via an "Ativar lembretes" button?
- Should notifications include only the message, or also appointment time/client first name?
- Should schedule notification state be local to the cron machine or stored in Firestore?
- Should the barber list have an admin UI to remove old devices manually?
