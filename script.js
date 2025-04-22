// Quiz state
let quizData = [];
let currentWeek = 0;
let score = 0;
let totalWeeks = 0;
let userAnswers = [];
const visibleWeekButtons = 10; // Number of week buttons to display at once
let startWeekIndex = 0; // Starting index for visible week buttons

// DOM Elements
const weekNavigation = document.getElementById('weekNavigation');
const weekDropdown = document.getElementById('weekDropdown');
const weekInfo = document.getElementById('weekInfo');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const dropdownBtn = document.getElementById('weekDropdownBtn');
const checkbox = document.getElementById('checkbox');
const nextWeekAfterResultsBtn = document.getElementById('nextWeekAfterResultsBtn');

// Theme toggle handler
checkbox.addEventListener('change', function() {
    if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        checkbox.checked = true;
    }
}

// Toggle dropdown menu
dropdownBtn.addEventListener('click', function() {
    weekDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    if (!event.target.matches('.dropdown-btn') && !event.target.matches('.fa-caret-down')) {
        if (weekDropdown.classList.contains('show')) {
            weekDropdown.classList.remove('show');
        }
    }
});

// Load quiz data
function loadQuizData() {
    const week0Questions = 5;
    const regularWeekQuestions = 10;
    const totalWeeksNeeded = 25;

    let extendedData = [...jsonData];

    // Calculate total number of questions needed
    const totalQuestions = week0Questions + (totalWeeksNeeded - 1) * regularWeekQuestions;

    // Extend data if not enough
    while (extendedData.length < totalQuestions) {
        extendedData = extendedData.concat(jsonData);
    }

    extendedData = extendedData.slice(0, totalQuestions);

    // Split into weeks: first 5 questions for week 0, then 10 for each week
    const weekData = [];
    weekData.push(extendedData.slice(0, week0Questions)); // Week 0

    for (let i = week0Questions; i < totalQuestions; i += regularWeekQuestions) {
        weekData.push(extendedData.slice(i, i + regularWeekQuestions));
    }

    quizData = weekData;
    totalWeeks = weekData.length;

    // Initialize user answers array with empty values
    userAnswers = Array(quizData.length).fill().map((week, index) => Array(quizData[index].length).fill(null));

    generateWeekNavigation();
    populateWeekDropdown();
    setActiveWeek(0);
    updateWeekInfo();
}

// Generate week navigation buttons
function generateWeekNavigation() {
    weekNavigation.innerHTML = '';
    
    // Only show a subset of week buttons
    const end = Math.min(startWeekIndex + visibleWeekButtons, totalWeeks);
    
    for (let i = startWeekIndex; i < end; i++) {
        const weekBtn = document.createElement('button');
        weekBtn.classList.add('week-btn');
        weekBtn.textContent = i + 1;
        weekBtn.dataset.week = i;
        weekBtn.addEventListener('click', () => {
            setActiveWeek(parseInt(weekBtn.dataset.week));
        });
        weekNavigation.appendChild(weekBtn);
    }
    
    // Update active button
    updateActiveWeekButton();
}

// Populate week dropdown
function populateWeekDropdown() {
    weekDropdown.innerHTML = '';
    
    for (let i = 0; i < totalWeeks; i++) {
        const weekOption = document.createElement('button');
        weekOption.textContent = `Week ${i + 1}`;
        weekOption.dataset.week = i;
        weekOption.addEventListener('click', () => {
            setActiveWeek(parseInt(weekOption.dataset.week));
            weekDropdown.classList.remove('show');
        });
        weekDropdown.appendChild(weekOption);
    }
}

