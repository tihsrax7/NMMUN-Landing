# How it works

Short notes on each interactive part, so the code can be explained in a minute.

## The globe (`js/globe.js`, `js/globe-data.js`)

- **Data.** `globe-data.js` holds the coastlines and borders as lists of longitude and latitude, plus the outline and a few facts for 165 UN member states.
- **Drawing a sphere on a flat canvas.** Every point is passed through an *orthographic projection*: a few lines of sin and cos that turn (longitude, latitude) into (x, y) on the circle, plus a depth value `z`. If `z` is below zero the point is on the far side and is skipped.
- **Turning.** The globe has two numbers, `lon0` and `lat0`, for which part faces the viewer. The globe turns on its own by adding a little to `lon0` on each frame. Dragging with a mouse or a finger adds that movement instead, and a quick flick keeps it turning for a moment. After a country is chosen the globe rests on it for six seconds, then turns again. Choosing a country moves both numbers 6% of the way towards that country on each frame, which gives the smooth glide.
- **Clicking a country.** The projection is run backwards (`unproject`) to get the longitude and latitude under the mouse. Then a standard *ray casting* test checks which country outline contains that point. The result is written into the dropdown, and the rest of the page reacts to the dropdown's `change` event.
- **Speed.** The finished globe picture is kept on a hidden canvas and only redrawn when something changes. If three redraws in a row are slow, the globe switches to a lighter mode (fewer pixels, thinner glow, fewer updates). It also stops drawing when scrolled out of view, and does not spin for people who have "reduce motion" switched on.

## The placard and country brief (`js/main.js`)

- Typing a name or changing the country calls one `render` function that updates the placard, saves both values in `localStorage`, and fills the country brief from the same data the globe uses.

## The committee matcher (`js/main.js`)

- Each answer carries points for one or more committees. After three questions the committee with the most points wins, and its file opens. The seven files are plain `<details>` elements, so they also open without the quiz.

## Registration (`js/main.js`, `backend/`)

- Every "Register as a delegate" button opens one `<dialog>` with a form, pre-filled with the name, country and committee already chosen on the page.
- If `SHEET_URL` is set, the form is posted to a small Google Apps Script (`backend/Code.gs`) that adds a row to a Google Sheet. If it is empty, the page says clearly that it is in preview mode and sends nothing.

## The delegate pass (`js/pass.js`)

- The pass is painted on a 1080 x 1350 canvas: background, frame, text, and the chosen country's outline scaled to fit a circle.
- The pass number is a simple hash of the delegate's details, so the same person always gets the same number.
- `canvas.toBlob` turns the picture into a PNG file, and a temporary link with the `download` attribute saves it.

## The highlights film (`js/main.js`)

- An `IntersectionObserver` watches the video frame. When 60% of it is on screen the film plays, and when it leaves the screen it pauses.
- Browsers block films that start by themselves with sound, unless the visitor has already clicked something. The code tries with sound first and falls back to a silent start, then shows a "Turn sound on" button.
- If the visitor pauses it, it stays paused and does not restart on scroll.

## Design decisions

- **No frameworks.** The page is three sections. Plain HTML, CSS and JavaScript load faster and every line can be explained.
- **One source of truth.** The dropdown holds the chosen country. The globe, placard, brief, form and pass all read from it, so they cannot disagree.
- **Honest placeholders.** Dates, theme, agendas and schedule are marked provisional in the footer and in the README.
