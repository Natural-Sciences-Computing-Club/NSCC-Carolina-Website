// Golden Ratio Cybercore System - Optimized Loading Version
const PHI = 1.618033988749;
const PHI_INV = 0.618033988749;
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

// ============================================
// DARK MODE THEME SYSTEM
// ============================================

// Theme management system
const ThemeManager = {
    // Initialize theme on page load
    init: function() {
        // Check if user has visited before
        const hasVisited = localStorage.getItem('nscc-has-visited');
        const savedTheme = localStorage.getItem('nscc-theme');
        const userHasSetTheme = localStorage.getItem('nscc-theme-manually-set') === 'true';
        
        // Detect system preference
        let systemPrefersDark = false;
        let systemPrefDetected = false;
        
        // Try to detect system preference
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (darkModeQuery.matches !== undefined) {
                systemPrefersDark = darkModeQuery.matches;
                systemPrefDetected = true;
                console.log(`%cSystem preference detected: ${systemPrefersDark ? 'dark' : 'light'}`, 
                    'color: #7ec8e3; font-style: italic;');
            }
        }
        
        let initialTheme;
        
        // Determine initial theme based on different scenarios
        if (!hasVisited) {
            // First-time visitor: use system preference or default to light
            if (systemPrefDetected) {
                initialTheme = systemPrefersDark ? 'dark' : 'light';
                console.log(`%cFirst visit - using system preference: ${initialTheme}`, 
                    'color: #7ec8e3;');
            } else {
                // Cannot detect system preference, default to light
                initialTheme = 'light';
                console.log('%cFirst visit - system preference not detected, defaulting to light mode', 
                    'color: #7ec8e3;');
            }
            
            // Mark as visited
            localStorage.setItem('nscc-has-visited', 'true');
            // Save the initial theme but mark it as not manually set
            localStorage.setItem('nscc-theme', initialTheme);
            localStorage.setItem('nscc-theme-manually-set', 'false');
        } else if (userHasSetTheme && savedTheme) {
            // Returning visitor who has manually set a preference
            initialTheme = savedTheme;
            console.log(`%cReturning visitor - using saved preference: ${initialTheme}`, 
                'color: #7ec8e3;');
        } else {
            // Returning visitor who hasn't manually set theme - follow system preference
            if (systemPrefDetected) {
                initialTheme = systemPrefersDark ? 'dark' : 'light';
                console.log(`%cReturning visitor - following system preference: ${initialTheme}`, 
                    'color: #7ec8e3;');
            } else {
                // Use saved theme or default to light
                initialTheme = savedTheme || 'light';
                console.log(`%cReturning visitor - using ${savedTheme ? 'saved' : 'default'} theme: ${initialTheme}`, 
                    'color: #7ec8e3;');
            }
            
            // Update saved theme to match current decision
            localStorage.setItem('nscc-theme', initialTheme);
        }
        
        // Apply the theme without animation on initial load
        this.setTheme(initialTheme, false);
        
        // Add event listener for theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const manuallySet = localStorage.getItem('nscc-theme-manually-set') === 'true';
                if (!manuallySet) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.setTheme(newTheme, true);
                    console.log(`%cSystem preference changed to: ${newTheme}`, 
                        'color: #7ec8e3; font-style: italic;');
                }
            });
        }
        
        // Log final theme initialization
        console.log(`%c✨ Theme initialized: ${initialTheme} mode`, 
            `color: ${initialTheme === 'dark' ? '#9482ff' : '#7ec8e3'}; font-weight: bold; font-size: 14px;`);
    },
    
    // Set theme
    setTheme: function(theme, animate = true, isManual = false) {
        const body = document.body;
        const toggleBtn = document.getElementById('themeToggle');
        
        // Add animation class if transitioning
        if (animate && toggleBtn) {
            toggleBtn.classList.add('toggling');
            setTimeout(() => {
                toggleBtn.classList.remove('toggling');
            }, 600);
        }
        
        // Set theme attribute
        body.setAttribute('data-theme', theme);
        
        // Save preference
        localStorage.setItem('nscc-theme', theme);
        
        // If this is a manual change (from toggle button), mark it as such
        if (isManual) {
            localStorage.setItem('nscc-theme-manually-set', 'true');
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#0a0b0f' : '#f0f0f0';
        } else {
            // Create meta tag if it doesn't exist
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = theme === 'dark' ? '#0a0b0f' : '#f0f0f0';
            document.head.appendChild(meta);
        }
        
        // Dispatch custom event for any components that need to know about theme changes
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },
    
    // Toggle between light and dark themes
    toggleTheme: function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Mark as manual change
        this.setTheme(newTheme, true, true);
        
        // Log theme change with styled console message
        console.log(`%c🔄 Theme manually switched to: ${newTheme} mode`, 
            `color: ${newTheme === 'dark' ? '#9482ff' : '#7ec8e3'}; font-weight: bold;`);
    },
    
    // Get current theme
    getCurrentTheme: function() {
        return document.body.getAttribute('data-theme') || 'light';
    },
    
    // Clear theme preferences (useful for testing)
    clearPreferences: function() {
        localStorage.removeItem('nscc-theme');
        localStorage.removeItem('nscc-theme-manually-set');
        localStorage.removeItem('nscc-has-visited');
        console.log('%c🗑️ Theme preferences cleared', 'color: #ff6b6b;');
    }
};

// Initialize theme system as soon as DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
    });
} else {
    // DOM is already loaded
    ThemeManager.init();
}

let scene, camera, renderer, clock;
let structures = [];
let particles = null;
let mouseX = 0, mouseY = 0;
let structuresVisible = true;
let particlesVisible = true;
let harmonicMotion, panelPhysics, dataStreamController;

// Lazy load images for better initial performance
const imagePreloader = {
    images: ['wk.jpg', 'ot.jpg', 'JC_photo.jpg'],
    loaded: false,
    preload: function() {
        if (this.loaded) return;
        this.loaded = true;
        this.images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
};

const debug = document.getElementById('debug');
function log(msg) {
    if (debug.style.display !== 'none') {
        debug.innerHTML = msg + '<br>' + debug.innerHTML;
    }
    console.log(msg);
}

// Performance Monitor (internal tracking only)
const perfMonitor = {
    fps: 60,
    objectCount: 0,
    startTime: performance.now(),
    frames: 0,
    update: function() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.startTime = currentTime;
        }
    }
};

// Harmonic Motion System
class HarmonicMotionSystem {
    constructor() {
        this.time = 0;
        this.elements = new Map();
        this.frameCounter = 0;
        this.updateFrequency = 2;
    }
    
