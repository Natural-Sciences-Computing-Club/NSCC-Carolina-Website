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
        console.log('%c🖥️ Desktop/landscape mode activated', 'color: #7ec8e3; font-weight: bold;');
        
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
    
    // Setup collapsible panel functionality for mobile
    setupCollapsiblePanels: function() {
        const panels = document.querySelectorAll('.nav-panel');
        
        panels.forEach((panel) => {
            // Store panel's bound handler
            if (!panel._mobileClickHandler) {
                panel._mobileClickHandler = this.handlePanelClick.bind(panel);
            }
            
            // Remove existing listeners to prevent duplicates
            panel.removeEventListener('click', panel._mobileClickHandler);
            panel.removeEventListener('touchend', panel._mobileClickHandler);
            
            // Add mobile click handler
            panel.addEventListener('click', panel._mobileClickHandler);
            panel.addEventListener('touchend', panel._mobileClickHandler);
            
            // Prevent default drag behavior
            panel.addEventListener('touchstart', this.preventDrag, { passive: false });
            panel.addEventListener('touchmove', this.preventDrag, { passive: false });
            
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
    
    // Remove collapsible panel functionality
    removeCollapsiblePanels: function() {
        const panels = document.querySelectorAll('.nav-panel');
        
        panels.forEach((panel) => {
            if (panel._mobileClickHandler) {
                panel.removeEventListener('click', panel._mobileClickHandler);
                panel.removeEventListener('touchend', panel._mobileClickHandler);
            }
            if (panel._keyHandler) {
                panel.removeEventListener('keydown', panel._keyHandler);
            }
            panel.removeEventListener('touchstart', this.preventDrag);
            panel.removeEventListener('touchmove', this.preventDrag);
            panel.classList.remove('mobile-expanded');
            panel.removeAttribute('role');
            panel.removeAttribute('aria-expanded');
            panel.removeAttribute('tabindex');
        });
    },
    
    // Handle panel click for mobile collapse/expand
    handlePanelClick: function(e) {
        // Prevent double-firing on touch devices
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        if (e.type === 'click' && e.detail === 0) {
            // This is a programmatic click from touchend, ignore
            return;
        }
        
        // Only handle in portrait mode
        if (!MobileHandler.isPortrait) return;
        
        // Prevent event from bubbling to drag handlers
        e.stopPropagation();
        
        const panel = this;
        const isExpanded = panel.classList.contains('mobile-expanded');
        
        // Don't expand if already in full-screen expansion mode
        if (window.isExpanded || window.isCollapsing) return;
        
        // Get content type for potential full expansion
        const contentType = panel.dataset.contentType;
        
        // Check if this is a long press or double-tap for fullscreen
        const now = Date.now();
        if (!panel._lastTap) panel._lastTap = 0;
        const isDoubleTap = (now - panel._lastTap) < 500;
        panel._lastTap = now;
        
        if (isDoubleTap) {
            // Full screen expansion (existing functionality)
            if (contentType && !window.isExpanded && !window.isCollapsing) {
                // Preload images for leadership panel
                if (contentType === 'leadership' && window.imagePreloader) {
                    window.imagePreloader.preload();
                }
                // Use existing expandPanel function
                if (typeof expandPanel === 'function') {
                    // First collapse the mobile expansion
                    panel.classList.remove('mobile-expanded');
                    panel.setAttribute('aria-expanded', 'false');
                    // Then expand to fullscreen
                    setTimeout(() => {
                        expandPanel(panel.id, contentType);
                    }, 300);
                }
            }
        } else {
            // Simple mobile expand/collapse
            if (isExpanded) {
                panel.classList.remove('mobile-expanded');
                panel.setAttribute('aria-expanded', 'false');
            } else {
                // Accordion behavior: close other panels
                document.querySelectorAll('.nav-panel.mobile-expanded').forEach(otherPanel => {
                    if (otherPanel !== panel) {
                        otherPanel.classList.remove('mobile-expanded');
                        otherPanel.setAttribute('aria-expanded', 'false');
                    }
                });
                
                // Expand this panel
                panel.classList.add('mobile-expanded');
                panel.setAttribute('aria-expanded', 'true');
                
                // Scroll panel into view smoothly
                setTimeout(() => {
                    panel.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }, 100);
            }
        }
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

console.log('%c✨ Mobile handler loaded', 'color: #a8d5e8; font-size: 12px;');
