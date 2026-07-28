# Product Requirements Document (PRD v5)

## Product Overview
PRD v5 evolves "Agendamento de Cortes" by removing the dependency on a local-machine cronjob, improving notification architecture, expanding monthly plan scheduling, and updating public creator branding.

The current application uses a local shell script executed every 30 minutes to detect new schedules and near-start appointments. The new version must move this operational responsibility online: new appointments notify the barber immediately through WhatsApp, while client reminders are checked by a GitHub Actions scheduled workflow. Monthly plans must also become schedule-aware, allowing clients to choose the actual dates and hours for each included attendance.

## Source Requirement
This PRD is based on `modifications.md`.

## Goals
- Remove the local machine as a required part of production notification operations.
- Notify the barber immediately when a new standard appointment is created.
- Use GitHub Actions Schedule as the online cron mechanism for 1-hour client reminders.
- Keep browser push notifications for client reminder delivery.
- Add date/hour selection to monthly plan booking.
- Apply standard schedule availability rules to plan attendance dates and hours.
- Restrict economic plan attendance dates to Monday, Tuesday, and Wednesday.
- Update the footer creator Instagram from `@caioobarreto1` to `@caio.websolutions`.

## Non-Goals
- Do not remove the existing admin panel.
- Do not remove existing browser push support for client reminders.
- Do not require a paid scheduling provider.
- Do not require the user's local computer to remain online.
- Do not redesign the full app visual identity.
- Do not expose admin passwords, VAPID private keys, Firebase keys, or GitHub secrets to the frontend.
- Do not use GitHub Actions to notify new appointments to the barber; this must happen immediately at appointment creation time.

## Target Users
- Clients booking one-time appointments.
- Clients buying weekly or economic monthly plans.
- Barber/admin receiving new appointment notifications.
- Developer/operator maintaining Vercel deployment, GitHub Actions, and environment variables.

## Functional Requirements

### FR1 - Remove Local Cron Dependency
- The production notification workflow must no longer depend on a cronjob running on the developer's local machine.
- `barbergscheck.sh` may remain for local diagnostics/manual testing, but it must not be required for production behavior.
- The application must document the new production scheduler setup.

### FR2 - Immediate Barber WhatsApp Notification for New Appointments
- When a client successfully creates a standard haircut appointment and a monthly plan with the respective dates and time (4 times or 2 times), the backend must immediately notify the barber's personal WhatsApp with the message (
  ```text
    Novo agendamento confirmado! 
      Nome {nome}, 
      Telefone {phone}, 
      Haircut {haircut or other service},
      Plan: {monthly plan}
  ```
)
- The 2 target barber WhatsApp number is:

```text
81 99379-6278 and 81 99936-7398
```

- Notification must happen as part of the appointment creation backend flow after the appointment is persisted.
- If WhatsApp delivery fails, the appointment must remain created.
- WhatsApp failures must be logged/returned in a safe operational way without exposing secrets to the client.
- The new appointment notification must not require polling or cron.

### FR3 - GitHub Actions Scheduled Reminder Job
- Replace the local cronjob with an online GitHub Actions Schedule workflow.
- The scheduled workflow must run every 30 minutes.
- The workflow must call a protected production API endpoint responsible for checking upcoming reminders.
- The endpoint must require a secret/admin credential so random public callers cannot trigger operational jobs.
- Required GitHub repository secrets should include, at minimum:
  - production app base URL;
  - admin/checker secret or password/token.

### FR4 - 1-Hour Client Browser Push Reminder
- Every 30 minutes, the GitHub Actions workflow must check if there are scheduled services that will start in approximately 1 hour or less.
- When a matching schedule is found, notify the respective client device via browser push.
- The notification body must be:

```text
Corte agendado para daqui a 1 hora ou menos! O atendimento foi marcado para {hour}, lembre-se de chegar na barbearia 5 minutos antes.
```

