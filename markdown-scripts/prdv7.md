# Product Requirements Document (PRD v7)

## Product Overview
PRD v7 evolves Barber GS by simplifying the barber/admin notification UI and tightening the production reminder workflow for appointments that are close to starting.

The current product already supports scheduling, monthly plans, Web Push subscriptions, WhatsApp notifications through CallMeBot, Firebase persistence, Vercel serverless APIs, and a GitHub Actions reminder workflow. This version focuses on making the reminder behavior operationally reliable in production: the reminder job must run online every 30 minutes, detect services scheduled to start in 65 minutes or less, notify the barber through WhatsApp, and notify the client through browser push when the client authorized notifications.

The implementation must not automate the public website or admin panel through browser navigation. Although the source request describes the cron job accessing the site, opening the admin panel, and entering the barber password, the production-safe design is for GitHub Actions to call a protected backend endpoint. This avoids exposing the barber password, avoids brittle UI automation, and keeps the system aligned with Vercel/Firebase best practices.

## Source Requirement
This PRD is based on `modifications.md`.

## Goals
- Remove the `Ativar lembrete` button from the barber/admin panel.
- Keep reminder enrollment behavior only where it is naturally needed by clients during booking or plan scheduling.
- Use a GitHub Actions YAML workflow as the production scheduler.
- Run the reminder workflow automatically every 30 minutes.
- Check all standard appointments and monthly plan attendances that are still pending.
- Detect appointments/attendances scheduled to start in 65 minutes or less.
- Notify the barber through CallMeBot WhatsApp with the client name and attendance hour.
- Notify the client through browser push when that client has granted notification permission.
- Keep duplicate prevention so the same attendance is not reminded repeatedly.
- Preserve the current public scheduling UI/UX except for the requested admin-panel button removal.

## Non-Goals
- Do not build UI automation that opens `barbergs.vercel.app`, clicks into the admin panel, or types the admin password.
- Do not store the barber/admin password in GitHub Actions.
- Do not expose CallMeBot API keys, VAPID private keys, Firebase Admin credentials, or internal check secrets to the frontend.
- Do not require the client to enable notifications to complete a booking.
- Do not remove browser push notification support entirely.
- Do not remove WhatsApp notifications for the barber.
- Do not introduce paid infrastructure.
- Do not add more Vercel serverless functions if the existing reminder endpoint can be extended safely.

## Target Users
- Clients who schedule a haircut and may want a 1-hour reminder.
- Clients with monthly plan attendances.
- Barber/admin who needs WhatsApp reminders before upcoming services.
- Developer/operator maintaining GitHub Actions, Vercel environment variables, Firebase, and notification health.

## Functional Requirements

### FR1 - Remove Barber Panel Reminder Button
- Remove the button labeled:

```text
Ativar lembrete
```

- The button must no longer appear in the barber/admin panel.
- Removing this button must not break existing admin workflows:
  - login;
  - listing appointments;
  - concluding appointments;
  - blocking dates or time slots;
  - managing monthly plans;
  - viewing reports.
- If the button currently triggers barber-device push subscription enrollment, that enrollment path should be deprecated for this version unless another visible admin requirement depends on it.
- The public client reminder opt-in flow must remain available where clients book an appointment or plan attendance.

### FR2 - GitHub Actions Reminder Workflow
- Add or update a GitHub Actions workflow file using YAML.
- The workflow must run every 30 minutes.
- The workflow must support manual execution through `workflow_dispatch`.
- The workflow must call the production reminder API endpoint over HTTPS.
- The workflow must fail visibly in GitHub Actions when the endpoint returns a non-2xx response.
- Required GitHub repository secrets:
  - `BARBERGS_BASE_URL`, for example `https://barbergs.vercel.app`;
  - `BARBERGS_CHECK_SECRET`, matching the secret configured in Vercel.

### FR3 - Protected Reminder API
- The reminder workflow must call a protected backend endpoint, preferably the existing:

```text
POST /api/reminders/check
```

- The endpoint must reject requests that do not include the correct check secret.
- The check secret must be sent in a header such as:

```text
x-barbergs-check-secret: {secret}
```

- The endpoint must not accept the barber/admin password as its production authentication mechanism.
- The endpoint response should include safe operational counts, such as:
  - checked;
  - eligible;
  - barberWhatsAppSent;
  - clientPushSent;
  - skipped;
  - failed.

### FR4 - Reminder Detection Window
- Every workflow run must check all pending reminder-eligible schedule items.
- Reminder-eligible schedule items include:
  - standard haircut appointments;
  - scheduled monthly plan attendances that are not marked done.
