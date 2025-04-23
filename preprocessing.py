import os
import re
import csv
from collections import Counter

TRANSCRIPTS_DIR = "./transcripts"
SEASONS_TO_PROCESS = {"1", "2", "3"}


def character_stats_per_season():
    season_counts = {
        season: {
            "lines": Counter(),
            "words": Counter(),
            "eps": Counter(),
        }
        for season in SEASONS_TO_PROCESS
    }
    
    # loop through each file in each season directory
    for season in os.listdir(TRANSCRIPTS_DIR):
        if season not in SEASONS_TO_PROCESS:
            continue

        season_dir = os.path.join(TRANSCRIPTS_DIR, season)
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
        + [f"s{st}_{m}" for st in sorted(SEASONS_TO_PROCESS, key=int)
                    for m in ("lines","words","eps")]
        + ["all_lines", "all_words", "all_eps"]
    )

    # Write one row per character, filling 0 if missing
    with open("./docs/data/all_characters_per_season.csv", "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for character in sorted(all_characters):
            row = {"name": character}
            for season in sorted(SEASONS_TO_PROCESS, key=int):
                for metric in ("lines", "words", "eps"):
                    col = f"s{season}_{metric}"
                    row[col] = season_counts[season][metric].get(character, 0)

                # totals across all seasons
                row["all_lines"] = sum(season_counts[s]["lines"].get(character,0) for s in SEASONS_TO_PROCESS)
                row["all_words"] = sum(season_counts[s]["words"].get(character,0) for s in SEASONS_TO_PROCESS)
                row["all_eps"] = sum(season_counts[s]["eps"].get(character,0) for s in SEASONS_TO_PROCESS)
            writer.writerow(row)


def main_character_stats_per_episode():
    main_characters = {"rick", "morty", "beth", "jerry", "summer"}

    # 2) Discover all files and initialize per-file counters
    file_order = []   # to preserve column order
    file_counts = {}

    for season in sorted(SEASONS_TO_PROCESS, key=int):
        season_dir = os.path.join(TRANSCRIPTS_DIR, season)
        if not os.path.isdir(season_dir):
            continue

        for fn in sorted(os.listdir(season_dir)):
            path = os.path.join(season_dir, fn)
            if not os.path.isfile(path):
                continue

            # create a simple key (e.g. "S1_Ep1.txt") or just the filename
            file_key = f"{season}_{fn}"
            file_order.append(file_key)
            file_counts[file_key] = {
                "lines":    Counter(),
                "words":    Counter(),
                "episodes": Counter(),
            }

            seen_in_file = set()
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if ":" not in line:
                        continue

                    # extract and clean the speaker name
                    name = line.split(":", 1)[0].strip().lower()
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', '', name).strip()
                    if name not in main_characters:
                        continue

                    # count every line
                    file_counts[file_key]["lines"][name] += 1

                    # count words
                    words = line.split(":",1)[1].split()
                    file_counts[file_key]["words"][name] += len(words)

                    # count one episode appearance
                    if name not in seen_in_file:
                        seen_in_file.add(name)
                        file_counts[file_key]["episodes"][name] += 1

    # 3) Write out the per-file CSV
    fieldnames = ["name"] + [
        f"{fk}_{metric}"
        for fk in file_order
        for metric in ("lines","words","episodes")
    ]

    with open("./docs/data/main_characters_per_episode.csv", "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for char in sorted(main_characters):
            row = {"name": char}
            for fk in file_order:
                for metric in ("lines","words","episodes"):
                    col = f"{fk}_{metric}"
                    row[col] = file_counts[fk][metric].get(char, 0)
            writer.writerow(row)


if __name__ == "__main__":
    # create csv files with specific data 
    character_stats_per_season()
    main_character_stats_per_episode()