    registerElement(element, config) {
        this.elements.set(element, {
            amplitude: config.amplitude || PHI * 10,
            frequency: config.frequency || 1 / (PHI * 10),
            phase: config.phase || Math.random() * Math.PI * 2,
            axis: config.axis || 'y',
            pattern: config.pattern || 'sine',
            lissajousA: 3,
            lissajousB: 5,
            perlinFactors: [1, PHI, PHI * PHI],
            perlinDivisor: 1.75
        });
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.frameCounter++;
        
        if (this.frameCounter % this.updateFrequency !== 0) return;
        
        this.elements.forEach((config, element) => {
            if (!element.visible) return;
            
            const t = this.time * config.frequency + config.phase;
            let displacement = 0;
            
            switch(config.pattern) {
                case 'sine':
                    displacement = Math.sin(t) * config.amplitude;
                    break;
                case 'lissajous':
                    displacement = Math.sin(config.lissajousA * t) * config.amplitude;
                    break;
                case 'perlin':
                    displacement = (Math.sin(t) + Math.sin(t * config.perlinFactors[1]) * 0.5 + 
                                 Math.sin(t * config.perlinFactors[2]) * 0.25) * config.amplitude / config.perlinDivisor;
                    break;
            }
            
            if (element.position && element.userData.originalPosition) {
                element.position[config.axis] = element.userData.originalPosition[config.axis] + displacement;
            }
        });
    }
}

