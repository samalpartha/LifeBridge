# VisaVerse AI Hackathon strategy

## Judging goals to optimize

- Clear problem. Large audience. Real emotion.
- A working demo in under 60 seconds.
- Visible AI value. Not hidden in the backend.
- Clean repo. One README. One command to run.

## Three stand-alone solutions

### 1) LifeBridge

A document-first assistant for families, students, and workers crossing borders.

- Input: passport pages, letters, forms, screenshots, email PDFs.
- Output: checklist, timeline, risk register, and evidence links.

Why it wins
- The user gets structure fast.
- The evidence links build trust.
- The story lands across ages.

### 2) Culture Compass

A real-time cultural guidance layer for daily situations.

- Input: chat + context like location, language, and situation.
- Output: short, polite phrasing and do and do-not guidance.

Why it wins
- It reduces conflict.
- It helps travelers and remote teams.

### 3) Borderless Onboarding

An AI onboarding flow for cross-border hiring.

- Input: offer letter, policy docs, role location.
- Output: tasks, compliance reminders, and a first-week plan.

Why it wins
- Clear business value.
- Easy to demo with sample docs.

## One integrated solution

LifeBridge becomes the backbone. The other modules plug into it.

- LifeBridge handles document intake, extraction, and evidence.
- Culture Compass writes the user-facing messages and translations.
- Borderless Onboarding adds employer and team workflows.

Integration approach
- One Case model.
- One upload API.
- Modules read the same chunks and write their own outputs.

Hackathon demo script
1. Click demo preset.
2. Show checklist and risks with evidence.
3. Upload a sample PDF.
4. Click re-analyze.
5. Explain how modules extend the same pipeline.
