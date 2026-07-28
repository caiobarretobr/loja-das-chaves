# Product Requirements Document (PRD v6)

## Product Overview
PRD v6 evolves "Agendamento de Cortes" by adding an optional client account system focused on monthly plans. Normal haircut scheduling must remain simple and available without account creation, but clients who want to subscribe to a monthly plan must create or access a user account.

Client accounts will store client identity, login state, selected monthly plan type, and the dates chosen for plan attendances. When a client confirms new plan attendance dates, the system must notify the barber through WhatsApp using CallMeBot. When all attendances in a client's monthly plan are completed, the plan must move automatically into the current monthly report and be removed from active monthly plans.

## Source Requirement
This PRD is based on `modifications.md`.

## Goals
- Add a client account entry point called `Conta do usuário` near the existing barber/admin panel option.
- Keep account creation optional for standard one-time scheduling.
- Require client account creation or login for monthly plan subscription.
- Support Google login and email/password registration.
- Persist client registration data securely.
- Keep the client logged in on the browser after account creation or login.
- Store monthly plan information and chosen attendance dates under the client's account.
- Notify the barber by WhatsApp whenever a client confirms new dates for a monthly plan.
- Automatically move finished monthly plans to the current monthly report.

## Non-Goals
- Do not require login for a simple standard haircut appointment.
- Do not redesign the full public scheduling flow.
- Do not remove the existing barber/admin panel.
- Do not expose client passwords, authentication secrets, CallMeBot API keys, Firebase admin credentials, or internal tokens to the frontend.
- Do not store plain-text passwords.
- Do not make WhatsApp delivery a blocker for saving valid plan date selections.
- Do not introduce paid infrastructure unless explicitly approved.

## Target Users
- Clients booking one-time appointments without wanting an account.
- Clients who want to subscribe to a monthly plan.
- Returning clients who need to manage or continue selecting plan dates.
- Barber/admin receiving WhatsApp updates and managing active monthly plans.
- Developer/operator maintaining Firebase, Vercel, and notification configuration.

## Functional Requirements

### FR1 - User Account Navigation Entry
- Add a public navigation/action option close to the barber panel called:

```text
Conta do usuário
```

- This option must open the client account interface.
- The option must be visually distinct from the barber/admin panel so clients understand it is for them.
- The barber/admin panel behavior must remain unchanged.

### FR2 - Optional Account for Standard Scheduling
- Clients must be able to create a simple standard appointment without creating an account.
- Existing standard booking fields and validation must continue working.
- The app must not block standard booking because the client is logged out.
- If a logged-in client books a standard appointment, the app may prefill available client data, but this must not be required.

### FR3 - Account Required for Monthly Plans
- In the monthly plan option, when the user is not logged in, show this Portuguese message:

```text
Para assinar um plano, crie uma conta
```

- The message must include a clear button:

```text
Criar conta
```

- Clicking `Criar conta` must open the same client account interface or registration flow.
- Monthly plan subscription/confirmation must be blocked until the client is authenticated.
- After successful account creation or login, the client should be able to continue the monthly plan flow.

### FR4 - Client Account Interface
- The `Conta do usuário` interface must provide two account access sections:
  - Google account login;
  - email/password login and registration.
- The interface must support both sign in and sign up behavior.
- User-facing labels, validation messages, and buttons must be in Portuguese.
- The interface must be responsive on mobile and desktop.

### FR5 - Google Login
- Clients must be able to sign in with a Google account.
- On first Google login, create or update the client profile record using available Google identity information.
- Google login must use the project's existing authentication provider when possible, preferably Firebase Authentication if already available.
- Google authentication state must persist in the browser.

### FR6 - Email/Password Registration
- To register with email/password, the client must fill:
  - complete name;
  - phone number;
  - email;
  - password;
  - confirm password.
- Registration validation must include:
  - required complete name;
  - valid phone format;
  - valid email format;
  - password and confirm password must match;
  - minimum password security requirements.
- Passwords must be handled by the authentication provider and must never be stored in Firestore as plain text.
- After registration succeeds, create a client profile record in the secure client registry.

### FR7 - Email/Password Login
- Existing clients must be able to log in with email and password from any device.
- When a valid client logs in on a device/browser, the login session must persist according to the authentication provider's browser persistence behavior.
- Invalid credentials must show a clear Portuguese error without revealing whether an email exists when avoidable.

### FR8 - Secure Client Registry
- Registered client information must be saved in a protected client list/collection.
- Each client profile must store:
  - stable user ID;
  - complete name;
  - phone number;
  - email;
  - authentication provider;
  - creation timestamp;
  - last login/update timestamp when available.
- Firestore security rules or server-side APIs must prevent random public users from reading all client records.
- Clients should only access their own profile data.
- Admin/barber access to client information must remain protected by admin authentication.

