/**
 * Portfolio Website JavaScript
 * Handles desktop interactions, macOS-style windows, and section navigation
 */

// ============================================
// DOM Elements
// ============================================
const themeToggle = document.getElementById('themeToggle');
const themeValue = document.getElementById('themeValue');
const menubarTime = document.getElementById('menubarTime');
const menuAppName = document.getElementById('menuAppName');
const resumeBtn = document.getElementById('resumeBtn');
const linkedinBtn = document.getElementById('linkedinBtn');
const desktopView = document.getElementById('desktopView');

// ============================================
// State
// ============================================
let currentSection = null; // null = desktop view

// ============================================
// App Names for Menu Bar
// ============================================
const appNames = {
    design: 'Design',
    code: 'Code',
    motion: 'Motion',
    about: 'About'
};

// ============================================
// Theme Management
// ============================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        setTheme(savedTheme);
    } else if (systemPrefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeValue) {
        themeValue.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }

    if (themeToggle) {
        themeToggle.style.transform = 'scale(0.95)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 100);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ============================================
// macOS Menu Bar Clock
// ============================================
function updateMenubarTime() {
    if (!menubarTime) return;

    const now = new Date();
    const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    menubarTime.textContent = now.toLocaleTimeString('en-US', options);
}

function startClock() {
    updateMenubarTime();
    setInterval(updateMenubarTime, 60000);
}

// ============================================
// Section/Window Management
// ============================================
function openSection(sectionName) {
    // Hide desktop view
    if (desktopView) {
        desktopView.classList.remove('active');
    }

    // Hide all windows
    document.querySelectorAll('.macos-window').forEach(win => {
        win.classList.remove('active');
    });

    // Show target window
    const targetWindow = document.querySelector(`.macos-window[data-section="${sectionName}"]`);
    if (targetWindow) {
        targetWindow.classList.add('active');
        currentSection = sectionName;

        // Update menu bar app name
        if (menuAppName) {
            menuAppName.textContent = appNames[sectionName] || 'Finder';
        }

        // Update dock and navbar active states
        updateDockActiveState(sectionName);
        updateNavbarActiveState(sectionName);
    }
}

function closeSection() {
    // Hide all windows
    document.querySelectorAll('.macos-window').forEach(win => {
        win.classList.remove('active');
    });

    // Show desktop view
    if (desktopView) {
        desktopView.classList.add('active');
    }

    currentSection = null;

    // Reset menu bar app name
    if (menuAppName) {
        menuAppName.textContent = 'Finder';
    }

    // Clear dock and navbar active states
    updateDockActiveState(null);
    updateNavbarActiveState(null);
}

function updateDockActiveState(sectionName) {
    document.querySelectorAll('.dock-item[data-section]').forEach(item => {
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function updateNavbarActiveState(sectionName) {
    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        if (btn.dataset.section === sectionName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ============================================
// Desktop Folder Interactions
// ============================================
function setupDesktopFolders() {
    const folders = document.querySelectorAll('.desktop-folder');

    folders.forEach(folder => {
        folder.addEventListener('click', () => {
            const section = folder.dataset.section;
            if (section) {
                // Press animation
                folder.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    folder.style.transform = '';
                    openSection(section);
                }, 100);
            }
        });

        // Selection highlight
        folder.addEventListener('mousedown', () => {
            folder.style.background = 'rgba(59, 130, 246, 0.3)';
        });

        folder.addEventListener('mouseup', () => {
            folder.style.background = '';
        });

        folder.addEventListener('mouseleave', () => {
            folder.style.background = '';
        });
    });
}

// ============================================
// Window Controls (Close button)
// ============================================
function setupWindowControls() {
    document.querySelectorAll('.window-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeSection();
        });
    });
}


// ============================================
// Dock Interactions
// ============================================
function setupDock() {
    const dockItems = document.querySelectorAll('.dock-item[data-section]');

    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            if (section) {
                openSection(section);
            }
        });
    });
}

// ============================================
// Sticky Notes
// ============================================
function setupStickyNotes() {
    const notes = document.querySelectorAll('.sticky-note');

    notes.forEach(note => {
        note.addEventListener('mouseenter', () => {
            note.style.zIndex = '10';
        });

        note.addEventListener('mouseleave', () => {
            note.style.zIndex = '';
        });
    });
}

// ============================================
// Project Card Interactions
// ============================================
function setupProjectCards() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.project;

            // Press animation
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
                // Navigate to project page or open modal
                console.log(`Opening project ${projectId}`);
            }, 150);
        });
    });
}

// ============================================
// Keyboard Navigation
// ============================================
function setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        // Escape to close window and return to desktop
        if (e.key === 'Escape' && currentSection !== null) {
            closeSection();
        }
    });
}

// ============================================
// External Links Configuration
// ============================================
function setupExternalLinks() {
    const RESUME_URL = '#';
    const LINKEDIN_URL = 'https://linkedin.com/in/yourprofile';

    if (resumeBtn) resumeBtn.href = RESUME_URL;
    if (linkedinBtn) linkedinBtn.href = LINKEDIN_URL;
}

// ============================================
// Initialize
// ============================================
function init() {
    // Initialize theme
    initTheme();

    // Setup external links
    setupExternalLinks();

    // Theme toggle event
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Start menu bar clock
    startClock();

    // Setup interactions
    setupDesktopFolders();
    setupWindowControls();
    setupDock();
    setupStickyNotes();
    setupProjectCards();
    setupKeyboardNav();

    // Ensure desktop view is visible initially
    if (desktopView) {
        desktopView.classList.add('active');
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// Export for potential module usage
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setTheme,
        toggleTheme,
        openSection,
        closeSection
    };
}
