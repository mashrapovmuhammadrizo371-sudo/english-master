# English Master

**IELTS & CEFR Preparation Platform** — an Uzbek-first English learning platform.

## Tech stack
- React + Vite
- Cloudflare Pages for the frontend
- Cloudflare Workers for the future API
- Cloudflare D1 for the future database

## Current MVP
- Responsive Uzbek-language landing page
- SEO title and description
- Five-question demo grammar diagnostic
- Estimated result with a clear note that it is not an official CEFR/IELTS assessment
- Mobile navigation and responsive layout

## Run locally
```bash
npm install
npm run dev
```

Create a production build:
```bash
npm run build
```

## Deploy frontend to Cloudflare Pages
1. Open the Cloudflare dashboard and choose **Workers & Pages**.
2. Create an application and connect this GitHub repository.
3. Choose **Pages** / deploy a Vite project.
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Deploy.

The first release is frontend-only. Accounts, saved progress, full CEFR placement testing, lessons, and the Workers/D1 API are planned for later phases.