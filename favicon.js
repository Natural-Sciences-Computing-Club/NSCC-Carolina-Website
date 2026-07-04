(function () {
    'use strict';

    const icon = document.querySelector('link[rel="icon"][data-light-icon][data-dark-icon]');
    if (!icon || !window.matchMedia) return;

    const darkMode = window.matchMedia('(prefers-color-scheme: dark)');

    function updateIcon() {
        icon.href = darkMode.matches ? icon.dataset.darkIcon : icon.dataset.lightIcon;
    }

    updateIcon();

    if (typeof darkMode.addEventListener === 'function') {
        darkMode.addEventListener('change', updateIcon);
    } else if (typeof darkMode.addListener === 'function') {
        darkMode.addListener(updateIcon);
    }
}());
