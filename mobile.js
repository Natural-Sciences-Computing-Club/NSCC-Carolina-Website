// ============================================
// MOBILE PORTRAIT MODE HANDLER
// ============================================

// Mobile detection and handling system - ONLY activates on true mobile portrait
const MobileHandler = {
    isMobile: false,
    isPortrait: false,
    initialized: false,
    
    // Check if device is mobile and in portrait orientation
    checkMobile: function() {
        const wasPortrait = this.isPortrait;
        
        // STRICT mobile portrait detection - must be both narrow AND portrait
        this.isPortrait = (
            window.innerHeight > window.innerWidth && 
            window.innerWidth <= 768 &&
            ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        );
        
        this.isMobile = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        
        // Only activate if truly mobile portrait, not just narrow desktop window
        if (wasPortrait !== this.isPortrait && this.initialized) {
            if (this.isPortrait) {
                this.enableMobileMode();
            } else {
                this.disableMobileMode();
            }
        }
        
        return this.isPortrait;
    },
    
    // Initialize mobile mode
    init: function() {
        if (this.initialized) return;
        
        // SAFEGUARD: Don't run on desktop at all
        const isDesktop = window.innerWidth > 1024 || (window.innerWidth > 768 && !('ontouchstart' in window));
        if (isDesktop) {
            console.log('%c💻 Desktop detected - mobile handler disabled', 'color: #7ec8e3;');
            return;
        }
        
        this.initialized = true;
        
        console.log('%c📱 Mobile handler initialized', 'color: #7ec8e3;');
        
        // Check initial state
        this.checkMobile();
        
        // Listen for orientation changes with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.checkMobile();
            }, 150);
        });
        
        // Listen for orientation change event
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.checkMobile();
            }, 100);
        });
        
        // Initialize mobile features if needed
        if (this.isPortrait) {
            setTimeout(() => {
                this.enableMobileMode();
            }, 100);
        }
    },
    
    // Enable mobile portrait mode
    enableMobileMode: function() {
        console.log('%c📱 Mobile portrait mode activated', 'color: #7ec8e3; font-weight: bold;');
        
        // Add mobile class to body
        document.body.classList.add('mobile-portrait');
        
        // Disable panel physics for mobile
        if (typeof panelPhysics !== 'undefined' && panelPhysics && panelPhysics.panels) {
            panelPhysics.panels.forEach((panel) => {
                panel.isDragging = false;
                panel.physicsDisabled = true;
                panel.velocity = { x: 0, y: 0 };
                panel.angularVelocity = 0;
            });
        }
        
        // Setup collapsible panels
        setTimeout(() => {
            this.setupCollapsiblePanels();
        }, 100);
        
        // Pause Three.js animation on mobile
        if (window.cancelAnimationFrame && window.animationFrameId) {
            cancelAnimationFrame(window.animationFrameId);
            window.animationFrameId = null;
        }
        
        // Hide cursor
        const cursor = document.getElementById('chromeCursor');
        if (cursor) {
            cursor.style.display = 'none';
        }
    },
    
    // Disable mobile portrait mode
    disableMobileMode: function() {
        console.log('%cÃ°Å¸â€“Â¥Ã¯Â¸Â Desktop/landscape mode activated', 'color: #7ec8e3; font-weight: bold;');
        
        // Remove mobile class
        document.body.classList.remove('mobile-portrait');
        
        // Re-enable panel physics
        if (typeof panelPhysics !== 'undefined' && panelPhysics && panelPhysics.panels) {
            panelPhysics.panels.forEach((panel) => {
                panel.physicsDisabled = false;
            });
        }
        
        // Remove mobile event listeners
        this.removeCollapsiblePanels();
        
        // Restart Three.js animation if it was stopped
        if (typeof animate === 'function' && !window.animationFrameId) {
            animate();
        }
        
        // Show cursor
        const cursor = document.getElementById('chromeCursor');
        if (cursor) {
            cursor.style.display = '';
        }
    },
    
    // Setup panel click functionality for mobile - use desktop expandPanel
    setupCollapsiblePanels: function() {
        const panels = document.querySelectorAll('.nav-panel');
        
        // Movement thresholds for detecting intentional taps vs scrolls
        const MOVEMENT_THRESHOLD = 10; // pixels - touch must move less than this
        const TIME_THRESHOLD = 300; // milliseconds - tap should be reasonably quick
        
        panels.forEach((panel) => {
            // Touch tracking variables for this panel
            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartTime = 0;
            let hasMoved = false;
            
            // Store panel's bound handler
            if (!panel._mobileClickHandler) {
                panel._mobileClickHandler = (e) => {
                    // Prevent double-firing on touch devices
                    if (e.type === 'touchend') {
                        e.preventDefault();
                    }
                    if (e.type === 'click' && e.detail === 0) {
                        return;
                    }
                    
                    // Prevent event from bubbling to drag handlers
                    e.stopPropagation();
                    
                    // Don't expand if already in full-screen expansion mode
                    if (window.isExpanded || window.isCollapsing) return;
                    
                    // Use desktop expandPanel function for consistency
                    const contentType = panel.dataset.contentType;
                    if (contentType) {
                        // Preload images for leadership panel
                        if (contentType === 'leadership' && window.imagePreloader) {
                            window.imagePreloader.preload();
                        }
                        // Use existing desktop expandPanel function
                        if (typeof expandPanel === 'function') {
                            expandPanel(panel.id, contentType);
                        }
                    }
                };
            }
            
            // Track touch start position and time
            if (!panel._touchStartHandler) {
                panel._touchStartHandler = (e) => {
                    const touch = e.touches[0];
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    touchStartTime = Date.now();
                    hasMoved = false;
                };
            }
            
            // Track touch movement to detect scrolling
            if (!panel._touchMoveHandler) {
                panel._touchMoveHandler = (e) => {
                    if (e.touches.length === 0) return;
                    
                    const touch = e.touches[0];
                    const deltaX = Math.abs(touch.clientX - touchStartX);
                    const deltaY = Math.abs(touch.clientY - touchStartY);
                    
                    // If moved more than threshold, mark as scroll gesture
                    if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
                        hasMoved = true;
                    }
                };
            }
            
            // Handle touch end - only trigger if not scrolling
            if (!panel._touchEndHandler) {
                panel._touchEndHandler = (e) => {
                    e.preventDefault(); // Prevent ghost click
                    
                    const touchDuration = Date.now() - touchStartTime;
                    
                    // Only trigger if:
                    // 1. Touch hasn't moved significantly (not scrolling)
                    // 2. Touch was quick (not a long press)
                    if (!hasMoved && touchDuration < TIME_THRESHOLD) {
                        // This is an intentional tap - trigger panel expansion
                        panel._mobileClickHandler(e);
                    }
                    
                    // Reset tracking
                    hasMoved = false;
                };
            }
            
            // Remove existing listeners to prevent duplicates
            panel.removeEventListener('click', panel._mobileClickHandler);
            panel.removeEventListener('touchstart', panel._touchStartHandler);
            panel.removeEventListener('touchmove', panel._touchMoveHandler);
            panel.removeEventListener('touchend', panel._touchEndHandler);
            
            // Add mobile click handler for non-touch (desktop fallback)
            panel.addEventListener('click', panel._mobileClickHandler);
            
            // Add touch handlers with movement detection
            panel.addEventListener('touchstart', panel._touchStartHandler, { passive: true });
            panel.addEventListener('touchmove', panel._touchMoveHandler, { passive: true });
            panel.addEventListener('touchend', panel._touchEndHandler);
            
            // Add ARIA attributes for accessibility
            panel.setAttribute('role', 'button');
            panel.setAttribute('aria-expanded', 'false');
            panel.setAttribute('tabindex', '0');
            
            // Add keyboard support
            if (!panel._keyHandler) {
                panel._keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        panel._mobileClickHandler(e);
                    }
                };
                panel.addEventListener('keydown', panel._keyHandler);
            }
        });
    },
    
    // Remove mobile panel event listeners
    removeCollapsiblePanels: function() {
        const panels = document.querySelectorAll('.nav-panel');
        
        panels.forEach((panel) => {
            if (panel._mobileClickHandler) {
                panel.removeEventListener('click', panel._mobileClickHandler);
            }
            if (panel._touchStartHandler) {
                panel.removeEventListener('touchstart', panel._touchStartHandler);
            }
            if (panel._touchMoveHandler) {
                panel.removeEventListener('touchmove', panel._touchMoveHandler);
            }
            if (panel._touchEndHandler) {
                panel.removeEventListener('touchend', panel._touchEndHandler);
            }
            if (panel._keyHandler) {
                panel.removeEventListener('keydown', panel._keyHandler);
            }
            panel.removeAttribute('role');
            panel.removeAttribute('aria-expanded');
            panel.removeAttribute('tabindex');
        });
    },
    
    // Prevent drag events on mobile
    preventDrag: function(e) {
        if (MobileHandler.isPortrait) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
};

// Initialize mobile handler when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileHandler.init();
    });
} else {
    // DOM is already loaded
    setTimeout(() => {
        MobileHandler.init();
    }, 100);
}

// Export for use in other scripts
window.MobileHandler = MobileHandler;

console.log('%cÃ¢Å“Â¨ Mobile handler loaded', 'color: #a8d5e8; font-size: 12px;');
