/**
 * Typing Test Game
 * A monkeytype-inspired typing test with 3D keyboard visualization
 */

// ============================================
// Word Lists
// ============================================
const commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'was', 'are', 'been', 'has', 'had', 'did', 'does', 'being', 'were',
    'very', 'when', 'where', 'while', 'world', 'still', 'great', 'much', 'should', 'need',
    'system', 'program', 'long', 'little', 'state', 'own', 'part', 'made', 'find', 'here',
    'many', 'through', 'right', 'down', 'found', 'such', 'both', 'between', 'never', 'under',
    'same', 'another', 'while', 'last', 'might', 'great', 'before', 'must', 'through', 'life',
    'where', 'those', 'school', 'high', 'every', 'number', 'always', 'away', 'small', 'home',
    'hand', 'each', 'place', 'old', 'turn', 'keep', 'point', 'large', 'group', 'problem'
];

const punctuationMarks = ['.', ',', '!', '?', ';', ':', "'", '"'];
const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ============================================
// Game State
// ============================================
let gameState = {
    mode: 'time', // 'time' or 'words'
    duration: 60,
    includePunctuation: false,
    includeNumbers: false,
    words: [],
    currentWordIndex: 0,
    currentLetterIndex: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalTyped: 0,
    started: false,
    finished: false,
    startTime: null,
    timerInterval: null,
    timeLeft: 60
};

// ============================================
// DOM Elements
// ============================================
const wordsContainer = document.getElementById('words');
const typingInput = document.getElementById('typingInput');
const timerDisplay = document.getElementById('timer');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const restartBtn = document.getElementById('restartBtn');
const resultsModal = document.getElementById('resultsModal');
const resultsRestartBtn = document.getElementById('resultsRestartBtn');
const keyboard = document.getElementById('keyboard');

// Results elements
const resultWpm = document.getElementById('resultWpm');
const resultAccuracy = document.getElementById('resultAccuracy');
const resultRaw = document.getElementById('resultRaw');
const resultChars = document.getElementById('resultChars');
const resultTime = document.getElementById('resultTime');

// Mode buttons
const modeButtons = document.querySelectorAll('.mode-btn');
const durationButtons = document.querySelectorAll('.duration-btn');

// ============================================
// Word Generation
// ============================================
function generateWords(count) {
    const words = [];
    for (let i = 0; i < count; i++) {
        let word = commonWords[Math.floor(Math.random() * commonWords.length)];

        // Add numbers
        if (gameState.includeNumbers && Math.random() < 0.15) {
            const num = numbers[Math.floor(Math.random() * numbers.length)];
            word = Math.random() < 0.5 ? num + word : word + num;
        }

        // Add punctuation
        if (gameState.includePunctuation && Math.random() < 0.2) {
            const punct = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
            word = word + punct;
        }

        words.push(word);
    }
    return words;
}

// ============================================
// Display Functions
// ============================================
function displayWords() {
    wordsContainer.innerHTML = '';

    gameState.words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        if (wordIndex === gameState.currentWordIndex) {
            wordSpan.classList.add('current');
        }

        word.split('').forEach((letter, letterIndex) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = letter;
            wordSpan.appendChild(letterSpan);
        });

        wordsContainer.appendChild(wordSpan);
    });

    updateCaret();
    scrollToCurrentWord();
}

function scrollToCurrentWord() {
    const currentWord = wordsContainer.querySelector('.word.current');
    if (!currentWord) return;

    const containerRect = wordsContainer.getBoundingClientRect();
    const wordRect = currentWord.getBoundingClientRect();

    // Get line height
    const lineHeight = parseFloat(getComputedStyle(wordsContainer).lineHeight);

    // Calculate which line the current word is on relative to the container
    const relativeTop = wordRect.top - containerRect.top + wordsContainer.scrollTop;
    const currentLine = Math.floor(relativeTop / lineHeight);

    // Keep the current word on the first line when it goes past line 1
    if (currentLine > 0) {
        const scrollTarget = currentLine * lineHeight;
        wordsContainer.scrollTop = scrollTarget;
    }
}

function updateCaret() {
    // Remove existing caret
    const existingCaret = document.querySelector('.caret');
    if (existingCaret) existingCaret.remove();

    // Add caret at current position
    const currentWord = wordsContainer.children[gameState.currentWordIndex];
    if (!currentWord) return;

    const caret = document.createElement('span');
    caret.className = 'caret';

    if (gameState.currentLetterIndex < currentWord.children.length) {
        currentWord.insertBefore(caret, currentWord.children[gameState.currentLetterIndex]);
    } else {
        currentWord.appendChild(caret);
    }
}

