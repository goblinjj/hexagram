import { PALACE_ELEMENTS, BRANCH_ELEMENTS, NA_JIA_TABLE, TRIGRAM_PALACE_MAP, HEXAGRAM_NAMES } from '../data/constants.js';

export class Divination {
    constructor() {
        this.castResult = []; // Array of 6 integers (6, 7, 8, 9)
    }

    // Cast a single line (3 coins)
    castLine() {
        // 3 coins: Front(Yang)=3, Back(Yin)=2
        let val = 0;
        for (let c = 0; c < 3; c++) {
            val += Math.random() < 0.5 ? 2 : 3;
        }
        this.castResult.push(val);
        return val;
    }

    // Reset casting state
    reset() {
        this.castResult = [];
    }

    // Cast full hexagram instantly (for testing or bulk)
    cast() {
        this.reset();
        for (let i = 0; i < 6; i++) {
            this.castLine();
        }
        return this.castResult;
    }

    getHexagrams() {
        const primaryLines = [];
        const variedLines = [];
        let hasMoving = false;

        this.castResult.forEach(val => {
            if (val === 6) { // Old Yin
                primaryLines.push(0);
                variedLines.push(1);
                hasMoving = true;
            } else if (val === 7) { // Young Yang
                primaryLines.push(1);
                variedLines.push(1);
            } else if (val === 8) { // Young Yin
                primaryLines.push(0);
                variedLines.push(0);
            } else if (val === 9) { // Old Yang
                primaryLines.push(1);
                variedLines.push(0);
                hasMoving = true;
            }
        });

        return {
            primary: primaryLines,
            varied: hasMoving ? variedLines : null,
            raw: this.castResult
        };
    }

    identifyPalace(lines) {
        const lower = lines.slice(0, 3).join('');
        const upper = lines.slice(3, 6).join('');

        if (upper === lower) {
            return { palace: TRIGRAM_PALACE_MAP[upper], generation: 6, shi: 6, ying: 3 };
        }

        let curr = [...lines];

        // 1
        curr[0] = curr[0] === 0 ? 1 : 0;
        let l = curr.slice(0, 3).join('');
        let u = curr.slice(3, 6).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: 1, shi: 1, ying: 4 };

