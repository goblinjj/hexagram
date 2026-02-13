import json
import os

def split_json():
    # Ensure directory exists
    output_dir = "public/data/takashima"
    # If public doesn't exist, maybe we are in root and vite serves from root?
    # Let's check where index.html is. It is in root. 
    # So we can just put in `data/takashima` if we want, but standard Vite often uses `public`.
    # However, user's current project structure seems to have `index.html` in root.
    # Let's put it in `data/takashima` to be consistent with `js/data`.
    # Wait, `js/data` contains JS files.
    # Let's create `data/takashima` in the root.
    
    target_dir = "data/takashima"
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    with open("takashima.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    hexagrams = data.get("hexagrams", {})
    index_map = {}

    for key, hex_data in hexagrams.items():
        # key is "1", "2", ... "64"
        # Save individual file
        file_path = os.path.join(target_dir, f"{key}.json")
        with open(file_path, "w", encoding="utf-8") as out:
            json.dump(hex_data, out, ensure_ascii=False, indent=2)
        
        # Add to index
        if "code" in hex_data:
            index_map[hex_data["code"]] = key
            
    # Save index
    with open("data/takashima_index.json", "w", encoding="utf-8") as idx:
        json.dump(index_map, idx, ensure_ascii=False, indent=2)

    print(f"Split complete. {len(hexagrams)} files created in {target_dir}.")
    print("Index saved to data/takashima_index.json")

if __name__ == "__main__":
    split_json()
