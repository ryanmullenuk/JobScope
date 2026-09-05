# JobScope TECH BOT service

Production API: https://jobscope-techbot.vercel.app/api/chat
Vercel project: jobscope-techbot, team ryanmullenuks-projects.

Deploy this folder as the Vercel project root. Install with pnpm install --frozen-lockfile. Run pnpm check and pnpm test. Uses the current Vercel AI SDK with AI Gateway OIDC; no browser API keys. TECHBOT_MODEL optionally overrides the model. AI_GATEWAY_API_KEY can be used instead of OIDC as a server-only variable.

AI activation is pending: the 5 September 2026 live test returned “AI Gateway requires a valid credit card on file”. Add the card in the team's AI Gateway settings and retest a PDF question before setting ../techbot/config.js aiEnabled to true. The public interface currently operates in document-search mode.

The API validates question lengths, restricts CORS to JobScope, caps output and tool steps, fetches only approved HTTPS manufacturer URLs in the catalogue, checks redirects and size, and only returns source identifiers in its retrieved evidence. PDF references are physical PDF page indices. Search is bounded keyword retrieval, not exhaustive semantic indexing. PDFs are read on demand with a small in-memory cache. Scanned PDFs require OCR before their instructions can be used.

Rate limiting is per function instance, not a durable global quota or authentication system. Add Vercel Firewall limits and an account-wide AI spend cap before opening AI to broad public traffic. Do not put keys, resident information, private manuals or access codes in the public GitHub repository. No chats are stored by this application, but AI provider/platform handling still applies.

The catalogue records public document associations and is not a manufacturer-approved procedure database. Review exact model and revision applicability. UI errors retain source search and do not invent instructions. Search, model filtering and database-integrity tests pass. Live AI generation remains unverified until billing activation.
