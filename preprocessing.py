import os
import re
import csv
from collections import Counter, defaultdict
from itertools import combinations
import pandas as pd

TRANSCRIPTS_DIR = "./transcripts"
SEASONS_TO_PROCESS = {"1", "2", "3"}
MAIN_CHARS = {"rick","morty","beth","jerry","summer"}


def all_character_stats_combined():
    # 1) Prepare data containers
    season_counts = {
        season: {
            "lines": Counter(),
            "words": Counter(),
            "eps":   Counter(),
        }
        for season in SEASONS_TO_PROCESS
    }

    char_episode = defaultdict(lambda: defaultdict(lambda: {"lines":0, "words":0}))
    all_episodes = set()
    all_characters = set()

    # 2) Walk every file once
    for season in sorted(SEASONS_TO_PROCESS, key=int):
        season_dir = os.path.join(TRANSCRIPTS_DIR, season)
        if not os.path.isdir(season_dir):
            continue

        for fname in sorted(os.listdir(season_dir)):
            if not fname.endswith(".txt"):
                continue

            ep_base = os.path.splitext(fname)[0]
            ep_name = f"{season}_{ep_base}"
            all_episodes.add(ep_name)

            path = os.path.join(season_dir, fname)
            seen_this_file = set()

            with open(path, encoding="utf-8") as f:
                for line in f:
                    if ":" not in line:
                        continue

                    raw = line.split(":",1)[0].strip().lower()
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", raw).replace(",", "").strip()
                    if not name:
                        continue

                    all_characters.add(name)

                    utter = line.split(":",1)[1]
                    txt = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", utter)
                    txt = re.sub(r'[^\w\s]', "", txt).lower().strip()
                    words = txt.split()

                    # per-season
                    season_counts[season]["lines"][name] += 1
                    season_counts[season]["words"][name] += len(words)
                    if name not in seen_this_file:
                        seen_this_file.add(name)
                        season_counts[season]["eps"][name] += 1

                    # per-episode
                    char_episode[name][ep_name]["lines"] += 1
                    char_episode[name][ep_name]["words"] += len(words)

    # 3) Filter characters by seasonal total lines
    total_season_lines = {
        ch: sum(season_counts[s]["lines"].get(ch,0) for s in SEASONS_TO_PROCESS)
        for ch in all_characters
    }
    filtered_chars = {ch for ch, tot in total_season_lines.items() if tot > 5}

    # 4) Prepare ordering and header
    seasons_sorted  = sorted(SEASONS_TO_PROCESS, key=int)
    episodes_sorted = sorted(all_episodes)
    fieldnames = ["name"]
    # per-season columns
    for s in seasons_sorted:
        for m in ("lines","words","eps"):
            fieldnames.append(f"s{s}_{m}")
    # total columns across seasons
    fieldnames += ["all_lines", "all_words", "all_eps"]
    # per-episode columns
    for ep in episodes_sorted:
        fieldnames += [f"{ep}_lines", f"{ep}_words"]

    # 5) Write combined CSV
    out_path = "./docs/data/all_characters_stats_combined.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for ch in sorted(filtered_chars):
            row = {"name": ch}

            # fill totals
            row["all_lines"] = total_season_lines[ch]
            row["all_words"] = sum(season_counts[s]["words"].get(ch,0) for s in seasons_sorted)
            row["all_eps"]   = sum(season_counts[s]["eps"].get(ch,0)   for s in seasons_sorted)

            # fill per-season
            for s in seasons_sorted:
                row[f"s{s}_lines"] = season_counts[s]["lines"].get(ch, 0)
                row[f"s{s}_words"] = season_counts[s]["words"].get(ch, 0)
                row[f"s{s}_eps"]   = season_counts[s]["eps"].get(ch, 0)

            # fill per-episode
            for ep in episodes_sorted:
                row[f"{ep}_lines"] = char_episode[ch][ep]["lines"]
                row[f"{ep}_words"] = char_episode[ch][ep]["words"]

            writer.writerow(row)


