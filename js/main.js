import { Divination } from './core/divination.js';
import { PALACE_ELEMENTS } from './data/constants.js';
// We need to import Lunar from global scope or handle it differently since it's a UMD/CommonJS lib usually. 
// If it's loaded via script tag <script src="..."> it should be available as `Lunar` global.
// Checking implementation plan: "Download or integrate `lunar-javascript` library".
// I will assume it's available globally as `Lunar` from the script tag.

const castingBtn = document.getElementById('cast-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMsg = document.getElementById('status-message');
const dateInfo = document.getElementById('date-info');
const primaryHexContainer = document.getElementById('primary-hexagram');
const variedHexContainer = document.getElementById('varied-hexagram');

const divination = new Divination();

// Initialize Date
function initDate() {
    // Using lunar-javascript
    // Assuming 'Lunar' global is available
    if (typeof Lunar !== 'undefined') {
        const d = Lunar.Solar.fromDate(new Date());
        const lunar = d.getLunar();
        const ganZhiYear = lunar.getYearInGanZhi();
        const ganZhiMonth = lunar.getMonthInGanZhi();
        const ganZhiDay = lunar.getDayInGanZhi();
        const ganZhiHour = lunar.getTimeInGanZhi();

        dateInfo.innerHTML = `
            ${d.getYear()}年${d.getMonth()}月${d.getDay()}日 
            农历:${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} 
            <br>
            ${ganZhiYear}年 ${ganZhiMonth}月 ${ganZhiDay}日 ${ganZhiHour}时
            (空亡: ${lunar.getDayXunKong()})
        `;
        return {
            dayStem: lunar.getDayGan() // e.g. "Jia" (Chinese char? No, library returns Key or Char?)
            // Lunar-javascript usually returns Chinese chars e.g. "甲".
            // My divination logic expects "Jia" (English) or needs a mapper.
            // I'll check what the library returns. 
            // Common lib returns Chinese characters. I need a mapper.
        };
    } else {
        dateInfo.innerHTML = "Error: Lunar library not loaded.";
        return { dayStem: "Jia" }; // Fallback
    }
}

const STEM_MAP = {
    "甲": "Jia", "乙": "Yi", "丙": "Bing", "丁": "Ding", "戊": "Wu",
    "己": "Ji", "庚": "Geng", "辛": "Xin", "壬": "Ren", "癸": "Gui"
};

let currentDayStem = "Jia";

document.addEventListener('DOMContentLoaded', () => {
    const dateData = initDate();
    if (typeof Lunar !== 'undefined') {
        const d = Lunar.Solar.fromDate(new Date());
        const lunar = d.getLunar();
        const dayGan = lunar.getDayGan();
        currentDayStem = STEM_MAP[dayGan] || "Jia";
    }
});

castingBtn.addEventListener('click', () => {
    statusMsg.innerText = "起卦中... (Casting...)";
    const result = divination.cast();

    // Animate or delay? For now, instant.
    renderResult(result);

    castingBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    statusMsg.innerText = "起卦完成 (Casting Complete)";
});

resetBtn.addEventListener('click', () => {
    primaryHexContainer.querySelector('.hexagram-lines').innerHTML = '';
    primaryHexContainer.querySelector('.hexagram-info').innerHTML = '';
    variedHexContainer.style.display = 'none';
    variedHexContainer.querySelector('.hexagram-lines').innerHTML = '';

    castingBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
    statusMsg.innerText = "点击按钮开始起卦...";
});

function renderResult(castResult) {
    const hexs = divination.getHexagrams();

    // Render Primary
    const primaryChart = divination.chart(hexs.primary, currentDayStem);
    renderHexagram(primaryHexContainer, hexs.primary, primaryChart, hexs.raw, 'Primary');

    // Render Varied if exists
    if (hexs.varied) {
        variedHexContainer.style.display = 'block';
        const variedChart = divination.chart(hexs.varied, currentDayStem);
        renderHexagram(variedHexContainer, hexs.varied, variedChart, null, 'Varied');
    } else {
        variedHexContainer.style.display = 'none';
    }
}

function renderHexagram(container, binaryLines, chartData, rawLines, type) {
    const linesContainer = container.querySelector('.hexagram-lines');
    linesContainer.innerHTML = '';

    // Lines are 0-5 (Bottom to Top)
    // Display should be Top to Bottom visually? 
    // Usually CSS flex-direction: column-reverse handles it if we append 0 first.
    // My CSS has .hexagram-lines { flex-direction: column-reverse; } so I append 0 (bottom) first.

    binaryLines.forEach((val, index) => {
        const lineRow = document.createElement('div');
        lineRow.className = 'line-row';

        // Left Info: Six Beasts + Six Relations
        // For Varied hexagram, we might show less info? 
        // User request: "Left: Primary (Right side: Relations, Beasts...)"
        // Wait, UI Layout requirement:
        // Left (Primary): "Right side elements: Six Relations, Six Beasts, Varied Marker".
        // My CSS: .line-info-left, .line-graphic, .line-info-right.

        // Let's put Beasts and Relations on the LEFT or RIGHT? 
        // User: "Left column: Primary Hexagram (Lines, Right side annotations: Relations, Beasts)"

        const relation = chartData.relations[index];
        const beast = chartData.sixBeasts ? chartData.sixBeasts[index] : "";
        const branch = chartData.branches[index];
        const element = chartData.elements[index];
        const shi = (chartData.palace.shi === (index + 1)) ? "世" : "";
        const ying = (chartData.palace.ying === (index + 1)) ? "应" : "";

        const hidden = (type === 'Primary' && chartData.hiddenSpirits && chartData.hiddenSpirits[index])
            ? `<span style="color:grey; font-size:0.8em">伏:${chartData.hiddenSpirits[index].relation}</span>`
            : "";

        // Raw value to check if moving
        // rawLines is available for Primary.
        let isMoving = false;
        let movingSymbol = "";
        if (type === 'Primary' && rawLines) {
            const raw = rawLines[index];
            if (raw === 6) { // Old Yin -> Moving
                isMoving = true;
                movingSymbol = "X";
            } else if (raw === 9) { // Old Yang -> Moving
                isMoving = true;
                movingSymbol = "O";
            }
        }

        // Mapping English terms to Chinese for display
        const REL_CN = { "Parents": "父母", "Offspring": "子孙", "Official": "官鬼", "Wealth": "妻财", "Brothers": "兄弟" };
        const BEAST_CN = {
            "Green Dragon": "青龙", "Vermilion Bird": "朱雀", "Hook Snake": "勾陈",
            "Flying Snake": "腾蛇", "White Tiger": "白虎", "Black Tortoise": "玄武"
        };
        const ELEMENT_CN = { "Metal": "金", "Wood": "木", "Water": "水", "Fire": "火", "Earth": "土" };
        const BRANCH_CN = {
            "Zi": "子", "Chou": "丑", "Yin": "寅", "Mao": "卯", "Chen": "辰", "Si": "巳",
            "Wu": "午", "Wei": "未", "Shen": "申", "You": "酉", "Xu": "戌", "Hai": "亥"
        };

        const relText = REL_CN[relation] || relation;
        const beastText = BEAST_CN[beast] || "";
        const branchText = BRANCH_CN[branch] || branch;
        const elText = ELEMENT_CN[element] || element;

        const leftText = type === 'Primary'
            ? `${beastText} ${relText}`
            : `${relText}`; // Varied might show relation

        const rightText = `${branchText}(${elText}) ${shi}${ying} ${movingSymbol} ${hidden}`;

        // Setup Left Info
        const leftDiv = document.createElement('div');
        leftDiv.className = 'line-info-left';
        leftDiv.innerHTML = leftText;

        // Setup Graphic
        const graphicDiv = document.createElement('div');
        graphicDiv.className = 'line-graphic';
        if (isMoving) graphicDiv.classList.add('moving');

        const lineDiv = document.createElement('div');
        lineDiv.className = val === 1 ? 'yang-line' : 'yin-line';
        graphicDiv.appendChild(lineDiv);

        // Setup Right Info
        const rightDiv = document.createElement('div');
        rightDiv.className = 'line-info-right';
        rightDiv.innerHTML = rightText;

        lineRow.appendChild(leftDiv);
        lineRow.appendChild(graphicDiv);
        lineRow.appendChild(rightDiv);

        linesContainer.appendChild(lineRow);
    });

    // Info
    const infoContainer = container.querySelector('.hexagram-info');
    const PALACE_CN = {
        "Qian": "乾", "Dui": "兑", "Li": "离", "Zhen": "震", "Xun": "巽", "Kan": "坎", "Gen": "艮", "Kun": "坤"
    };
    const pName = PALACE_CN[chartData.palace.palace] || chartData.palace.palace;
    infoContainer.innerHTML = `
        <div>${pName}宫 (${ELEMENT_CN[PALACE_ELEMENTS[chartData.palace.palace]]})</div>
        ${chartData.palace.generation === 6 ? "六冲卦?" : ""}
    `;
}
