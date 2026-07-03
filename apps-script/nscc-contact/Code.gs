const DESTINATION_EMAIL = 'inquiries@nsccatunc.org';

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'NSCC contact endpoint is running.'
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
        MailApp.sendEmail({
          to: DESTINATION_EMAIL,
          replyTo: clean_(payload.email),
          subject: 'NSCC contact form: ' + clean_(payload.name),
          body: buildBody_(payload)
        });

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

function buildBody_(payload) {
  return [
    'Name: ' + clean_(payload.name),
    'Email: ' + clean_(payload.email),
    '',
    clean_(payload.message),
    '',
    '---',
    'Sent from ' + clean_(payload.pageUrl),
    clean_(payload.userAgent)
  ].join('\n');
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
  const required = ['name', 'email', 'message'];

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
    source: 'nscc-contact',
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
