/* Compatibility shim for browsers with the previous mobile root HTML cached.
   The full prior implementation is preserved in prior-website/mobile.js. */
(function () {
    'use strict';

    var oldMobilePage = document.getElementById('three-canvas') ||
        document.querySelector('.cyberspace, .nav-panel, .mobile-portrait');

    if (oldMobilePage) {
        window.location.replace('/?v=20260702-mobile-fix');
    }
}());