def main_character_stats_per_episode():
    MAIN_CHARS = {"rick", "morty", "beth", "jerry", "summer"}

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
            file_key = f"{season}_{fn}".replace(".txt", "")
            file_order.append(file_key)
            file_counts[file_key] = {
                "lines":    Counter(),
                "words":    Counter(),
            }

            seen_in_file = set()
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if ":" not in line:
                        continue

                    # extract and clean the speaker name
                    name = line.split(":", 1)[0].strip().lower()
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', '', name).strip()
                    if name not in MAIN_CHARS:
                        continue

                    # count every line
                    file_counts[file_key]["lines"][name] += 1

                    # count words
                    words = line.split(":",1)[1].split()
                    file_counts[file_key]["words"][name] += len(words)

    # 3) Write out the per-file CSV
    fieldnames = ["name"] + [
        f"{fk}_{metric}"
        for fk in file_order
        for metric in ("lines","words")
    ]

    with open("./docs/data/main_characters_per_episode.csv", "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for char in sorted(MAIN_CHARS):
            row = {"name": char}
            for fk in file_order:
                for metric in ("lines","words"):
                    col = f"{fk}_{metric}"
                    row[col] = file_counts[fk][metric].get(char, 0)
            writer.writerow(row)


def get_all_characters_stats(
    characters_csv='./docs/data/all_characters_stats_combined.csv',
    transcripts_dir=TRANSCRIPTS_DIR,
    seasons=SEASONS_TO_PROCESS,
    phrase_lengths=(1, 3, 4, 5),
    top_n=10,
    output_csv="./docs/data/characters_top_phrases.csv"
):
    STOPWORDS = {
        "the", "and", "or", "but", "if", "in", "on",
        "to", "of", "for", "is", "it", "with", "that", "were",
        "you", "he", "she", "they", "we", "me", "my", "your",
        "as", "an", "at", "by", "this", "that", "there", "where",
        "so", "up", "down", "out", "all", "just", "like", "no", "its",
        "are", "was", "be", "been", "being", "has", "have", "had",
        "do", "does", "did", "doing", "will", "would", "can", "could",
        "should", "may", "might", "must", "shall", "than", "then",
        "more", "most", "some", "such", "any", "every", "each",
        "few", "less", "least", "much", "many", "now", "here", "there",
        "when", "where", "why", "how", "what", "who", "which",
        "whoever", "whomever", "whichever", "whatever", "whose",
        "from", "im", "into", "onto", "over", "under", "between",
        "dont", "not", "doesnt", "didnt", "cant", "couldnt", "hes",
        "oh", "thats", "youre", "get", "about", "well", "hey", "got",
        "go", "gonna", "yeah", "because",
    }    
    # 1) Load the character list
    with open(characters_csv, newline="", encoding="utf-8") as cf:
        reader     = csv.DictReader(cf)
        characters = [row["name"].strip().lower() for row in reader]

    # 2) Build wide CSV header
    fieldnames = ["name"]
    for n in phrase_lengths:
        prefix = "word" if n == 1 else f"{n}gram"
        for i in range(1, top_n + 1):
            fieldnames += [f"{prefix}_{i}_text", f"{prefix}_{i}_count"]

    # 3) Open CSV for writing
    with open(output_csv, "w", newline="", encoding="utf-8") as outf:
        writer = csv.DictWriter(outf, fieldnames=fieldnames)
        writer.writeheader()

        # 4) Process each character
        for character in characters:
            row = {"name": character}

            # init a Counter for each n
            counters = {n: Counter() for n in phrase_lengths}

            # 5) Aggregate across seasons/files
            for season in seasons:
                season_dir = os.path.join(transcripts_dir, season)
                if not os.path.isdir(season_dir):
                    continue
                for fn in os.listdir(season_dir):
                    fpath = os.path.join(season_dir, fn)
                    if not os.path.isfile(fpath):
                        continue

                    with open(fpath, "r", encoding="utf-8") as f:
                        for line in f:
                            if ":" not in line:
                                continue
                            name, utterance = line.split(":", 1)
                            if name.strip().lower() != character:
                                continue

                            # clean & tokenize
                            txt = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", utterance)
                            txt = re.sub(r'[^\w\s]', "", txt).lower().strip()
                            tokens = txt.split()
                            if not tokens:
                                continue

                            # update each Counter
                            for n in phrase_lengths:
                                if n == 1:
                                    filtered = [t for t in tokens if len(t) > 1 and t not in STOPWORDS]
                                    counters[1].update(filtered)
                                else:
                                    for i in range(len(tokens) - n + 1):
                                        gram = " ".join(tokens[i : i + n])
                                        counters[n][gram] += 1

            # 6) Fill row with top_n for each n
            for n in phrase_lengths:
                prefix = "word" if n == 1 else f"{n}gram"
                common = counters[n].most_common(top_n)
                for idx in range(1, top_n + 1):
                    if idx <= len(common):
                        text, cnt = common[idx - 1]
                    else:
                        text, cnt = "", 0
                    row[f"{prefix}_{idx}_text"]  = text
                    row[f"{prefix}_{idx}_count"] = cnt

            writer.writerow(row)


def count_character_cooccurrences(transcripts_dir=TRANSCRIPTS_DIR,
                                  seasons=SEASONS_TO_PROCESS,
                                  proximity=25,
                                  output_csv="./docs/data/cooccurrences_by_lines.csv"):
    """
    For each episode, chunk its dialogue into blocks of `proximity` lines,
    then count how many blocks each unordered pair of characters shares.
    Writes a CSV: episode, char1, char2, count.
    """
    episode_counters = {}

    for season in sorted(seasons, key=int):
        season_dir = os.path.join(transcripts_dir, season)
        if not os.path.isdir(season_dir):
            continue

        for fname in sorted(os.listdir(season_dir)):
            if not fname.endswith(".txt"):
                continue

            # strip ".txt" and prefix with season
            ep_name    = os.path.splitext(fname)[0]      # e.g. "Pilot"
            episode_id = f"{season}_{ep_name}"           # e.g. "1_Pilot"

            fpath = os.path.join(season_dir, fname)
            if not os.path.isfile(fpath):
                continue

            # read all lines once
            with open(fpath, encoding="utf-8") as f:
                lines = f.readlines()

            # choose marker
            marker = "[" if any(l.lstrip().startswith("[") for l in lines) else "("

            # split into scenes
            scenes = []
            buf = []
            for line in lines:
                if line.lstrip().startswith(marker) and buf:
                    scenes.append(buf)
                    buf = []
                buf.append(line)
            if buf:
                scenes.append(buf)

            # count co-occurrences in each scene
            cooccur = Counter()
            for scene in scenes:
                speakers = set()
                for line in scene:
                    if ":" not in line:
                        continue
                    raw = line.split(":", 1)[0].strip().lower()
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", raw).strip()
                    if name:
                        speakers.add(name)
                for a, b in combinations(sorted(speakers), 2):
                    cooccur[(a, b)] += 1

            episode_counters[episode_id] = cooccur

    # write CSV using episode_id
    with open(output_csv, "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out)
        writer.writerow(["episode", "char1", "char2", "count"])
        for episode_id, counter in episode_counters.items():
            for (a, b), cnt in counter.items():
                if cnt > 1:  # only write pairs with more than 1 co-occurrence
                    writer.writerow([episode_id, a, b, cnt])


def count_interactions_by_markers(transcripts_dir=TRANSCRIPTS_DIR,
                                  seasons=SEASONS_TO_PROCESS,
                                  output_csv="./docs/data/cooccurrences_by_markers.csv"):
    """
    For each episode, split lines into 'scenes' whenever a line starts with '['
    (or if none, whenever a line starts with '('), then in each scene count
    every unordered pair of characters who speak at least once.
    """
    episode_counters = {}

    for season in sorted(seasons, key=int):
        season_dir = os.path.join(transcripts_dir, season)
        if not os.path.isdir(season_dir):
            continue

        for fname in sorted(os.listdir(season_dir)):
            if not fname.endswith(".txt"):
                continue

            # strip ".txt" and prefix the season
            ep_name    = os.path.splitext(fname)[0]          # e.g. "Pilot"
            episode_id = f"{season}_{ep_name}"               # e.g. "1_Pilot"

            fpath = os.path.join(season_dir, fname)
            if not os.path.isfile(fpath):
                continue

            # — read lines & decide marker as before —
            with open(fpath, encoding="utf-8") as f:
                lines = f.readlines()

            marker = "[" if any(l.lstrip().startswith("[") for l in lines) else "("

            scenes = []
            buf = []
            for line in lines:
                if line.lstrip().startswith(marker) and buf:
                    scenes.append(buf)
                    buf = []
                buf.append(line)
            if buf:
                scenes.append(buf)

            # — count co-occurrences per scene —
            cooccur = Counter()
            for scene in scenes:
                speakers = set()
                for line in scene:
                    if ":" not in line:
                        continue
                    raw = line.split(":", 1)[0].strip().lower()
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", raw).strip()
                    if name:
                        speakers.add(name)
                for a, b in combinations(sorted(speakers), 2):
                    cooccur[(a, b)] += 1

            episode_counters[episode_id] = cooccur

    # — write CSV using episode_id instead of fname —
    with open(output_csv, "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out)
        writer.writerow(["episode", "char1", "char2", "count"])
        for episode_id, counter in episode_counters.items():
            for (a, b), cnt in counter.items():
                if cnt > 1:  # only write pairs with more than 1 co-occurrence
                    writer.writerow([episode_id, a, b, cnt])


def count_pair_phrases(transcripts_dir=TRANSCRIPTS_DIR,
                       seasons=SEASONS_TO_PROCESS,
                       phrase_lengths=(3, 4, 5),
                       output_csv='./docs/data/pair_top_phrases.csv'):
    """
    For each episode:
      - split into scenes on '[' (or '(' if no '[' present)
      - in each scene, collect each speaker’s utterances
      - for every ordered pair (A → B) where both A and B appear in the scene,
        count all 3/4/5-word n-grams *from A’s lines*
    Finally, write one CSV row per directed pair with their single top
    3-, 4-, and 5-gram plus counts.
    """
    # directed counters: (speaker, listener) -> { n -> Counter() }
    directed = defaultdict(lambda: {n: Counter() for n in phrase_lengths})

    for season in sorted(seasons, key=int):
        season_dir = os.path.join(transcripts_dir, season)
        if not os.path.isdir(season_dir):
            continue

        for fname in sorted(os.listdir(season_dir)):
            if not fname.endswith(".txt"):
                continue
            fpath = os.path.join(season_dir, fname)

            # read & choose marker
            with open(fpath, encoding="utf-8") as f:
                lines = f.readlines()
            marker = "[" if any(l.lstrip().startswith("[") for l in lines) else "("

            # split into scenes
            scenes, buf = [], []
            for line in lines:
                if line.lstrip().startswith(marker) and buf:
                    scenes.append(buf)
                    buf = []
                buf.append(line)
            if buf:
                scenes.append(buf)

            # process each scene
            for scene in scenes:
                # collect cleaned utterances per speaker
                utterances = defaultdict(list)
                for line in scene:
                    if ":" not in line:
                        continue
                    raw, text = line.split(":", 1)
                    name = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "",
                                  raw.strip().lower()).strip()
                    if not name:
                        continue
                    # clean text
                    txt = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", text)
                    txt = re.sub(r'[^\w\s]', "", txt).lower().strip()
                    if txt:
                        utterances[name].append(txt)

                present = sorted(utterances.keys())
                # for every ordered pair A → B
                for A in present:
                    for B in present:
                        if A == B:
                            continue
                        ctr_map = directed[(A, B)]
                        # count n-grams in A’s lines
                        for utt in utterances[A]:
                            tokens = utt.split()
                            for n in phrase_lengths:
                                if len(tokens) < n:
                                    continue
                                for i in range(len(tokens) - n + 1):
                                    gram = " ".join(tokens[i : i + n])
                                    ctr_map[n][gram] += 1

    # write out wide CSV: one row per directed pair
    fieldnames = ["speaker", "listener"]
    for n in phrase_lengths:
        fieldnames += [f"{n}gram_phrase", f"{n}gram_count"]

    with open(output_csv, "w", newline="", encoding="utf-8") as out:
        writer = csv.DictWriter(out, fieldnames=fieldnames)
        writer.writeheader()

        for (A, B), counters in sorted(directed.items()):
            # find the single top count for each n
            top_counts = []
            for n in phrase_lengths:
                most = counters[n].most_common(1)
                top_counts.append(most[0][1] if most else 0)

            # skip if NONE of the 3‐,4‐,5‐gram counts is > 1
            if all(c <= 1 for c in top_counts):
                continue

            # otherwise build and write the row
            row = {"speaker": A, "listener": B}
            for n in phrase_lengths:
                most = counters[n].most_common(1)
                if most:
                    phrase, cnt = most[0]
                else:
                    phrase, cnt = "", 0
                row[f"{n}gram_phrase"] = phrase
                row[f"{n}gram_count"]  = cnt

            writer.writerow(row)


def lexical_richness_analysis():
    # 1) Profanity set
    PROFANITIES = {
        "shit", "fuck", "fucking", "fucked", "motherfucker", "ass", "asshole",
        "bitch", "bastard", "dick", "dickhead", "piss", "pissed", "crap",
        "damn", "goddamn", "hell", "cunt", "prick", "cock", "balls", "bollocks",
        "twat", "whore", "slut", "friggin", "frick", "frickin", "heck", "screw",
        "screwed", "dammit", "shithead", "butthead", "dipshit", "dumbass", "jackass",
        "smartass", "fatass", "badass", "hardass", "lameass", "kickass", "crybaby",
        "cry-ass", "bitch-ass",
    }

    # data structures
    char_tokens           = defaultdict(list)
    char_sentence_words   = defaultdict(int)
    char_sentence_count   = defaultdict(int)
    char_profanity_counters = defaultdict(Counter)

    # 2) Gather data
    for season in sorted(SEASONS_TO_PROCESS, key=int):
        season_dir = os.path.join(TRANSCRIPTS_DIR, season)
        if not os.path.isdir(season_dir):
            continue

        for fname in os.listdir(season_dir):
            if not fname.endswith(".txt"):
                continue
            path = os.path.join(season_dir, fname)

            with open(path, encoding="utf-8") as f:
                for line in f:
                    if ":" not in line:
                        continue
                    speaker, utter = line.split(":",1)
                    speaker = speaker.strip().lower()
                    if speaker not in MAIN_CHARS:
                        continue

                    # clean utterance
                    clean = re.sub(r'\([^)]*\)|\[[^\]]*\]|["\']+', "", utter)
                    clean = re.sub(r'[^\w\s\.!?]', "", clean).lower().strip()

                    # 2a) Sentence splitting
                    sentences = [s.strip() for s in re.split(r'[\.!?]+', clean) if s.strip()]
                    for sent in sentences:
                        words = [w for w in sent.split() if len(w)>1]
                        char_sentence_words[speaker] += len(words)
                        char_sentence_count[speaker] += 1

                    # 2b) Token list for lexicon & profanity
                    tokens = [t for t in re.findall(r'\w+', clean) if len(t)>1]
                    char_tokens[speaker].extend(tokens)

                    # 2c) Profanity counting (and per-word tally)
                    for t in tokens:
                        if t in PROFANITIES:
                            char_profanity_counters[speaker][t] += 1

    # 3) Compute metrics
    rows = []
    for ch in sorted(MAIN_CHARS):
        toks   = char_tokens[ch]
        total  = len(toks)
        vocab  = len(set(toks))
        ttr    = vocab/total if total else 0
        avg_tl = sum(len(t) for t in toks)/total if total else 0

        sw     = char_sentence_words[ch]
        sc     = char_sentence_count[ch]
        avg_sl = sw/sc if sc else 0

        prof_ctr = char_profanity_counters[ch]
        prof_cnt = sum(prof_ctr.values())
        prof_freq = prof_cnt/total if total else 0

        # top 2 profanities
        top_two = prof_ctr.most_common(2)
        (p1, c1), (p2, c2) = (("", 0), ("", 0))
        if len(top_two) >= 1:
            p1, c1 = top_two[0]
        if len(top_two) == 2:
            p2, c2 = top_two[1]

        rows.append({
            "character":             ch,
            "total_tokens":          total,
            "vocab_size":            vocab,
            "type_token_ratio":      round(ttr,3),
            "avg_token_length":      round(avg_tl,3),
            "avg_sentence_length":   round(avg_sl,3),
            "profanity_count":       prof_cnt,
            "profanity_freq":        round(prof_freq,4),
            "top_profanity_1":       p1,
            "top_profanity_1_count": c1,
            "top_profanity_2":       p2,
            "top_profanity_2_count": c2,
        })

    # 4) Build DataFrame & write to CSV
    df = pd.DataFrame(rows).set_index("character")
    output_path = "./docs/data/main_characters_lexical_metrics.csv"
    df.to_csv(output_path)


if __name__ == "__main__":
    # Level 1 goals 
    all_character_stats_combined()
    get_all_characters_stats()
    main_character_stats_per_episode()

    # Level 2/3 goals
    count_character_cooccurrences()
    count_interactions_by_markers()
    
    # Level 4 goals
    count_pair_phrases()

    lexical_richness_analysis()
    # Total tokens – the total number of words they speak
    # Vocabulary size – how many unique word types
    # Type–token ratio – vocab size ÷ total tokens
    # Average token length – sum of token lengths ÷ total tokens
