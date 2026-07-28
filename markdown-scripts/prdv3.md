# Product Requirements Document (PRD v3)

## Product Overview
The next version of "Agendamento de Cortes" expands the barber/admin experience with monthly reports, clearer appointment outcomes, client reminder notifications, and small layout/branding refinements. This version builds on the existing React + Material UI frontend, serverless APIs, Firestore persistence, Vercel hosting, and browser push notification flow introduced in PRD v2.

The core business change is that completed services are no longer simply deleted. When the barber finishes an appointment, the service must be stored as an attended service, shown in the current monthly report, and later archived into past monthly reports. Canceled appointments must still be removable without entering revenue reports.

## Source Requirement
This PRD is based on `modifications.md`.

## Goals
- Add a "Relatórios mensais" section inside the barber/admin panel.
- Track finished services for the current month.
- Archive finished services into past monthly reports when a new month begins at 08:00 on day 1.
- Allow the barber to view, download, and delete past monthly reports.
- Replace the single "concluir atendimento" action with:
  - `Finalizar atendimento`;
  - `Cancelar atendimento`.
- Register barber devices and client devices in persistent notification lists.
- Send browser push notifications to:
  - all barber devices when a new schedule is detected;
  - the scheduled client device and all barber devices when the appointment is 1 hour or less away.
- Add Caio Barreto Rodrigues personal branding at the bottom of the page with Instagram `@caioobarreto1`.
- Improve the admin dashboard summary layout so "atendimentos agendados", "bloqueios ativos", and "planos mensais" appear stacked vertically.

## Non-Goals
- Do not add paid notification providers.
- Do not redesign the full application.
- Do not expose financial reports to clients.
- Do not include canceled appointments in monthly revenue.
- Do not store more client data than required for reports and reminders.
- Do not remove the existing barber notification enrollment behavior unless replaced by an equivalent secure flow.

## Target Users
- Barber/admin managing daily appointments and monthly revenue.
- Clients who need appointment reminders.
- Developer/operator maintaining the local cron checker and production deployment.

## Functional Requirements

### FR1 - Monthly Reports Section
- Add a new section in the barber panel called `Relatórios mensais`.
- This section must include two options:
  - `Mês atual`;
  - `Meses passados`.
- The UI must be in Portuguese and consistent with existing Material UI patterns.

### FR2 - Current Month Report
- `Mês atual` must show all services finished from the beginning of the active reporting month until today, including services finished today.
- Each item must show:
  - client name;
  - service type;
  - date and hour;
  - service price.
- When the current month report is empty, show:

```text
À espera de clientes satisfeitos
```

- Every new finished service must automatically appear in `Mês atual`.

### FR3 - Past Month Reports
- `Meses passados` must list only months that have at least one finished service.
- Months without attended clients must not appear.
- Clicking a month must show all clients/services attended in that month.
- Each past monthly report must show:
  - client name;
  - service type;
  - date and hour;
  - price for each service;
  - total money earned in that month.
- Past reports must persist until the barber deletes them.

### FR4 - Month Rollover
- On day 1 of a new month, starting at 08:00 local time, the current month list must close and become a past month report.
- A new empty current month list must begin.
- Rollover should be deterministic and must not duplicate services if executed more than once.
- Rollover may be handled lazily by backend reads/writes or by the existing scheduled checker, but monthly report state must remain correct.

### FR5 - Download Past Monthly Report
- Each past month item must include a `Baixar relatório` action.
- The action must download a PDF report to the user's device/phone.
- The PDF must include:
  - report month/year;
  - all finished services for that month;
  - client name;
  - service type;
  - date and hour;
  - individual prices;
  - monthly total.
- The PDF generation must use a zero-cost client-side or serverless-compatible approach.

### FR6 - Delete Past Monthly Report
- Each past month item must include a `Deletar mês` action.
- Deleting a month removes that month from `Meses passados`.
- Deleted reports must not reappear unless explicitly regenerated from retained source data.
- Deletion should require a confirmation step to avoid accidental loss.

