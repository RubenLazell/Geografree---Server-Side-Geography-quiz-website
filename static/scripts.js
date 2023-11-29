document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_countries')
    .then(response => response.json())
    .then(data => {
        let select = document.getElementById('favourite_flag');
        let currentFavouriteFlag = select.getAttribute('data-current');

        // Sort the countries alphabetically by name
        data.sort((a, b) => a[1].localeCompare(b[1]));

        data.forEach(country => {
            let option = document.createElement('option');
            option.value = country[0];
            option.textContent = country[1];

            if (option.value === currentFavouriteFlag) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        if (!currentFavouriteFlag) {
            select.selectedIndex = 0;
        }
    });
});


function fetchAndDisplayFavoriteFlag() {
    fetch('/get_favorite_flag')
        .then(response => response.json())
        .then(data => {
            const flagImg = document.getElementById('favourite-flag');
            if (data && data.favorite_flag) {
                flagImg.src = `https://flagsapi.com/${data.favorite_flag}/flat/64.png`;
            } else {
                flagImg.style.display = 'none'; // Hide if no favorite flag is set
            }
        })
        .catch(error => console.error('Error fetching favorite flag:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayFavoriteFlag();
});

document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_leaderboard')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('.leaderboard tbody');
            tbody.innerHTML = ''; // Clear existing rows

            data.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.username}</td>
                    <td>${user.xp}</td>
                `;
                tbody.appendChild(row);
            });

            // Highlight the current user's row if they are on the leaderboard
            if (data.some(user => user.username === '{{ current_user.username }}')) {
                let currentUserRow = [...tbody.children].find(row => row.cells[1].textContent === '{{ current_user.username }}');
                if (currentUserRow) {
                    currentUserRow.classList.add('you');
                }
            }
        })
        .catch(error => console.error('Error fetching leaderboard:', error));
});

