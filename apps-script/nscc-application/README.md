# NSCC Application Apps Script

This folder contains the Google Apps Script backend for the static application form at `/apply/`.

## Deploy

1. Create a Google Sheet for applications.
2. Open `script.google.com` and create a new Apps Script project.
3. Copy `Code.gs` into the Apps Script editor.
4. In Project Settings, add a script property named `SPREADSHEET_ID` with the ID from the Google Sheet URL.
5. Deploy as a Web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the `/exec` deployment URL.
7. Paste that URL into `apply/apply-config.js` and `nscc-site/apply/apply-config.js`.

The frontend submits to the Apps Script web app through a hidden iframe and waits for a `postMessage` confirmation from the Apps Script response page. This lets the static GitHub Pages site receive a success/error signal without relying on unofficial Google Forms fields or a separate backend.