- A schedule item is eligible when it starts in 65 minutes or less and has not already been processed for this reminder type.
- Past appointments should be ignored after a reasonable grace window so old data does not trigger stale reminders.
- Recommended production window:
  - minimum: `0` minutes from now;
  - maximum: `65` minutes from now.
- The window values should remain configurable with:

```text
BARBERGS_REMINDER_MINUTES_MIN=0
BARBERGS_REMINDER_MINUTES_MAX=65
```

### FR5 - Barber WhatsApp Reminder
- For every eligible schedule item, notify the barber through CallMeBot WhatsApp.
- The message must be in Portuguese.
- The message must include at minimum:
  - client name;
  - scheduled hour;
  - service or plan attendance description when available.
- Required message meaning:

```text
Lembrete de atendimento: {nome} tem horário marcado às {hora}.
```

- A richer acceptable message:

```text
Lembrete de atendimento!
Cliente: {nome}
Serviço: {servico}
Horário: {hora}
```

- The message must be URL encoded before calling CallMeBot.
- WhatsApp failures must be recorded safely and must not prevent the job from checking the remaining schedules.
- Client-facing responses must never expose the CallMeBot API key or raw provider error.

### FR6 - Client Browser Push Reminder
- If the eligible schedule item has a valid client browser push subscription, send a browser push reminder to that client.
- The client message must be in Portuguese and include the attendance hour.
- Required message:

```text
Corte agendado para daqui a 1 hora ou menos! O atendimento foi marcado para {hora}, lembre-se de chegar na barbearia 5 minutos antes.
```

- If the client did not allow browser notifications, the job must skip the client push notification safely.
- If the push subscription is expired or invalid, the backend should remove or ignore it according to the existing push cleanup behavior.
- Failure to push to one client must not stop reminders for other clients.

### FR7 - Duplicate Prevention
- The same schedule item must not send duplicate 1-hour reminders across repeated workflow runs.
- Duplicate prevention state must be persisted in Firestore, not only in GitHub Actions logs.
- Each reminder-eligible item should have a stable reminder key:
  - standard appointment ID for appointments;
  - plan ID plus attendance/item ID for monthly plan attendances.
- The system should mark reminder state only after the reminder attempt has been accepted for processing.
- Retrying the workflow manually must not resend already processed reminders.

### FR8 - Reminder Coverage for Monthly Plans
- Monthly plan attendances with selected dates and times must be included in the reminder scan.
- Completed plan attendances must be ignored.
- Plan attendances without a selected date or time must be ignored.
- Reminder status for one plan attendance must not affect another attendance in the same plan.

### FR9 - Admin UI Behavior After Button Removal
- The barber/admin panel must not show a dead area, empty control row, or confusing text where `Ativar lembrete` used to appear.
- If there is existing admin notification status text tied only to that button, remove or simplify it.
- Existing admin notification diagnostics may remain only if they are still useful without requiring the removed button.

### FR10 - Operational Logging
- The reminder endpoint must log enough information for debugging without exposing secrets.
- Logs may include:
  - run timestamp;
  - number of appointments checked;
  - number of plan attendances checked;
  - number of reminders eligible;
  - WhatsApp success/failure count;
  - push success/failure count;
  - safe error category.
- Logs must not include:
  - admin password;
  - `BARBERGS_CHECK_SECRET`;
  - VAPID private key;
  - Firebase private key;
  - CallMeBot API key.

## Data Requirements

### Reminder-Eligible Schedule Item
Each normalized item checked by the reminder job should include:
- stable `id`;
- `kind`, such as `appointment` or `plan-attendance`;
- client name;
- service/plan label;
- date;
- time;
- optional client push subscription reference;
- current done/completed status;
- reminder sent timestamp/status.

### Standard Appointment Reminder State
Each standard appointment should support or reference:
- appointment ID;
- date;
- time;
- reminder sent timestamp;
- optional client push subscription ID;
- optional last reminder error category.

### Plan Attendance Reminder State
Each plan attendance should support:
- plan ID;
- attendance/item ID;
- date;
- time;
- done flag;
- reminder sent timestamp;
- optional last reminder error category.

### Reminder Run Result
Each workflow/API run may return:
- `checked`;
- `eligible`;
- `barberWhatsAppSent`;
- `clientPushSent`;
- `skipped`;
- `failed`;
- `timestamp`.

## API Requirements

### Reminder Check API
- Must be callable from GitHub Actions.
- Must use secret-based authentication.
- Must scan standard appointments and active monthly plan attendances.
- Must normalize schedule items into one reminder-processing flow.
- Must compare schedule date/time against the configured reminder window.
- Must call the WhatsApp notification service for the barber.
- Must call the browser push service for clients with valid subscriptions.
- Must persist duplicate-prevention state.
- Must continue processing other schedule items when one item fails.
- Must return safe operational counts.

