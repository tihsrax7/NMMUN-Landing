# Saving registrations to a Google Sheet

The page works without this. Until it is set up, the form runs in preview mode: it makes the delegate pass and sends nothing.

To switch real saving on (about ten minutes, free):

1. Create a new Google Sheet. Name it "NMMUN registrations".
2. In the sheet, open **Extensions > Apps Script**.
3. Delete what is there, paste the contents of `Code.gs`, and save.
4. Click **Deploy > New deployment**. Choose type **Web app**.
5. Set "Execute as" to **Me** and "Who has access" to **Anyone**. Click **Deploy** and allow access when asked.
6. Copy the **Web app URL**.
7. In `js/main.js`, paste it between the quotes of `SHEET_URL = ""` near the top, then commit.

Each registration now appears as a new row: time, name, email, school or college, country, committee.

Notes:

- The page posts with `mode: "no-cors"`, which is how a plain web page can reach Apps Script. The reply cannot be read by the page, so the form reports success when the request leaves without an error.
- The sheet holds personal details. Keep it private and share it only with the organising committee.
