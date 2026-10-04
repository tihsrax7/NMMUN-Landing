# NMMUN'27 landing page

A single, responsive landing page for Narsee Monjee Model United Nations (NMMUN), built for the technical organising committee task.

**Live page:** add your GitHub Pages link here after turning Pages on (Settings > Pages > Deploy from branch > `main`).

## What the brief asked for, and where it is

| Requirement | Where |
|---|---|
| Hero: event title, dates/theme, tagline, clear CTA | Top section. Title "NMMUN'27", dates, venue, theme, tagline and the "Register as a delegate" button |
| About / overview | "What happens at NMMUN": description, host city map, the two days at a glance, key numbers |
| One creative feature | "Which committee is yours?": the committee matcher, the seven committee files and what to prepare next |

## The idea

Every delegate at a MUN sits behind a placard. So the page hands the visitor one.

- **Placard in the hero.** Type your name, pick a country, and the placard becomes yours. It is remembered if you come back.
- **Committee matcher (the custom section).** The biggest question a new delegate has is "which committee should I pick?". Three questions lead to one committee, and its file opens with the agenda and who it suits. All seven files can also be opened by hand.
- **A globe that answers you.** The globe in the hero shows the Earth at night: glowing gold coastlines and borders, with bright cities. It turns slowly; pick a country on the placard and it rotates to that country and pins it. It is drawn on a canvas in plain JavaScript, with no libraries.
- **One thread.** The register button reads back your name, country and committee, so the three parts feel like one experience.

The look is formal and diplomatic: navy and white, serif headings, a dotted world map behind the title, and thin gold used only for fine lines and the register button, so the call to action is never missed.

## Built with

Plain HTML, CSS and JavaScript. No frameworks and no build step. Graphics are two small SVG maps and a canvas globe. Total size is about 190 KB before fonts, most of it map data.

```
index.html      page structure (three sections)
css/style.css   all styling, phone layout at the bottom
js/main.js      placard, countdown, committee matcher, register button
js/globe.js     the rotating dotted globe (canvas)
js/globe-data.js  coastline and border lines used by the globe
assets/         dotted world map and India map (SVG)
```

To run it, open `index.html` in a browser.

## Details that were cared for

- Works from 320 px phones to wide desktops.
- Keyboard friendly: visible focus, skip link, real buttons, native `<details>` and `<dialog>`.
- Respects the "reduce motion" setting: the globe stops spinning.
- The globe pauses when it is scrolled out of view.
- Committee files still open if the quiz is never used.

## Assumptions

Nothing is officially announced yet, so these are placeholders and are easy to change:

- Dates (16 and 17 January 2027), the edition number, the theme and the tagline ("The world is on the agenda. Take your seat.").
- Committee agendas. The committee mix follows the NMMUN'25 event report.
- The registration link. Set `REGISTER_URL` at the top of `js/main.js` and the button goes straight to the form.

Facts about NMMUN (2,000+ participants, prizes up to ₹1 lakh) are from the NMMUN page on the NMIMS Shirpur website.

Map data: Natural Earth (public domain), via the `world-atlas` package, used once to generate the dot maps.