### FR7 - Appointment Outcome Actions
- In `Agendamentos confirmados`, replace the single `concluir atendimento` button with:
  - `Finalizar atendimento`;
  - `Cancelar atendimento`.
- `Finalizar atendimento` must:
  - remove the appointment from confirmed appointments;
  - create a finished-service record;
  - make the service appear in `Mês atual`.
- `Cancelar atendimento` must:
  - remove the appointment from confirmed appointments;
  - not create a finished-service record;
  - not affect monthly revenue.
- These buttons must be placed at the bottom of each appointment item and must not cover client information, service information, notes, phone, date, or price.

### FR8 - Admin Summary Layout
- In the "Agenda do barbeiro" summary section, display the summary items vertically:
  - atendimentos agendados;
  - bloqueios ativos;
  - planos mensais.
- These items must be one above another instead of side by side.
- The layout must remain usable on mobile and desktop.

### FR9 - Personal Branding
- At the bottom of the public page, add a personal brand credit for the developer.
- The credit must identify:
  - Caio Barreto Rodrigues;
  - Instagram `@caioobarreto1`.
- The branding must be visible but not disruptive to booking, admin access, or existing Barber GS branding.

### FR10 - Barber Persisting List
- Maintain a persistent barber device list.
- Every time a device accesses the main domain, opens the admin panel, logs in with the correct admin password, and authorizes notifications, the device must be added to the barber list.
- The barber list must be cleared every 15 days.
- Re-enrolling the same device should update the existing record instead of creating duplicates whenever the push endpoint can be used as a stable identifier.

### FR11 - Client Persisting List
- Maintain a persistent client device list.
- Every time a client accesses the main domain, enters their name, chooses a schedule, and confirms scheduling, the device should be registered in the client list when browser notification permission is available/granted.
- Each client-list item must contain:
  - client name;
  - service type;
  - date and hour;
  - push subscription data when available.
- The client list must be cleared every 15 days.
- If notification permission is denied or unsupported, scheduling must still work, but that device cannot receive browser reminders.
- If two scheduled services has the same client name from both, but different hours and services, the program must count as 2 devices and add both in the client list as different clients

### FR12 - New Schedule Barber Notification
- Every time `barbergscheck.sh` runs, it must check all existing schedules.
- If a schedule is detected that was not checked before, send this browser push notification to all devices in the barber list:

```text
Novo agendamento confirmado!
```

- The same new schedule must not notify repeatedly across cron executions.

### FR13 - Client and Barber 1-Hour Reminder
- Every time `barbergscheck.sh` runs, it must check all client-list items and their scheduled hours.
- If a service is scheduled for 1 hour or less from now, send a browser push notification to:
  - the registered client device for that schedule;
  - all devices in the barber list.
- The notification message must be:

```text
Corte agendado para daqui a 1 hora ou menos! O atendimento foi marcado para {hour}, lembre-se de chegar na barbearia 5 minutos antes.
```

- `{hour}` must be replaced by the corresponding scheduled hour.
- The same schedule/reminder must not notify repeatedly across cron executions.

## Data Requirements

### Finished Service Record
Each finished service must store:
- unique ID;
- original appointment ID when available;
- client name;
- service type;
- service price;
- date;
- hour;
- finished timestamp;
- report month key, such as `YYYY-MM`.

### Monthly Report
Each monthly report must support:
- month key;
- month label in Portuguese;
- list of finished service records;
- total revenue;
- archived/deleted status;
- archive timestamp when applicable.

### Barber Device Record
Each barber-list record must store:
- stable device/subscription ID;
- push subscription payload;
- creation timestamp;
- last update timestamp;
- expiration/cleanup metadata.

