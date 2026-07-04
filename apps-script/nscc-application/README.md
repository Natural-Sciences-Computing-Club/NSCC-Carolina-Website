# NSCC Application Apps Script

This folder contains the Google Apps Script backend for the static application form at `/apply/`.

## Deploy

1. Create a Google Sheet for applications.
2. Open `script.google.com` and create a new Apps Script project.
3. Copy `Code.gs` into the Apps Script editor.
4. Confirm `Code.gs` contains the application response sheet ID: `1_tvZiGs-bxQGmG-op90nJ6nwl_aAQxJJKDLo_vAc198`.
5. Optional: add a script property named `RESUME_FOLDER_ID` with the ID of a Drive folder to store uploaded resumes in. Without it, resumes are saved to the script's Drive root.
6. Deploy as a Web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. If updating an existing deployment, choose **Manage deployments**, edit the web app deployment, select a **New version**, and deploy. Saving code alone is not enough for `/exec` to run the new code.
8. Open the `/exec` deployment URL and confirm the JSON includes:
   - `"version": "2026-07-04-resume-base64"`
   - `"spreadsheetId": "1_tvZiGs-bxQGmG-op90nJ6nwl_aAQxJJKDLo_vAc198"`
   - `"spreadsheetOk": true`
9. Copy the `/exec` deployment URL.
10. Paste that URL into `apply/apply-config.js`.

The frontend submits to the Apps Script web app through a hidden iframe and waits for a `postMessage` confirmation from the Apps Script response page. This lets the static GitHub Pages site receive a success/error signal without relying on unofficial Google Forms fields or a separate backend. The resume field is the one exception: it's posted as real `multipart/form-data` (the file input is moved into the submission form and back, since a file's value can't be copied into a hidden field) so Apps Script receives it as a Blob and saves it to Drive.
