// app.js
document.addEventListener('DOMContentLoaded', async () => {
    const quiz = new Quiz();
    
    // Check if we have a saved state before loading
    const hasSavedState = localStorage.getItem(quiz.storageKey) != null;
    
    await quiz.loadQuestions();

    const questionText = document.getElementById('question-text');
    const choicesContainer = document.getElementById('choices-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const streakText = document.getElementById('streak-text');
    const progressText = document.getElementById('progress-text');
    const masteryText = document.getElementById('mastery-text');
    const sessionSummary = document.getElementById('session-summary');
    const summaryStats = document.getElementById('summary-stats');
    const continueBtn = document.getElementById('continue-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    
    // Show clear data button if we restored from saved state
    if (hasSavedState) {
        clearDataBtn.style.display = 'block';
    }

    function updateProgress() {
        const stats = quiz.getSessionStats();
        if (quiz.isInChallengeMode) {
            progressText.textContent = `Challenge Progress: ${stats.completed}/${stats.total}`;
            masteryText.textContent = `Remaining: ${stats.remaining}`;
        } else {
            progressText.textContent = `Question Progress: ${stats.masteredQuestions}/${stats.totalQuestions}`;
            masteryText.textContent = `Mastered: ${Math.round((stats.masteredQuestions/stats.totalQuestions) * 100)}%`;
        }
    }

    function displayQuestion() {
        if (quiz.isInChallengeMode && quiz.isChallengeCompleted()) {
            showChallengeComplete();
            return;
        }

        const question = quiz.getNextQuestion();
        if (!question) {
            showSessionSummary();
            return;
        }

        questionText.textContent = question.text;
        choicesContainer.innerHTML = '';

        question.shuffledChoices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice;
            button.addEventListener('click', () => handleAnswer(choice));
            choicesContainer.appendChild(button);
        });

        feedbackContainer.style.display = 'none';
        updateProgress();
        
        // Save state when displaying a question
        quiz.saveState();
    }

    function handleAnswer(selectedAnswer) {
        const result = quiz.processAnswer(selectedAnswer);

        feedbackText.textContent = result.isCorrect ? 'Correct!' : 'Incorrect!';
        streakText.textContent = `Current streak: ${result.streak}`;
        feedbackContainer.style.display = 'block';

        const buttons = choicesContainer.getElementsByClassName('choice-btn');
        Array.from(buttons).forEach(button => {
            if (button.textContent === quiz.currentQuestion.correctAnswer) {
                button.classList.add('correct');
            } else if (button.textContent === selectedAnswer && !result.isCorrect) {
                button.classList.add('incorrect');
            }
            button.disabled = true;
        });

        setTimeout(() => {
            displayQuestion();
        }, 5000);
    }

    function showChallengeComplete() {
        sessionSummary.style.display = 'block';
        summaryStats.innerHTML = `
            <h3>Challenge Mode Completed!</h3>
            <p>You have successfully re-mastered all challenging questions.</p>
            <p>Would you like to:</p>
        `;

        continueBtn.style.display = 'none';
        resetBtn.textContent = 'Start New Session';

        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'Exit Challenge Mode';
        exitBtn.addEventListener('click', () => {
            quiz.exitChallengeMode();
            resetBtn.textContent = 'Reset Session';
            showSessionSummary();
        });
        summaryStats.appendChild(exitBtn);
    }

    function showSessionSummary() {
        const stats = quiz.getSessionStats();
        if (!quiz.isInChallengeMode) {
            summaryStats.innerHTML = `
                <p>Total Questions: ${stats.totalQuestions}</p>
                <p>Questions Mastered: ${stats.masteredQuestions}</p>
                <p>Mastery Rate: ${Math.round((stats.masteredQuestions/stats.totalQuestions) * 100)}%</p>
                <p>Challenging Questions: ${stats.challengedQuestions}</p>
            `;

            continueBtn.style.display = stats.challengedQuestions > 0 ? 'inline-block' : 'none';
            continueBtn.textContent = 'Practice Challenging Questions';
        }

        sessionSummary.style.display = 'block';
        questionText.textContent = '';
        choicesContainer.innerHTML = '';
        feedbackContainer.style.display = 'none';
    }

    continueBtn.addEventListener('click', () => {
        quiz.startChallengeMode();
        sessionSummary.style.display = 'none';
        displayQuestion();
    });

    resetBtn.addEventListener('click', () => {
        quiz.resetSession();
        sessionSummary.style.display = 'none';
        displayQuestion();
    });
    
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved progress? This cannot be undone.')) {
            quiz.clearSavedState();
            quiz.resetSession();
            sessionSummary.style.display = 'none';
            clearDataBtn.style.display = 'none';
            displayQuestion();
        }
    });

    displayQuestion();
});