### FR9 - Browser Session Persistence
- After a client registers or logs in, the app must keep the account active in that browser.
- When the client opens the app again in the same browser, the app should restore the same account automatically.
- The app must provide a logout action in the client account area.
- Logging in on another device/browser must create a valid persistent session for that device/browser too.

### FR10 - Monthly Plan Data Attached to Account
- Client accounts must store or reference the monthly plans selected by that client.
- Monthly plan data must include:
  - client/user ID;
  - client name;
  - phone number;
  - plan type;
  - selected dates;
  - selected attendance count;
  - plan status;
  - creation timestamp;
  - completion timestamp when finished.
- Supported plan types must include at minimum:
  - `Plano econômico`;
  - `Plano semanal`.
- The plan data model must support clients choosing all included dates at once or choosing the next date later.

### FR11 - Flexible Plan Date Selection
- Choosing all dates for the monthly plan at one time must be optional.
- A client may choose only the next haircut date as time passes.
- Whenever the client adds or confirms one or more new plan dates, the system must persist those dates under the active plan.
- Selected dates must continue following the plan scheduling and availability requirements from PRD v5:
  - weekly plan requires up to 4 attendances;
  - economic plan requires up to 2 attendances;
  - economic plan dates are restricted to Monday, Tuesday, and Wednesday;
  - selected slots must not conflict with booked appointments, blocked slots, or other plan attendances.

### FR12 - Notify Barber When Plan Dates Are Confirmed
- Each time a client confirms new dates for a monthly plan, the system must call the `notifyBarber` behavior.
- The notification must be sent through CallMeBot using this URL pattern:

```text
https://api.callmebot.com/whatsapp.php?phone={phone}&text={text}&apikey={apikey}
```

- The default barber notification target from `modifications.md` is:

```text
phone = 558193796278
apikey = 7205669
```

- In production, phone and API key should be configurable through environment variables.
- The notification text must include the plan type, client name, and confirmed dates:

```text
Novas datas confirmadas para o plano {plan} de {name}:
{dates}
```

- Each date line should use the attendance order and date, for example:

```text
1º atendimento: 17/04
2º atendimento: 24/04
```

- The message text must be URL encoded before calling CallMeBot.
- If there are no newly confirmed dates, the system must not send an empty notification.

### FR13 - Notification Timing and Failure Handling
- The CallMeBot notification must happen after the new plan dates are successfully persisted.
- If CallMeBot fails, the selected dates must remain saved.
- Notification failures must be logged for admin/developer diagnostics.
- Client-facing errors must not expose the CallMeBot API key, raw provider response, or stack trace.
- The API should return a safe status indicating that dates were saved and notification may have failed when appropriate.

### FR14 - Active Monthly Plan Lifecycle
- Active monthly plans must remain visible in the monthly plans/admin area while they still have pending attendances.
- Each attendance must be individually trackable as pending or completed.
- When all attendances for a client's plan are completed, the system must:
  - add the completed plan to the current monthly report;
  - remove the plan from active monthly plans.
- This behavior must work for both economic and weekly plans.
- The monthly report entry must preserve enough detail to understand what was completed.

### FR15 - Returning Client Plan Continuation
- When a logged-in client returns to the app, the monthly plan area should show their active plan status when available.
- If the client has remaining plan attendances to choose, the app should allow choosing the next available date.
- If all dates are already chosen, the app should show the selected dates/status instead of prompting for duplicate selections.
- The client must not be able to create duplicate active plans of the same type accidentally unless the business rules explicitly allow a renewal.

## Data Requirements

### Client Profile
Each registered client profile must include:
- `uid`;
- `fullName`;
- `phone`;
- `email`;
- `authProvider`;
- `createdAt`;
- `updatedAt`;
- optional `lastLoginAt`.

### Client Plan
Each client monthly plan must include:
- `planId`;
- `uid`;
- `clientName`;
- `phone`;
- `planType`;
- `planLabel`;
- `status`;
- `attendanceLimit`;
- `createdAt`;
- `completedAt`;
- `reportMonth` when completed;
- array or subcollection of attendances.

### Plan Attendance
Each plan attendance must include:
- `attendanceId`;
- `order`;
- `date`;
- `hour` when the existing plan flow requires time selection;
- `status`;
- `done`;
- `doneAt`;
- `createdAt`;
- optional `reminderSentAt` from PRD v5 reminder behavior.

### Notification Log
For operational diagnostics, each CallMeBot notification attempt should store or log:
- plan ID;
- user/client ID;
- notification type;
- destination phone masked when displayed;
- sent date count;
- success/failure status;
- timestamp;
- safe error code/message when failed.

## API Requirements

### Auth/Profile API or Firebase Auth Integration
- Must support Google login.
- Must support email/password registration and login.
- Must create/update protected client profile records.
- Must persist browser authentication sessions.
- Must expose only the logged-in client's own profile data to the frontend.