function updateWordDisplay() {
    const wordElements = wordsContainer.querySelectorAll('.word');

    wordElements.forEach((wordEl, wordIndex) => {
        wordEl.classList.remove('current');
        if (wordIndex === gameState.currentWordIndex) {
            wordEl.classList.add('current');
        }
    });

    // Update current word's letters
    const currentWordEl = wordElements[gameState.currentWordIndex];
    if (!currentWordEl) return;

    const typedValue = typingInput.value;
    const currentWord = gameState.words[gameState.currentWordIndex];

    // Reset all letters
    Array.from(currentWordEl.querySelectorAll('.letter')).forEach((letterEl, i) => {
        letterEl.classList.remove('correct', 'incorrect', 'extra');

        if (i < typedValue.length) {
            if (typedValue[i] === currentWord[i]) {
                letterEl.classList.add('correct');
            } else {
                letterEl.classList.add('incorrect');
            }
        }
    });

    // Handle extra characters
    const existingExtra = currentWordEl.querySelectorAll('.extra');
    existingExtra.forEach(el => el.remove());

    if (typedValue.length > currentWord.length) {
        const extra = typedValue.slice(currentWord.length);
        extra.split('').forEach(char => {
            const extraSpan = document.createElement('span');
            extraSpan.className = 'letter extra';
            extraSpan.textContent = char;
            currentWordEl.appendChild(extraSpan);
        });
    }

    updateCaret();
}

// ============================================
// Stats Calculation
// ============================================
function calculateWPM() {
    if (!gameState.startTime) return 0;

    const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60; // in minutes
    if (timeElapsed === 0) return 0;

    // Standard WPM calculation: (characters / 5) / minutes
    const wpm = Math.round((gameState.correctChars / 5) / timeElapsed);
    return Math.max(0, wpm);
}

function calculateRawWPM() {
    if (!gameState.startTime) return 0;

    const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60;
    if (timeElapsed === 0) return 0;

    const rawWpm = Math.round((gameState.totalTyped / 5) / timeElapsed);
    return Math.max(0, rawWpm);
}

function calculateAccuracy() {
    if (gameState.totalTyped === 0) return 100;
    return Math.round((gameState.correctChars / gameState.totalTyped) * 100);
}

function updateStats() {
    wpmDisplay.textContent = calculateWPM();
    accuracyDisplay.textContent = calculateAccuracy();
}

