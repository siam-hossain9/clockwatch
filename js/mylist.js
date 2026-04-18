/**
 * Dororo - My List / Watchlist Module
 * Handles localStorage-based watchlist with add/remove/toggle
 */

const MyList = (() => {
    const STORAGE_KEY = 'dororo_mylist';

    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch { return []; }
    }

    function saveAll(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function has(id, type) {
        return getAll().some(item => item.id === String(id) && item.type === type);
    }

    function add(item) {
        const list = getAll();
        if (!list.some(i => i.id === String(item.id) && i.type === item.type)) {
            list.push({ ...item, id: String(item.id), addedAt: Date.now() });
            saveAll(list);
        }
    }

    function remove(id, type) {
        const list = getAll().filter(item => !(item.id === String(id) && item.type === type));
        saveAll(list);
    }

    function toggle(item, btnEl) {
        if (has(item.id, item.type)) {
            remove(item.id, item.type);
            if (btnEl) {
                btnEl.innerHTML = btnEl.classList.contains('card-bookmark') ? '✓' : btnEl.innerHTML.replace('Remove from', 'Add to').replace('✓', '+');
                btnEl.classList.remove('bookmarked');
            }
            showToast('Removed from My List');
        } else {
            add(item);
            if (btnEl) {
                btnEl.innerHTML = btnEl.classList.contains('card-bookmark') ? '✓' : btnEl.innerHTML.replace('Add to', 'Remove from').replace('+', '✓');
                btnEl.classList.add('bookmarked');
            }
            showToast('Added to My List');
        }
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function getByType(type) {
        return getAll().filter(item => item.type === type);
    }

    function showToast(message) {
        const existing = document.querySelector('.cw-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'cw-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    return { getAll, has, add, remove, toggle, clear, getByType, showToast };
})();
