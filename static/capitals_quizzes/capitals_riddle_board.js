document.addEventListener('DOMContentLoaded', () => {

    const quizName = 'capitals_riddle_board';

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
        'B2': 'Capital of Australia',
        'B3': 'Row A answers all begin with C',
        'B4': 'Capital of country where the Nile ends',
        'B5': 'Location of a Caraqueño',
        'B6': 'Havana’s country',
        'C2': 'A2 is the capital of Denmark',
        'C3': 'This one begins with L',
        'C4': 'B1 and B2 are the capitals of the 2 countries that begin with Z',
        'C5': 'Row B is all African capitals',
        'C6': 'B3 and B4 are capitals beginning with T',
        'D2': 'B3,B4,B5 goes alphabetically. Also B5 is on an island',
        'D3': 'Row C is all capitals of the 5 smallest world countries',
        'D4': 'Row C is in order of smallest population to largest',
        'D5': 'C3 and C4 are all in the pacific. C5 is surrounded by Italy',
        'D6': 'The capital of this country is also the name of the country'
    };

    const answers = {
        'B2': 'Canberra',
        'B3': 'Copenhagen',
        'B4': 'Cairo',
        'B5': 'Caracas',
        'B6': 'Cuba',
        'C2': 'Harare',
        'C3': 'Lusaka',
        'C4': 'Tripoli',
        'C5': 'Tunis',
        'C6': 'Victoria',
        'D2': 'Vatican City',
        'D3': 'Monaco',
        'D4': 'Yaren',
        'D5': 'Funafuti',
        'D6': 'San Marino'
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


    // Function to update score display
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
