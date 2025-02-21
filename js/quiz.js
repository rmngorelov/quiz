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
        this.challengeModeProgress = new Map();
    }

    async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            const data = await response.json();
            this.questions = data.questions.map(q => ({
                ...q,
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
        
        this.currentQuestion = currentPool[
            Math.floor(Math.random() * currentPool.length)
        ];
        this.currentQuestion.shuffledChoices = this.shuffleArray([...this.currentQuestion.choices]);
        return this.currentQuestion;
    }

    startChallengeMode() {
        this.isInChallengeMode = true;
        this.challengeModeProgress.clear();
        this.challengedQuestions.forEach(q => {
            q.stats.currentStreak = 0;
            this.challengeModeProgress.set(q.text, false);
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
                if (question.stats.currentStreak >= this.targetStreak) {
                    this.challengeModeProgress.set(question.text, true);
                }
            }
        } else {
            question.stats.currentStreak = 0;
        }

        return {
            isCorrect,
            streak: question.stats.currentStreak,
            isMastered: question.stats.isMastered,
            attempts: question.stats.attemptsBeforeMastery
        };
    }

    isChallengeCompleted() {
        return Array.from(this.challengeModeProgress.values()).every(v => v === true);
    }

    getChallengeStats() {
        const total = this.challengedQuestions.length;
        const completed = Array.from(this.challengeModeProgress.values()).filter(v => v).length;
        return {
            total,
            completed,
            remaining: total - completed
        };
    }

    getSessionStats() {
        if (this.isInChallengeMode) {
            const challengeStats = this.getChallengeStats();
            return {
                ...challengeStats,
                isInChallengeMode: true
            };
        }
        return {
            totalQuestions: this.questions.length,
            masteredQuestions: this.masteredQuestions.length,
            remainingQuestions: this.activeQuestions.length,
            challengedQuestions: this.challengedQuestions.length,
            isInChallengeMode: false
        };
    }

    resetSession() {
        this.isInChallengeMode = false;
        this.activeQuestions = [...this.questions];
        this.masteredQuestions = [];
        this.challengedQuestions = [];
        this.challengeModeProgress.clear();
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
