
export class Takashima {
    constructor() {
        this.indexMap = null; // "111111" -> "1"
        this.cache = {}; // hexId -> hexData
    }

    async init() {
        try {
            // Load only the lightweight index map
            const response = await fetch('/data/takashima_index.json');
            if (!response.ok) throw new Error("Failed to load Takashima index");
            this.indexMap = await response.json();
            console.log("Takashima index loaded.");
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Get explanation for a hexagram and optional moving line.
     * Async operation as it might need to fetch data.
     * @param {string} binaryCode - The 6-bit binary string.
     * @param {number|null} movingLineIndex - 0-based index of the moving line.
     * @returns {Promise<object>} { title: string, content: string }
     */
    async getExplanation(binaryCode, movingLineIndex) {
        if (!this.indexMap) return { title: "索引未加载", error: "请刷新页面重试。" };

        const hexId = this.indexMap[binaryCode];
        if (!hexId) return { title: "未知卦象", error: "未找到对应的卦象解释。" };

        // Check cache or fetch
        let hex = this.cache[hexId];
        if (!hex) {
            try {
                const res = await fetch(`/data/takashima/${hexId}.json`);
                if (!res.ok) throw new Error(`Failed to load Hexagram ${hexId}`);
                hex = await res.json();
                this.cache[hexId] = hex;
            } catch (e) {
                console.error(e);
                return { title: "加载失败", error: "无法获取该卦象的详细信息。" };
            }
        }

        const result = {
            title: hex.name,
            guaci: hex.guaci || '',
            modern_guaci: hex.modern_guaci || '',
            general_text: hex.general_text || '',
            modern_general_text: hex.modern_general_text || '',
        };

        if (movingLineIndex !== null && movingLineIndex !== undefined) {
            const lineKey = (movingLineIndex + 1).toString();
            const line = hex.lines[lineKey];

            if (!line) return { ...result, error: "未找到该爻的变辞。" };

            const lineName = lineKey === '1' ? '初' : (lineKey === '6' ? '上' : lineKey);
            result.title = `${hex.name} - ${lineName}爻变`;
            result.lineText = line.text || '';
            result.modern_lineText = line.modern_text || '';
            result.takashima = line.takashima_explanation || '';
            result.modern_takashima = line.modern_takashima_explanation || '';
        } else {
            result.title = `${hex.name} - 总断`;
            result.takashima = hex.takashima_general || '';
            result.modern_takashima = hex.modern_takashima_general || '';
        }

        return result;
    }
    /**
     * Calculate the focal element based on moving lines logic.
     * @param {number[]} rawLines - Array of 6 integers (6, 7, 8, 9) from bottom to top.
     * @param {string} primaryCode - Binary string of primary hexagram.
     * @param {string} variedCode - Binary string of varied hexagram.
     * @returns {object} { type: 'line'|'general'|'varied_general', index: number|null, hexCode: string, description: string }
     */
    calculateFocalElement(rawLines, primaryCode, variedCode) {
        const movingIndices = [];
        rawLines.forEach((val, i) => {
            if (val === 6 || val === 9) movingIndices.push(i);
        });

        const count = movingIndices.length;
        const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

        // 0 Moving Lines: General Text of Primary
        // "本卦总断"
        if (count === 0) {
            return { type: 'general', index: null, hexCode: primaryCode, description: "本卦总断" };
        }

        // 1 Moving Line: That line
        // E.g. "初爻变"
        if (count === 1) {
            return { type: 'line', index: movingIndices[0], hexCode: primaryCode, description: `${lineNames[movingIndices[0]]}变` };
        }

        // 2 Moving Lines
        if (count === 2) {
            const idx1 = movingIndices[0]; // Lower
            const idx2 = movingIndices[1]; // Upper
            const val1 = rawLines[idx1];
            const val2 = rawLines[idx2];

            // Same polarity (both 6 or both 9) -> Upper
            // Different polarity -> The Yin (6) one
            if ((val1 === 6 && val2 === 6) || (val1 === 9 && val2 === 9)) {
                return { type: 'line', index: idx2, hexCode: primaryCode, description: `${lineNames[idx2]}变` };
            } else {
                const targetIdx = (val1 === 6 ? idx1 : idx2);
                return { type: 'line', index: targetIdx, hexCode: primaryCode, description: `${lineNames[targetIdx]}变` };
            }
        }

        // 3 Moving Lines: Middle one
        if (count === 3) {
            return { type: 'line', index: movingIndices[1], hexCode: primaryCode, description: `${lineNames[movingIndices[1]]}变` };
        }

        // 4 Moving Lines: Lower static line
        // "取X爻" (Take X Line) - technically static, reading X line.
        if (count === 4) {
            // Find static lines
            const staticIndices = [];
            rawLines.forEach((val, i) => {
                if (val === 7 || val === 8) staticIndices.push(i);
            });
            // Should be 2 static lines
            return { type: 'line', index: staticIndices[0], hexCode: primaryCode, description: `取${lineNames[staticIndices[0]]}` };
        }

        // 5 Moving Lines: The static line
        // "取X爻"
        if (count === 5) {
            const staticIndices = [];
            rawLines.forEach((val, i) => {
                if (val === 7 || val === 8) staticIndices.push(i);
            });
            // Should be 1 static line
            return { type: 'line', index: staticIndices[0], hexCode: primaryCode, description: `取${lineNames[staticIndices[0]]}` };
        }

        // 6 Moving Lines
        if (count === 6) {
            // Check for Qian (111111) or Kun (000000)
            const isAllNines = rawLines.every(v => v === 9);
            const isAllSixes = rawLines.every(v => v === 6);

            if (isAllNines) {
                return { type: 'line', index: 6, hexCode: primaryCode, description: "用九" };
            }
            if (isAllSixes) {
                return { type: 'line', index: 6, hexCode: primaryCode, description: "用六" };
            }

            // Otherwise: Varied Hexagram General
            return { type: 'varied_general', index: null, hexCode: variedCode, description: "变卦总断" };
        }

        return { type: 'general', index: null, hexCode: primaryCode, description: "未知" };
    }
}
