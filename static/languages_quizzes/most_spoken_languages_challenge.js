document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'most_spoken_languages_challenge_challenge';

    const enterButton = document.getElementById('enterButton');
    const languageInput = document.getElementById('languageInput');
    const languagesTableBody = document.getElementById('languagesTable').getElementsByTagName('tbody')[0];
    const messageDiv = document.getElementById('message');
    const giveUpButton = document.getElementById('giveUpButton');
    const startButton = document.getElementById('startButton')
    const highScoreElement = document.getElementById('highScore');


    if (highScoreElement) {
        fetchHighScore();
    }
    
    let languages = [];
    let score = 0;

    startButton.disabled = false;
    enterButton.disabled= true;
    languageInput.disabled= true;
    giveUpButton.disabled = true;

    
    function fetchLanguages() {
        fetch('/static/json/language_speakers.json')
            .then(response => response.json())
            .then(data => {
                languages = data;
                initialiseTable();
            
            totalCountries= languages.length

            })
            .catch(error => console.error('Error fetching languages:', error));
    }


    function initialiseTable() {
        languages.forEach(language => {
            const row = languagesTableBody.insertRow();
            row.insertCell(0).innerText = language.number;
            row.insertCell(1).innerText = ''; 
            row.insertCell(2).innerText = '';
            row.hidden = true;
        });
    }

    function startQuiz() {
        startButton.disabled=true;
        enterButton.disabled=false;
        languageInput.disabled=false;
        giveUpButton.disabled=false;
    }

    startButton.addEventListener('click', startQuiz);



    function giveUpQuiz() {
        languages.forEach((_, index) => revealLanguage(index)); 
        giveUpButton.disabled=true;
        enterButton.disabled = true;
        languageInput.disabled = true;
        startButton.disabled = true;
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        updateXP(score); 
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }    }

    function checkAnswer() {
        const userAnswer = normaliseString(languageInput.value.trim());
        const languageIndex = languages.findIndex(r => normaliseString(r.name) === userAnswer);

        if (languageIndex !== -1 && languagesTableBody.rows[languageIndex].hidden) {
            revealLanguage(languageIndex);
            score++; 
            showMessage(`Correct! ${languages[languageIndex].name} is one of the world's most spoken languges.`);
            languageInput.value = ''; 
            if (countRevealedRows() === languages.speakers) {
                endQuizSuccess();
            }
            
        } else {
            showMessage("Incorrect answer or already answered. Try again!");
        }
    }

    function endQuizSuccess() {
        giveUpButton.disabled=true;
        enterButton.disabled = true;
        languageInput.disabled = true;
        startButton.disabled = true;
        showMessage(`Congratulations! You've named all the countries in the world! You have earned ${calculateXP(score, totalCountries)} xp.`);
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        languageInput.value = ''; 
    }
    

    function countRevealedRows() {
        let revealedRows = 0;
        for (let i = 0; i < languagesTableBody.rows.speakers; i++) {
            if (!languagesTableBody.rows[i].hidden) {
                revealedRows++;
            }
        }
        return revealedRows;
    }
    

    function revealLanguage(index) {
        const row = languagesTableBody.rows[index];
        row.cells[1].innerText = languages[index].name;
        row.cells[2].innerText = languages[index].speakers;
        row.hidden = false; 
    }

    function normaliseString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function showMessage(message) {
        messageDiv.textContent = message;
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
                highScoreElement.textContent = data.new_high_score; 
            } else {
                console.error('Failed to update high score');
            }
        })
        .catch(error => console.error('Error updating high score:', error));
    }

    giveUpButton.addEventListener('click', giveUpQuiz)
    enterButton.addEventListener('click', checkAnswer);
    languageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });

    fetchLanguages();
});
