import json
import os

def split_json():
    # Ensure directory exists
    # Vite serves public/ folder at root.
    # So we put data in public/data, and fetch from /data/...
    output_dir = "public/data/takashima"
    
    # Ensure parent dir exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open("takashima.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    hexagrams = data.get("hexagrams", {})
    index_map = {}

    for key, hex_data in hexagrams.items():
        # key is "1", "2", ... "64"
        # Save individual file
        file_path = os.path.join(output_dir, f"{key}.json")
        with open(file_path, "w", encoding="utf-8") as out:
            json.dump(hex_data, out, ensure_ascii=False, indent=2)
        
        # Add to index
        if "code" in hex_data:
            index_map[hex_data["code"]] = key
            
    # Save index to public/data/takashima_index.json
    with open("public/data/takashima_index.json", "w", encoding="utf-8") as idx:
        json.dump(index_map, idx, ensure_ascii=False, indent=2)

    print(f"Split complete. {len(hexagrams)} files created in {output_dir}.")
    print("Index saved to public/data/takashima_index.json")

if __name__ == "__main__":
    split_json()
