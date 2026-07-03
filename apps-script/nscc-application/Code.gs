const SHEET_NAME = 'Applications';
const HEADERS = [
  'Received At',
  'First Name',
  'Last Name',
  'Email',
  'Class Year',
  'Major',
  'Interests',
  'Programming Experience',
  'Availability',
  'Consent',
  'Page URL',
  'User Agent'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'NSCC application endpoint is running.'
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
          const sheet = getApplicationsSheet_();
          ensureHeaders_(sheet);
          sheet.appendRow([
            new Date(),
            clean_(payload.firstName),
            clean_(payload.lastName),
            clean_(payload.email),
            clean_(payload.year),
            clean_(payload.major),
            clean_(payload.interests),
            clean_(payload.experience),
            clean_(payload.availability),
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
  const required = ['firstName', 'lastName', 'email', 'year', 'major', 'interests'];

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

function getApplicationsSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('Missing SPREADSHEET_ID script property');
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
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
