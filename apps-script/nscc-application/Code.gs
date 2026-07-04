const SHEET_NAME = 'Applications';
const SPREADSHEET_ID = '1UbgdiJQuSx3OjTzUIxJut7SGv8G13lrqEcx54raXM6M';
const SCRIPT_VERSION = '2026-07-04-spreadsheet-id-healthcheck';
const HEADERS = [
  'Received At',
  'Full Name',
  'Email',
  'LinkedIn URL',
  'Resume',
  'Hours Per Week',
  'Contribution',
  'Project Idea',
  'Other Projects',
  'Consent',
  'Page URL',
  'User Agent'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'NSCC application endpoint is running.',
    version: SCRIPT_VERSION,
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetOk: canOpenSpreadsheet_()
  });
}

function doPost(e) {
  let payload = {};

  try {
    payload = parsePayload_(e);
    let result;

    if (payload.website) {
      result = { ok: true, ignored: true };
    } else {
      const errors = validate_(payload);
      if (errors.length) {
        result = { ok: false, errors };
      } else {
        const lock = LockService.getScriptLock();
        lock.waitLock(10000);

        try {
          const resumeUrl = saveResume_(payload.resume);
          const sheet = getApplicationsSheet_();
          ensureHeaders_(sheet);
          sheet.appendRow([
            new Date(),
            clean_(payload.fullName),
            clean_(payload.email),
            clean_(payload.linkedin),
            resumeUrl,
            clean_(payload.hoursPerWeek),
            clean_(payload.contribution),
            clean_(payload.projectIdea),
            clean_(payload.otherProjects),
            hasConsent_(payload) ? 'Yes' : 'No',
            clean_(payload.pageUrl),
            clean_(payload.userAgent)
          ]);
        } finally {
          lock.releaseLock();
        }

        result = { ok: true };
      }
    }

    return response_(payload, result);
  } catch (error) {
    console.error(error);
    return response_(payload, {
      ok: false,
      error: 'Server error'
    });
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return e.parameter || {};
    }
  }

  return e && e.parameter ? e.parameter : {};
}

function validate_(payload) {
  const errors = [];
  const required = ['fullName', 'email', 'hoursPerWeek', 'contribution', 'projectIdea'];

  required.forEach(function (field) {
    if (!String(payload[field] || '').trim()) {
      errors.push(field + ' is required');
    }
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email || '').trim())) {
    errors.push('email must be valid');
  }

  if (!hasConsent_(payload)) {
    errors.push('consent is required');
  }

  return errors;
}

// The resume arrives as a Blob only when the form posted multipart/form-data
// with a file actually chosen; the optional field being left empty leaves
// this as '' (from e.parameter), caught by the typeof check below.
function saveResume_(resume) {
  if (!resume || typeof resume.getBytes !== 'function' || !resume.getBytes().length) {
    return '';
  }

  const folderId = PropertiesService.getScriptProperties().getProperty('RESUME_FOLDER_ID');
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const file = folder.createFile(resume);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getApplicationsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function canOpenSpreadsheet_() {
  try {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function ensureHeaders_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some(function (value) {
    return String(value || '').trim();
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function response_(payload, data) {
  if (payload._response === 'postMessage') {
    return postMessageResponse_(payload, data);
  }

  return jsonResponse_(data);
}

function postMessageResponse_(payload, data) {
  const targetOrigin = clean_(payload._origin) || '*';
  const message = Object.assign({}, data, {
    source: 'nscc-application',
    submissionId: clean_(payload._submissionId)
  });
  const html = '<!doctype html><html><body><script>' +
    'window.parent.postMessage(' + JSON.stringify(message).replace(/</g, '\\u003c') + ', ' + JSON.stringify(targetOrigin) + ');' +
    '</script></body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function hasConsent_(payload) {
  return payload.consent === true || payload.consent === 'true' || payload.consent === 'yes';
}

function clean_(value) {
  return String(value || '').trim();
}
