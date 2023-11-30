document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'south_american_country_name_challenge';

    const startButton = document.getElementById('startButton');
    const enterButton = document.getElementById('enterButton');
    const countryInput = document.getElementById('countryInput');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const giveUpButton = document.getElementById('giveUpButton');
    const highScoreElement = document.getElementById('highScore');



    /////////////////////////////
    if (highScoreElement) {
        fetchHighScore();
    }
    /////////////////////////////



    let score = 0;
    let countries = [];
    let timer = null;
    let timeRemaining = 5 * 60;
    let totalCountries = 0;


    startButton.addEventListener('click', startQuiz);
    enterButton.addEventListener('click', checkAnswer);

    startButton.disabled = false; 
    giveUpButton.disabled= true;
    enterButton.disabled= true;
    countryInput.disabled = true;

    function startQuiz() {
        startButton.disabled = true; 
        fetchCountries();
        startTimer();
        enterButton.disabled= false;
        countryInput.disabled = false;
        giveUpButton.disabled= false;

    }

    function normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
    
    function fetchCountries() {
        fetch('https://restcountries.com/v3.1/all')
            .then(response => response.json())
            .then(data => {
                countries = data
                .filter(country => (country.region === 'Americas' && (country.subregion === 'South America')))
                .map(country => normalizeString(country.name.common)); 
    
                totalCountries = countries.length; 
                scoreDisplay.textContent = `0 / ${totalCountries}`; 
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
        timerDisplay.textContent = `${minutes}:${seconds < 5 ? '0' + seconds : seconds}`;
    }

    function checkAnswer() {
        const userAnswer = countryInput.value.trim().toLowerCase();

        if (countries.includes(userAnswer)) {
            score++;
            scoreDisplay.textContent = `${score}/${totalCountries}`;
            countries = countries.filter(country => country !== userAnswer); 
            countryInput.value = ''; 
            countryInput.focus(); 
            showMessage("")


            
            if (score === totalCountries) {
                endQuizSuccess(); 
            }

        } else {
            showMessage("Incorrect answer. Try again!");
        }
    }

    function endQuizSuccess() {
        clearInterval(timer); 
        showMessage(`Congratulations! You've named all the countries in South America! You have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        updateXP(score); 

        //////////////////////////
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        //////////////////////////

        giveUpButton.disabled = true;
        countryInput.disabled = true;
        enterButton.disabled = true;

    }
    
    function endQuiz() {
        clearInterval(timer); 
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        disableQuizInteraction();
        updateXP(score); 

        ////////////////////////////
        if (score > parseInt(document.getElementById('highScore').textContent)) {
            updateHighScore(score);
        }
        ///////////////////////////

        giveUpButton.disabled = true;
        countryInput.disabled = true;
        enterButton.disabled = true;
    }
    
    function showMessage(message) {
        const endMessageElement = document.getElementById('endMessage');
        endMessageElement.textContent = message;
        endMessageElement.style.display = 'block'; 
    }
    
    function disableQuizInteraction() {
        enterButton.disabled = true;
        countryInput.disabled = true;
        startButton.disabled = true; 
    }

    function giveUp() {
        endQuiz();
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

    ///////////////////////////////
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

    //////////////////////////////

    //////////////////////////////
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
    //////////////////////////////

    giveUpButton.addEventListener('click', giveUp);

    countryInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
        });

    
    
    
});



