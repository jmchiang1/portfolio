/**
 * Portfolio Pages JavaScript
 * Handles page-specific functionality (project cards, etc.)
 * Note: Theme and navbar are handled by components/components.js
 */

// ============================================
// Project Card Click Handler
// ============================================
function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const projectId = card.dataset.project;

            // iOS-like press animation
            card.style.transform = 'scale(0.98)';
            card.style.transition = 'transform 100ms ease';

            setTimeout(() => {
                card.style.transform = '';

                // Navigate to project case study
                console.log(`Opening project ${projectId} case study`);
                // window.location.href = `projects/project-${projectId}.html`;
            }, 150);
        });
    });
}

// ============================================
// Initialize
// ============================================
function init() {
    setupProjectCards();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
