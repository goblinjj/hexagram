import { HEXAGRAM_NAMES } from './data/constants.js';

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
}

function renderGrid() {
    const grid = document.getElementById('hexagram-grid');

    for (let id = 1; id <= 64; id++) {
        const code = idToCode[String(id)];
        const name = code ? (HEXAGRAM_NAMES[code] || `卦${id}`) : `卦${id}`;

        const cell = document.createElement('div');
        cell.className = 'hex-cell';
        cell.dataset.id = id;
        cell.innerHTML =
            `<span class="hex-cell-num">${id}</span>` +
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
let isModern = false;

closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.style.display = 'none';
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

async function showHexDetail(id) {
    modalTitle.innerText = '加载中...';
    modalBody.innerHTML = '';
    modal.style.display = 'block';
    isModern = false;

    const hex = await fetchHex(id);
    if (!hex) {
        modalTitle.innerText = '加载失败';
        modalBody.innerHTML = '无法获取该卦象数据。';
        return;
    }

    renderDetail(hex);
}

function renderDetail(hex) {
    modalTitle.innerText = hex.name;

    // Check if any modern field exists
    const hasModern = !!(
        hex.modern_guaci ||
        hex.modern_general_text ||
        hex.modern_takashima_general ||
        (hex.lines && Object.values(hex.lines).some(l =>
            l.modern_text || l.modern_takashima_explanation
        ))
    );

    let html = '';

    // Toggle button
    if (hasModern) {
        html += `<div class="modal-toggle-wrap">` +
            `<button class="modal-toggle-btn${isModern ? ' active' : ''}" id="study-toggle-btn">` +
            `${isModern ? '切换原文' : '切换译文'}` +
            `</button></div>`;
    }

    // 1. 卦辞
    const guaci = pick(hex.guaci, hex.modern_guaci);
    if (guaci) {
        html += section('卦辞', guaci, 'modal-classical-text');
    }

    // 2. 总注
    const general = pick(hex.general_text, hex.modern_general_text);
    if (general) {
        html += section('总注', general, 'modal-modern-text');
    }

    // 3. 高岛易断（总断）
    const takGen = pick(hex.takashima_general, hex.modern_takashima_general);
    if (takGen) {
        html += section('高岛易断（总断）', takGen, 'modal-takashima-text');
    }

    // 4. 爻辞 1-6
    if (hex.lines) {
        const lineLabels = ['初', '二', '三', '四', '五', '上'];
        for (let i = 1; i <= 6; i++) {
            const line = hex.lines[String(i)];
            if (!line) continue;

            const label = lineLabels[i - 1];

            // 爻辞
            const lineText = pick(line.text, line.modern_text);
            if (lineText) {
                html += section(`${label}爻 · 爻辞`, lineText, 'modal-classical-text');
            }

            // 高岛易断
            const lineTak = pick(line.takashima_explanation, line.modern_takashima_explanation);
            if (lineTak) {
                html += section(`${label}爻 · 高岛易断`, lineTak, 'modal-takashima-text');
            }
        }

        // 5. 用九/用六 (lines["7"] if present)
        const extra = hex.lines['7'];
        if (extra) {
            const extraText = pick(extra.text, extra.modern_text);
            if (extraText) {
                html += section('用九/用六 · 辞', extraText, 'modal-classical-text');
            }
            const extraGuaci = pick(extra.guaci, extra.modern_guaci);
            if (extraGuaci) {
                html += section('用九/用六 · 卦辞', extraGuaci, 'modal-classical-text');
            }
            const extraTak = pick(extra.takashima_explanation, extra.modern_takashima_explanation);
            if (extraTak) {
                html += section('用九/用六 · 高岛易断', extraTak, 'modal-takashima-text');
            }
        }
    }

    modalBody.innerHTML = html;

    // Bind toggle
    if (hasModern) {
        const btn = document.getElementById('study-toggle-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                isModern = !isModern;
                renderDetail(hex);
            });
        }
    }
}

/** Pick original or modern text based on toggle, with fallback */
function pick(original, modern) {
    if (isModern) return modern || original || '';
    return original || '';
}

function section(title, text, cssClass) {
    if (!text) return '';
    return `<div class="modal-section">` +
        `<div class="modal-section-title">${title}</div>` +
        `<div class="${cssClass}">${escapeHtml(text)}</div>` +
        `</div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Start
init();
