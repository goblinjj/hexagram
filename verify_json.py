import json

with open("takashima.json", "r", encoding="utf-8") as f:
    data = json.load(f)

hexagrams = data.get("hexagrams", {})
print(f"Total hexagrams: {len(hexagrams)}")

missing_fields = []
empty_fields = []

for i in range(1, 65):
    key = str(i)
    if key not in hexagrams:
        missing_fields.append(f"Hexagram {key} missing")
        continue
    
    h = hexagrams[key]
    if not h.get("name"): empty_fields.append(f"Hexagram {key} name empty")
    # General text might be empty if not in file? But unlikely.
    if not h.get("general_text"): print(f"Hexagram {key} general_text empty (might be ok)")
    if not h.get("takashima_general"): empty_fields.append(f"Hexagram {key} takashima_general empty")
    
    lines = h.get("lines", {})
    # Check lines 1-6
    for j in range(1, 7):
        l_key = str(j)
        if l_key not in lines:
            # Some hexagrams might strictly not have all lines? No, standard I Ching always has 6.
            missing_fields.append(f"Hexagram {key} Line {l_key} missing")
            continue
        
        line = lines[l_key]
        if not line.get("text"): empty_fields.append(f"Hexagram {key} Line {l_key} text empty")
        if not line.get("takashima_explanation"): empty_fields.append(f"Hexagram {key} Line {l_key} explanation empty")

if missing_fields:
    print("Missing items:")
    for m in missing_fields: print(m)
else:
    print("All hexagrams and lines present.")

if empty_fields:
    print("Empty fields:")
    for e in empty_fields: print(e)
else:
    print("All fields populated.")
