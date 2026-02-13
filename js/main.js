import { Divination } from './core/divination.js';
import { PALACE_ELEMENTS } from './data/constants.js';

const castingBtn = document.getElementById('cast-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMsg = document.getElementById('status-message');
const dateInfo = document.getElementById('date-info');
const primaryHexContainer = document.getElementById('primary-hexagram');
const variedHexContainer = document.getElementById('varied-hexagram');

const divination = new Divination();

function initDate() {
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
            dayStem: lunar.getDayGan()
        };
    } else {
        dateInfo.innerHTML = "错误: Lunar 库未加载。";
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
    if (typeof Lunar !== 'undefined') {
        const d = Lunar.Solar.fromDate(new Date());
        const lunar = d.getLunar();
        const dayGan = lunar.getDayGan();
        currentDayStem = STEM_MAP[dayGan] || "Jia";
    }
});

castingBtn.addEventListener('click', () => {
    statusMsg.innerText = "起卦中...";
    const result = divination.cast();

    renderResult(result);

    castingBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    statusMsg.innerText = "起卦完成";
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