### Monthly Plan Creation API
- Must require an authenticated client.
- Must validate the selected plan type.
- Must create a plan linked to the authenticated client ID.
- Must support creating a plan with all dates selected or with dates selected later.
- Must prevent accidental duplicate active monthly plans unless renewal is intentionally supported.

### Plan Date Confirmation API
- Must require an authenticated client.
- Must verify the plan belongs to the authenticated client or that the caller is an authenticated admin.
- Must validate newly selected dates against availability and plan rules.
- Must persist the new dates before attempting WhatsApp notification.
- Must call the CallMeBot notification service for newly confirmed dates.
- Must return a safe success/failure result for saved dates and notification status.

### Plan Completion/Report API
- Must allow the barber/admin to mark plan attendances as completed.
- Must detect when all attendances for a plan are completed.
- Must add completed plans to the current monthly report.
- Must remove completed plans from active monthly plans after report insertion.
- Must avoid duplicating report entries if the completion action is retried.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: Vercel serverless API routes where server-side handling is needed.
- Authentication: Firebase Authentication preferred for Google and email/password.
- Database: Firebase Firestore.
- Notifications: CallMeBot WhatsApp API for barber notification when plan dates are confirmed.
- Hosting: Vercel.
- Language: all user-facing text must be in Portuguese.
- Infrastructure should remain free-tier friendly.

## Security Requirements
- Passwords must never be stored directly in Firestore.
- Authentication credentials must be managed by Firebase Authentication or an equivalent secure provider.
- Firestore rules must prevent public reading of all client profiles.
- Clients must only modify their own profile and plan data through approved flows.
- Admin-only actions must remain protected.
- CallMeBot API key and phone configuration should live in environment variables for production.
- Client-facing responses must not reveal provider secrets or internal stack traces.
- Sensitive data should be limited to what is needed for scheduling and plan management.

## UX Requirements
- The `Conta do usuário` area must feel like part of the current app and not like an admin-only tool.
- The monthly plan locked state must clearly explain that an account is needed only to subscribe to plans.
- Registration should be short and direct.
- Returning logged-in clients should not have to log in again unless their session expires or they log out.
- Validation messages must be clear and written in natural Portuguese.
- The app must stay responsive on small screens.

## Acceptance Criteria
- `Conta do usuário` appears near the barber panel option.
- A logged-out client can still create a standard one-time appointment.
- A logged-out client cannot subscribe to a monthly plan until creating or accessing an account.
- The monthly plan area shows `Para assinar um plano, crie uma conta` with a `Criar conta` button when logged out.
- Clients can register with complete name, phone number, email, password, and confirm password.
- Clients can log in with Google.
- Clients can log in with email and password from a different device/browser.
- After login or registration, the browser restores the same account on future visits.
- Registered client data is saved in a protected client registry.
- A monthly plan is linked to the authenticated client account.
- Clients can choose all plan dates at once or add plan dates later.
- Confirming new plan dates persists them under the client's plan.
- Confirming new plan dates triggers a CallMeBot WhatsApp notification to the barber.
- The notification contains the client name, plan type, and selected dates.
- No WhatsApp notification is sent when no new dates are confirmed.
- If WhatsApp notification fails, the dates remain saved and the failure is logged safely.
- When all attendances of a monthly plan are completed, the plan is added to the current monthly report.
- Completed monthly plans are removed from active monthly plans.

## Risks and Mitigations
- Risk: Account creation may make the monthly plan flow feel slower.
  - Mitigation: keep registration short and use Google login as the fastest option.
- Risk: Users may misunderstand whether accounts are required for normal booking.
  - Mitigation: clearly keep normal scheduling available without login and only gate monthly plans.
- Risk: Authentication and Firestore rules may expose too much client data if configured poorly.
  - Mitigation: use Firebase Auth UIDs, strict rules, and server-side validation for sensitive operations.
- Risk: CallMeBot may fail or be unavailable.
  - Mitigation: save dates first, log failures, and do not block the client after successful persistence.
- Risk: Duplicate completion/report actions may create repeated monthly report records.
  - Mitigation: make plan completion idempotent using stable plan IDs and report insertion checks.
- Risk: Flexible date selection may conflict with plan limits.
  - Mitigation: validate every date confirmation server-side against attendance limits and availability rules.

## Implementation Notes
- Prefer Firebase Authentication for Google and email/password login to avoid custom password handling.
- Store client profile documents by Firebase Auth UID.
- Reuse the PRD v5 plan attendance availability logic instead of creating a separate scheduler.
- Implement CallMeBot notification through a server-side function so the API key is not exposed.
- Build the notification text from only newly confirmed dates, not all historical plan dates, unless the UI explicitly asks to resend the full list.
- Use URL encoding for the WhatsApp message text before calling CallMeBot.
- Make completed-plan report insertion idempotent by checking `planId` in the current monthly report before adding a new entry.
- Keep the existing local/simple scheduling flow as untouched as possible while adding account-aware behavior only where needed.
