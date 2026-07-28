# Product Requirements Document (PRD)

## Product Overview
A responsive, zero-cost haircut scheduling web application for barbers, allowing clients to book appointments without direct contact. The app automates scheduling, manages appointments, and provides an admin interface for barbers.

## Goals
- Automate haircut scheduling for clients and barbers
- Eliminate the need for direct communication
- Ensure zero infrastructure and operational costs
- Provide a simple, intuitive, and fully responsive UI
- 100% Portuguese localization

## Target Users
- Clients seeking to book haircuts or beard trims
- Barbers managing their appointment schedules

## Features
### Client Side
- Fill in name and (optional) phone number
- Select available or partially available dates
- Choose available time slots for the selected date
- Select service: Haircut, Beardcut, or Both (with price display)
- Submit and save appointment
- Receive confirmation (on-screen)

### Barber/Admin Side
- Secure admin login (simple password or code)
- View all scheduled appointments in a list
- Mark appointments as completed (auto-delete from schedule)
- View client details and service type

## Technical Requirements
- **Frontend:** React, Material-UI or Chakra UI, JavaScript
- **Backend/API:** Serverless functions (Vercel/Netlify/Cloudflare Workers)
- **Database:** Firebase Firestore (free tier)
- **Hosting:** Vercel or Netlify (free tier)
- **Localization:** i18next or react-intl (Portuguese)

## Non-Functional Requirements
- Fully responsive design (mobile, tablet, desktop)
- Zero-cost infrastructure (free tiers only)
- Simple deployment and maintenance
- Data privacy: no sensitive data stored beyond what is necessary

## User Flows
1. **Client Booking:**
   - Access app → Enter name/phone → Select date/time → Choose service → Confirm booking
2. **Barber/Admin:**
   - Login → View schedule → Mark as completed → Appointment auto-deletes

## Success Criteria
- Clients can book appointments without contacting the barber
- Barbers can manage and clear schedules easily
- No infrastructure or hosting costs
- App is fully functional and translated in Portuguese
