import { Divination } from './core/divination.js';
import { PALACE_ELEMENTS } from './data/constants.js';
import { Solar, Lunar } from 'lunar-javascript';

const castingBtn = document.getElementById('cast-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMsg = document.getElementById('status-message');
const dateInfo = document.getElementById('date-info');
const primaryHexContainer = document.getElementById('primary-hexagram');
const variedHexContainer = document.getElementById('varied-hexagram');

const divination = new Divination();

function initDate() {
    try {
        const d = Solar.fromDate(new Date());
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
            dayStem: lunar.getDayGan()
        };

    } catch (e) {
        console.error(e);
        dateInfo.innerHTML = "错误: 日期库加载失败。";
        return { dayStem: "Jia" };
    }
}

const STEM_MAP = {
    "甲": "Jia", "乙": "Yi", "丙": "Bing", "丁": "Ding", "戊": "Wu",
    "己": "Ji", "庚": "Geng", "辛": "Xin", "壬": "Ren", "癸": "Gui"
};

let currentDayStem = "Jia";

document.addEventListener('DOMContentLoaded', () => {
    const dateData = initDate();
    const d = Solar.fromDate(new Date());
    const lunar = d.getLunar();
    const dayGan = lunar.getDayGan();
    currentDayStem = STEM_MAP[dayGan] || "Jia";

    // Initialize UI state
    window.startCasting();
});

const castingButtonText = [
    "开始起卦 (掷初爻)", "掷二爻", "掷三爻", "掷四爻", "掷五爻", "掷上爻"
];

let castingStep = 0;
const coinContainer = document.getElementById('coin-container');

window.startCasting = () => {
    castingStep = 0;
    divination.reset();
    primaryHexContainer.style.display = 'none';
    primaryHexContainer.querySelector('.hexagram-lines').innerHTML = '';
    primaryHexContainer.querySelector('.hexagram-info').innerHTML = '';
    variedHexContainer.style.display = 'none';
    variedHexContainer.querySelector('.hexagram-lines').innerHTML = '';

    castingBtn.innerText = castingButtonText[0];
    castingBtn.disabled = false;
    castingBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
    statusMsg.innerText = "点击按钮开始抛掷铜钱...";
    coinContainer.style.display = 'none';
};

castingBtn.addEventListener('click', () => {
    if (castingStep < 6) {
        performToss();
    }
});

resetBtn.addEventListener('click', () => {
    window.startCasting();
});

function performToss() {
    castingBtn.disabled = true;
    statusMsg.innerText = "掷铜钱中...";
    coinContainer.style.display = 'flex';

    // 1. Determine targets (Collision limit)
    // Area: 300x150. Coin: 50x50.
    const targets = [];
    let attempts = 0;
    while (targets.length < 3 && attempts < 100) {
        const left = Math.random() * 250; // 300 - 50
        const top = Math.random() * 100;  // 150 - 50

        let overlap = false;
        for (const t of targets) {
            const dx = t.left - left;
            const dy = t.top - top;
            // Distance check (55px to be safe)
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                overlap = true;
                break;
            }
        }
        if (!overlap) {
            targets.push({ left, top });
        }
        attempts++;
    }
    // Fallback if placement fails
    while (targets.length < 3) {
        targets.push({ left: Math.random() * 250, top: Math.random() * 100 });
    }

    // 2. Prepare coins
    const coins = coinContainer.querySelectorAll('.coin');
    const indices = [0, 1, 2];
    // Shuffle indices for stopping order
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // 3. Start Motion
    indices.forEach((coinIdx, i) => {
        const c = coins[coinIdx];
        const target = targets[coinIdx];

        // Random start position (cluster near center for "toss" effect)
        c.style.transition = 'none';
        c.style.left = (125 + Math.random() * 50) + 'px';
        c.style.top = (50 + Math.random() * 50) + 'px';
        c.style.transform = `rotate(${Math.random() * 360}deg)`;

        // Trigger reflow
        c.offsetHeight;

        const stopDelay = 800 + (i * 600) + Math.random() * 300;

        // Reset class to start spin
        c.className = 'coin spinning';
        c.innerText = '';

        // spin speed
        c.style.animationDuration = (0.5 + Math.random() * 0.3) + 's';

        // Smooth Roll: Transition to target over the duration of the delay
        c.style.transition = `left ${stopDelay}ms ease-out, top ${stopDelay}ms ease-out`;

        // Set Target Position
        c.style.left = target.left + 'px';
        c.style.top = target.top + 'px';

        // Store delay on the element for retrieval
        c.dataset.stopDelay = stopDelay;
    });

    // 4. Logic & Feedback
    const lineVal = divination.castLine();
    const coinValues = decomposeToCoins(lineVal);
    let completedCount = 0;

    setVibration(3);

    // Visual Flicker Interval (Texture swap only, NO movement - pure texture toggle)
    const flickerInterval = setInterval(() => {
        const spinningCoins = coinContainer.querySelectorAll('.coin.spinning');
        if (spinningCoins.length === 0) {
            clearInterval(flickerInterval);
            return;
        }
        spinningCoins.forEach(c => {
            const isYin = Math.random() > 0.5;
            // Preserve spinning class, just toggle yin/yang class for color
            c.classList.remove('yin', 'yang');
            c.classList.add(isYin ? 'yin' : 'yang');
            c.innerText = isYin ? "阴" : "阳";
        });
    }, 80);

    // 5. Stopping Logic
    indices.forEach((coinIdx, i) => {
        const c = coins[coinIdx];
        const delay = parseFloat(c.dataset.stopDelay);

        setTimeout(() => {
            const val = coinValues[coinIdx];

            // Stop spinning
            c.className = 'coin';
            c.style.animationDuration = '';
            c.style.transition = ''; // Clear transition

            // Set Final Face
            if (val === 2) {
                c.classList.add('yin');
                c.innerText = "阴";
            } else {
                c.classList.add('yang');
                c.innerText = "阳";
            }

            // Final resting rotation (random angle on floor)
            c.style.transform = `rotate(${Math.random() * 360}deg)`;

            completedCount++;
            setVibration(3 - completedCount);

            if (completedCount === 3) {
                clearInterval(flickerInterval);
                finishToss(lineVal);
            }
        }, delay);
    });
}

