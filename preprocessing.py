import os
import re
from collections import Counter

def run_all_text_to_csv_files():

    transcripts_dir = "./transcripts"
    allowed = {"1"}

    character_speaks_counts = Counter()
    
    # loop through each file in each season directory
    for season in os.listdir(transcripts_dir):
        if season not in allowed:
            continue

        season_dir = os.path.join(transcripts_dir, season)
        if os.path.isdir(season_dir):
            for file_name in os.listdir(season_dir):
                file_path = os.path.join(season_dir, file_name)
                if os.path.isfile(file_path):
                    
                    # in the current file, count how many times each character speaks
                    with open(file_path, "r", encoding="utf-8") as f:
                        for line in f:
                            if ":" in line:
                                # extract the character's name and normalize it
                                name = line.split(":", 1)[0].strip().lower()
                                clean_name = re.sub(r'\([^)]*\)', '', name).strip()
                                if clean_name:
                                    character_speaks_counts[clean_name] += 1
    
    for character, count in character_speaks_counts.most_common(20):
        print(f"{character}: {count}")


if __name__ == "__main__":
    # create csv files with specific data 
    run_all_text_to_csv_files()