### WhatsApp Notification Service
- Must run server-side only.
- Must use the current CallMeBot target configuration.
- Must build a reminder-specific barber message.
- Must URL encode message text.
- Must hide secrets from client-facing errors and logs.

### Push Notification Service
- Must reuse the existing Web Push/VAPID infrastructure.
- Must send to the specific client subscription for the schedule item when available.
- Must handle invalid subscriptions without crashing the full run.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: Vercel Serverless Functions.
- Scheduler: GitHub Actions Schedule.
- Database: Firebase Firestore.
- Notifications:
  - CallMeBot WhatsApp for barber reminders;
  - Web Push for client reminders.
- Hosting: Vercel.
- Language: all user-facing notification text must be Portuguese.
- Keep the Vercel serverless function count at or below the existing project limit.
- Prefer extending existing endpoint/function domains over creating new endpoints.

## Security Requirements
- Never commit the barber/admin password, check secret, Firebase Admin credentials, VAPID private key, or CallMeBot API key.
- GitHub Actions must use repository secrets.
- Vercel must use environment variables for server-side secrets.
- The reminder API must not be publicly triggerable without the check secret.
- The frontend must never receive server-side secrets.
- Browser push subscription data must be stored with only the minimum metadata required for delivery and cleanup.
- Logs and API responses must avoid sensitive personal data beyond what is operationally necessary.

## UX Requirements
- Removing `Ativar lembrete` should make the barber panel simpler, not visibly incomplete.
- Clients should still be able to finish booking even if they deny notification permission.
- Client push permission prompts must remain contextual and understandable.
- Reminder notification text must be short, direct, and useful on mobile notification screens.
- No new public-facing explanation page is required.

## Acceptance Criteria
- The barber/admin panel no longer displays the `Ativar lembrete` button.
- Existing admin panel actions still work after the button removal.
- A GitHub Actions workflow exists and runs every 30 minutes.
- The workflow can also be triggered manually.
- The workflow calls a protected production reminder endpoint.
- The workflow does not navigate the website UI and does not submit the barber password.
- Requests without the correct check secret are rejected.
- A schedule item starting in 65 minutes or less is detected as reminder-eligible.
- The barber receives a CallMeBot WhatsApp reminder containing the client name and hour.
- A client with a valid push subscription receives the Portuguese 1-hour reminder.
- A client without a push subscription is skipped safely.
- The same appointment or plan attendance is not reminded repeatedly across repeated workflow runs.
- Monthly plan attendances are included in reminder checks when they have date/time and are not done.
- Safe operational counts are returned by the reminder endpoint.
- No secrets are exposed in frontend code, API responses, or repository files.

## Risks and Mitigations
- Risk: GitHub Actions scheduled workflows can run late or be skipped occasionally.
  - Mitigation: use a 65-minute detection window and persisted duplicate-prevention state.
- Risk: UI automation would be brittle and expose the admin password.
  - Mitigation: use a protected API endpoint instead of browser automation.
- Risk: WhatsApp provider failures may prevent barber reminders.
  - Mitigation: log safe failure details, continue processing, and avoid blocking other reminders.
- Risk: Browser push permission may be denied or subscriptions may expire.
  - Mitigation: treat client push as best-effort and clean invalid subscriptions.
- Risk: Duplicate reminders could annoy clients and the barber.
  - Mitigation: persist reminder state per schedule item and make the endpoint idempotent.
- Risk: Monthly plan attendances may have nested checklist data that is harder to update safely.
  - Mitigation: use stable plan attendance IDs and update only the matching attendance reminder state.

## Implementation Notes
- Prefer extending the existing `api/reminders/check.js` instead of adding a new Vercel function.
- Reuse current Firestore helpers for appointments, plans, and push subscriptions.
- Add a reminder-specific WhatsApp message builder rather than overloading the new-appointment message.
- Use `BARBERGS_REMINDER_MINUTES_MAX=65` for this PRD.
- Keep the local script `scripts/barbergscheck.mjs` optional for diagnostics only; production should rely on GitHub Actions.
- Update README/deployment docs when implementing to include GitHub Actions secrets and reminder window configuration.
- Consider adding a small manual test checklist:
  - create appointment 60 minutes from now;
  - register client push subscription;
  - run workflow manually;
  - confirm WhatsApp barber reminder;
  - confirm client browser push;
  - run workflow again and verify no duplicate reminder.