function setVibration(level) {
    if (window.vibrationTimer) clearInterval(window.vibrationTimer);
    if (!navigator.vibrate) return;
    navigator.vibrate(0); // Stop current

    if (level <= 0) return;

    // Simulate intensity levels using pulse patterns
    const patterns = {
        3: { duration: 80, interval: 100 },
        2: { duration: 50, interval: 150 },
        1: { duration: 30, interval: 300 }
    };

    const p = patterns[level];
    const run = () => navigator.vibrate(p.duration);

    run(); // Start immediately
    window.vibrationTimer = setInterval(run, p.interval);
}

function finishToss(lineVal) {
    castingStep++;

    if (castingStep === 1) {
        primaryHexContainer.style.display = 'block';
    }

    const stepName = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][castingStep - 1];
    statusMsg.innerText = `${stepName}掷得: ${getLineName(lineVal)}`;

    renderSingleLine(primaryHexContainer, lineVal, castingStep - 1);

    castingBtn.disabled = false;

    if (castingStep < 6) {
        castingBtn.innerText = castingButtonText[castingStep];
    } else {
        statusMsg.innerText = "起卦完成";
        castingBtn.style.display = 'none';
        resetBtn.innerText = "重新起卦";
        resetBtn.style.display = 'inline-block';

        setTimeout(() => {
            const result = divination.castResult;
            renderResult(result);
        }, 500);
    }
}

function decomposeToCoins(sum) {
    let coins;
    if (sum === 6) coins = [2, 2, 2];
    else if (sum === 9) coins = [3, 3, 3];
    else if (sum === 7) coins = [2, 2, 3]; // 2+2+3=7 (Shao Yang) - 1 Yang, 2 Yins
    else if (sum === 8) coins = [2, 3, 3]; // 2+3+3=8 (Shao Yin) - 1 Yin, 2 Yangs
    else coins = [2, 3, 3];

    // Shuffle for visual effect
    for (let i = coins.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coins[i], coins[j]] = [coins[j], coins[i]];
    }
    return coins;
}

function getLineName(val) {
    if (val === 6) return "老阴 (变)";
    if (val === 7) return "少阳 (静)";
    if (val === 8) return "少阴 (静)";
    if (val === 9) return "老阳 (变)";
    return "";
}

