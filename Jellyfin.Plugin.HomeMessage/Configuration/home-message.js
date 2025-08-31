(async function () {
    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    async function getCfg() {
        try {
            const r = await fetch('/HomeMessage', { credentials: 'include' });
            if (!r.ok) return null;
            return await r.json();
        } catch {
            return null;
        }
    }

    function onHome(cb) {
        // Home content loads dynamically; poll for a bit until we see a known container.
        const sel = '.homeContent:not(.message-patched)';
        const iv = setInterval(() => {
            const el = document.querySelector(sel);
            if (el) {
                el.classList.add('message-patched');
                clearInterval(iv);
                cb(el);
            }
        }, 400);
        // soft timeout after ~15s
        setTimeout(() => clearInterval(iv), 15000);
    }

    function inject(container, cfg) {
        if (!cfg || !cfg.message) return;

        const id = 'home-message-banner';
        if (document.getElementById(id)) return;

        const wrap = document.createElement('div');
        wrap.id = id;
        wrap.style.background = cfg.bgColor || '#111827';
        wrap.style.color = cfg.textColor || '#ffffff';
        wrap.style.padding = '10px 14px';
        wrap.style.borderRadius = '10px';
        wrap.style.margin = '12px 0';
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '10px';
        wrap.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        wrap.innerHTML = `<span style="font-weight:600">${cfg.message}</span>`;

        if (cfg.dismissible) {
            const btn = document.createElement('button');
            btn.textContent = 'Dismiss';
            btn.style.cursor = 'pointer';
            btn.style.border = 'none';
            btn.style.padding = '6px 10px';
            btn.style.borderRadius = '8px';
            btn.addEventListener('click', () => wrap.remove());
            wrap.appendChild(btn);
        }

        // insert at top or bottom of the home content:
        if ((cfg.position || 'top') === 'top') {
            container.prepend(wrap);
        } else {
            container.appendChild(wrap);
        }
    }

    ready(async () => {
        const cfg = await getCfg();
        onHome((container) => inject(container, cfg));
    });
})();
