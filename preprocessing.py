import os
import re
from collections import Counter

def run_all_text_to_csv_files():

    transcripts_dir = "./transcripts"
    seasons_to_process = {"1"}

    character_lines_counts = Counter()

    character_words_counts = Counter()

    character_episode_counts = Counter()
    
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
                            clean_name = re.sub(r'\([^)]*\)', '', name).strip()
                            
                            if clean_name:
                                # update the counts for characters lines
                                character_lines_counts[clean_name] += 1

                                # update the counts for characters words
                                words = line.split(":")[1].strip()
                                words_count = len(words.split())
                                character_words_counts[clean_name] += words_count

                                # update the counts for characters episode appearances
                                if clean_name not in seen_in_this_file:
                                    seen_in_this_file.add(clean_name)
                                    character_episode_counts[clean_name] += 1

    print("\nCharacter Lines Counts\n")
    for character, count in character_lines_counts.most_common(15):
        print(f"{character}: {count}")

    print("\nCharacter Words Counts\n")
    for character, count in character_words_counts.most_common(15):
        print(f"{character}: {count}")

    print("\nCharacter Episode Counts\n")
    for character, count in character_episode_counts.most_common(15):
        print(f"{character}: {count}")


if __name__ == "__main__":
    # create csv files with specific data 
    run_all_text_to_csv_files()