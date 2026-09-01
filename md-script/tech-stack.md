Based on your requirements for a responsive, simple, and zero-cost haircut scheduling app, here’s the recommended technology stack:

**Frontend (Responsive UI):**
- Framework: React
- UI Library: Material-UI (MUI) or Chakra UI (for fast, responsive design)
- Language: JavaScript

**Backend/API:**
- Use serverless functions (API routes) with free hosting:
  - Vercel or Netlify Functions (both have generous free tiers and zero server management)
  - Alternatively, Cloudflare Workers (also has a free tier)

**Database (Zero Cost):**
- Use Google Sheets as a database via Google Apps Script (for very low traffic and MVPs)

**Hosting:**
- Vercel or Netlify (free static site hosting with built-in CI/CD and serverless functions)

**Localization:**
- Use i18next or react-intl for Portuguese translation