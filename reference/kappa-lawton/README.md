# Kappa Alpha Psi – Lawton Chapter (reference)

Target route: goelev8.ai/kappa
Files:
- demo.html: working demo (public homepage, brothers portal, officer dashboard)

## Scope (from the pitch deck)
Phase 1 – Public homepage: chapter story, leadership, upcoming events with RSVP links, photo gallery, contact form.
Phase 2 – Brothers portal: password-only "Brothers" login that opens the chapter's document folders (Google Drive or SharePoint).
Phase 3 – Officer dashboard: add, edit, and delete events; change the brothers and officer passwords; edit homepage text and leadership.
Optional add-ons: dues or ticket payments (Stripe), text-message event reminders, officer AI training session.

## Access model
- One shared brothers password and one separate officer password.
- Officers change the passwords from the dashboard when leadership turns over or a brother leaves.
- Production must check passwords on the server (Vercel env vars), never in page code.

## Open decisions
Google Drive or SharePoint; number of brothers; which officers are admins; payments or RSVPs on site; domain and province/national approval.

## Brand notes
Colors: crimson #8C1C2E, cream #F2EADB. Fonts: DM Serif Display (headings), Figtree (body).
Do not use the fraternity crest or letters until the chapter provides approved assets.
Keep the GoElev8.ai copyright comment and footer credit.
