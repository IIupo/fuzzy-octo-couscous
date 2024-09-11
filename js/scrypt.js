let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function throttle(func, limit) {
    let lastFunc;
    let lastRan;

    return function (...args) {
        const context = this;

        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = results.length ? 'block' : 'none';

    results.forEach(repo => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.textContent = repo.name;
        item.onclick = () => addToFavorites(repo);
        resultsContainer.appendChild(item);
    });
}

function addToFavorites(repo) {
    if (!favorites.find(fav => fav.id === repo.id)) {
        favorites.push(repo);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
    closeResults();

    document.getElementById('repo-search').value = '';
}

function removeFromFavorites(repoID) {
    favorites = favorites.filter(repo => repo.id !== repoID);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';

    favorites.forEach(repo => {
        const item = document.createElement('li');
        item.className = 'favorite-item';
        item.innerHTML = `<span>${repo.name} (${repo.owner.login}, ⭐ ${repo.stargazers_count})</span>`;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Удалить';
        removeButton.onclick = () => removeFromFavorites(repo.id);
        item.appendChild(removeButton);
        favoritesList.appendChild(item);
    });
}

async function searchRepositories(query) {
    document.getElementById('loader').style.display = 'block';
    const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort`);
    const data = await response.json();
    displayResults(data.items.slice(0, 5));
    document.getElementById('loader').style.display = 'none';
}

function closeResults() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.style.display = 'none';
}

const throttledSearch = throttle(searchRepositories, 300); // 0.3sec

document.getElementById('repo-search').addEventListener('input', (event) => {
    const query = event.target.value;
    throttledSearch(query);
});

document.addEventListener('click', (event) => {
    if (!document.getElementById('search-container').contains(event.target)) {
        closeResults();
    }
});

renderFavorites();