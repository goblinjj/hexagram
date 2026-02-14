import { HEXAGRAM_NAMES } from './data/constants.js';

// Trigram binary → Chinese name and symbol
const TRIGRAM_INFO = {
    '111': { name: '乾', symbol: '☰', nature: '天' },
    '110': { name: '兑', symbol: '☱', nature: '泽' },
    '101': { name: '离', symbol: '☲', nature: '火' },
    '100': { name: '震', symbol: '☳', nature: '雷' },
    '011': { name: '巽', symbol: '☴', nature: '风' },
    '010': { name: '坎', symbol: '☵', nature: '水' },
    '001': { name: '艮', symbol: '☶', nature: '山' },
    '000': { name: '坤', symbol: '☷', nature: '地' },
};

// Build id→code reverse mapping from takashima_index.json
let idToCode = {};   // "1" -> "111111"
let indexMap = {};    // "111111" -> "1"
const hexCache = {}; // id -> hex data

async function init() {
    try {
        const res = await fetch('/data/takashima_index.json');
        if (!res.ok) throw new Error('Failed to load index');
        indexMap = await res.json();
        // Reverse: code→id  =>  id→code
        for (const [code, id] of Object.entries(indexMap)) {
            idToCode[id] = code;
        }
    } catch (e) {
        console.error('Failed to load takashima index:', e);
    }

    renderGrid();

    const searchInput = document.getElementById('hex-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            document.querySelectorAll('.hex-cell').forEach(cell => {
                const name = cell.querySelector('.hex-cell-name');
                if (!query || (name && name.textContent.includes(query))) {
                    cell.style.display = '';
                } else {
                    cell.style.display = 'none';
                }
            });
        });
    }

    // Open hexagram from URL param (e.g. ?hex=1)
    const urlParams = new URLSearchParams(window.location.search);
    const hexParam = urlParams.get('hex');
    if (hexParam) {
        showHexDetail(parseInt(hexParam, 10));
    }
}

function renderGrid() {
    const grid = document.getElementById('hexagram-grid');

    for (let id = 1; id <= 64; id++) {
        const code = idToCode[String(id)];
        const name = code ? (HEXAGRAM_NAMES[code] || `卦${id}`) : `卦${id}`;

        const cell = document.createElement('div');
        cell.className = 'hex-cell';
        cell.dataset.id = id;
        // Build mini 6-line hexagram (display top-to-bottom = reverse of binary)
        let linesHtml = '';
        if (code) {
            linesHtml = '<div class="hex-cell-lines">';
            for (let i = 5; i >= 0; i--) {
                const bit = code[i];
                linesHtml += bit === '1'
                    ? '<div class="hex-mini-yang"></div>'
                    : '<div class="hex-mini-yin"><span></span><span></span></div>';
            }
            linesHtml += '</div>';
        }

        cell.innerHTML =
            `<span class="hex-cell-num">${id}</span>` +
            linesHtml +
            `<span class="hex-cell-name">${name}</span>`;
        cell.addEventListener('click', () => showHexDetail(id));
        grid.appendChild(cell);
    }
}

async function fetchHex(id) {
    if (hexCache[id]) return hexCache[id];
    try {
        const res = await fetch(`/data/takashima/${id}.json`);
        if (!res.ok) throw new Error(`Failed to load hexagram ${id}`);
        const data = await res.json();
        hexCache[id] = data;
        return data;
    } catch (e) {
        console.error(e);
        return null;
    }
}

// ── Modal ──
const modal = document.getElementById('study-modal');
const modalTitle = document.getElementById('study-modal-title');
const modalBody = document.getElementById('study-modal-body');
const closeBtn = modal.querySelector('.close-btn');

closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.style.display = 'none';
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

let sectionIdCounter = 0;

async function showHexDetail(id) {
    modalTitle.innerText = '加载中...';
    modalBody.innerHTML = '';
    modal.style.display = 'block';
    sectionIdCounter = 0;

    const hex = await fetchHex(id);
    if (!hex) {
        modalTitle.innerText = '加载失败';
        modalBody.innerHTML = '无法获取该卦象数据。';
        return;
    }

    renderDetail(hex);
}

