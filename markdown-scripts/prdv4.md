# Product Requirements Document (PRD v4)

## Product Overview
This version of "Agendamento de Cortes" improves the monthly report system by including completed monthly plans as reportable revenue items. Today, the monthly report focuses on individual finished appointments. PRD v4 expands that behavior so weekly and economic monthly plans also enter the current monthly report when all included attendances for that plan are completed.

The business goal is simple: if the barber sells a plan and completes every attendance included in that plan, the plan must be represented in the monthly report as a completed revenue item, similar to a finished service.

## Source Requirement
This PRD is based on `modifications.md`.

## Goals
- Add completed monthly plans to `Relatórios mensais`.
- Treat a fully completed weekly/economic plan as one report item.
- Show the client's name, plan type, plan price, and number of attendances completed.
- Preserve the existing monthly report behavior for normal appointments.
- Avoid duplicate plan report entries when the same plan is completed or refreshed more than once.

## Non-Goals
- Do not redesign the monthly reports section.
- Do not change plan prices or plan attendance limits.
- Do not add partial plans to monthly revenue before all attendances are completed.
- Do not remove existing finished-service report records.
- Do not expose monthly report data to public clients.
- Do not add paid reporting or accounting integrations.

## Target Users
- Barber/admin who needs accurate monthly revenue reporting.
- Developer/operator maintaining the Firestore and Vercel serverless implementation.

## Functional Requirements

### FR1 - Plan Completion Report Entry
- When a client books a weekly or economic monthly plan, the plan must continue to appear in the admin plan list as it does today.
- When all attendances/checklist items for that plan are marked as done, the system must create a completed-plan report item.
- The completed-plan report item must be added to the active current monthly report.
- A completed plan must be treated like one report item, not like multiple separate finished services.

### FR2 - Required Plan Report Information
Each completed-plan report item must show:
- client name;
- type of plan;
- plan price;
- number of attendances completed.

Recommended display format in the monthly report:

```text
Nome do cliente
Plano semanal ou Plano econômico
Atendimentos concluídos: X de X
Valor: R$ XX,XX
```

### FR3 - Revenue Calculation
- Completed plans must contribute to the monthly report total revenue.
- The revenue value for a completed plan must be the plan price paid/registered for that plan.
- Partial plans must not contribute to report revenue until every attendance in the plan has been completed.
- Existing finished services must continue contributing revenue exactly as before.

### FR4 - Current Month Behavior
- A completed plan must enter `Mês atual` using the same report-month rule already defined in PRD v3.
- If the plan is completed before day 1 at 08:00 local time, it belongs to the previous active reporting month.
- If the plan is completed after day 1 at 08:00 local time, it belongs to the new active reporting month.
- The reporting timezone remains `America/Recife`.

### FR5 - Past Month Reports
- Completed-plan report items must appear in `Meses passados` after the month rolls over.
- Past month report totals must include both:
  - finished individual services;
  - completed monthly plans.
- Deleting a past month must delete completed-plan report items for that month together with existing finished/canceled report data.

### FR6 - PDF Download
- `Baixar relatório` must include completed-plan report items.
- The PDF must include, for each completed plan:
  - client name;
  - plan type;
  - plan price;
  - completed attendance count.
- The PDF monthly total must include completed-plan revenue.
- Barber GS branding/logo must remain in the PDF.

### FR7 - Duplicate Prevention
- A completed plan must create at most one completed-plan report item.
- Re-clicking a completed checklist item, refreshing the dashboard, retrying an API request, or running the same operation again must not duplicate the completed-plan entry.
- The completed-plan report record should use a stable identifier derived from the original plan ID.

### FR8 - Admin UI Integration
- Completed-plan report items must be visually distinguishable from individual service items.
- The UI may use a label such as:

```text
Plano concluído
```

- The current report empty state remains:

```text
À espera de clientes satisfeitos
```

- If the report contains only completed plans, the report is not considered empty.

### FR9 - Existing Plan Workflow Preservation
- The existing admin checklist behavior must remain:
  - plans show remaining attendances;
  - the barber marks each attendance as done;
  - when all attendances are completed, the plan is removed from active plans.
- The only new behavior at completion time is creating the completed-plan report item.

## Data Requirements

### Completed Plan Report Record
Each completed-plan report record must store:
- unique ID;
- original plan ID;
- client name;
- plan option ID when available;
- plan type/name;
- plan service description when available;
- plan price;
- attendance limit;
- completed attendance count;
- completion timestamp;
- report month key, such as `YYYY-MM`;
- creation timestamp.

### Monthly Report Aggregation
Monthly report data must support:
- finished service records;
- canceled/no-show service records;
- completed plan records;
- total revenue from finished services plus completed plans;
- month label in Portuguese;
- stable month key.

## Technical Requirements
- Frontend: React, JavaScript, Material UI.
- Backend: Vercel serverless API routes.
- Database: Firebase Firestore.
- Reports: Firestore-backed aggregation with client-side PDF generation.
- The implementation must stay within the Vercel Hobby plan serverless function limit.
- Server-side validation must remain required for all plan completion/report writes.

## Security Requirements
- Only authenticated barber/admin sessions may mark plan attendance as complete.
- Only authenticated barber/admin sessions may view, download, or delete monthly reports.
- Plan report records must not expose private credentials, admin secrets, push subscriptions, or unnecessary client data.
- Firestore access must continue through serverless APIs, not directly from public client code.

## Acceptance Criteria
- Completing the final attendance of a weekly plan creates one completed-plan item in `Mês atual`.
- Completing the final attendance of an economic plan creates one completed-plan item in `Mês atual`.
- The completed-plan item shows client name, plan type, plan price, and completed attendance count.
- The monthly total includes completed-plan revenue.
- The PDF report includes completed-plan items and the updated monthly total.
- Past month reports include completed-plan items after rollover.
- Deleting a month removes completed-plan items for that month.
- Repeating the same plan completion action does not duplicate the plan in reports.
- Existing individual service reporting continues to work.
- Existing canceled/no-show reporting continues to work.

## Risks and Mitigations
- Risk: completed plans may be counted twice if an API request is retried.
  - Mitigation: use a stable completed-plan report ID based on the original plan ID.
- Risk: plan revenue timing may be unclear because the client paid before all attendances were completed.
  - Mitigation: PRD v4 defines revenue recognition at the time all plan attendances are completed.
- Risk: monthly report UI becomes confusing if services and plans are mixed.
  - Mitigation: visually label completed-plan records as `Plano concluído`.

## Implementation Notes
- Add a dedicated Firestore collection for completed plan report items, or extend the existing report data model with a clear `type` field.
- Prefer keeping completed plans separate from finished service records to avoid confusing service-specific fields such as `horario`.
- Update report aggregation logic to include completed plans in totals.
- Update report deletion logic to delete completed plans for the selected month.
- Update PDF generation to render a separate section for completed plans.