- `{hour}` must be replaced by the corresponding scheduled hour.
- The same schedule/reminder must not notify repeatedly across GitHub Actions executions.
- If the client has no valid push subscription, the reminder job must skip that client safely and continue processing others.

### FR5 - Reminder Duplicate Prevention
- The system must persist reminder sent state.
- A schedule that already received the 1-hour reminder must not receive it again.
- Re-running the GitHub Actions workflow manually must not duplicate reminders.
- API retries must not corrupt reminder state.

### FR6 - Monthly Plan Booking with Dates and Hours
- The monthly plan booking tab must change from only selecting a monthly plan to selecting:
  - client information;
  - plan type/service;
  - dates and hours for each included attendance.
- The available dates and hours for plans must follow the same standard availability rules used by normal appointments, unless overridden by plan-specific rules.
- Plan attendance slots must respect already booked appointments and blocked dates/hours.
- Confirming a plan must reserve every selected plan attendance slot.

### FR7 - Weekly Plan Date/Hour Selection
- For `Plano semanal`, the client must choose 4 dates and 4 hours.
- These 4 selections represent the 4 weekly attendances in 1 month.
- Each selected date/hour must be unique.
- Each selected date/hour must be available according to standard scheduling rules.

### FR8 - Economic Plan Date/Hour Selection
- For `Plano econômico`, the client must choose 2 dates and 2 hours.
- Economic plan available weekdays are restricted to:
  - Monday;
  - Tuesday;
  - Wednesday.
- This weekday restriction applies regardless of which month days are inside the plan range.
- The available economic plan dates must begin from the client's chosen plan start date and continue until the plan end date, 1 month later.
- Example: if the client starts an economic plan on June 13, the client may choose 2 available slots among all Mondays, Tuesdays, and Wednesdays between June 13 and July 13.

### FR9 - Plan Scheduling Conflict Rules
- A plan attendance slot must not be bookable if:
  - another standard appointment already uses that date/hour;
  - another plan attendance already uses that date/hour;
  - the barber blocked that full date;
  - the barber blocked that specific hour.
- If any selected plan attendance becomes unavailable during confirmation, the API must reject the plan creation with a clear Portuguese message.
- The client must be asked to choose another available slot.

### FR10 - Admin Plan Display
- Active plans in the barber/admin panel must show the scheduled date and hour for each planned attendance.
- The barber must still be able to mark each plan attendance as done.
- Completed plan behavior from PRD v4 must remain:
  - when all plan attendances are done, the plan is removed from active plans;
  - a completed-plan report item is added to the current monthly report.

### FR11 - Client Reminder Data for Plan Attendances
- Plan attendance slots should be compatible with the reminder system.
- If the client grants browser notification permission during plan booking, each selected plan attendance should be eligible for the 1-hour reminder.
- Reminder duplicate prevention must work independently for each plan attendance.

### FR12 - Creator Instagram Footer Update
- At the bottom of the public page, replace the creator Instagram:

```text
@caioobarreto1
```

with:

```text
@caio.websolutions
```

- The Instagram icon must remain.
- The link must point to the correct Instagram profile for `@caio.websolutions`.
- Existing Barber GS Instagram display must remain unchanged.

## Data Requirements

### Standard Appointment Reminder Record
Each reminder-eligible schedule must store or expose:
- appointment ID;
- client name;
- date;
- hour;
- service/plan attendance description;
- push subscription when available;
- reminder sent timestamp/status.

### Plan Attendance Record
Each plan attendance item must store:
- stable attendance ID;
- date;
- hour;
- status/done flag;
- done timestamp when completed;
- reminder sent timestamp/status when applicable.

### Plan Record
Each plan record must store:
- client name;
- phone when provided;
- plan option ID;
- plan type/name;
- selected service;
- plan price;
- plan attendance limit;
- plan start date;
- plan end date;
- scheduled attendance items;
- creation timestamp.

