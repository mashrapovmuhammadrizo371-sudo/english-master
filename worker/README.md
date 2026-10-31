# English Master AI Assessment Worker

This Worker powers AI checking for Writing, Speaking (text/audio), tests, and tasks. It is separate from the future AI tutor API.

## 1. Deploy the Worker

1. Open the Cloudflare dashboard and go to **Workers & Pages**.
2. Create a Worker named `english-master-assessment`.
3. Upload/deploy the contents of this `worker` folder (`index.js` and `wrangler.toml`) using the dashboard or Wrangler.
4. In the Worker, open **Settings → Variables and Secrets**.
5. Add a secret named `GEMINI_API_KEY` and paste the Gemini API key there. Do not add the key to GitHub or frontend variables.
6. Deploy/redeploy the Worker and copy its public URL, for example `https://english-master-assessment.<your-subdomain>.workers.dev`.

## 2. Connect the website

In Cloudflare Pages, open the English Master project → **Settings → Environment variables**. Add:

- Name: `VITE_ASSESSMENT_API_URL`
- Value: the Worker URL from step 6 (without a trailing slash is preferred)

Save and trigger a new Pages deployment so Vite can include the public endpoint URL.

## 3. Test

Open English Master → **Imkoniyatlar** → **AI orqali tekshirish**. Try a short writing answer first, then test, task, and a small speaking audio file.

## Notes

- The Gemini API key is used only in the Worker and must remain a secret.
- The current Worker uses the Gemini `gemini-2.5-flash` model.
- AI feedback is an estimate, not an official CEFR/IELTS score.
- The current endpoint has basic input-size checks but is not an account-based quota system. Before a public launch, add rate limiting / abuse protection and review allowed origins.
