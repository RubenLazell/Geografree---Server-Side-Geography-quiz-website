document.addEventListener('DOMContentLoaded', () => {

    const quizName = 'borders_riddle_board';

    const startButton = document.getElementById('startQuiz');
    const inputAnswer = document.getElementById('inputAnswer');
    const submitAnswerButton = document.getElementById('submitAnswer');
    const giveUpButton = document.getElementById('giveUp');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const endMessage = document.getElementById('endMessage');
    const riddleBoard = document.getElementById('riddleBoard');
    const timerDisplay = document.getElementById('timerDisplay');
    const highScoreElement = document.getElementById('highScore');

    if (highScoreElement) {
        fetchHighScore();
    }

    
    let timer;
    let timeRemaining = 15 * 60; // 15 minutes in seconds
    let quizStarted = false;
    let selectedCell = null;
    let score = 0;

    const clues = {
        'B2': 'Country with world’s longest coastline',
        'B3': 'Row A answers all begin with C',
        'B4': 'A2 borders Central African Republic, Chad, Equatorial Guinea, Gabon, and Nigeria',
        'B5': 'Has no land borders but is closest to Mozambique and Tanzania',
        'B6': 'Excluding overseas territories, Row B features the 5 countries with the most neighbours',
        'C2': 'This one borders Burundi',
        'C3': 'A3 and A5 are in South America and are seperated by Peru',
        'C4': 'This one borders Switzerland, also C4 is the largest landlocked country',
        'C5': 'C5 is the Dominican Republic’s only bordering country',
        'C6': 'This one is in 2 continents',
        'D2': 'This one is in Europe',
        'D3': 'B2 and B5 have the joint 2 most bordering countries',
        'D4': 'This one borders only Brazil and Argentina',
        'D5': 'A5 has more borders than A3',
        'D6': 'C1 and C2 are double-landlocked'
    };

    const answers = {
        'B2': 'Canada',
        'B3': 'Cameroon',
        'B4': 'Chile',
        'B5': 'Comoros',
        'B6': 'Colombia',
        'C2': 'Democratic Republic of Congo',
        'C3': 'China',
        'C4': 'Germany',
        'C5': 'Brazil',
        'C6': 'Russia',
        'D2': 'Liechtenstein',
        'D3': 'Uzbekistan',
        'D4': 'Uruguay',
        'D5': 'Kazakhstan',
        'D6': 'Haiti'
    };

    const totalCountries = 15


    const updateTimer = () => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (timeRemaining <= 0) {
            clearInterval(timer);
            timerDisplay.textContent = "Time's up!";
            inputAnswer.disabled = true;
            submitAnswerButton.disabled = true;
            checkCompletion();
        } else {
            timeRemaining--;
        }
    };

    const startQuiz = () => {
        if (!quizStarted) {
            quizStarted = true;
            startButton.disabled = true;
            inputAnswer.disabled = false;
            giveUpButton.disabled = false;
            submitAnswerButton.disabled = false;
            timer = setInterval(updateTimer, 1000);
            riddleBoard.querySelectorAll('.clue-cell').forEach(cell => {
                cell.disabled = false;
                cell.addEventListener('click', () => selectCell(cell));
            });
        }
    };

    startButton.addEventListener('click', startQuiz);

    const createRiddleBoard = () => {
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'riddle-row';
            for (let j = 0; j < 6; j++) {
                const cell = document.createElement('textarea');
                const clueKey = String.fromCharCode(65 + i) + (j + 1);
                if (clues[clueKey]) {
                    cell.className = 'riddle-cell clue-cell';
                    cell.dataset.clueKey = clueKey;
                    cell.placeholder = clues[clueKey];
                    cell.addEventListener('click', () => selectCell(cell));
                } else {
                    cell.className = 'riddle-cell reference-cell';
                // Updated logic for displaying row or column index, skipping the first cell
                    if (i === 0 && j > 0) {
                        cell.value = j.toString(); // Top row, excluding first cell
                    } else if (j === 0 && i > 0) {
                        cell.value = String.fromCharCode(65 + i - 1); // Left column, excluding first cell
                    }
                    cell.readOnly = true; // Make these cells read-only
                }
                cell.disabled = true;
                row.appendChild(cell);
            }
            riddleBoard.appendChild(row);
        }
    };

    createRiddleBoard(); // Make sure to call this function to create the board initially

    const updateScoreDisplay = () => {
        scoreDisplay.textContent = `Score: ${score} / ${15}`;
    };

    // Function to handle giving up
    const giveUpQuiz = () => {
        clearInterval(timer);
        quizStarted = false;
        startButton.disabled = false;
        inputAnswer.disabled = true;
        submitAnswerButton.disabled = true;
        giveUpButton.disabled = true;
        riddleBoard.querySelectorAll('.clue-cell').forEach(cell => {
            cell.disabled = true;
        });
        endMessage.textContent = `Quiz over! Your score is ${score} out of ${totalCountries} and you have earned ${calculateXP(score, totalCountries)} xp.`;
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
    };

    const selectCell = (cell) => {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        selectedCell = cell;
        selectedCell.classList.add('selected');
        inputAnswer.focus();
    };

    const submitAnswer = () => {
        if (selectedCell && inputAnswer.value.trim()) {
            const answer = inputAnswer.value.trim().toLowerCase();
            const clueKey = selectedCell.dataset.clueKey;
            if (answer === answers[clueKey].toLowerCase()) {
                selectedCell.value = answers[clueKey] + " - " + clues[clueKey];
                selectedCell.classList.remove('selected');
                selectedCell.classList.add('correct');
                selectedCell.disabled = true;
                score++;
                updateScoreDisplay()
                selectedCell = null;
                inputAnswer.value = '';
                endMessage.textContent = '';
                if (score === 15) {
                    completeQuiz();
                }
            } else {
                giveUpQuiz()
                
            }
        }    
    };

    submitAnswerButton.addEventListener('click', submitAnswer);

    inputAnswer.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            submitAnswer();
        }
    });

    const checkCompletion = () => {
        if (score === Object.keys(answers).length) {
            completeQuiz();
        } else{
            giveUpQuiz();
        }
    };

    const completeQuiz = () => {
        endMessage.textContent = `Congratulations! You've completed the riddle board! You have earned ${calculateXP(score, totalCountries)} xp.`;
        updateXP(score);
        if (highScoreElement && score > parseInt(highScoreElement.textContent)) {
            updateHighScore(score);
        }
        clearInterval(timer);
        inputAnswer.disabled = true;
        submitAnswerButton.disabled = true;
        giveUpButton.disabled = true;
        scoreDisplay.textContent = `Final Score: ${score} / ${15}`;
    };

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

    // Add the giveUpButton event listener
    giveUpButton.addEventListener('click', giveUpQuiz);

    // Initial call to set the score display to 0
    updateScoreDisplay();
});
