document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'world_capitals_by_country';

    const enterButton = document.getElementById('enterButton');
    const capitalInput = document.getElementById('capitalInput');
    const stateQuestion = document.getElementById('currentState');
    const scoreDisplay = document.getElementById('score');
    const endMessage = document.getElementById('endMessage');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const giveUpButton = document.getElementById('giveUpButton');

    const highScoreElement = document.getElementById('highScore');

    if (highScoreElement) {
        fetchHighScore();
    }


    
    let countries = [];
    let totalCountries = 0;


    let currentQuestionIndex = 0;
    let score = 0;

    
    let timer; 

    const timerDisplay = document.getElementById('timerDisplay');
    let timeLeft = 30 * 60;

    const startButton = document.getElementById('startButton')

    startButton.addEventListener('click', startQuiz);


    startButton.disabled=false;
    enterButton.disabled=true;
    capitalInput.disabled=true;
    nextButton.disabled=true;
    prevButton.disabled=true;
    giveUpButton.disabled=true;

    function normaliseString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function startQuiz() {
        startTimer()
        startButton.disabled = true;
        enterButton.disabled=false;
        capitalInput.disabled=false;
        nextButton.disabled=false;
        prevButton.disabled=false;
        giveUpButton.disabled=false;
        askNextQuestion();
    }

    

    function fetchcountries() {
        fetch('https://restcountries.com/v3.1/all')
            .then(response => response.json())
            .then(data => {
                countries = data
                    .filter(country => country.independent === true)
                    .map(country => ({
                        name: normaliseString(country.name.common),
                        capital: normaliseString(country.capital[0])
                    }));

                shuffleArray(countries);
                totalCountries = countries.length;
                scoreDisplay.textContent = `0 / ${totalCountries}`;
            })
            .catch(error => console.error('Error fetching countries:', error));
    }

    function startTimer() {
        timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            endQuiz();
        }
    }, 1000);
    }

    function askNextQuestion() {

        if (currentQuestionIndex < countries.length) {
            stateQuestion.textContent = (countries[currentQuestionIndex].name).split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

            capitalInput.value = '';
            capitalInput.focus();
        }

        if (currentQuestionIndex === countries.length) {
            console.log("All questions answered, ending quiz.");
            endQuiz()
        }
    }

    function checkAnswer() {
        const userAnswer = capitalInput.value.trim().toLowerCase();
        const correctAnswer = countries[currentQuestionIndex].capital.toLowerCase();

    
        if (userAnswer === correctAnswer) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            countries.splice(currentQuestionIndex, 1);
            currentQuestionIndex -= 1;
            moveToNextQuestion();
        } else {
            showMessage("Incorrect answer. Try again!");
        }
    }
    
    function moveToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= countries.length) {
            currentQuestionIndex = 0;
        }
        askNextQuestion();
    }
    


    
    function moveToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
        } else {
            currentQuestionIndex = countries.length - 1;
        }
        askNextQuestion();
    }
 
    
    

    nextButton.addEventListener('click', () => {
        showMessage("");
        moveToNextQuestion();
    });
    
    prevButton.addEventListener('click', () => {
        showMessage("");
        moveToPreviousQuestion();
    });
    
    

    function giveUp() {
        endQuiz();
    }

    function endQuiz() {
        clearInterval(timer);
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        capitalInput.value = '';
        nextButton.disabled = true;
        enterButton.disabled = true;
        stateQuestion.textContent = '';
        capitalInput.placeholder = '';



    }
    

    function showMessage(message) {
        
        console.log("Displaying message:", message);
        endMessage.textContent = message;
        endMessage.style.display = 'block';
    }

    function disableQuizInteraction() {
        enterButton.disabled = true;
        capitalInput.disabled = true;
        nextButton.disabled = true;
        prevButton.disabled = true;
        giveUpButton.disabled = true;

    }

    function calculateXP(score, totalCountries) {
        const percentage = (score / totalCountries) * 100;
        if (percentage === 100) {
            return 100;
        } else if (percentage >= 80) {
            return 80;
        } else if (percentage >= 60) {
            return 60;
        } else if (percentage >= 40) {
            return 40;
        } else {
            return 1; 
        }
    }

    function updateXP(score) {
        const xpGained = calculateXP(score, totalCountries);
    
        fetch('/update_xp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'credentials': 'same-origin'
            },
            body: JSON.stringify({ xp: xpGained })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(`XP updated to ${data.new_xp}`);
            } else {
                console.error('Failed to update XP');
            }
        })
        .catch(error => console.error('Error updating XP:', error));
    }
    
    function fetchHighScore() {
        fetch(`/get_high_score/${quizName}`)
            .then(response => response.json())
            .then(data => {
                const highScoreElement = document.getElementById('highScore');
                if (highScoreElement) {
                    highScoreElement.textContent = data.high_score;
                }
            })
            .catch(error => {
                console.error('Error fetching high score:', error);
            });
    }

    function updateHighScore(newScore) {
        const highScoreElement = document.getElementById('highScore');
        if (!highScoreElement) {
            return;
        }
        
        fetch(`/update_high_score/${quizName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_score: newScore }),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(`High score updated to ${data.new_high_score}`);
                highScoreElement.textContent = data.new_high_score;
            } else {
                console.error('Failed to update high score');
            }
        })
        .catch(error => console.error('Error updating high score:', error));
    }

    giveUpButton.addEventListener('click', giveUp);
    enterButton.addEventListener('click', checkAnswer);
    capitalInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        checkAnswer();
    }
    });


    fetchcountries();
});