        // 2
        curr[1] = curr[1] === 0 ? 1 : 0;
        l = curr.slice(0, 3).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: 2, shi: 2, ying: 5 };

        // 3
        curr[2] = curr[2] === 0 ? 1 : 0;
        l = curr.slice(0, 3).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: 3, shi: 3, ying: 6 };

        // 4
        curr[3] = curr[3] === 0 ? 1 : 0;
        l = curr.slice(0, 3).join('');
        u = curr.slice(3, 6).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: 4, shi: 4, ying: 1 };

        // 5
        curr[4] = curr[4] === 0 ? 1 : 0;
        l = curr.slice(0, 3).join('');
        u = curr.slice(3, 6).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: 5, shi: 5, ying: 2 };

        // You Hun (4th change from 5th gen state)
        // Reset to original lines and follow path to 4th
        curr = [...lines];
        // Logic: 5th gen is changing 1,2,3,4,5. 
        // You Hun is changing 4 (so index 3). 
        // Wait, "You Hun is a variation of the 4th generation".
        // Let's implement simpler: The remaining ones are either You Hun or Gui Hun.
        // You Hun: Outer trigram matches Pure Hexagram of Palace? No.

        // Correct algorithm from standard:
        // Change 1,2,3,4,5.
        // Then change 4 (index 3).
        // Check match.
        curr = [...lines];
        for (let i = 0; i < 5; i++) curr[i] = curr[i] === 0 ? 1 : 0;
        curr[3] = curr[3] === 0 ? 1 : 0; // The 4th line
        l = curr.slice(0, 3).join('');
        u = curr.slice(3, 6).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: "YouHun", shi: 4, ying: 1 };

        // Gui Hun (3rd change from You Hun state)
        // From You Hun state, change 1,2,3 (indices 0,1,2).
        // Wait, You Hun state: 1-5 changed, then 4 changed back? 
        // Standard:
        // Pure -> 1 -> 2 -> 3 -> 4 -> 5 -> You Hun -> Gui Hun.
        // You Hun: Change 4th line of 5th Gen Hexagram. 
        // Gui Hun: Change lower 3 lines of You Hun Hexagram.

        // Current state `curr` is You Hun.
        // Change 0,1,2
        curr[0] = curr[0] === 0 ? 1 : 0;
        curr[1] = curr[1] === 0 ? 1 : 0;
        curr[2] = curr[2] === 0 ? 1 : 0;
        l = curr.slice(0, 3).join('');
        u = curr.slice(3, 6).join('');
        if (l === u) return { palace: TRIGRAM_PALACE_MAP[u], generation: "GuiHun", shi: 3, ying: 6 };

        return { error: "Unknown Palace", palace: "Qian" }; // Fallback
    }

    getSixBeasts(dayStem) {
        const beasts = ["Green Dragon", "Vermilion Bird", "Hook Snake", "Flying Snake", "White Tiger", "Black Tortoise"];
        const startMap = {
            "Jia": 0, "Yi": 0,
            "Bing": 1, "Ding": 1,
            "Wu": 2,
            "Ji": 3,
            "Geng": 4, "Xin": 4,
            "Ren": 5, "Gui": 5
        };
        let startIdx = startMap[dayStem] !== undefined ? startMap[dayStem] : 0;
        const result = [];
        for (let i = 0; i < 6; i++) {
            result.push(beasts[(startIdx + i) % 6]);
        }
        return result;
    }

    getRelation(me, other) {
        if (me === other) return "Brothers";
        const generating = { "Water": "Wood", "Wood": "Fire", "Fire": "Earth", "Earth": "Metal", "Metal": "Water" };
        if (generating[me] === other) return "Offspring";
        if (generating[other] === me) return "Parents";
        const controlling = { "Water": "Fire", "Fire": "Metal", "Metal": "Wood", "Wood": "Earth", "Earth": "Water" };
        if (controlling[me] === other) return "Wealth";
        if (controlling[other] === me) return "Official";
        return "Brothers"; // Fallback
    }

    chart(lines, dayStem) {
        const palaceInfo = this.identifyPalace(lines);
        const palaceElement = PALACE_ELEMENTS[palaceInfo.palace];

        const lowerBin = lines.slice(0, 3).join('');
        const upperBin = lines.slice(3, 6).join('');

        const lowerStems = NA_JIA_TABLE[lowerBin].inner;
        const upperStems = NA_JIA_TABLE[upperBin].outer;

        const allBranches = [...lowerStems, ...upperStems];

        const sixRelations = allBranches.map(branch => {
            const branchEl = BRANCH_ELEMENTS[branch];
            return this.getRelation(palaceElement, branchEl);
        });

        const sixBeasts = this.getSixBeasts(dayStem);

        // Hidden Spirit
        const hiddenSpirits = {};
        const presentRelations = new Set(sixRelations);
        const allRelations = ["Parents", "Offspring", "Official", "Wealth", "Brothers"];
        const missingRelations = allRelations.filter(r => !presentRelations.has(r));

        if (missingRelations.length > 0) {
            let pureTrigramBin = Object.keys(TRIGRAM_PALACE_MAP).find(key => TRIGRAM_PALACE_MAP[key] === palaceInfo.palace);
            if (pureTrigramBin) {
                const pureLowerStems = NA_JIA_TABLE[pureTrigramBin].inner;
                const pureUpperStems = NA_JIA_TABLE[pureTrigramBin].outer;
                const pureBranches = [...pureLowerStems, ...pureUpperStems];

                missingRelations.forEach(missingRel => {
                    const foundIndex = pureBranches.findIndex(branch => {
                        const el = BRANCH_ELEMENTS[branch];
                        return this.getRelation(palaceElement, el) === missingRel;
                    });

                    if (foundIndex !== -1) {
                        hiddenSpirits[foundIndex] = {
                            branch: pureBranches[foundIndex],
                            element: BRANCH_ELEMENTS[pureBranches[foundIndex]],
                            relation: missingRel
                        };
                    }
                });
            }
        }

        const binaryStr = lines.join('');
        const hexName = HEXAGRAM_NAMES[binaryStr] || "未知卦";

        return {
            name: hexName,
            palace: palaceInfo,
            branches: allBranches,
            elements: allBranches.map(b => BRANCH_ELEMENTS[b]),
            relations: sixRelations,
            sixBeasts: sixBeasts,
            hiddenSpirits: hiddenSpirits
        };
    }
}