function renderSingleLine(container, val, index) {
    const linesContainer = container.querySelector('.hexagram-lines');
    const lineRow = document.createElement('div');
    lineRow.className = 'line-row';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'line-info-left';
    leftDiv.innerText = `[${index + 1}]`;

    const graphicDiv = document.createElement('div');
    graphicDiv.className = 'line-graphic';

    let isMoving = false;
    let movingSymbol = "";
    if (val === 6) { isMoving = true; movingSymbol = "X"; }
    else if (val === 9) { isMoving = true; movingSymbol = "O"; }
    if (isMoving) graphicDiv.classList.add('moving');

    const lineDiv = document.createElement('div');
    const isYang = (val % 2 !== 0);
    lineDiv.className = isYang ? 'yang-line' : 'yin-line';
    graphicDiv.appendChild(lineDiv);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'line-info-right';
    rightDiv.innerHTML = `${getLineName(val)} ${movingSymbol}`;

    lineRow.appendChild(leftDiv);
    lineRow.appendChild(graphicDiv);
    lineRow.appendChild(rightDiv);

    linesContainer.appendChild(lineRow);
}

function renderResult(castResult) {
    const hexs = divination.getHexagrams();

    // Render Primary
    const primaryChart = divination.chart(hexs.primary, currentDayStem);
    renderHexagram(primaryHexContainer, hexs.primary, primaryChart, hexs.raw, 'Primary');

    // Render Varied
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

    binaryLines.forEach((val, index) => {
        const lineRow = document.createElement('div');
        lineRow.className = 'line-row';

        const relation = chartData.relations[index];
        const beast = chartData.sixBeasts ? chartData.sixBeasts[index] : "";
        const branch = chartData.branches[index];
        const element = chartData.elements[index];
        const shi = (chartData.palace.shi === (index + 1)) ? "世" : "";
        const ying = (chartData.palace.ying === (index + 1)) ? "应" : "";

        let hiddenText = "";
        if (type === 'Primary' && chartData.hiddenSpirits && chartData.hiddenSpirits[index]) {
            const hs = chartData.hiddenSpirits[index];
            const hsRel = REL_CN[hs.relation];
            const hsBranch = BRANCH_CN[hs.branch];
            const hsEl = ELEMENT_CN[hs.element];
            hiddenText = `<span style="color:red; font-size:0.8em; margin-left:5px;">(伏: ${hsRel}${hsBranch}${hsEl})</span>`;
        }

        let isMoving = false;
        let movingSymbol = "";
        if (type === 'Primary' && rawLines) {
            const raw = rawLines[index];
            if (raw === 6) {
                isMoving = true;
                movingSymbol = "X";
            } else if (raw === 9) {
                isMoving = true;
                movingSymbol = "O";
            }
        }

        const relText = REL_CN[relation] || relation;
        const beastText = BEAST_CN[beast] || "";
        const branchText = BRANCH_CN[branch] || branch;
        const elText = ELEMENT_CN[element] || element;

        const leftText = type === 'Primary'
            ? `${beastText} ${relText}`
            : `${relText}`;

        const rightText = `${branchText}${elText} ${shi}${ying} ${movingSymbol} ${hiddenText}`;

        const leftDiv = document.createElement('div');
        leftDiv.className = 'line-info-left';
        leftDiv.innerHTML = leftText;

        const graphicDiv = document.createElement('div');
        graphicDiv.className = 'line-graphic';
        if (isMoving) graphicDiv.classList.add('moving');

        const lineDiv = document.createElement('div');
        lineDiv.className = val === 1 ? 'yang-line' : 'yin-line';
        graphicDiv.appendChild(lineDiv);

        const rightDiv = document.createElement('div');
        rightDiv.className = 'line-info-right';
        rightDiv.innerHTML = rightText;

        lineRow.appendChild(leftDiv);
        lineRow.appendChild(graphicDiv);
        lineRow.appendChild(rightDiv);

        linesContainer.appendChild(lineRow);
    });

    const infoContainer = container.querySelector('.hexagram-info');
    const PALACE_CN = {
        "Qian": "乾", "Dui": "兑", "Li": "离", "Zhen": "震", "Xun": "巽", "Kan": "坎", "Gen": "艮", "Kun": "坤"
    };
    const pName = PALACE_CN[chartData.palace.palace] || chartData.palace.palace;
    const genText = chartData.palace.generation === 6 ? "六冲" :
        (chartData.palace.generation === "YouHun" ? "游魂" :
            (chartData.palace.generation === "GuiHun" ? "归魂" :
                chartData.palace.generation + "世"));

    infoContainer.innerHTML = `
        <div style="font-size:1.2em; margin-bottom:5px;">${chartData.name}</div>
        <div>${pName}宫${ELEMENT_CN[PALACE_ELEMENTS[chartData.palace.palace]]} - ${genText}</div>
    `;
}
