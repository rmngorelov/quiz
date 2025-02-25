// quiz.js
class Quiz {
    constructor() {
        this.questions = [];
        this.activeQuestions = [];
        this.masteredQuestions = [];
        this.challengedQuestions = [];
        this.currentQuestion = null;
        this.targetStreak = 3;
        this.challengeThreshold = 5;
        this.isInChallengeMode = false;
        this.challengeModeProgress = new Map(); // Maps questionId -> {remastered: boolean, streak: number}
    }

    async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            const data = await response.json();
            this.questions = data.questions.map((q, index) => ({
                ...q,
                id: `question-${index}`, // Add unique ID to each question
                stats: {
                    currentStreak: 0,
                    totalAttempts: 0,
                    attemptsBeforeMastery: 0,
                    correctAttempts: 0,
                    isMastered: false,
                    isChallenger: false
                }
            }));
            this.activeQuestions = [...this.questions];
        } catch (error) {
            console.error('Error loading questions:', error);
            // Alert the user about loading error
            alert('Failed to load questions. Please refresh the page.');
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getNextQuestion() {
        const currentPool = this.isInChallengeMode ?
            this.challengedQuestions : this.activeQuestions;

        if (currentPool.length === 0) {
            return null;
        }

        // Filter out already re-mastered questions in challenge mode
        let availableQuestions = currentPool;
        if (this.isInChallengeMode) {
            availableQuestions = currentPool.filter(question => {
                const progress = this.challengeModeProgress.get(question.id);
                return !progress?.remastered;
            });

            if (availableQuestions.length === 0) {
                return null;
            }
        }

        this.currentQuestion = availableQuestions[
            Math.floor(Math.random() * availableQuestions.length)
        ];
        this.currentQuestion.shuffledChoices = this.shuffleArray([...this.currentQuestion.choices]);
        return this.currentQuestion;
    }

    startChallengeMode() {
        this.isInChallengeMode = true;
        this.challengeModeProgress.clear();
        this.challengedQuestions.forEach(q => {
            q.stats.currentStreak = 0;
            this.challengeModeProgress.set(q.id, {
                remastered: false,
                streak: 0
            });
        });
    }

    exitChallengeMode() {
        this.isInChallengeMode = false;
        this.challengeModeProgress.clear();
    }

    processAnswer(selectedAnswer) {
        const question = this.currentQuestion;
        question.stats.totalAttempts++;

        if (!question.stats.isMastered) {
            question.stats.attemptsBeforeMastery++;
        }

        const isCorrect = selectedAnswer === question.correctAnswer;
        
        if (isCorrect) {
            question.stats.correctAttempts++;
            question.stats.currentStreak++;

            if (!this.isInChallengeMode) {
                if (question.stats.currentStreak >= this.targetStreak && !question.stats.isMastered) {
                    question.stats.isMastered = true;
                    if (question.stats.attemptsBeforeMastery >= this.challengeThreshold) {
                        question.stats.isChallenger = true;
                        this.challengedQuestions.push(question);
                    }
                    this.masteredQuestions.push(question);
                    this.activeQuestions = this.activeQuestions.filter(q => q !== question);
                }
            } else {
                // Update progress in challenge mode
                const progress = this.challengeModeProgress.get(question.id);
                if (progress) {
                    progress.streak++;
                    if (progress.streak >= this.targetStreak) {
                        progress.remastered = true;
                    }
                }
            }
        } else {
            question.stats.currentStreak = 0;
            
            // In challenge mode, reset the streak in challengeModeProgress
            if (this.isInChallengeMode) {
                const progress = this.challengeModeProgress.get(question.id);
                if (progress) {
                    progress.streak = 0;
                }
            }
        }

        return {
            isCorrect,
            streak: this.isInChallengeMode ? 
                this.challengeModeProgress.get(question.id)?.streak : 
                question.stats.currentStreak,
            isMastered: question.stats.isMastered,
            attempts: question.stats.attemptsBeforeMastery
        };
    }

    isChallengeCompleted() {
        if (!this.isInChallengeMode) return false;
        
        return Array.from(this.challengeModeProgress.values())
            .every(progress => progress.remastered === true);
    }

    getChallengeStats() {
        const total = this.challengedQuestions.length;
        const completed = Array.from(this.challengeModeProgress.values())
            .filter(progress => progress.remastered).length;
        return {
            total,
            completed,
            remaining: total - completed
        };
    }

    getSessionStats() {
        const baseStats = {
            totalQuestions: this.questions.length,
            masteredQuestions: this.masteredQuestions.length,
            remainingQuestions: this.activeQuestions.length,
            challengedQuestions: this.challengedQuestions.length,
        };
        
        if (this.isInChallengeMode) {
            const challengeStats = this.getChallengeStats();
            return {
                ...baseStats,
                ...challengeStats,
                isInChallengeMode: true
            };
        }
        
        return {
            ...baseStats,
            isInChallengeMode: false
        };
    }

    resetSession() {
        this.exitChallengeMode(); // Explicitly call exitChallengeMode
        this.activeQuestions = [...this.questions];
        this.masteredQuestions = [];
        this.challengedQuestions = [];
        this.questions.forEach(q => {
            q.stats = {
                currentStreak: 0,
                totalAttempts: 0,
                attemptsBeforeMastery: 0,
                correctAttempts: 0,
                isMastered: false,
                isChallenger: false
            };
        });
    }
}
