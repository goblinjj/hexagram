import json
import re
import os
import sys

# Add current directory to path to find constants
sys.path.append(os.getcwd())

try:
    from hexagram_constants import HEXAGRAM_DATA
except ImportError:
    # Fallback if file not found or path issue, though it should be there
    HEXAGRAM_DATA = {}
    print("Warning: hexagram_constants not found, metadata will be empty.")

def parse_gaodao(file_path, output_path):
    print(f"Reading file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    hexagrams = {}
    current_hex = None
    current_line_num = None
    
    # State tracking
    # 0: Searching for start
    # 1: In Hexagram General
    # 2: In Line
    state = 0
    
    # buffers
    takashima_general_buffer = []
    takashima_line_buffer = []
    
    # Regex
    # Matches "01　乾为天"
    hex_header_re = re.compile(r'^(\d{2})　(.*)$')
    # Matches "初九：..." or "九二：..."
    # Note: Using unicode for colon just in case: ：. Also handling ; and , as separators.
    line_header_re = re.compile(r'^(初[九六]|九[二三四五]|六[二三四五]|上[九六]|用[九六])[:：;；,，](.*)$')
    
    # Find start index
    start_index = 0
    start_marker = "01　乾为天"
    for i, line in enumerate(lines):
        if start_marker in line and i > 1000: # Ensure we are in the main section, not TOC
            start_index = i
            break
            
    print(f"Starting parse at line {start_index}")
    if start_index == 0:
        print("Error: Could not find start marker in expected location.")
        # Try finding it anywhere if > 1000 check failed or just take the first one if unique
        # But we know it is around line 1606.
    
    i = start_index
    current_hex_id = None
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for Hexagram Header
        hex_match = hex_header_re.match(line)
        if hex_match:
            # Save previous hexagram if exists
            if current_hex:
                # Save last line of previous hexagram
                if current_line_num:
                    full_expl = "\n".join(takashima_line_buffer).strip()
                    if "【例】" in full_expl:
                         full_expl = full_expl.split("【例】")[0].strip()
                    current_hex['lines'][current_line_num]['takashima_explanation'] = full_expl
                    
                # Save general explanation
                gen_expl = "\n".join(takashima_general_buffer).strip()
                if "【例】" in gen_expl:
                    gen_expl = gen_expl.split("【例】")[0].strip()
                current_hex['takashima_general'] = gen_expl
                
                hexagrams[current_hex_id] = current_hex
                print(f"Processed Hexagram {current_hex_id}: {current_hex['name']}")

            # Start new hexagram
            hex_id_str = hex_match.group(1)
            hex_name = hex_match.group(2).strip()
            current_hex_id = str(int(hex_id_str)) # "01" -> "1"
            
            const_data = HEXAGRAM_DATA.get(hex_name, {})
            # Reverse code to match frontend Bottom-to-Top
            raw_code = const_data.get("code", "")
            code = raw_code[::-1]
            
            current_hex = {
                "name": hex_name,
                "pinyin": const_data.get("pinyin", ""),
                "code": code,
                "palace": const_data.get("palace", ""),
                "general_text": "",
                "takashima_general": "",
                "lines": {}
            }
            
            takashima_general_buffer = []
            takashima_line_buffer = []
            current_line_num = None
            
            state = 1
            i += 1
            continue

        # Check for Line Header
        line_match = line_header_re.match(line)
        if line_match:
            # Save previous line if exists
            if current_hex and current_line_num:
                full_expl = "\n".join(takashima_line_buffer).strip()
                if "【例】" in full_expl:
                     full_expl = full_expl.split("【例】")[0].strip()
                current_hex['lines'][current_line_num]['takashima_explanation'] = full_expl

            # Save general explanation if we were in general state
            if state == 1 and current_hex:
                 gen_expl = "\n".join(takashima_general_buffer).strip()
                 if "【例】" in gen_expl:
                     gen_expl = gen_expl.split("【例】")[0].strip()
                 # If general text was never set (unexpected), set it from buffer logic? 
                 # We handle general text setting in extraction loop below.
                 current_hex['takashima_general'] = gen_expl

            # Start new line
            line_name = line_match.group(1) # e.g. 初九
            line_content = line_match.group(2).strip()
            
            line_num_map = {
                "初九": "1", "初六": "1",
                "九二": "2", "六二": "2",
                "九三": "3", "六三": "3",
                "九四": "4", "六四": "4",
                "九五": "5", "六五": "5",
                "上九": "6", "上六": "6",
                "用九": "7", "用六": "7"
            }
            current_line_num = line_num_map.get(line_name)
            
            if current_line_num:
                current_hex['lines'][current_line_num] = {
                    "text": f"{line_name}：{line_content}",
                    "takashima_explanation": ""
                }
                takashima_line_buffer = []
                state = 2
            
            i += 1
            continue
            
        # Content processing
        if state == 1: # General section
            if not line:
                i += 1
                continue
                
            # Heuristic: The first non-empty line after Header is General Text.
            if not current_hex['general_text']:
                 current_hex['general_text'] = line
            else:
                 takashima_general_buffer.append(line)
                 
        elif state == 2: # Line section
            if not line:
                 if takashima_line_buffer and takashima_line_buffer[-1] != "\n":
                      takashima_line_buffer.append("\n")
                 i += 1
                 continue
            
            takashima_line_buffer.append(line)
            
        i += 1

    # Save final hexagram
    if current_hex:
        if current_line_num:
            full_expl = "\n".join(takashima_line_buffer).strip()
            if "【例】" in full_expl:
                 full_expl = full_expl.split("【例】")[0].strip()
            current_hex['lines'][current_line_num]['takashima_explanation'] = full_expl
        
        # Also need to save general text if we ended on general state (unlikely for final, but consistent)
        if state == 1: 
             gen_expl = "\n".join(takashima_general_buffer).strip()
             if "【例】" in gen_expl:
                 gen_expl = gen_expl.split("【例】")[0].strip()
             current_hex['takashima_general'] = gen_expl
             
        hexagrams[current_hex_id] = current_hex
        print(f"Processed Hexagram {current_hex_id}: {current_hex['name']}")

    # Construct final output
    final_output = {"hexagrams": hexagrams}
    
    print(f"Total Hexagrams parsed: {len(hexagrams)}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    parse_gaodao("/home/gobling/work/hexagram/gaodao.txt", "takashima.json")
