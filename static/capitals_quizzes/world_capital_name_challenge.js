document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'world_capital_name_challenge';

    const startButton = document.getElementById('startButton');
    const enterButton = document.getElementById('enterButton');
    const capitalInput = document.getElementById('capitalInput');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const giveUpButton = document.getElementById('giveUpButton')

    const highScoreElement = document.getElementById('highScore');

    if (highScoreElement) {
        fetchHighScore();
    }


    let score = 0;
    let capitals = [];
    let timer = null;
    let timeRemaining = 20 * 60; // 20 minutes in seconds
    let totalCapitals = 0; // Total number of Capitals

    // Disable elements initially

    // Disable elements initially
    startButton.disabled = false;
    enterButton.disabled = true;
    capitalInput.disabled = true;
    giveUpButton.disabled = true;






    startButton.addEventListener('click', startQuiz);
    enterButton.addEventListener('click', checkAnswer);

    function startQuiz() {
        enterButton.disabled = false;
        capitalInput.disabled = false;
        startButton.disabled = true; // Disable start button after quiz starts
        giveUpButton.disabled = false;

        fetchCapitals();
        startTimer();
    }

    function normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
    
    function fetchCapitals() {
        fetch('https://restcountries.com/v3.1/all')
            .then(response => response.json())
            .then(data => {
                capitals = data
                    .filter(country => country.independent === true && country.capital && country.capital.length > 0)
                    .map(country => normalizeString(country.capital[0])); // Fetch and normalize the first capital name
        
                totalCapitals = capitals.length; // Set the total number of Capitals
                totalCountries = totalCapitals
                scoreDisplay.textContent = `0 / ${totalCapitals}`; // Update score display with total number of Capitals        
                console.log(capitals);
            })
            .catch(error => console.error('Error fetching Capitals:', error));
    }
    
    

    

    function startTimer() {
        timer = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                endQuiz();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    function checkAnswer() {
        const userAnswer = capitalInput.value.trim().toLowerCase();

        if (capitals.includes(userAnswer)) {
            score++;
            scoreDisplay.textContent = `${score}/${totalCapitals}`;
            capitals = capitals.filter(capital => capital !== userAnswer); // Remove answered Capital
            capitalInput.value = ''; // Clear input field
            capitalInput.focus(); // Focus back to input field for next entry
        } else {
            showMessage("Incorrect answer. Try again!");
        }

        // Check if the user has named all Capitals
        if (score === totalCapitals) {
            endQuizSuccess(); // Call a function to handle the successful completion
        }
    }

    function endQuizSuccess() {
        clearInterval(timer); // Stop the timer
        showMessage(`Congratulations! You've named all the capitals in the world! You have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        giveUpButton.disabled = true;
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
    }
    
    function endQuiz() {
        clearInterval(timer); // Stop the timer
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        giveUpButton.disabled = true;

        updateXP(score); // Update XP based on the score
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
    }
    
    function showMessage(message) {
        const endMessageElement = document.getElementById('endMessage');
        endMessageElement.textContent = message;
        endMessageElement.style.display = 'block'; // Make the message visible
    }
    
    function disableQuizInteraction() {
        enterButton.disabled = true;
        capitalInput.disabled = true;
        startButton.disabled = true; // Optionally disable the start button
    }

    function giveUp() {
        endQuiz();
    }

    function calculateXP(score, totalCountries) {
        const percentage = (score / totalCountries) * 100;
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
        const xpGained = calculateXP(score, totalCountries);
    
        fetch('/update_xp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'credentials': 'same-origin'  // Ensure cookies (session) are included
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


    capitalInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
        });
});
