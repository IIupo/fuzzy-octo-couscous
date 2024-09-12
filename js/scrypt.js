let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let abortController;
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultsList = document.createElement('div');
    resultsList.innerHTML = '';
    
    results.forEach(repo => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.textContent = repo.name;
        item.onclick = () => addToFavorites(repo);
        resultsList.appendChild(item);
    });
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(resultsList);
}

function addToFavorites(repo) {
    if (!favorites.some(fav => fav.id === repo.id)) {
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
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('results');
    loader.style.display = 'block';
    resultsContainer.style.display = 'none';
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    const { signal } = abortController;

    try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort`, { signal });
        if (!response.ok) throw new Error(`Ошибка ${response.status}`);
        
        const data = await response.json();
        displayResults(data.items ? data.items.slice(0, 5) : []);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Запрос был прерван');
        } else {
            console.error("Ошибка при выполнении запроса:", error);
        }
    } finally {
        loader.style.display = 'none';
        resultsContainer.style.display = 'block'; 
    }
}

function closeResults() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.style.display = 'none';
}

const debouncedSearch = debounce(searchRepositories, 500); // 0.5 секунды

document.getElementById('repo-search').addEventListener('input', (event) => {
    const query = event.target.value;
    if (query.length > 1) debouncedSearch(query); 
});

document.addEventListener('click', function(event) {
    if (!document.getElementById('search-container').contains(event.target)) {
        closeResults();
    }
});

renderFavorites();