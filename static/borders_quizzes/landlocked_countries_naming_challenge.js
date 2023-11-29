document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'landlocked_countries_naming_challenge';

    const startButton = document.getElementById('startButton');
    const enterButton = document.getElementById('enterButton');
    const countryInput = document.getElementById('countryInput');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const giveUpButton = document.getElementById('giveUpButton');
    const highScoreElement = document.getElementById('highScore');

    if (highScoreElement) {
        fetchHighScore();
    }


    let score = 0;
    let countries = [];
    let timer = null;
    let timeRemaining = 5 * 60; // 5 minutes in seconds
    let totalCountries = 0; // Total number of countries

    giveUpButton.disabled=true;



    startButton.addEventListener('click', startQuiz);
    enterButton.addEventListener('click', checkAnswer);
    giveUpButton.addEventListener('click', giveUp);
    countryInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        checkAnswer();
    }
    });


    function startQuiz() {
        startButton.disabled = true; // Disable start button after quiz starts
        fetchCountries();
        startTimer();
        giveUpButton.disabled=false;

    }

    function normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
    
    function fetchCountries() {
        fetch('https://restcountries.com/v3.1/all')
            .then(response => response.json())
            .then(data => {
                countries = data
                    .filter(country => country.independent === true)
                    .filter(country => country.landlocked === true)

                    .map(country => normalizeString(country.name.common)); // Normalize and convert to lowercase
    
                totalCountries = countries.length; // Set the total number of countries
                scoreDisplay.textContent = `0 / ${totalCountries}`; // Update score display with total number of countries            
            })
            .catch(error => console.error('Error fetching countries:', error));
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

    function giveUp() {
        endQuiz();
    }

    function checkAnswer() {
        const userAnswer = countryInput.value.trim().toLowerCase();

        if (countries.includes(userAnswer)) {
            showMessage(``);

            score++;
            scoreDisplay.textContent = `${score}/${totalCountries}`;
            countries = countries.filter(country => country !== userAnswer); // Remove answered country
            countryInput.value = ''; // Clear input field
            countryInput.focus(); // Focus back to input field for next entry
        } else {
            showMessage(`Incorrect! Try again!.`);
        }

        // Check if the user has named all countries
        if (score === totalCountries) {
            endQuizSuccess(); // Call a function to handle the successful completion
        }
    }

    function endQuizSuccess() {
        clearInterval(timer); // Stop the timer
        showMessage(`Congratulations! You've named all the landlocked countries in the world! You have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
    }
    
    function endQuiz() {
        clearInterval(timer); // Stop the timer
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
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
        countryInput.disabled = true;
        startButton.disabled = true; // Optionally disable the start button
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
    //////////////////////////////
    giveUpButton.addEventListener('click', giveUp);

});