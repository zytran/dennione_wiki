document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-search-input').forEach(input => {
    const form = input.closest('form');
    const list = form ? form.querySelector('.js-search-suggestions') : null;

    if (!form || !list) {
      return;
    }

    let debounceTimer;
    let activeController;

    function closeList() {
      list.innerHTML = '';
      list.classList.remove('open');
    }

    function renderResults(results) {
      list.innerHTML = '';

      if (results.length === 0) {
        closeList();
        return;
      }

      results.forEach(page => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/${page.slug}`;
        link.textContent = page.title;
        item.appendChild(link);
        list.appendChild(item);
      });

      list.classList.add('open');
    }

    input.addEventListener('input', () => {
      const query = input.value.trim();

      clearTimeout(debounceTimer);

      if (!query) {
        closeList();
        return;
      }

      debounceTimer = setTimeout(() => {
        if (activeController) {
          activeController.abort();
        }
        activeController = new AbortController();

        fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`, {
          signal: activeController.signal,
        })
          .then(res => res.json())
          .then(renderResults)
          .catch(() => {});
      }, 200);
    });

    document.addEventListener('click', event => {
      if (!form.contains(event.target)) {
        closeList();
      }
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeList();
      }
    });
  });
});
