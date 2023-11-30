document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'us_state_capitals_challenge';

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

    
    let statesWithCapitals = [];
    let statesWithCapitalsfull = [];

    let currentQuestionIndex = 0;
    let score = 0;

    
    let timer; // Declare timer in the outer scope

    const timerDisplay = document.getElementById('timerDisplay');
    let timeLeft = 20 * 60; // 20 minutes in seconds

    const startButton = document.getElementById('startButton');

    // Start button event listener
    startButton.addEventListener('click', startQuiz);

    startButton.disabled=false;
    enterButton.disabled=true;
    capitalInput.disabled=true;
    nextButton.disabled=true;
    prevButton.disabled=true;
    giveUpButton.disabled=true;


    

    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }
    

    function fetchStateCapitals() {
        fetch('/static/json/us_states.json')
            .then(response => response.json())
            .then(data => {
                // shuffleArray(data); // Shuffle the states array for random order
                statesWithCapitals = data;
                statesWithCapitalsfull =data.length;

                shuffleArray(data)

            })
            .catch(error => console.error('Error fetching state capitals:', error));
    }

    function startQuiz() {
        startTimer()
        startButton.disabled = true; // Disable start button after starting the quiz
        enterButton.disabled=false;
        capitalInput.disabled=false;
        nextButton.disabled=false;
        prevButton.disabled=false;
        giveUpButton.disabled=false;
        askNextQuestion(); // Add this call here to display the first state when the quiz starts

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

        if (currentQuestionIndex < statesWithCapitals.length) {
            stateQuestion.textContent = statesWithCapitals[currentQuestionIndex].state;
            capitalInput.value = '';
            capitalInput.focus();
        }

        if (currentQuestionIndex ===  statesWithCapitals.length) {
            console.log("All questions answered, ending quiz."); // Log when all questions are answered
            showMessage(`Quiz over! Your score is ${score} out of ${statesWithCapitalsfull} and you have earned ${calculateXP(score, statesWithCapitalsfull)} xp.`);
            disableQuizInteraction();
            updateXP(score); // Update XP based on the score
            if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
                updateHighScore(score);
            }
            capitalInput.value = ''; // Clear the input bar
            nextButton.disabled = true; // Disable the next button
            enterButton.disabled = true;
            stateQuestion.textContent = ''; // Clear the state question display
            capitalInput.placeholder = ''; // Clear the state question display
        }
    }

    function checkAnswer() {
        const userAnswer = capitalInput.value.trim().toLowerCase();
        const correctAnswer = statesWithCapitals[currentQuestionIndex].capital.toLowerCase();
    
        if (userAnswer === correctAnswer) {
            showMessage("");
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            statesWithCapitals.splice(currentQuestionIndex, 1); // Remove the answered question from the array
            currentQuestionIndex -= 1;
            moveToNextQuestion(); // Move to the next question
        } else {
            showMessage("Incorrect answer. Try again!");
        }
    }
    
    function moveToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= statesWithCapitals.length) {
            currentQuestionIndex = 0; // Reset to the first question
        }
        askNextQuestion();
    }
    


    
    function moveToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
        } else {
            // If at the first question, wrap around to the last question
            currentQuestionIndex = statesWithCapitals.length - 1;
        }
        askNextQuestion();
    }
 
    
    

    nextButton.addEventListener('click', () => {
        showMessage(""); // Clear the message when moving to the next question
        moveToNextQuestion();
    });
    
    prevButton.addEventListener('click', () => {
        showMessage(""); // Clear the message when moving to the previous question
        moveToPreviousQuestion();
    });
    
    

    function giveUp() {
        endQuiz();
    }

    function endQuiz() {
        showMessage(`Quiz over! Your score is ${score} out of ${statesWithCapitalsfull} and you have earned ${calculateXP(score, statesWithCapitalsfull)} xp.`);
        disableQuizInteraction();
        updateXP(score); // Update XP based on the score
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        clearInterval(timer); // Clear the timer interval
        capitalInput.value = ''; // Clear the input bar
        nextButton.disabled = true; // Disable the next button
        enterButton.disabled = true;
        stateQuestion.textContent = ''; // Clear the state question display
        capitalInput.placeholder = ''; // Clear the state question display



    }
    

    function showMessage(message) {
        
        console.log("Displaying message:", message); // Log the message being displayed
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

    function calculateXP(score, statesWithCapitalsfull) {
        const percentage = (score / statesWithCapitalsfull) * 100;
        if (percentage === 100) {
            return 100; // Full marks
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
        const xpGained = calculateXP(score, statesWithCapitalsfull);
    
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
            return; // Exit the function if there is no high score element
        }
        
        fetch(`/update_high_score/${quizName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_score: newScore }),
            credentials: 'same-origin' // Correct credentials policy for same-origin requests
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(`High score updated to ${data.new_high_score}`);
                highScoreElement.textContent = data.new_high_score; // Update on-page high score
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


    fetchStateCapitals();
});
