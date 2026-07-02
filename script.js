/* Compatibility shim for browsers with the previous root HTML cached.
   The full prior implementation is preserved in prior-website/script.js. */
(function () {
    'use strict';

    var oldRootPage = document.getElementById('three-canvas') ||
        document.querySelector('.cyberspace, .nav-panel, .mobile-portrait');

    if (oldRootPage) {
        window.location.replace('/?v=20260702-mobile-logo');
    }
}());
