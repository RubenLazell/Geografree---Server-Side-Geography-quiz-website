document.addEventListener('DOMContentLoaded', () => {
    const quizName = 'longest_rivers';

    const enterButton = document.getElementById('enterButton');
    const riverInput = document.getElementById('riverInput');
    const riversTableBody = document.getElementById('riversTable').getElementsByTagName('tbody')[0];
    const messageDiv = document.getElementById('message');
    const giveUpButton = document.getElementById('giveUpButton');
    const startButton = document.getElementById('startButton')

    const highScoreElement = document.getElementById('highScore');

    if (highScoreElement) {
        fetchHighScore();
    }

    
    let rivers = [];
    let score = 0;
    let totalCountries = 0;


    startButton.addEventListener('click', startQuiz);


    startButton.disabled=false;
    enterButton.disabled=true;
    riverInput.disabled=true;
    giveUpButton.disabled=true;


    function fetchRivers() {
        fetch('/static/json/longest_rivers.json')
            .then(response => response.json())
            .then(data => {
                rivers = data;
                initialiseTable();
                totalCountries = rivers.length;


            })
            .catch(error => console.error('Error fetching rivers:', error));
    }

    function startQuiz() {

        startButton.disabled=true;
        enterButton.disabled=false;
        riverInput.disabled=false;
        giveUpButton.disabled=false;
    }


    function initialiseTable() {
        rivers.forEach(river => {
            const row = riversTableBody.insertRow();
            row.insertCell(0).innerText = river.number;
            row.insertCell(1).innerText = ''; 
            row.insertCell(2).innerText = '';
            row.hidden = true; 
        });
    }

    function checkAnswer() {
        const userAnswer = normaliseString(riverInput.value.trim());
        const riverIndex = rivers.findIndex(r => normaliseString(r.name) === userAnswer);

        if (riverIndex !== -1 && riversTableBody.rows[riverIndex].hidden) {
            revealRiver(riverIndex);
            score++;
            showMessage(`Correct! The ${rivers[riverIndex].name} is one of the world's longest rivers.`);
            riverInput.value = '';
            if (countRevealedRows() === rivers.length) {
                endQuizSuccess();
            }
            
        } else {
            showMessage("Incorrect answer or already answered. Try again!");
        }
    }

    function giveUpQuiz() {
        rivers.forEach((_, index) => revealRiver(index));
        giveUpButton.disabled = true;
        enterButton.disabled = true;
        riverInput.disabled = true;
        startButton.disabled=true;
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        updateXP(score); 
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }   
    }


    giveUpButton.addEventListener('click', giveUpQuiz);

    function endQuizSuccess() {
        showMessage(`Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`);
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        giveUpButton.disabled = true;
        enterButton.disabled = true;
        riverInput.disabled = true;
        startButton.disabled=true;
        riverInput.value = '';
    }

    
    

    function countRevealedRows() {
        let revealedRows = 0;
        for (let i = 0; i < riversTableBody.rows.length; i++) {
            if (!riversTableBody.rows[i].hidden) {
                revealedRows++;
            }
        }
        return revealedRows;
    }
    

    function revealRiver(index) {
        const row = riversTableBody.rows[index];
        row.cells[1].innerText = rivers[index].name;
        row.cells[2].innerText = rivers[index].Length;
        row.hidden = false; // Reveal the row
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
                highScoreElement.textContent = data.new_high_score; // Update on-page high score
            } else {
                console.error('Failed to update high score');
            }
        })
        .catch(error => console.error('Error updating high score:', error));
    }

    giveUpButton.addEventListener('click', giveUpQuiz);
    enterButton.addEventListener('click', checkAnswer);
    riverInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });
    

    fetchRivers();
});