function formatPinyin(raw) {
    if (!raw) return '';
    // "shui_lei_tun" → "shuǐ léi tún" — just capitalize and space for now
    return raw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function renderDetail(hex) {
    const pinyin = formatPinyin(hex.pinyin);
    modalTitle.innerHTML = escapeHtml(hex.name) +
        (pinyin ? `<span class="hex-title-pinyin">${pinyin}</span>` : '');

    let html = '';

    // Hex info header: trigram composition + palace
    const code = hex.code || '';
    let trigramHtml = '';
    if (code.length === 6) {
        const lowerBits = code.substring(0, 3);
        const upperBits = code.substring(3, 6);
        const lower = TRIGRAM_INFO[lowerBits];
        const upper = TRIGRAM_INFO[upperBits];
        if (upper && lower) {
            trigramHtml = `<span class="hex-info-trigrams">` +
                `${upper.symbol} ${upper.name}（${upper.nature}）上 · ${lower.symbol} ${lower.name}（${lower.nature}）下` +
                `</span>`;
        }
    }
    if (trigramHtml || hex.palace) {
        html += `<div class="hex-detail-header">`;
        if (hex.palace) html += `<span class="hex-info-palace">${hex.palace}</span>`;
        if (trigramHtml) html += trigramHtml;
        html += `</div>`;
    }

    // 1. 卦辞
    html += section('卦辞', hex.guaci, hex.modern_guaci, 'modal-classical-text');

    // 2. 总注
    html += section('总注', hex.general_text, hex.modern_general_text, 'modal-modern-text');

    // 3. 高岛易断（总断）
    html += section('高岛易断（总断）', hex.takashima_general, hex.modern_takashima_general, 'modal-takashima-text');

    // 4. 爻辞 1-6
    if (hex.lines) {
        const lineLabels = ['初', '二', '三', '四', '五', '上'];
        for (let i = 1; i <= 6; i++) {
            const line = hex.lines[String(i)];
            if (!line) continue;
            const label = lineLabels[i - 1];
            html += section(`${label}爻 · 爻辞`, line.text, line.modern_text, 'modal-classical-text');
            html += section(`${label}爻 · 高岛易断`, line.takashima_explanation, line.modern_takashima_explanation, 'modal-takashima-text');
        }

        // 5. 用九/用六
        const extra = hex.lines['7'];
        if (extra) {
            html += section('用九/用六 · 辞', extra.text, extra.modern_text, 'modal-classical-text');
            html += section('用九/用六 · 卦辞', extra.guaci, extra.modern_guaci, 'modal-classical-text');
            html += section('用九/用六 · 高岛易断', extra.takashima_explanation, extra.modern_takashima_explanation, 'modal-takashima-text');
        }
    }

    modalBody.innerHTML = html;

    buildModalNav(modalBody);

    // Bind per-section toggle buttons
    modalBody.querySelectorAll('.section-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = btn.closest('.modal-section');
            const origEl = sec.querySelector('.section-original');
            const modernEl = sec.querySelector('.section-modern');
            const showingModern = !modernEl.hidden;
            origEl.hidden = !showingModern;
            modernEl.hidden = showingModern;
            btn.textContent = showingModern ? '译文' : '原文';
            btn.classList.toggle('active', !showingModern);
        });
    });
}

function buildModalNav(bodyElement) {
    const sections = bodyElement.querySelectorAll('[data-nav-title]');
    if (sections.length < 3) return;

    const nav = document.createElement('div');
    nav.className = 'modal-nav';
    sections.forEach(sec => {
        const link = document.createElement('a');
        link.className = 'modal-nav-link';
        link.textContent = sec.dataset.navTitle;
        link.href = '#' + sec.id;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        nav.appendChild(link);
    });
    bodyElement.insertBefore(nav, bodyElement.firstChild);
}

function section(title, original, modern, cssClass) {
    if (!original) return '';
    const sid = `study-sec-${sectionIdCounter++}`;
    const hasModern = !!modern;

    let toggleHtml = '';
    if (hasModern) {
        toggleHtml = `<button class="section-toggle-btn modal-toggle-btn">译文</button>`;
    }

    const modernHtml = hasModern
        ? `<div class="${cssClass} section-modern" hidden>${escapeHtml(modern)}</div>`
        : '';

    return `<div class="modal-section" id="${sid}" data-nav-title="${title}">` +
        `<div class="modal-section-title">${title}${toggleHtml}</div>` +
        `<div class="${cssClass} section-original">${escapeHtml(original)}</div>` +
        modernHtml +
        `</div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Start
init();