// Update active week button
function updateActiveWeekButton() {
    const weekBtns = document.querySelectorAll('.week-btn');
    weekBtns.forEach((btn) => {
        if (parseInt(btn.dataset.week) === currentWeek) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Update week info display
function updateWeekInfo() {
    weekInfo.textContent = `Week ${currentWeek + 1} of ${totalWeeks}`;
    dropdownBtn.textContent = `Week ${currentWeek + 1} `;
    
    // Add caret icon
    const caretIcon = document.createElement('i');
    caretIcon.className = 'fas fa-caret-down';
    dropdownBtn.appendChild(caretIcon);
    
    // Update previous/next week buttons
    prevWeekBtn.disabled = currentWeek === 0;
    nextWeekBtn.disabled = currentWeek === totalWeeks - 1;
    
    // Update next week after results button visibility
    if (document.getElementById('resultsContainer').style.display !== 'none') {
        nextWeekAfterResultsBtn.style.display = currentWeek === totalWeeks - 1 ? 'none' : 'flex';
    }
}

// Set active week
function setActiveWeek(weekIndex) {
    // Update navigation buttons visibility
    if (weekIndex < startWeekIndex || weekIndex >= startWeekIndex + visibleWeekButtons) {
        startWeekIndex = Math.max(0, Math.min(totalWeeks - visibleWeekButtons, weekIndex - Math.floor(visibleWeekButtons / 2)));
        generateWeekNavigation();
    }
    
    currentWeek = weekIndex;
    score = calculateWeekScore(weekIndex);

    // Update UI
    updateActiveWeekButton();
    updateWeekInfo();

    // Show quiz container, hide results
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('resultsContainer').style.display = 'none';

    // Load all questions for this week
    loadAllQuestions();
    updateScore();
}

// Navigate to previous week
function prevWeek() {
    if (currentWeek > 0) {
        setActiveWeek(currentWeek - 1);
    }
}

// Navigate to next week
function nextWeek() {
    if (currentWeek < totalWeeks - 1) {
        setActiveWeek(currentWeek + 1);
    }
}

// Calculate score for a specific week
function calculateWeekScore(weekIndex) {
    let weekScore = 0;
    const weekQuestions = quizData[weekIndex] || [];
    
    for (let i = 0; i < weekQuestions.length; i++) {
        const userAnswer = userAnswers[weekIndex][i];
        if (userAnswer !== null && userAnswer === weekQuestions[i].answer) {
            weekScore++;
        }
    }
    
    return weekScore;
}

// Load all questions for the current week
function loadAllQuestions() {
    const questionsContainer = document.getElementById('quizContainer');
    questionsContainer.innerHTML = ''; // Clear previous questions
    
    // Check if we have questions for this week
    if (!quizData[currentWeek] || quizData[currentWeek].length === 0) {
        showResults();
        return;
    }
    
    const weekQuestions = quizData[currentWeek];
    const totalQuestionsInWeek = weekQuestions.length;
    
    // Create a container for all questions
    const allQuestionsContainer = document.createElement('div');
    allQuestionsContainer.className = 'all-questions-container';
    
    // Create each question card
    weekQuestions.forEach((currentQ, questionIndex) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'quiz-card';
        
        // Create question number and text
        const questionNumber = document.createElement('div');
        questionNumber.className = 'question-number';
        questionNumber.textContent = `Question ${questionIndex + 1} of ${totalQuestionsInWeek}`;
        
        const questionText = document.createElement('div');
        questionText.className = 'question';
        questionText.textContent = currentQ.question;
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options';
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        feedback.id = `feedback-${questionIndex}`;
        
        // Create option elements
        const optionLetters = ['A', 'B', 'C', 'D'];
        currentQ.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.dataset.option = option;
            optionElement.dataset.questionIndex = questionIndex;
            
            // Check if this option was previously selected
            const userAnswer = userAnswers[currentWeek][questionIndex];
            if (userAnswer === option) {
                optionElement.classList.add('selected');
                
                // If answered, show correct/incorrect
                if (option === currentQ.answer) {
                    optionElement.classList.add('correct');
                    feedback.textContent = 'Correct! Well done!';
                    feedback.className = 'feedback correct-feedback show';
                } else {
                    optionElement.classList.add('incorrect');
                    feedback.textContent = 'Incorrect! Try again next time.';
                    feedback.className = 'feedback incorrect-feedback show';
                }
            }
            
            // If answered incorrectly, show correct answer
            if (userAnswer !== null && userAnswer !== currentQ.answer && option === currentQ.answer) {
                optionElement.classList.add('correct');
            }
            
            optionElement.innerHTML = `
                <div class="option-indicator">${optionLetters[optionIndex]}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', () => selectOption(option, questionIndex));
            optionsContainer.appendChild(optionElement);
        });
        
        // Assemble question card
        questionCard.appendChild(questionNumber);
        questionCard.appendChild(questionText);
        questionCard.appendChild(optionsContainer);
        questionCard.appendChild(feedback);
        
        // Add to container
        allQuestionsContainer.appendChild(questionCard);
    });
    
    // Add a submit button at the bottom
    const submitButtonContainer = document.createElement('div');
    submitButtonContainer.className = 'controls submit-controls';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'btn submit-btn';
    submitButton.innerHTML = 'Submit Answers <i class="fas fa-check"></i>';
    submitButton.addEventListener('click', showResults);
    
    submitButtonContainer.appendChild(submitButton);
    
    // Add everything to the main container
    questionsContainer.appendChild(allQuestionsContainer);
    questionsContainer.appendChild(submitButtonContainer);
    
    // Update progress for this week
    updateProgressBar();
}

// Select an answer option
function selectOption(selectedOption, questionIndex) {
    // If already answered, do nothing
    if (userAnswers[currentWeek][questionIndex] !== null) return;
    
    const currentQ = quizData[currentWeek][questionIndex];
    const options = document.querySelectorAll(`.option[data-question-index="${questionIndex}"]`);
    const feedback = document.getElementById(`feedback-${questionIndex}`);
    
    // Mark as answered
    userAnswers[currentWeek][questionIndex] = selectedOption;
    
    // Check if correct
    const isCorrect = selectedOption === currentQ.answer;
    
    // Update score if correct
    if (isCorrect) {
        score++;
        updateScore();
    }
    
    // Update UI
    options.forEach(option => {
        const optionValue = option.dataset.option;
        
        if (optionValue === selectedOption) {
            option.classList.add('selected');
            
            if (isCorrect) {
                option.classList.add('correct');
                if (feedback) {
                    feedback.textContent = 'Correct! Well done!';
                    feedback.className = 'feedback correct-feedback show';
                }
            } else {
                option.classList.add('incorrect');
                if (feedback) {
                    feedback.textContent = 'Incorrect! Try again next time.';
                    feedback.className = 'feedback incorrect-feedback show';
                }
            }
        }
        
        // Highlight correct answer if user selected wrong
        if (!isCorrect && optionValue === currentQ.answer) {
            option.classList.add('correct');
        }
    });
    
    // Update progress bar
    updateProgressBar();
}

// Show quiz results
function showResults() {
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    
    const finalScore = document.getElementById('finalScore');
    const resultsMessage = document.getElementById('resultsMessage');
    const weekQuestions = quizData[currentWeek] ? quizData[currentWeek].length : 0;

    finalScore.textContent = `${score} / ${weekQuestions}`;
    resultsMessage.textContent = `You scored ${score} out of ${weekQuestions}.`;

    // Show "Next Week" button only if there's another week
    nextWeekAfterResultsBtn.style.display = currentWeek < totalWeeks - 1 ? 'flex' : 'none';
}

// Restart quiz for current week
document.getElementById('restartBtn').addEventListener('click', () => {
    // Reset user answers for the current week
    userAnswers[currentWeek] = Array(quizData[currentWeek].length).fill(null);
    score = 0;

    // Show quiz and load all questions
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('resultsContainer').style.display = 'none';
    loadAllQuestions();
    updateScore();
});

// Go to next week after results
nextWeekAfterResultsBtn.addEventListener('click', () => {
    nextWeek();
});

// Update score display
function updateScore() {
    const total = quizData[currentWeek] ? quizData[currentWeek].length : 0;
    document.getElementById('scoreDisplay').textContent = `${score} / ${total}`;
}

// Update progress bar
function updateProgressBar() {
    const total = quizData[currentWeek] ? quizData[currentWeek].length : 0;
    let answered = 0;
    
    // Count how many questions have been answered
    for (let i = 0; i < total; i++) {
        if (userAnswers[currentWeek][i] !== null) {
            answered++;
        }
    }
    
    const percentage = (answered / total) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

// Navigation buttons
prevWeekBtn.addEventListener('click', prevWeek);
nextWeekBtn.addEventListener('click', nextWeek);

// Load everything on page load
window.onload = function () {
    if (typeof jsonData === 'undefined') {
        console.error("jsonData not found. Make sure 'data.js' contains the quiz questions.");
    } else {
        loadQuizData();
    }
};