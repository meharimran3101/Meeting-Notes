# Meeting to Action Notes

Meeting to Action Notes is a web app that turns raw meeting transcripts into summaries, action items, decisions, risks, and a follow-up draft.

## Stack

- React 19 + Vite
- Custom editorial UI with animated signal visuals
- Netlify Functions
- OpenAI Responses API

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Live AI setup
Live Demo
https://meeting-action-notes.netlify.app/

Set these environment variables in Netlify:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults to `gpt-5-mini`

The frontend sends transcripts to the Netlify function at `/api/analyze-meeting`, which calls OpenAI server-side and returns structured meeting notes. If the API key is not configured, the UI falls back to a local heuristic analysis so the app still works.

## Current UX

- Transcript workspace with sample meeting presets
- Live AI extraction trigger
- Structured action board with owners and due dates
- Decision and risk lanes
- Follow-up email draft
- Responsive layout for desktop and mobile