// ============================================
// Timer Functions
// ============================================
function startTimer() {
    gameState.timeLeft = gameState.duration;
    timerDisplay.textContent = gameState.timeLeft;

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timerDisplay.textContent = gameState.timeLeft;

        updateStats();

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// ============================================
// Game Control
// ============================================
function startGame() {
    if (gameState.started) return;

    gameState.started = true;
    gameState.startTime = Date.now();

    if (gameState.mode === 'time') {
        startTimer();
    }
}

function endGame() {
    gameState.finished = true;
    stopTimer();

    // Show results
    const finalWpm = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    const finalRaw = calculateRawWPM();
    const timeSpent = gameState.mode === 'time'
        ? gameState.duration
        : Math.round((Date.now() - gameState.startTime) / 1000);

    resultWpm.textContent = finalWpm;
    resultAccuracy.textContent = finalAccuracy;
    resultRaw.textContent = finalRaw;
    resultChars.textContent = `${gameState.correctChars}/${gameState.incorrectChars}`;
    resultTime.textContent = timeSpent;

    resultsModal.classList.add('show');
}

function resetGame() {
    stopTimer();

    gameState = {
        ...gameState,
        words: generateWords(gameState.mode === 'time' ? 200 : gameState.duration),
        currentWordIndex: 0,
        currentLetterIndex: 0,
        correctChars: 0,
        incorrectChars: 0,
        totalTyped: 0,
        started: false,
        finished: false,
        startTime: null,
        timeLeft: gameState.duration
    };

    typingInput.value = '';
    timerDisplay.textContent = gameState.mode === 'time' ? gameState.duration : '--';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100';

    resultsModal.classList.remove('show');
    displayWords();
    typingInput.focus();
}

// ============================================
// Input Handling
// ============================================
function handleInput(e) {
    if (gameState.finished) return;

    // Start game on first input
    if (!gameState.started) {
        startGame();
    }

    const typedValue = typingInput.value;
    const currentWord = gameState.words[gameState.currentWordIndex];

    // Update letter index
    gameState.currentLetterIndex = typedValue.length;

    updateWordDisplay();
}

function handleKeyDown(e) {
    if (gameState.finished && e.key !== 'Tab') return;

    // Handle Tab + Enter for restart
    if (e.key === 'Tab') {
        e.preventDefault();
        typingInput.focus();
        return;
    }

    // Space to go to next word
    if (e.key === ' ') {
        e.preventDefault();

        const typedValue = typingInput.value.trim();
        const currentWord = gameState.words[gameState.currentWordIndex];

        // Count correct/incorrect characters
        for (let i = 0; i < Math.max(typedValue.length, currentWord.length); i++) {
            gameState.totalTyped++;
            if (typedValue[i] === currentWord[i]) {
                gameState.correctChars++;
            } else {
                gameState.incorrectChars++;
            }
        }

        // Move to next word
        gameState.currentWordIndex++;
        gameState.currentLetterIndex = 0;
        typingInput.value = '';

        // Check if we've completed all words (words mode)
        if (gameState.mode === 'words' && gameState.currentWordIndex >= gameState.words.length) {
            endGame();
            return;
        }

        // Generate more words if needed
        if (gameState.currentWordIndex >= gameState.words.length - 10) {
            gameState.words = gameState.words.concat(generateWords(50));
            displayWords();
        } else {
            updateWordDisplay();
            scrollToCurrentWord();
        }

        updateStats();
        return;
    }

    // Handle backspace
    if (e.key === 'Backspace') {
        // Allow going back to previous word if at start of current word
        if (typingInput.value === '' && gameState.currentWordIndex > 0) {
            e.preventDefault();
            gameState.currentWordIndex--;
            typingInput.value = gameState.words[gameState.currentWordIndex];
            gameState.currentLetterIndex = typingInput.value.length;
            updateWordDisplay();
        }
        return;
    }

    // Visual keyboard feedback
    highlightKey(e.key);
}

// ============================================
// Keyboard Visualization
// ============================================
function highlightKey(key) {
    // Normalize key
    let normalizedKey = key.toLowerCase();
    if (key === ' ') normalizedKey = ' ';

    // Find and highlight the key
    const keyElements = keyboard.querySelectorAll('.key');
    keyElements.forEach(keyEl => {
        const keyData = keyEl.dataset.key;
        if (keyData && (keyData.toLowerCase() === normalizedKey || keyData === key)) {
            keyEl.classList.add('pressed');
            setTimeout(() => {
                keyEl.classList.remove('pressed');
            }, 100);
        }
    });
}

// Also handle keyup for physical keyboard feedback
document.addEventListener('keydown', (e) => {
    if (document.activeElement === typingInput) {
        highlightKey(e.key);
    }
});

// ============================================
// Mode Selection
// ============================================
function setupModeButtons() {
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            const type = btn.dataset.type;

            if (mode) {
                // Toggle mode (punctuation/numbers)
                btn.classList.toggle('active');
                if (mode === 'punctuation') {
                    gameState.includePunctuation = btn.classList.contains('active');
                } else if (mode === 'numbers') {
                    gameState.includeNumbers = btn.classList.contains('active');
                }
            } else if (type) {
                // Switch test type
                modeButtons.forEach(b => {
                    if (b.dataset.type) b.classList.remove('active');
                });
                btn.classList.add('active');
                gameState.mode = type;

                // Update duration buttons visibility
                const durationGroup = document.querySelector('.duration-group');
                if (type === 'time') {
                    durationGroup.querySelectorAll('.duration-btn').forEach(b => {
                        b.textContent = b.dataset.duration;
                    });
                } else {
                    durationGroup.querySelectorAll('.duration-btn').forEach(b => {
                        b.textContent = b.dataset.duration;
                    });
                }
            }

            resetGame();
        });
    });

    durationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            durationButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.duration = parseInt(btn.dataset.duration);
            resetGame();
        });
    });
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    typingInput.addEventListener('input', handleInput);
    typingInput.addEventListener('keydown', handleKeyDown);

    restartBtn.addEventListener('click', resetGame);
    resultsRestartBtn.addEventListener('click', resetGame);

    // Focus input when clicking on text display
    document.querySelector('.text-display').addEventListener('click', () => {
        typingInput.focus();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Tab to restart
        if (e.key === 'Tab' && !e.shiftKey) {
            // Already handled above
        }

        // Escape to close results
        if (e.key === 'Escape') {
            resultsModal.classList.remove('show');
            resetGame();
        }
    });
}

// ============================================
// Initialize
// ============================================
function init() {
    setupModeButtons();
    setupEventListeners();
    resetGame();
}

// Run initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