// Panel Physics Engine
class GoldenPanelPhysics {
    constructor() {
        this.panels = new Map();
        this.constraints = [];
        this.draggedPanel = null;
        this.initialized = false;
        this.frameCounter = 0;
        this.updateFrequency = 2;
        this.lastWidth = window.innerWidth;
        this.lastHeight = window.innerHeight;
        
        // Store drag state centrally
        this.dragState = {
            offsetX: 0,
            offsetY: 0,
            velocityTracking: [],
            mouseDownTime: 0,
            mouseDownX: 0,
            mouseDownY: 0,
            hasMoved: false
        };
        
        this.springConstants = {
            stiffness: PHI_INV * 0.1,
            damping: PHI_INV,
            restLength: 0,
            minVelocity: 0.01
        };
        
        // Set up centralized document event handlers
        this.setupDocumentHandlers();
        
        // Use requestIdleCallback for non-critical initialization
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.initializePanels());
        } else {
            setTimeout(() => this.initializePanels(), 100);
        }
    }
    
    setupDocumentHandlers() {
        // Single mousemove handler for all panels
        document.addEventListener('mousemove', (e) => {
            if (!this.draggedPanel) return;
            
            const panelData = this.panels.get(this.draggedPanel);
            if (!panelData || !panelData.isDragging) return;
            
            // Check if mouse moved significantly
            const dx = e.clientX - this.dragState.mouseDownX;
            const dy = e.clientY - this.dragState.mouseDownY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                this.dragState.hasMoved = true;
            }
            
            const newX = e.clientX - this.dragState.offsetX;
            const newY = e.clientY - this.dragState.offsetY;
            
            this.dragState.velocityTracking.push({ 
                x: newX - panelData.position.x, 
                y: newY - panelData.position.y 
            });
            if (this.dragState.velocityTracking.length > 5) {
                this.dragState.velocityTracking.shift();
            }
            
            panelData.position.x = newX;
            panelData.position.y = newY;
            
            const panel = panelData.element;
            panel.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotateZ(${panelData.angle}deg)`;
        }, { passive: true });
        
        // Single mouseup handler for all panels
        document.addEventListener('mouseup', (e) => {
            if (!this.draggedPanel) return;
            
            const panelId = this.draggedPanel;
            const panelData = this.panels.get(panelId);
            if (!panelData) return;
            
            const panel = panelData.element;
            
            // Debug logging
            console.log(`[${panelId}] mouseup fired, hasMoved: ${this.dragState.hasMoved}, isExpanded: ${isExpanded}, isCollapsing: ${isCollapsing}`);
            
            panel.classList.remove('dragging');
            panelData.isDragging = false;
            
            // Check if this was a click (short time, no movement)
            const clickDuration = Date.now() - this.dragState.mouseDownTime;
            const isClick = !this.dragState.hasMoved && clickDuration < 200;
            
            if (isClick) {
                console.log(`[${panelId}] Click detected! contentType: ${panel.dataset.contentType}`);
                // This was a click, trigger panel expansion
                const contentType = panel.dataset.contentType;
                if (contentType && !isExpanded && !isCollapsing) {
                    // Preload images when leadership panel is clicked
                    if (contentType === 'leadership') {
                        imagePreloader.preload();
                    }
                    console.log(`[${panelId}] Calling expandPanel`);
                    expandPanel(panelId, contentType);
                } else {
                    console.log(`[${panelId}] Click blocked - isExpanded: ${isExpanded}, isCollapsing: ${isCollapsing}`);
                }
            } else {
                // This was a drag, apply physics
                if (this.dragState.velocityTracking.length > 0) {
                    const avgVel = this.dragState.velocityTracking.reduce((acc, vel) => ({
                        x: acc.x + vel.x,
                        y: acc.y + vel.y
                    }), { x: 0, y: 0 });
                    
                    panelData.velocity.x = (avgVel.x / this.dragState.velocityTracking.length) * PHI_INV;
                    panelData.velocity.y = (avgVel.y / this.dragState.velocityTracking.length) * PHI_INV;
                    panelData.angularVelocity = panelData.velocity.x * (1 / PHI) * 0.1;
                }
            }
            
            // Clear drag state
            this.draggedPanel = null;
            this.dragState.velocityTracking = [];
        }, { passive: true });
    }
    
    initializePanels() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Calculate safe zone height for title and subtitle
        const titleElement = document.getElementById('siteTitle');
        const subtitleElement = document.getElementById('siteSubtitle');
        let safeZoneBottom = 0;
        
        if (titleElement && subtitleElement) {
            const subtitleRect = subtitleElement.getBoundingClientRect();
            safeZoneBottom = subtitleRect.bottom + 30; // Add 30px buffer
        }
        
        document.querySelectorAll('.nav-panel').forEach((panel) => {
            const dataX = parseFloat(panel.dataset.originalX);
            const dataY = parseFloat(panel.dataset.originalY);
            
            let x = (dataX / 100) * window.innerWidth;
            let y = (dataY / 100) * window.innerHeight;
            
            // Ensure panels don't overlap with title/subtitle
            if (y < safeZoneBottom) {
                y = safeZoneBottom + 10; // Push panel below safe zone with small gap
                // Update the data attribute for consistency
                panel.dataset.adjustedY = ((y / window.innerHeight) * 100).toFixed(1);
            }
            
            const panelData = {
                element: panel,
                position: { x, y },
                velocity: { x: 0, y: 0 },
                originalPosition: { x, y },
                angle: 0,
                angularVelocity: 0,
                isDragging: false,
                isMoving: false,
                physicsDisabled: false,  // Initialize the physics disabled flag
                mass: PHI
            };
            
            this.panels.set(panel.id, panelData);
            
            this.constraints.push({
                type: 'spring',
                panel: panel.id,
                anchor: { x, y },
                stiffness: this.springConstants.stiffness,
                damping: this.springConstants.damping,
                restLength: 0
            });
            
            panel.style.left = '0px';
            panel.style.top = '0px';
            panel.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            panel.style.willChange = 'transform';
            
            this.addPanelListeners(panel);
        });
    }
    
    addPanelListeners(panel) {
        panel.addEventListener('mousedown', (e) => {
            const panelData = this.panels.get(panel.id);
            if (!panelData) return;
            
            // Visual feedback that mousedown fired - apply to glass container for better effect
            const glassContainer = panel.querySelector('.panel-glass-container');
            if (glassContainer) {
                glassContainer.style.boxShadow = `
                    inset 0 2px 4px rgba(255,255,255,0.5),
                    inset 0 -2px 4px rgba(0,0,0,0.2),
                    0 0 0 1px rgba(126,200,227,0.8),
                    0 0 50px rgba(126,200,227,0.6),
                    0 10px 40px rgba(0,0,0,0.3),
                    0 2px 10px rgba(0,0,0,0.2)
                `;
                setTimeout(() => {
                    glassContainer.style.boxShadow = '';
                }, 200);
            }
            
            // Debug logging
            console.log(`[${panel.id}] mousedown fired, isDragging was: ${panelData.isDragging}, isExpanded: ${isExpanded}, isCollapsing: ${isCollapsing}`);
            
            // Record mouse down time and position for click detection
            this.dragState.mouseDownTime = Date.now();
            this.dragState.mouseDownX = e.clientX;
            this.dragState.mouseDownY = e.clientY;
            this.dragState.hasMoved = false;
            
            this.draggedPanel = panel.id;
            panelData.isDragging = true;
            panelData.isMoving = true;
            panel.classList.add('dragging');
            
            const rect = panel.getBoundingClientRect();
            this.dragState.offsetX = e.clientX - rect.left;
            this.dragState.offsetY = e.clientY - rect.top;
            this.dragState.velocityTracking = [];
            
            panelData.velocity.x = 0;
            panelData.velocity.y = 0;
            panelData.angularVelocity = 0;
            
            e.preventDefault();
        });
    }
    
    update(deltaTime) {
        if (!this.initialized) return;
        
        this.frameCounter++;
        
        if (this.frameCounter % this.updateFrequency !== 0) return;
        
        deltaTime = Math.min(deltaTime * this.updateFrequency, 1 / 30);
        
        this.panels.forEach((panelData, panelId) => {
            // Skip physics for panels that are being dragged or have physics disabled
            if (panelData.isDragging || panelData.physicsDisabled) return;
            
            if (!panelData.isMoving) return;
            
            this.constraints.forEach(constraint => {
                if (constraint.panel === panelId) {
                    const dx = constraint.anchor.x - panelData.position.x;
                    const dy = constraint.anchor.y - panelData.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 5) {
                        const springForceX = dx * constraint.stiffness;
                        const springForceY = dy * constraint.stiffness;
                        
                        panelData.velocity.x += springForceX / panelData.mass;
                        panelData.velocity.y += springForceY / panelData.mass;
                    }
                }
            });
            
            panelData.velocity.x *= this.springConstants.damping;
            panelData.velocity.y *= this.springConstants.damping;
            
            if (Math.abs(panelData.velocity.x) < this.springConstants.minVelocity && 
                Math.abs(panelData.velocity.y) < this.springConstants.minVelocity) {
                panelData.velocity.x = 0;
                panelData.velocity.y = 0;
                panelData.isMoving = false;
                panelData.angularVelocity = 0;
                panelData.angle = 0;
                return;
            } else {
                panelData.isMoving = true;
            }
            
            panelData.position.x += panelData.velocity.x;
            panelData.position.y += panelData.velocity.y;
            
            panelData.angularVelocity *= PHI_INV;
            panelData.angle += panelData.angularVelocity;
            panelData.angle *= (1 + PHI_INV) / 2;
            
            panelData.element.style.transform = 
                `translate3d(${panelData.position.x}px, ${panelData.position.y}px, 0) 
                 rotateZ(${panelData.angle}deg)`;
        });
        
        // Continuously check for overlaps during physics updates
        this.checkCollisionsDuringPhysics();
    }
    
    checkCollisionsDuringPhysics() {
        const panelArray = Array.from(this.panels.values());
        const panelWidth = window.innerWidth * 0.15;
        const panelHeight = window.innerHeight * 0.30;
        const minWidth = 180;
        const minHeight = 240;
        
        const actualWidth = Math.max(panelWidth, minWidth);
        const actualHeight = Math.max(panelHeight, minHeight);
        
        for (let i = 0; i < panelArray.length; i++) {
            for (let j = i + 1; j < panelArray.length; j++) {
                const a = panelArray[i];
                const b = panelArray[j];
                
                if (a.isDragging || b.isDragging) continue;
                
                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                
                // Check if too close
                if (Math.abs(dx) < actualWidth && Math.abs(dy) < actualHeight) {
                    // Apply repulsion force
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < actualWidth * 0.8) {
                        const repulsionStrength = 0.5;
                        const angle = Math.atan2(dy, dx);
                        
                        if (!a.isMoving) a.isMoving = true;
                        if (!b.isMoving) b.isMoving = true;
                        
                        a.velocity.x -= Math.cos(angle) * repulsionStrength;
                        a.velocity.y -= Math.sin(angle) * repulsionStrength;
                        b.velocity.x += Math.cos(angle) * repulsionStrength;
                        b.velocity.y += Math.sin(angle) * repulsionStrength;
                    }
                }
            }
        }
    }
    
    updateBounds() {
        const oldWidth = this.lastWidth;
        const oldHeight = this.lastHeight;
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        
        // Calculate safe zone height for title and subtitle
        const titleElement = document.getElementById('siteTitle');
        const subtitleElement = document.getElementById('siteSubtitle');
        let safeZoneBottom = 0;
        
        if (titleElement && subtitleElement) {
            // Small delay to ensure CSS has updated
            setTimeout(() => {
                const subtitleRect = subtitleElement.getBoundingClientRect();
                safeZoneBottom = subtitleRect.bottom + 30;
            }, 10);
        }
        
        this.panels.forEach((panelData) => {
            const panel = panelData.element;
            const dataX = parseFloat(panel.dataset.originalX);
            const dataY = parseFloat(panel.dataset.originalY);
            
            // Calculate new anchor positions from percentages
            const newAnchorX = (dataX / 100) * newWidth;
            let newAnchorY = (dataY / 100) * newHeight;
            
            // Check if using adjusted Y position
            if (panel.dataset.adjustedY) {
                const adjustedY = parseFloat(panel.dataset.adjustedY);
                newAnchorY = (adjustedY / 100) * newHeight;
            }
            
            // Ensure anchor doesn't overlap with title/subtitle
            if (newAnchorY < safeZoneBottom) {
                newAnchorY = safeZoneBottom + 10;
                panel.dataset.adjustedY = ((newAnchorY / newHeight) * 100).toFixed(1);
            }
            
            // Scale current position proportionally
            panelData.position.x *= scaleX;
            panelData.position.y *= scaleY;
            
            // Ensure current position respects safe zone
            if (panelData.position.y < safeZoneBottom) {
                panelData.position.y = safeZoneBottom + 10;
            }
            
            // Update original position
            panelData.originalPosition.x = newAnchorX;
            panelData.originalPosition.y = newAnchorY;
            
            // Update constraints
            this.constraints.forEach(constraint => {
                if (constraint.panel === panel.id) {
                    constraint.anchor.x = newAnchorX;
                    constraint.anchor.y = newAnchorY;
                }
            });
            
            // Immediately update transform
            panel.style.transform = 
                `translate3d(${panelData.position.x}px, ${panelData.position.y}px, 0) 
                 rotateZ(${panelData.angle}deg)`;
        });
        
        // Prevent overlaps after scaling
        this.resolveOverlaps();
        
        // Store dimensions for next resize
        this.lastWidth = newWidth;
        this.lastHeight = newHeight;
    }
    
    resolveOverlaps() {
        const panelArray = Array.from(this.panels.values());
        // Use actual panel dimensions with some padding
        const panelWidth = window.innerWidth * 0.15; // 15vw
        const panelHeight = window.innerHeight * 0.30; // 30vh
        const minWidth = 180;
        const minHeight = 240;
        
        const actualWidth = Math.max(panelWidth, minWidth);
        const actualHeight = Math.max(panelHeight, minHeight);
        const padding = 20; // Minimum space between panels
        
        // Multiple passes to resolve all overlaps
        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < panelArray.length; i++) {
                for (let j = i + 1; j < panelArray.length; j++) {
                    const a = panelArray[i];
                    const b = panelArray[j];
                    
                    // Skip if either is being dragged
                    if (a.isDragging || b.isDragging) continue;
                    
                    const dx = b.position.x - a.position.x;
                    const dy = b.position.y - a.position.y;
                    
                    const minDistX = actualWidth + padding;
                    const minDistY = actualHeight + padding;
                    
                    // Check if overlapping
                    if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
                        // Calculate overlap amounts
                        const overlapX = minDistX - Math.abs(dx);
                        const overlapY = minDistY - Math.abs(dy);
                        
                        // Push apart along axis of least overlap
                        if (overlapX < overlapY) {
                            // Separate horizontally
                            const pushX = (overlapX / 2 + padding) * Math.sign(dx || 1);
                            a.position.x -= pushX;
                            b.position.x += pushX;
                        } else {
                            // Separate vertically
                            const pushY = (overlapY / 2 + padding) * Math.sign(dy || 1);
                            a.position.y -= pushY;
                            b.position.y += pushY;
                        }
                        
                        // Keep panels on screen
                        const maxX = window.innerWidth - actualWidth;
                        const maxY = window.innerHeight - actualHeight;
                        
                        a.position.x = Math.max(0, Math.min(a.position.x, maxX));
                        a.position.y = Math.max(0, Math.min(a.position.y, maxY));
                        b.position.x = Math.max(0, Math.min(b.position.x, maxX));
                        b.position.y = Math.max(0, Math.min(b.position.y, maxY));
                        
                        // Update transforms immediately
                        a.element.style.transform = 
                            `translate3d(${a.position.x}px, ${a.position.y}px, 0) rotateZ(${a.angle}deg)`;
                        b.element.style.transform = 
                            `translate3d(${b.position.x}px, ${b.position.y}px, 0) rotateZ(${b.angle}deg)`;
                    }
                }
            }
        }
    }
}

// Data Stream Controller
class DataStreamController {
    constructor() {
        this.streams = [];
        this.updateStreams();
    }
    
    updateStreams() {
        const panels = document.querySelectorAll('.nav-panel');
        const cyberspace = document.getElementById('cyberspace');
        
        document.querySelectorAll('.data-stream').forEach(s => s.remove());
        this.streams = [];
        
        const connections = [
            [0, 2],
            [1, 3],
            [2, 4],
            [3, 0],
            [4, 1]
        ];
        
        connections.forEach(([from, to], index) => {
            if (panels[from] && panels[to]) {
                const rect1 = panels[from].getBoundingClientRect();
                const rect2 = panels[to].getBoundingClientRect();
                
                const stream = document.createElement('div');
                stream.className = 'data-stream';
                stream.id = `dataStream${index}`;
                
                const dx = rect2.left + rect2.width / 2 - (rect1.left + rect1.width / 2);
                const dy = rect2.top + rect2.height / 2 - (rect1.top + rect1.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                stream.style.width = '2px';
                stream.style.height = distance + 'px';
                stream.style.left = (rect1.left + rect1.width / 2) + 'px';
                stream.style.top = (rect1.top + rect1.height / 2) + 'px';
                stream.style.transform = `rotate(${angle + 90}deg)`;
                stream.style.transformOrigin = 'top center';
                stream.style.animationDelay = `${index * PHI_INV}s`;
                
                cyberspace.appendChild(stream);
                this.streams.push(stream);
            }
        });
    }
}

// Three.js Initialization - Optimized loading check
function checkThreeJS() {
    if (typeof THREE !== 'undefined') {
        log('Three.js loaded successfully');
        // Use requestAnimationFrame for smoother initialization
        requestAnimationFrame(() => init());
    } else {
        log('Waiting for Three.js...');
        setTimeout(checkThreeJS, 100);
    }
}

function init() {
    try {
        log('Initializing Golden Ratio System...');
        
        clock = new THREE.Clock();
        
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0xf0f8ff, 50, 200);
        
        camera = new THREE.PerspectiveCamera(
            PHI * 45,
            window.innerWidth / window.innerHeight, 
            PHI_INV, 
            1000
        );
        camera.position.set(0, 0, PHI * 30);
        
        const canvas = document.getElementById('three-canvas');
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: window.devicePixelRatio === 1,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        renderer.shadowMap.enabled = false;
        renderer.sortObjects = true;
        renderer.outputEncoding = THREE.LinearEncoding;
        
        log('Renderer created');
        
        const ambientLight = new THREE.AmbientLight(0xffffff, PHI_INV);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0x7ec8e3, 1);
        dirLight.position.set(PHI * 5, PHI * 5, PHI * 5);
        scene.add(dirLight);
        
        log('Lighting added');
        
        harmonicMotion = new HarmonicMotionSystem();
        panelPhysics = new GoldenPanelPhysics();
        dataStreamController = new DataStreamController();
        
        createGoldenStructures();
        
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('resize', onWindowResize, { passive: true });
        
        log('Starting Animation...');
        animate();
        
        // Listen for theme changes to update materials
        window.addEventListener('themechange', (e) => {
            const isDark = e.detail.theme === 'dark';
            updateStructureMaterials(isDark);
        });
        
        setTimeout(() => {
            debug.style.display = 'none';
        }, PHI * 2000);
        
    } catch(error) {
        log('Error: ' + error.message);
        console.error(error);
    }
}

function createGoldenStructures() {
    log('Creating Iridescent Structures...');
    
    let sharedShader = null;
    
    // Get current theme for color adjustments
    const isDarkMode = () => document.body.getAttribute('data-theme') === 'dark';
    
    function createIridescentMaterial(hueOffset = 0) {
        // Adjust hue based on theme
        const themeHueShift = isDarkMode() ? 0.7 : 0; // Shift to violet in dark mode
        const adjustedHue = (hueOffset + themeHueShift) % 1;
        
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(adjustedHue, 0.8, 0.6),
            metalness: 0.4,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            reflectivity: 0.8,
            emissive: new THREE.Color().setHSL((adjustedHue + 0.5) % 1, 1, 0.2),
            emissiveIntensity: isDarkMode() ? 0.4 : 0.3,
            side: THREE.DoubleSide
        });
        
        material.userData = {
            hueOffset: hueOffset,
            time: 0,
            shader: null
        };
        
        material.onBeforeCompile = function(shader) {
            if (!sharedShader) {
                shader.uniforms.time = { value: 0 };
                
                shader.vertexShader = 'varying vec3 vWorldNormal;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <worldpos_vertex>',
                    `#include <worldpos_vertex>
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);`
                );
                
                shader.fragmentShader = 'uniform float time;\nvarying vec3 vWorldNormal;\n' + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <color_fragment>',
                    `#include <color_fragment>
                    vec3 viewDirection = normalize(cameraPosition - vWorldPosition.xyz);
                    float fresnel = 1.0 - abs(dot(viewDirection, vWorldNormal));
                    
                    vec3 iridescentColor = vec3(
                        sin(fresnel * 6.28 + time * 2.0) * 0.5 + 0.5,
                        sin(fresnel * 6.28 + time * 2.5 + 2.094) * 0.5 + 0.5,
                        sin(fresnel * 6.28 + time * 3.0 + 4.189) * 0.5 + 0.5
                    );
                    
                    diffuseColor.rgb = mix(diffuseColor.rgb, iridescentColor, fresnel * 0.6);
                    diffuseColor.rgb += iridescentColor * fresnel * 0.3;`
                );
                
                sharedShader = shader;
            } else {
                Object.assign(shader.uniforms, sharedShader.uniforms);
                shader.vertexShader = sharedShader.vertexShader;
                shader.fragmentShader = sharedShader.fragmentShader;
            }
            
            material.userData.shader = shader;
        };
        
        return material;
    }
    
    function createWireframeMaterial(color = 0x7ec8e3) {
        return new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
    }
    
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        ior: 1.5,
        reflectivity: 0.5
    });
    
    const structureCount = FIBONACCI[7];
    
    const positions = [
        { x: 61.8, y: 38.2, z: -20 },  
        { x: -38.2, y: -61.8, z: -40 }, 
        { x: 33.3, y: 66.7, z: -30 },
        { x: -66.7, y: 33.3, z: -25 },
        { x: 85.4, y: 85.4, z: -45 },
        { x: -85.4, y: -85.4, z: -35 },
        { x: -85.4, y: 85.4, z: -50 },
        { x: 85.4, y: -85.4, z: -40 },
        { x: 0, y: 76.4, z: -60 },
        { x: -76.4, y: 0, z: -55 },
        { x: 76.4, y: 0, z: -65 },
        { x: 0, y: -76.4, z: -70 },
        { x: 50, y: -50, z: -80 }
    ];
    
    for (let i = 0; i < structureCount; i++) {
        let geometry;
        let material;
        
        const isIridescent = i % 2 === 0;
        
        if (isIridescent) {
            const hueOffset = (i / structureCount) * 0.3;
            material = createIridescentMaterial(hueOffset);
        } else {
            material = glassMaterial;
        }
        
        const sizeIndex = (i % 6) + 3;
        const baseSize = FIBONACCI[sizeIndex] * 0.5;
        
        const posIndex = i % positions.length;
        const pos = positions[posIndex];
        
        const depthScale = 1 - (Math.abs(pos.z) / 100) * 0.3;
        const size = baseSize * depthScale;
        
        const detailLevel = Math.abs(pos.z) > 50 ? 0 : 1;
        
        switch(i % 5) {
            case 0:
                geometry = new THREE.IcosahedronGeometry(size, detailLevel);
                break;
            case 1:
                geometry = new THREE.TorusKnotGeometry(size * PHI_INV, size * 0.3, 55, 8, 2, 3);
                break;
            case 2:
                geometry = new THREE.DodecahedronGeometry(size, 0);
                break;
            case 3:
                geometry = new THREE.OctahedronGeometry(size, detailLevel);
                break;
            case 4:
                geometry = new THREE.TetrahedronGeometry(size * PHI, Math.min(2, detailLevel + 1));
                break;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        
        if (isIridescent) {
            const wireframeMat = createWireframeMaterial();
            const wireframeMesh = new THREE.Mesh(geometry, wireframeMat);
            mesh.add(wireframeMesh);
        }
        
        mesh.position.set(pos.x, pos.y, pos.z);
        
        mesh.userData.originalPosition = mesh.position.clone();
        mesh.userData.isIridescent = isIridescent;
        mesh.frustumCulled = true;
        
        const patterns = ['sine', 'lissajous', 'perlin'];
        const axes = ['x', 'y', 'z'];
        
        harmonicMotion.registerElement(mesh, {
            amplitude: FIBONACCI[sizeIndex % 5 + 1] * (0.5 + Math.random() * 0.5),
            frequency: 1 / (FIBONACCI[sizeIndex % 4 + 3] * (1.5 + Math.random())),
            phase: i * PHI + Math.random() * Math.PI,
            axis: axes[i % 3],
            pattern: patterns[Math.floor(i / 3) % 3]
        });
        
        scene.add(mesh);
        structures.push(mesh);
        
        perfMonitor.objectCount++;
    }
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x7ec8e3, 1);
    directionalLight.position.set(30, 30, 30);
    scene.add(directionalLight);
    
    const secondaryLight = new THREE.PointLight(0xa8d5e8, 0.8, 100);
    secondaryLight.position.set(-30, -30, 30);
    scene.add(secondaryLight);
    
    log(`Created ${structures.length} structures`);
}

// Update structure materials based on theme
function updateStructureMaterials(isDark) {
    structures.forEach((mesh, i) => {
        if (mesh.userData.isIridescent && mesh.material) {
            // Adjust material colors for theme
            const hueShift = isDark ? 0.7 : 0; // Shift to violet in dark mode
            const hueOffset = (i / structures.length) * 0.3 + hueShift;
            
            if (mesh.material.color) {
                mesh.material.color.setHSL(hueOffset % 1, 0.8, 0.6);
            }
            if (mesh.material.emissive) {
                mesh.material.emissive.setHSL((hueOffset + 0.5) % 1, 1, 0.2);
                mesh.material.emissiveIntensity = isDark ? 0.4 : 0.3;
            }
            mesh.material.needsUpdate = true;
        }
    });
    
    // Update lights for theme
    if (scene) {
        scene.traverse((child) => {
            if (child.isLight) {
                if (child.type === 'DirectionalLight') {
                    child.color.setHex(isDark ? 0x7b6fff : 0x7ec8e3);
                } else if (child.type === 'PointLight') {
                    child.color.setHex(isDark ? 0x9482ff : 0xa8d5e8);
                }
            }
        });
    }
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const cursor = document.getElementById('chromeCursor');
    cursor.style.left = event.clientX + 'px';
    cursor.style.top = event.clientY + 'px';
}

// Debounced resize handler for better performance
let resizeTimeout;
function onWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (panelPhysics) {
            panelPhysics.updateBounds();
        }
        
        if (dataStreamController) {
            dataStreamController.updateStreams();
        }
    }, 100);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const time = clock.getElapsedTime();
    
    perfMonitor.update();
    
    if (harmonicMotion) {
        harmonicMotion.update(deltaTime);
    }
    
    if (panelPhysics) {
        panelPhysics.update(deltaTime);
    }
    
    const rotationSpeedX = deltaTime * PHI_INV * 0.1;
    const rotationSpeedY = deltaTime * PHI_INV * 0.2;
    
    for (let i = 0; i < structures.length; i++) {
        const structure = structures[i];
        
        if (!structure.visible) continue;
        
        structure.rotation.x += rotationSpeedX * (1 + i * 0.1);
        structure.rotation.y += rotationSpeedY * (1 + i * 0.05);
        
        if (structure.userData.isIridescent && 
            structure.material.userData.shader && 
            Math.floor(time * 60) % 3 === 0) {
            structure.material.userData.shader.uniforms.time.value = time;
        }
    }
    
    const camTime1 = time * PHI_INV * 0.1;
    const camTime2 = time * PHI_INV * 0.08;
    const camTime3 = time * PHI_INV * 0.05;
    
    camera.position.x = Math.sin(camTime1) * PHI * 2;
    camera.position.y = Math.cos(camTime2) * PHI + 2;
    camera.position.z = PHI * 30 + Math.sin(camTime3) * PHI * 3;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

function createNeuralNetwork() {
    const network = document.getElementById('neuralNetwork');
    const elements = document.querySelectorAll('.shape-cluster, .nav-panel');
    const nodes = [];
    
    const fragment = document.createDocumentFragment();
    
    elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const node = document.createElement('div');
        node.className = 'neural-node';
        node.style.cssText = `
            position: absolute;
            width: ${FIBONACCI[3] * 2}px;
            height: ${FIBONACCI[3] * 2}px;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            background: radial-gradient(circle, var(--accent-cyan), transparent);
            border-radius: 50%;
            box-shadow: 0 0 ${FIBONACCI[5]}px rgba(126,200,227,0.5);
            animation: pulse ${PHI * 2}s infinite;
            will-change: transform;
            transform: translateZ(0);
        `;
        fragment.appendChild(node);
        nodes.push({
            element: node,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    });
    
    for(let i = 0; i < nodes.length; i++) {
        for(let j = i + 1; j < nodes.length; j++) {
            if(Math.random() > PHI_INV * 1.2) {
                const strand = document.createElement('div');
                strand.className = 'neural-strand';
                
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                strand.style.cssText = `
                    position: absolute;
                    height: 1px;
                    background: linear-gradient(90deg, 
                        transparent, 
                        var(--accent-cyan) ${PHI_INV * 30}%, 
                        var(--accent-cyan) ${(1 - PHI_INV * 0.3) * 100}%, 
                        transparent);
                    width: ${distance}px;
                    left: ${nodes[i].x}px;
                    top: ${nodes[i].y}px;
                    transform: rotate(${angle}deg);
                    transform-origin: 0 50%;
                    opacity: ${PHI_INV * 0.5};
                    animation: neural-pulse ${FIBONACCI[5]}s infinite;
                    animation-delay: ${Math.random() * FIBONACCI[5]}s;
                    will-change: opacity;
                `;
                
                fragment.appendChild(strand);
            }
        }
    }
    
    network.appendChild(fragment);
}

// ============================================
// PANEL EXPANSION SYSTEM - ADVANCED MORPHING
// ============================================

let currentExpandedPanel = null;
let isExpanded = false;
let isCollapsing = false;  // Prevent multiple concurrent collapse operations

function expandPanel(panelId, contentType) {
    if (isExpanded || isCollapsing) return;  // Don't expand while collapsing
    isExpanded = true;
    currentExpandedPanel = panelId;
    
    console.log(`[expandPanel] Opening panel: ${panelId}`);
    
    const panel = document.getElementById(panelId);
    const expandedOverlay = document.getElementById('expandedOverlay');
    const expandedContainer = document.getElementById('expandedContainer');
    const expandedContent = document.getElementById('expandedContent');
    
    // Clear any inline opacity styles
    panel.style.opacity = '';
    
    // Get panel's current position
    const panelRect = panel.getBoundingClientRect();
    const panelData = panelPhysics.panels.get(panelId);
    
    // Set initial position to match the panel
    expandedContainer.style.left = panelRect.left + 'px';
    expandedContainer.style.top = panelRect.top + 'px';
    expandedContainer.style.width = panelRect.width + 'px';
    expandedContainer.style.height = panelRect.height + 'px';
    expandedContainer.style.opacity = '1';
    
    // Disable physics for the expanding panel using a separate flag
    if (panelData) {
        panelData.physicsDisabled = true; // Use a separate flag instead of isDragging
        console.log(`[expandPanel] Set physicsDisabled=true for ${panelId}`);
    }
    
    // Load content based on type
    loadContent(contentType, expandedContent);
    
    // Start the expansion animation
    expandedOverlay.style.pointerEvents = '';  // Clear any stuck pointer-events
    expandedOverlay.classList.add('active');
    
    // Reset container position and pointer-events in case it's stuck off-screen
    expandedContainer.style.pointerEvents = '';
    // IMPORTANT: Reset position from potential off-screen location
    if (expandedContainer.style.left === '-9999px') {
        expandedContainer.style.left = panelRect.left + 'px';
        expandedContainer.style.top = panelRect.top + 'px';
        console.log('[expandPanel] Reset container from off-screen position');
    }
    
    // Force a reflow to ensure initial styles are applied
    expandedContainer.offsetHeight;
    
    // Add morphing class and expanded state
    expandedContainer.classList.add('morphing');
    requestAnimationFrame(() => {
        expandedContainer.classList.add('expanded');
        
        // Fade out all elements smoothly
        fadeOutElements();
        
        // Hide the clicked panel with fade transition
        panel.classList.add('hidden');
    });
    
    // Disable panel dragging during expansion
    document.querySelectorAll('.nav-panel').forEach(p => {
        p.style.pointerEvents = 'none';
    });
    console.log(`[expandPanel] Set pointer-events=none on all panels`);
}

function collapsePanel() {
    if (!isExpanded || isCollapsing) return;  // Prevent multiple concurrent collapses
    isCollapsing = true;  // Set flag to prevent concurrent operations
    
    console.log(`[collapsePanel] Starting collapse of panel: ${currentExpandedPanel}`);
    
    const expandedOverlay = document.getElementById('expandedOverlay');
    const expandedContainer = document.getElementById('expandedContainer');
    const panel = document.getElementById(currentExpandedPanel);
    
    // Validate panel exists
    if (!panel || !expandedOverlay || !expandedContainer) {
        console.warn('[collapsePanel] Missing required elements for collapse');
        // Still clean up state even if elements are missing
        isExpanded = false;
        isCollapsing = false;
        currentExpandedPanel = null;
        // Try to restore all panels
        document.querySelectorAll('.nav-panel').forEach(p => {
            p.style.pointerEvents = '';
            p.classList.remove('hidden');
        });
        return;
    }
    
    // Store the panel ID before it gets cleared
    const collapsedPanelId = currentExpandedPanel;
    
    // CRITICAL: Clear any stuck dragging state for ALL panels
    if (panelPhysics && panelPhysics.panels) {
        panelPhysics.panels.forEach((panelData, panelId) => {
            // Only clear isDragging if it's not actually being dragged right now
            if (panelPhysics.draggedPanel !== panelId) {
                panelData.isDragging = false;
            }
        });
        // Also clear the draggedPanel if it's stuck
        panelPhysics.draggedPanel = null;
        console.log('[collapsePanel] Cleared stuck dragging states');
    }
    
    // Get panel's current position for morphing back
    const panelRect = panel.getBoundingClientRect();
    
    // Remove expanded state to trigger morphing animation
    expandedContainer.classList.remove('expanded');
    
    // Morph back to panel position
    requestAnimationFrame(() => {
        expandedContainer.style.left = panelRect.left + 'px';
        expandedContainer.style.top = panelRect.top + 'px';
        expandedContainer.style.width = panelRect.width + 'px';
        expandedContainer.style.height = panelRect.height + 'px';
        
        // Fade in all elements smoothly
        fadeInElements();
        
        // Show the original panel with fade transition
        panel.classList.remove('hidden');
        console.log(`[collapsePanel] Removed hidden class from ${collapsedPanelId}`);
        
        // Immediately restore pointer-events for all panels after animation starts
        // This ensures panels become clickable right away, not after the 800ms delay
        setTimeout(() => {
            document.querySelectorAll('.nav-panel').forEach(p => {
                // Clear inline pointer-events style to restore interactivity
                p.style.pointerEvents = '';
            });
            console.log('[collapsePanel] Cleared pointer-events on all panels (50ms)');
        }, 50); // Small delay to ensure animation has started
    });
    
    // Hide overlay after animation
    setTimeout(() => {
        expandedOverlay.classList.remove('active');
        expandedContainer.classList.remove('morphing');
        expandedContainer.style.opacity = '0';
        
        // IMPORTANT: Ensure overlay and container don't block any clicks
        expandedOverlay.style.pointerEvents = 'none';
        expandedContainer.style.pointerEvents = 'none';
        expandedContainer.style.left = '-9999px';
        expandedContainer.style.top = '-9999px';
        console.log('[collapsePanel] Moved expanded container off-screen and disabled pointer events');
        
        // Re-enable physics for the panel using stored ID
        const panelData = panelPhysics.panels.get(collapsedPanelId);
        if (panelData) {
            panelData.physicsDisabled = false;  // Clear the physics disabled flag
            panelData.isDragging = false;  // Also ensure isDragging is false
            console.log(`[collapsePanel] Set physicsDisabled=false and isDragging=false for ${collapsedPanelId}`);
        }
        
        isExpanded = false;
        isCollapsing = false;  // Clear the collapsing flag
        currentExpandedPanel = null;
        console.log('[collapsePanel] Collapse complete - all flags cleared');
    }, 800); // Match animation duration
}

function fadeOutElements() {
    // Fade out title, subtitle, and other panels
    document.getElementById('siteTitle').classList.add('hidden');
    document.getElementById('siteSubtitle').classList.add('hidden');
    
    document.querySelectorAll('.nav-panel').forEach(panel => {
        if (panel.id !== currentExpandedPanel) {
            panel.classList.add('hidden');
        }
    });
}

function fadeInElements() {
    // Fade in title, subtitle, and all panels
    document.getElementById('siteTitle').classList.remove('hidden');
    document.getElementById('siteSubtitle').classList.remove('hidden');
    
    console.log('[fadeInElements] Starting to restore panels');
    document.querySelectorAll('.nav-panel').forEach(panel => {
        // Clear any inline opacity and pointer-events styles
        panel.style.opacity = '';
        panel.style.pointerEvents = '';  // Clear inline pointer-events to restore CSS defaults
        panel.classList.remove('hidden');
        
        // Also ensure the panel isn't stuck in a dragging state
        const panelData = panelPhysics.panels.get(panel.id);
        if (panelData) {
            // Don't modify isDragging here as it might be legitimately set by mouse interaction
            console.log(`[fadeInElements] Panel ${panel.id} - hidden removed, pointer-events cleared`);
        }
    });
}

function loadContent(contentType, container) {
    switch(contentType) {
        case 'leadership':
            container.innerHTML = getLeadershipContent();
            break;
        case 'research':
            container.innerHTML = getResearchContent();
            break;
        case 'workshops':
            container.innerHTML = getWorkshopsContent();
            break;
        case 'community':
            container.innerHTML = getCommunityContent();
            break;
        case 'join':
            container.innerHTML = getJoinContent();
            break;
        default:
            container.innerHTML = '<p>Content coming soon...</p>';
    }
}

function getLeadershipContent() {
    return `
        <h1 class="expanded-title">NSCC Leadership</h1>
        
        <div class="leader-section">
            <div class="leader-image leader-image-left">
                <span><img loading="lazy" src="wk.jpg" alt="William Keffer"></span>
            </div>
            <div class="leader-info leader-info-left">
                <div class="leader-role">Co-President</div>
                <div class="leader-name">William Keffer</div>
                <div class="leader-description">
                    William Keffer is a UNC-Chapel Hill student and the driving force behind the Natural Sciences Computing Club (NSCC), where he bridges natural sciences with modern computing through hands-on workshops, project sprints, and mentorship. He focuses on practical Python and Jupyter workflows, data visualization, and approachable machine learningÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âhelping members turn curiosity into portfolio-ready projects that mix biology, physics, and earth science with code. With a sharp eye for design and user experience, William also shapes NSCC's brand and web presence, championing creative, high-quality visuals alongside clean, reproducible pipelines. Above all, he's building an inclusive, collaborative community that celebrates both scientific rigor and inventive, real-world problem-solving.
                </div>
            </div>
        </div>
        
        <div class="leader-section">
            <div class="leader-info leader-info-right">
                <div class="leader-role">Co-President</div>
                <div class="leader-name">Osman Taka</div>
                <div class="leader-description">
                    Osman Taka is a Computer Science and Physics double major at UNC Chapel Hill with a passion for using computational tools to tackle challenges in the natural sciences. He's drawn to projects that merge programming with scientific researchÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âwhether that's modeling complex systems or developing tools that make discovery more accessible. With experience leading robotics, math, and engineering initiatives, Osman values collaboration and creative problem-solving. Through the Natural Sciences Computing Club, he hopes to build a community where students from different disciplines can explore the intersection of computation and science, and work together on projects that make a real impact.
                </div>
            </div>
            <div class="leader-image leader-image-right">
                <span><img loading="lazy" src="ot.jpg" alt="Osman Taka"></span>
            </div>
        </div>
        
        <div class="leader-section">
            <div class="leader-image leader-image-left">
                <span><img loading="lazy" src="JC_photo.jpg" alt="John Christopher"></span>
            </div>
            <div class="leader-info leader-info-left">
                <div class="leader-role">Treasurer</div>
                <div class="leader-name">John Christopher</div>
                <div class="leader-description">
                    John Christopher is a sophomore pursuing a BS in mathematics. His research includes cellular automata, random network theory, nonlinear dynamics, and spectral geometry. His primary interests now are mathematical physics and the intersection of algebraic and differential geometry. He loves talking about all things related to these fields. In his free time John enjoys hiking, rock climbing, and drinking tea. At NSCC John uses mathematical tools to help construct computational models for systems of interest in the natural sciences. 
                </div>
            </div>
        </div>
        
        <div class="bottom-link">
            <a href="#" onclick="return false;">2025-26 Officer Positions</a>
        </div>
    `;
}

function getResearchContent() {
    return `
        <h1 class="expanded-title">Research Projects</h1>
        <p style="text-align: center; margin-bottom: 40px; color: var(--text-light);">
            Cutting-edge computational research across natural sciences
        </p>
        <div class="bottom-link">
            <a href="#" onclick="return false;">Join a Research Team</a>
        </div>
    `;
}

function getWorkshopsContent() {
    return `
        <h1 class="expanded-title">Workshops & Training</h1>
        <p style="text-align: center; margin-bottom: 40px; color: var(--text-light);">
            Weekly sessions on computational tools and techniques
        </p>
        <div class="bottom-link">
            <a href="#" onclick="return false;">View Schedule</a>
        </div>
    `;
}

function getCommunityContent() {
    return `
        <h1 class="expanded-title">Our Community</h1>
        <p style="text-align: center; margin-bottom: 40px; color: var(--text-light);">
            Connect with students passionate about computational science
        </p>
        <div class="bottom-link">
            <a href="#" onclick="return false;">Join Discord</a>
        </div>
    `;
}

function getJoinContent() {
    return `
        <h1 class="expanded-title">Join NSCC</h1>
        <p style="text-align: center; margin-bottom: 40px; color: var(--text-light);">
            Open to all UNC students - no experience required!
        </p>
        <div class="bottom-link">
            <a href="#" onclick="return false;">Apply Now</a>
        </div>
    `;
}

// Debug function to reset all panel states - can be called from console
window.resetPanelStates = function() {
    console.log('[DEBUG] Resetting all panel states...');
    
    // Reset global flags
    isExpanded = false;
    isCollapsing = false;
    currentExpandedPanel = null;
    
    // Reset physics states
    if (panelPhysics && panelPhysics.panels) {
        panelPhysics.draggedPanel = null;
        panelPhysics.panels.forEach((panelData, panelId) => {
            panelData.isDragging = false;
            panelData.physicsDisabled = false;
            console.log(`[DEBUG] Reset ${panelId}: isDragging=false, physicsDisabled=false`);
        });
    }
    
    // Reset all panel visuals
    document.querySelectorAll('.nav-panel').forEach(panel => {
        panel.style.pointerEvents = '';
        panel.style.opacity = '';
        panel.style.boxShadow = '';
        panel.classList.remove('hidden');
        panel.classList.remove('dragging');
        console.log(`[DEBUG] Reset visual state for ${panel.id}`);
    });
    
    // Hide expanded overlay
    const expandedOverlay = document.getElementById('expandedOverlay');
    const expandedContainer = document.getElementById('expandedContainer');
    if (expandedOverlay) {
        expandedOverlay.classList.remove('active');
        expandedOverlay.style.pointerEvents = 'none';
    }
    if (expandedContainer) {
        expandedContainer.classList.remove('morphing', 'expanded');
        expandedContainer.style.opacity = '0';
        expandedContainer.style.pointerEvents = 'none';
        expandedContainer.style.left = '-9999px';
        expandedContainer.style.top = '-9999px';
    }
    
    console.log('[DEBUG] All panel states reset complete');
};

// Initialize on load with optimized DOM ready check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createNeuralNetwork();
        checkThreeJS();
    });
} else {
    // DOM is already loaded
    createNeuralNetwork();
    checkThreeJS();
}

console.log('%cÃƒÂ¢Ã…â€œÃ‚Â¦ GOLDEN RATIO CYBERCORE INITIALIZED', 
    'color: #7ec8e3; font-size: 24px; font-weight: 100; text-shadow: 0 0 20px rgba(126,200,227,0.8);');
console.log(`%cÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ÃƒÂÃ¢â‚¬Â  = ${PHI.toFixed(3)}`, 'color: #a8d5e8; font-size: 12px;');
console.log(`%cÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Fibonacci: ${FIBONACCI.slice(0, 8).join(', ')}...`, 'color: #a8d5e8; font-size: 12px;');

// Console helpers for theme debugging
window.themeDebug = {
    checkSystemPreference: function() {
        if (window.matchMedia) {
            const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
            const lightMode = window.matchMedia('(prefers-color-scheme: light)');
            console.log('%c=== System Theme Preference ===', 'color: #7ec8e3; font-weight: bold;');
            console.log(`Dark mode: ${darkMode.matches}`);
            console.log(`Light mode: ${lightMode.matches}`);
            console.log(`No preference: ${!darkMode.matches && !lightMode.matches}`);
            return darkMode.matches ? 'dark' : (lightMode.matches ? 'light' : 'no-preference');
        } else {
            console.log('%cSystem preference detection not supported', 'color: #ff6b6b;');
            return 'not-supported';
        }
    },
    
    resetToSystemDefault: function() {
        ThemeManager.clearPreferences();
        location.reload();
    },
    
    showCurrentState: function() {
        console.log('%c=== Current Theme State ===', 'color: #7ec8e3; font-weight: bold;');
        console.log(`Current theme: ${ThemeManager.getCurrentTheme()}`);
        console.log(`Has visited: ${localStorage.getItem('nscc-has-visited')}`);
        console.log(`Saved theme: ${localStorage.getItem('nscc-theme')}`);
        console.log(`Manually set: ${localStorage.getItem('nscc-theme-manually-set')}`);
        console.log(`System preference: ${this.checkSystemPreference()}`);
    }
};

console.log('%cTip: Use themeDebug.showCurrentState() to see theme info', 'color: #a8d5e8; font-style: italic;');
console.log('%cTip: Use themeDebug.resetToSystemDefault() to test first-time visit', 'color: #a8d5e8; font-style: italic;');
