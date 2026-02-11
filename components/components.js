/**
 * Shared Components Loader
 * Handles loading navbar and other shared components across pages
 */

// ============================================
// Component Loader
// ============================================
async function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        const html = await response.text();
        element.innerHTML = html;
        return true;
    } catch (error) {
        console.error('Error loading component:', error);
        return false;
    }
}

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

    const themeValue = document.getElementById('themeValue');
    if (themeValue) {
        themeValue.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }

    const themeToggle = document.getElementById('themeToggle');
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

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ============================================
// Navigation State
// ============================================
function setActiveNavButton() {
    // Get current page name from URL
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Map page names to section names
    const pageToSection = {
        'design.html': 'design',
        'code.html': 'code',
        'motion.html': 'motion',
        'about.html': 'about'
    };

    const activeSection = pageToSection[currentPage];

    // Set active class on the correct nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === activeSection) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// Homepage Navigation (Open Windows Instead)
// ============================================
function setupHomepageNavigation() {
    // Check if we're on the homepage
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isHomepage = currentPage === 'index.html' || currentPage === '';

    if (!isHomepage) return;

    // Check if openSection function exists (from script.js)
    if (typeof openSection !== 'function') return;

    // Intercept nav button clicks to open windows instead of navigating
    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.dataset.section;
            if (section) {
                openSection(section);
                // Update active state on navbar
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
}

// ============================================
// External Links Configuration
// ============================================
function setupExternalLinks() {
    const RESUME_URL = '#'; // Replace with your resume URL
    const LINKEDIN_URL = 'https://linkedin.com/in/yourprofile'; // Replace with your LinkedIn URL

    const resumeBtn = document.getElementById('resumeBtn');
    const linkedinBtn = document.getElementById('linkedinBtn');

    if (resumeBtn) resumeBtn.href = RESUME_URL;
    if (linkedinBtn) linkedinBtn.href = LINKEDIN_URL;
}

// ============================================
// Initialize Navbar
// ============================================
async function initNavbar() {
    // Determine the correct path to components folder
    const isInRoot = !window.location.pathname.includes('/pages/');
    const componentPath = isInRoot ? 'components/navbar.html' : '../components/navbar.html';

    // Load navbar component
    const loaded = await loadComponent('navbar-container', componentPath);

    if (loaded) {
        // Initialize theme (needs to run after navbar is loaded)
        initTheme();

        // Setup external links
        setupExternalLinks();

        // Set active nav button based on current page
        setActiveNavButton();

        // Setup homepage navigation (open windows instead of pages)
        setupHomepageNavigation();

        // Setup theme toggle click handler
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }
}

// ============================================
// Initialize on DOM Ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

// Handle visibility change to sync theme across tabs
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (savedTheme !== currentTheme) {
                setTheme(savedTheme);
            }
        }
    }
});

// Export for use in other scripts
window.ComponentLoader = {
    setTheme,
    toggleTheme,
    initTheme
};
