export const PALACE_ELEMENTS = {
    "Qian": "Metal",
    "Dui": "Metal",
    "Li": "Fire",
    "Zhen": "Wood",
    "Xun": "Wood",
    "Kan": "Water",
    "Gen": "Earth",
    "Kun": "Earth"
};

export const BRANCH_ELEMENTS = {
    "Zi": "Water", "Chou": "Earth", "Yin": "Wood", "Mao": "Wood",
    "Chen": "Earth", "Si": "Fire", "Wu": "Fire", "Wei": "Earth",
    "Shen": "Metal", "You": "Metal", "Xu": "Earth", "Hai": "Water"
};

export const SIX_RELATIONS = {
    "GenerateMe": "Parents",
    "MeGenerate": "Offspring",
    "ControlMe": "Official",
    "MeControl": "Wealth",
    "SameAsMe": "Brothers"
};

export const SIX_BEASTS = ["Green Dragon", "Vermilion Bird", "Hook Snake", "Flying Snake", "White Tiger", "Black Tortoise"];

// 64 Hexagrams Data
// Format: Binary (Bottom -> Top), 0=Yin, 1=Yang
// Based on King Wen Sequence or standard lookup
export const HEXAGRAMS_DATA = {
    "111111": { name: "Qian", palace: "Qian", familyOrder: 1 }, // 乾为天
    "000000": { name: "Kun", palace: "Kun", familyOrder: 1 },   // 坤为地
    "100010": { name: "Tun", palace: "Kan", familyOrder: 2 },   // 水雷屯
    "010001": { name: "Meng", palace: "Li", familyOrder: 0, distinct: "Li" }, // 山水蒙 - Logic needed for family determination if not explicit
    
    // ... This needs to be a complete list of 64 hexagrams with their binary codes and palaces. 
    // For simplicity in this step, I will implement a helper to determine palace based on bit changes 
    // rather than hardcoding all 64 if possible, OR I'll list the 8 pure hexagrams and derive others.
    // Actually, a lookup table is safer for correctness.
    // Let's implement the 8 Pure Hexagrams first to test the logic, then expand or use an algorithmic approach.
};

// Instead of hardcoding all 64, we can use the "Bit Change" method to find the Palace.
// 1. Change 1st line (bottom) -> 1st generation
// 2. Change 2nd line -> 2nd generation
// ...
// This logic will be implemented in the Divination class.

// Na Jia Lookup Table (Inner/Outer Trigrams)
// Trigrams: Qian (111), Dui (110), Li (101), Zhen (100), Xun (011), Kan (010), Gen (001), Kun (000)
// Binary representation: Top-Mid-Bot (as standard integer? No, sticking to Bottom->Top array usually)
export const NA_JIA_TABLE = {
    "111": { // Qian
        inner: ["Zi", "Yin", "Chen"],
        outer: ["Wu", "Shen", "Xu"]
    },
    "000": { // Kun
        inner: ["Wei", "Si", "Mao"],
        outer: ["Chou", "Hai", "You"]
    },
    "100": { // Zhen (Bottom is Yang, others Yin? No, standard binary 001=1? Let's use array convention [1,0,0])
             // Zhen is Yang at bottom: [1, 0, 0]
        inner: ["Zi", "Yin", "Chen"],
        outer: ["Wu", "Shen", "Xu"]
    },
    "011": { // Xun (Bottom Yin, others Yang: [0, 1, 1])
        inner: ["Chou", "Hai", "You"],
        outer: ["Wei", "Si", "Mao"]
    },
    "010": { // Kan (Middle Yang: [0, 1, 0])
        inner: ["Yin", "Chen", "Wu"],
        outer: ["Shen", "Xu", "Zi"]
    },
    "101": { // Li (Middle Yin: [1, 0, 1])
        inner: ["Mao", "Chou", "Hai"],
        outer: ["You", "Wei", "Si"]
    },
    "001": { // Gen (Top Yang: [0, 0, 1])
        inner: ["Chen", "Wu", "Shen"],
        outer: ["Xu", "Zi", "Yin"]
    },
    "110": { // Dui (Top Yin: [1, 1, 0])
        inner: ["Si", "Mao", "Chou"],
        outer: ["Hai", "You", "Wei"]
    }
};

// Palace identity for the 8 pure trigrams (used to identify palace element)
export const TRIGRAM_PALACE_MAP = {
    "111": "Qian",
    "110": "Dui",
    "101": "Li",
    "100": "Zhen",
    "011": "Xun",
    "010": "Kan",
    "001": "Gen",
    "000": "Kun"
};
