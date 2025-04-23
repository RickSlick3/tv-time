import os
import re
import csv
from collections import Counter

def run_all_text_to_csv_files():

    transcripts_dir = "./transcripts"
    seasons_to_process = {"1", "2", "3"}

    season_counts = {
        season: {
            "lines": Counter(),
            "words": Counter(),
            "eps": Counter(),
        }
        for season in seasons_to_process
    }
    
    # loop through each file in each season directory
    for season in os.listdir(transcripts_dir):
        if season not in seasons_to_process:
            continue

        season_dir = os.path.join(transcripts_dir, season)
        if os.path.isdir(season_dir):
            for file_name in os.listdir(season_dir):
                file_path = os.path.join(season_dir, file_name)                    
                    
                # in the current file, process different counts
                seen_in_this_file = set()
                with open(file_path, "r", encoding="utf-8") as f:
                    for line in f:
                        
                        # only process speaking lines, ex: "name: this is their line"
                        if ":" in line:
                            # extract the character's name and normalize it
                            name = line.split(":", 1)[0].strip().lower()
                            clean_name = re.sub(r'\([^)]*\)', '', name)
                            clean_name = re.sub(r'\[[^\]]*\]',  '', clean_name).strip()
                            clean_name = clean_name.replace('"', '').replace(',', '').strip()
                            
                            if clean_name:
                                # update the counts for characters lines
                                season_counts[season]["lines"][clean_name] += 1

                                # update the counts for characters words
                                words = line.split(":")[1].strip().split()
                                season_counts[season]["words"][clean_name] += len(words)

                                # update the counts for characters episode appearances
                                if clean_name not in seen_in_this_file:
                                    seen_in_this_file.add(clean_name)
                                    season_counts[season]["eps"][clean_name] += 1
    
    # Build a sorted list of every character ever seen
    all_characters = set()
    for cnts in season_counts.values():
        all_characters |= set(cnts["lines"].keys())

    # Build CSV header (per-season + totals)
    fieldnames = (["name"]
        + [f"s{st}_{m}" for st in sorted(seasons_to_process, key=int)
                    for m in ("lines","words","eps")]
        + ["all_lines", "all_words", "all_eps"]
    )

    # Write one row per character, filling 0 if missing
    with open("./docs/data/data.csv", "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for character in sorted(all_characters):
            row = {"name": character}
            for season in sorted(seasons_to_process, key=int):
                for metric in ("lines", "words", "eps"):
                    col = f"s{season}_{metric}"
                    row[col] = season_counts[season][metric].get(character, 0)

                # totals across all seasons
                row["all_lines"] = sum(season_counts[s]["lines"].get(character,0) for s in seasons_to_process)
                row["all_words"] = sum(season_counts[s]["words"].get(character,0) for s in seasons_to_process)
                row["all_eps"] = sum(season_counts[s]["eps"].get(character,0) for s in seasons_to_process)
            writer.writerow(row)


if __name__ == "__main__":
    # create csv files with specific data 
    run_all_text_to_csv_files()