### GitHub Actions Job State
The reminder sent state should be stored in Firestore, not only inside GitHub Actions logs, so it survives:
- repeated runs;
- workflow retries;
- deployment changes;
- manual workflow executions.

## API Requirements

### Appointment Creation API
- Must persist the appointment before attempting WhatsApp notification.
- Must trigger immediate barber WhatsApp notification for standard appointments.
- Must not depend on cron for new appointment notification.

### Plan Creation API
- Must validate all selected attendance date/hour slots server-side.
- Must reject unavailable, duplicate, or invalid plan slots.
- Must persist scheduled plan attendances with the plan.
- Must support plan attendance reminders when push subscription data is available.

### Reminder Check API
- Must be callable by GitHub Actions.
- Must be protected by secret/token authentication.
- Must find reminder-eligible schedules approximately 1 hour or less from start time.
- Must send browser push notifications to the correct client device.
- Must mark reminders as sent after successful or accepted processing to avoid duplicates.
- Must return concise operational counts, such as checked, sent, skipped, and failed.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: Vercel serverless API routes.
- Database: Firebase Firestore.
- Scheduler: GitHub Actions Schedule.
- Notifications:
  - WhatsApp for immediate barber new-appointment notification;
  - Browser Push for client 1-hour reminders.
- Hosting: Vercel.
- The implementation should stay within the Vercel Hobby plan serverless function limit whenever possible.

## Security Requirements
- GitHub Actions must store secrets in repository secrets, not in committed files.
- The reminder API endpoint must reject unauthenticated requests.
- WhatsApp provider tokens/API keys must live only in environment variables.
- Browser push private VAPID key must remain server-side only.
- Client-facing errors must not reveal secrets, tokens, or internal stack traces.
- The barber phone number may be configured through environment variables even if the business number is documented here.

## Acceptance Criteria
- Creating a standard appointment immediately attempts to notify the barber by WhatsApp.
- New standard appointment notification no longer requires local cron polling.
- GitHub Actions runs every 30 minutes and calls the production reminder endpoint.
- A client with a valid push subscription receives the 1-hour reminder message once.
- The same schedule does not receive duplicate reminders across repeated GitHub Actions runs.
- Weekly plan booking requires exactly 4 available date/hour selections.
- Economic plan booking requires exactly 2 available date/hour selections.
- Economic plan date choices are limited to Monday, Tuesday, and Wednesday.
- Plan attendance slots cannot conflict with standard appointments, blocked slots, or other plan attendances.
- Active plans in the admin panel display scheduled dates/hours per attendance.
- Completing all plan attendances still adds the completed plan to monthly reports.
- Footer creator Instagram displays `@caio.websolutions` and links to that profile.

## Risks and Mitigations
- Risk: GitHub Actions scheduled workflows may not run at an exact minute.
  - Mitigation: use a practical reminder detection window and duplicate-prevention state.
- Risk: WhatsApp delivery depends on third-party provider availability.
  - Mitigation: appointment creation must not fail if WhatsApp delivery fails.
- Risk: Plan scheduling may introduce more conflicts than one-time appointments.
  - Mitigation: validate every selected slot server-side immediately before persistence.
- Risk: GitHub Actions secrets may be misconfigured.
  - Mitigation: document required secrets and make the reminder endpoint return clear operational errors.
- Risk: Browser push permission may be denied.
  - Mitigation: booking must still work; reminders are only sent when valid subscription data exists.

## Implementation Notes
- Prefer reusing the existing availability logic for plan attendance selection.
- Consider storing plan checklist items as JSON with `date`, `time`, `done`, `doneAt`, and `reminderSentAt`.
- The GitHub Actions workflow can replace the local `barbergscheck.sh` in production while the script remains available for manual checks.
- Keep new functionality inside existing API domains where practical to avoid exceeding Vercel Hobby serverless function limits.
- Update README/deployment docs with GitHub Actions setup and required secrets when implementing this PRD.