### Client Device/Schedule Record
Each client-list record must store:
- stable record ID;
- appointment ID;
- client name;
- service type;
- date;
- hour;
- push subscription payload if granted;
- reminder sent status;
- creation timestamp;
- expiration/cleanup metadata.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: serverless API routes hosted on Vercel.
- Database: Firebase Firestore free tier.
- Notifications: Web Push using Service Worker, Push API, and VAPID keys.
- Reports: Firestore-backed finished-service data with PDF download support.
- Localization: Portuguese-first text and labels.
- Keep infrastructure zero-cost.
- Use environment variables for all secrets.
- Avoid unnecessary dependencies, but use proven libraries for PDF generation or Web Push when they reduce risk.

## Security and Privacy Requirements
- Only authenticated admin users can view reports and revenue.
- Only authenticated admin users can delete reports.
- Do not store plain-text admin secrets in committed files.
- Do not expose private VAPID keys to the frontend.
- Store only the client data required for scheduling, reports, and reminders.
- Do not show client report data publicly.
- Push subscription data must be treated as private operational data.

## User Flows

### Finish Appointment Flow
1. Barber opens `Painel do barbeiro`.
2. Barber views `Agendamentos confirmados`.
3. Barber clicks `Finalizar atendimento`.
4. Appointment disappears from confirmed appointments.
5. Finished service appears in `Relatórios mensais` > `Mês atual`.

### Cancel Appointment Flow
1. Barber opens `Painel do barbeiro`.
2. Barber views `Agendamentos confirmados`.
3. Barber clicks `Cancelar atendimento`.
4. Appointment disappears from confirmed appointments.
5. No report/revenue record is created.

### Past Monthly Report Flow
1. Barber opens `Relatórios mensais`.
2. Barber clicks `Meses passados`.
3. Barber sees only months with attended clients.
4. Barber opens a month and views all finished services and total revenue.
5. Barber may download the report PDF or delete that month.

### Client Reminder Flow
1. Client schedules an appointment.
2. Client device is registered for reminders if notifications are allowed.
3. Cron runs every 30 minutes.
4. If the appointment is 1 hour or less away, the client and barber devices receive the reminder notification.

## Acceptance Criteria
- `Relatórios mensais` appears in the admin panel with `Mês atual` and `Meses passados`.
- Empty current month report shows `À espera de clientes satisfeitos`.
- `Finalizar atendimento` creates a finished-service record and updates the current monthly report.
- `Cancelar atendimento` removes the appointment without creating report revenue.
- Past months with attended clients appear in `Meses passados`; empty months do not appear.
- Past month details show client, service, date/hour, price, and monthly total.
- `Baixar relatório` downloads a PDF for the selected month.
- `Deletar mês` removes the selected month after confirmation.
- Admin summary chips/items are displayed vertically.
- Public footer includes Caio Barreto Rodrigues and `@caioobarreto1`.
- Barber list and client list are cleared every 15 days.
- New schedules notify all barber devices with `Novo agendamento confirmado!`.
- Appointments 1 hour or less away notify the client device and all barber devices with the required dynamic-hour message.
- Duplicate notifications are prevented across repeated cron executions.

## Risks and Mitigations
- PDF generation may increase bundle size.
  - Mitigation: lazy-load the PDF generator or use a minimal client-side approach.
- Browser push may be unsupported or denied.
  - Mitigation: keep scheduling functional and show clear Portuguese feedback.
- Monthly rollover can duplicate or lose records if not idempotent.
  - Mitigation: use stable month keys and finished-service IDs.
- Deleting past reports can remove business records permanently.
  - Mitigation: require confirmation and consider soft delete if implementation allows.
- Client-list cleanup every 15 days may remove a reminder for an appointment scheduled farther ahead.
  - Mitigation: align cleanup with appointment window or preserve future appointments until completed/canceled.
- Cron state and Firestore state can drift.
  - Mitigation: use stable appointment IDs and persisted sent flags where possible.

## Important reminders
- `Deletar mês` should permanently delete data: YES
- Should monthly rollover be triggered API reads, or report creation logic? By report creationg logic
- Should client notification permission be requested during booking or after booking confirmation? After booking confirmation
- Should the PDF include Barber GS branding/logo? YES
- Should monthly reports include canceled/no-show appointments as a separate non-revenue section? YES