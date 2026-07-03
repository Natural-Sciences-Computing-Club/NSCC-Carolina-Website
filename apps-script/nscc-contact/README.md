# NSCC Contact Apps Script

This folder contains the Google Apps Script backend for the static contact form at `/contact/`. It sends mail directly with `MailApp.sendEmail()` — there is no sheet, no storage, nothing to provision beyond the script itself.

## Deploy

1. Open `script.google.com` and create a new Apps Script project, logged in as whichever Google account should send the mail (its send quota and "From" address apply).
2. Copy `Code.gs` into the Apps Script editor.
3. If `inquiries@nsccatunc.org` isn't the deploying account's own address, set it up as a **"Send As"** alias under that account's Gmail settings first, or messages will show the deploying account as the sender instead.
4. Deploy as a Web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the `/exec` deployment URL.
6. Paste that URL into `contact/contact-config.js`.

The frontend submits through a hidden iframe and waits for a `postMessage` confirmation from the Apps Script response page — the same pattern `nscc-application` uses, so the static site never needs a server of its own. Each message's `Reply-To` is set to the visitor's own address, so replying from the inbox goes straight back to them.

`MailApp.sendEmail()` is capped by Google's daily quota (100 emails/day on a consumer Gmail account, 1,500/day on Workspace) — far more than a club contact form should ever need.
