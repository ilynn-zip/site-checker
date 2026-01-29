const STORAGE_KEY = 'sites';

const grid = document.getElementById('grid');
const input = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');


function normalizeUrl(url) {
    return url.trim().toLowerCase().replace(/\/$/, '');
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}


let sites = [];

try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
        sites = saved.map(s => ({
            ...s,
            url: normalizeUrl(s.url)
        }));
    }
} catch { }


function addSite(url) {
    const normalized = normalizeUrl(url);

    if (sites.some(s => s.url === normalized)) return false;

    sites.push({
        url: normalized,
        status: 'down',
        lastCheck: '—'
    });

    save();
    render();
    checkSite(sites.length - 1);

    return true;
}


fetch('sites.json')
    .then(res => res.json())
    .then(list => {
        list.forEach(url => addSite(url));
    })
    .catch(() => {
        console.warn('sites.json not found or contains an error');
    });


addBtn.onclick = () => {
    const url = input.value;
    if (!url) return;

    if (!addSite(url)) {
        alert('The site has already been added');
    }

    input.value = '';
};


function render() {
    grid.innerHTML = '';

    sites.forEach((site, index) => {
        const row = document.createElement('div');
        row.className = 'row';

        row.innerHTML = `
      <div class="site">
        <div class="url">${site.url}</div>

        <div class="status">
          <span class="status-icon ${site.status}"></span>
          ${site.status.toUpperCase()}
        </div>

        <div class="time">${site.lastCheck}</div>
      </div>

      <button class="delete-btn" title="Delete"></button>
    `;

        row.querySelector('.delete-btn').onclick = () => {
            sites.splice(index, 1);
            save();
            render();
        };

        grid.appendChild(row);
    });
}


async function checkSite(index) {
    const site = sites[index];
    if (!site) return;

    try {
        await fetch(site.url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store'
        });
        site.status = 'up';
    } catch {
        site.status = 'down';
    }

    site.lastCheck = new Date().toLocaleTimeString();
    save();
    render();
}


render();
sites.forEach((_, i) => checkSite(i));

setInterval(() => {
    sites.forEach((_, i) => checkSite(i));
}, 10000);
