# NMMUN'27 landing page

A single, responsive landing page for Narsee Monjee Model United Nations (NMMUN), built for the technical organising committee task.

**Live page:** add your GitHub Pages link here after turning Pages on (Settings > Pages > Deploy from branch > `main`).

## What the brief asked for, and where it is

| Requirement | Where |
|---|---|
| Hero: event title, dates/theme, tagline, clear CTA | Top section. Title "NMMUN'27", dates, venue, theme, tagline and the "Register as a delegate" button |
| About / overview | "What happens at NMMUN": description, host city map, the NMMUN'25 highlights film, the two days at a glance, key numbers |
| One creative feature | "Which committee is yours?": the committee matcher, the seven committee files and what to prepare next |

## The idea

Every delegate at a MUN sits behind a placard. So the page hands the visitor one, and everything else follows from it.

- **A globe you can use.** The hero shows the Earth at night, drawn on a canvas with no libraries. Drag it to turn it. Point at a country to see its name. Click a country and it goes on your placard.
- **A placard and a country brief.** Type your name and the placard is yours. The brief under it shows the capital, region, UN regional group and land neighbours of the country you picked.
- **Committee matcher (the custom section).** The biggest question a new delegate has is "which committee should I pick?". Three questions lead to one committee, and its file opens with the agenda and who it suits. All seven files can also be opened by hand, and a short guide says what to prepare next.
- **A registration that does something.** The register button opens a form, pre-filled with what you already chose. It can save to a Google Sheet (see `backend/README.md`).
- **A delegate pass to keep.** After registering, the page paints a personal delegate pass with your name, country outline, committee and pass number, and saves it as an image. Delegates sharing their pass is free publicity for the conference.

The look is formal and diplomatic: navy and white, serif headings, and thin gold used only for fine lines and the register button, so the call to action is never missed.

## Built with

Plain HTML, CSS and JavaScript. No frameworks, no libraries, no build step.

```
index.html          page structure (three sections)
css/style.css       all styling, phone layout at the bottom
js/main.js          placard, country brief, countdown, committee matcher, registration
js/globe.js         the interactive globe (canvas)
js/globe-data.js    map outlines and country facts
js/pass.js          the downloadable delegate pass (canvas)
assets/             two small SVG maps, the NMMUN'25 film and its cover image
backend/            optional Google Apps Script that saves registrations to a Google Sheet
HOW-IT-WORKS.md     short explanation of each interactive part
```

To run it, open `index.html` in a browser.

## Quality checks

Google Lighthouse, run locally on this build:

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Desktop | 100 | 100 | 96 | 100 |
| Phone (slow 4G, slowed processor) | 88 | 100 | 96 | 100 |

These were measured on a local copy. Run https://pagespeed.web.dev on the live link for the hosted figures.

## Details that were cared for

- Works from 320 px phones to wide desktops.
- The film starts when it scrolls into view and pauses when it scrolls away, with one play / pause button. It is not loaded until then, so it does not slow the page down. Browsers only allow sound after the visitor has clicked something, so it may start silently with a "Turn sound on" button. It does not start by itself for people who have "reduce motion" switched on.
- Keyboard friendly: visible focus, skip link, real buttons, native `<details>` and `<dialog>`.
- Respects the "reduce motion" setting: the globe stops spinning.
- The globe pauses when it is scrolled out of view, and switches to a lighter drawing mode on slow devices.
- Everything the globe does can also be done with the keyboard through the country dropdown.
- Committee files still open if the quiz is never used.

## Assumptions

Nothing is officially announced yet, so these are placeholders and are easy to change:

- Dates (16 and 17 January 2027), the theme and the tagline ("The world is on the agenda. Take your seat.").
- Committee agendas. The committee mix follows the NMMUN'25 event report.
- Registration runs in preview mode and sends nothing until `SHEET_URL` is set in `js/main.js` (steps in `backend/README.md`).
- The two-day schedule.

Facts about NMMUN (2,000+ participants, prizes up to ₹1 lakh) are from the NMMUN page on the NMIMS Shirpur website.

Map outlines: Natural Earth (public domain), via the `world-atlas` package. Country facts: the open `world-countries` dataset (ODbL). Both were used once to generate `js/globe-data.js`; the page loads no outside data.
