(function () {
    'use strict';

    const yearEl = document.getElementById('footYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const form = document.getElementById('applyForm');
    const status = document.getElementById('formStatus');
    const submitButton = document.getElementById('submitButton');
    const endpoint = String(window.NSCC_APPLY_ENDPOINT || '').trim();
    const configured = endpoint.startsWith('https://script.google.com/macros/s/') && !endpoint.includes('PASTE_');
    const RESPONSE_SOURCE = 'nscc-application';
    let pendingSubmission = null;

    function setStatus(message, type) {
        status.textContent = message;
        status.className = `form-status ${type || ''}`.trim();
    }

    function collectPayload() {
        const data = Object.fromEntries(new FormData(form).entries());
        return {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            year: data.year || '',
            major: data.major || '',
            interests: data.interests || '',
            experience: data.experience || '',
            availability: data.availability || '',
            consent: data.consent === 'yes',
            website: data.website || '',
            submittedAtClient: new Date().toISOString(),
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
        };
    }

    function isTrustedResponseOrigin(origin) {
        try {
            const url = new URL(origin);
            return url.protocol === 'https:' && (
                url.hostname === 'script.google.com' ||
                url.hostname === 'script.googleusercontent.com' ||
                url.hostname.endsWith('.googleusercontent.com')
            );
        } catch (error) {
            return false;
        }
    }

    function ensureFrame() {
        let frame = document.getElementById('appsScriptSubmitFrame');
        if (!frame) {
            frame = document.createElement('iframe');
            frame.name = 'appsScriptSubmitFrame';
            frame.id = 'appsScriptSubmitFrame';
            frame.title = 'Application submission frame';
            frame.hidden = true;
            document.body.appendChild(frame);
        }
        return frame;
    }

    function postToAppsScript(payload) {
        return new Promise((resolve, reject) => {
            ensureFrame();

            const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const timeout = window.setTimeout(() => {
                pendingSubmission = null;
                reject(new Error('Submission confirmation timed out.'));
            }, 15000);

            pendingSubmission = { id: submissionId, resolve, reject, timeout };

            const postForm = document.createElement('form');
            postForm.method = 'POST';
            postForm.action = endpoint;
            postForm.target = 'appsScriptSubmitFrame';
            postForm.style.display = 'none';

            const fields = {
                ...payload,
                consent: payload.consent ? 'yes' : 'no',
                _response: 'postMessage',
                _submissionId: submissionId,
                _origin: window.location.origin
            };

            Object.entries(fields).forEach(([name, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value == null ? '' : String(value);
                postForm.appendChild(input);
            });

            document.body.appendChild(postForm);
            postForm.submit();
            postForm.remove();
        });
    }

    window.addEventListener('message', (event) => {
        if (!isTrustedResponseOrigin(event.origin)) return;
        if (!pendingSubmission || !event.data || event.data.source !== RESPONSE_SOURCE) return;
        if (event.data.submissionId !== pendingSubmission.id) return;

        window.clearTimeout(pendingSubmission.timeout);

        if (event.data.ok) {
            pendingSubmission.resolve(event.data);
        } else {
            pendingSubmission.reject(new Error((event.data.errors || [event.data.error || 'Submission failed.']).join(' ')));
        }

        pendingSubmission = null;
    });

    if (!form) return;

    if (!configured) {
        setStatus('Apps Script endpoint not configured yet.', 'error');
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('', '');

        if (!form.reportValidity()) {
            setStatus('Please complete the required fields.', 'error');
            return;
        }

        if (!configured) {
            setStatus('Add the deployed Apps Script URL in apply-config.js before collecting applications.', 'error');
            return;
        }

        const payload = collectPayload();

        submitButton.disabled = true;
        setStatus('Submitting...', '');

        try {
            await postToAppsScript(payload);

            form.reset();
            setStatus('Application submitted.', 'success');
        } catch (error) {
            setStatus('Submission failed. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
}());
