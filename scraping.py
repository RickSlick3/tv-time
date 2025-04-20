from bs4 import BeautifulSoup
from bs4 import NavigableString
import requests
import re
import os

BASE_URL = 'https://rickandmorty.fandom.com'


# get the links to the transcripts of each season
def get_season_links():
    # load the html of the transcripts page
    transcripts_url = "https://rickandmorty.fandom.com/wiki/Category:Transcripts"
    resp = requests.get(transcripts_url)
    html = resp.text
    soup = BeautifulSoup(html, 'html.parser')

    # get all <a> tags where the title starts with "Category:Season"
    season_links = []
    for a in soup.find_all("a", title=True):
        if a["title"].startswith("Category:Season"):
            season_links.append(BASE_URL + a["href"])

    return season_links


# get all episode links in every season
def get_episode_links(season_links):
    # store all episodes
    episode_links = {}

    # for each season link, get the episode links
    for season_link in season_links:

        num = re.search(r"Season_(\d+)_transcripts", season_link)
        if not num:
            continue

        season_num = int(num.group(1))

        # load the html of the season page
        resp = requests.get(season_link)
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')

        # get all <a> tags where the title ends with "/Transcript"
        eps = []
        for a in soup.find_all("a", title=True, class_="category-page__member-link"):
            if a["title"].endswith("/Transcript"):
                eps.append(BASE_URL + a["href"])
        
        episode_links[season_num] = eps

    return episode_links


# using a list of episode links, get the transcript of each episode
def write_episode_transcript(season, episode_url):
    output_path = f'./transcripts/{season}/{episode_url.split("/")[-2]}.txt'

    # check or create folders
    if not os.path.exists('./transcripts'):
        os.makedirs('./transcripts')
    if not os.path.exists(f'./transcripts/{season}'):
        os.makedirs(f'./transcripts/{season}')

    resp = requests.get(episode_url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    container = soup.select_one("div.mw-content-ltr.mw-parser-output")
    if not container:
        raise RuntimeError("Could not find the transcript container on page")
        
    for node in container.find_all(string=True):
        if isinstance(node, NavigableString):
            node.replace_with(node.replace("\n", " ")) # replace literal '\n' in that node

    # pull out ONLY the tags we care about, in document order
    elems = container.find_all(lambda tag: tag.name in ("h2","h3","p","dd"))

    all_lines = []
    for el in elems:
        if el.name in ("h2","h3"):
            # headings become their own line
            text = " ".join(el.get_text().split())
            if text:
                all_lines.append(text)

        else:  # el.name is "p" or "dd"
            # turn <br> → "\n"
            for br in el.find_all("br"):
                br.replace_with("\n")

            raw = el.get_text()
            chunks = [ln.strip() for ln in raw.split("\n") if ln.strip()]
            all_lines.extend(chunks)

    merged = []
    for ln in all_lines:
        # strip a leading "-" plus any following spaces
        if ln.startswith("-"):
            ln = ln[1:].lstrip()

        if any(token in ln for token in (":","[","(")):
            # new speaker/dialogue starts here
            merged.append(ln)
        else:
            # continuation: append to previous, or start fresh if none
            if merged:
                merged[-1] += " " + ln
            else:
                merged.append(ln)

    with open(output_path, "w", encoding="utf-8") as f:
        for ln in merged:
            if ln in ("Transcript[]", "Site navigation[]") or ln.startswith("This article is"):
                continue
            f.write(ln + "\n")


# loop through dictionary of all links and call write_episode_transcript for each episode
def loop_through_episodes(all_episode_links):
    for szn, eps in all_episode_links.items():
        for ep in eps:
            write_episode_transcript(szn, ep)


if __name__ == "__main__":
    season_links = get_season_links()
    # print(season_links)

    # here is the output of get_season_links
    # season_links = [
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_1_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_2_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_3_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_4_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_5_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_6_transcripts', 
    #     'https://rickandmorty.fandom.com/wiki/Category:Season_7_transcripts'
    # ]

    # all_episode_links = get_episode_links(season_links)
    # print(all_episode_links)

    # here is the output of get_episode_links
    all_episode_links = {
        1: 
            ['https://rickandmorty.fandom.com/wiki/Anatomy_Park_(episode)/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Close_Rick-Counters_of_the_Rick_Kind/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Lawnmower_Dog/Transcript', 
            'https://rickandmorty.fandom.com/wiki/M._Night_Shaym-Aliens!/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Meeseeks_and_Destroy/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Pilot/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Raising_Gazorpazorp/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rick_Potion_No._9/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Ricksy_Business/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rixty_Minutes/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Something_Ricked_This_Way_Comes/Transcript'], 
        2: 
            ['https://rickandmorty.fandom.com/wiki/A_Rickle_in_Time/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Auto_Erotic_Assimilation/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Big_Trouble_in_Little_Sanchez/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Get_Schwifty_(episode)/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Interdimensional_Cable_2:_Tempting_Fate/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Look_Who%27s_Purging_Now/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Mortynight_Run/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Ricks_Must_Be_Crazy/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Wedding_Squanchers/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Total_Rickall/Transcript'], 
        3: 
            ['https://rickandmorty.fandom.com/wiki/Morty%27s_Mind_Blowers/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Pickle_Rick/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rest_and_Ricklaxation/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rickmancing_the_Stone/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_ABC%27s_of_Beth/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Rickchurian_Mortydate/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Ricklantis_Mixup/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Rickshank_Rickdemption/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Whirly_Dirly_Conspiracy/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Vindicators_3:_The_Return_of_Worldender/Transcript'], 
        4: 
            ['https://rickandmorty.fandom.com/wiki/Claw_and_Hoarder:_Special_Ricktim%27s_Morty/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Edge_of_Tomorty:_Rick_Die_Rickpeat/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Never_Ricking_Morty/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rattlestar_Ricklactica/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Star_Mort_Rickturn_of_the_Jerri/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Vat_of_Acid_Episode/Transcript'], 
        5: 
            ['https://rickandmorty.fandom.com/wiki/Gotron_Jerrysis_Rickvangelion/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Mort_Dinner_Rick_Andre/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Mortyplicity/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rick_%26_Morty%27s_Thanksploitation_Spectacular/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rickdependence_Spray/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rickmurai_Jack/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rickternal_Friendshine_of_the_Spotless_Mort/Transcript'], 
        6: 
            ['https://rickandmorty.fandom.com/wiki/A_Rick_in_King_Mortur%27s_Mort_/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Analyze_Piss_/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Full_Meta_Jackrick/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Ricktional_Mortpoon%27s_Rickmas_Mortcation/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Solaricks/Transcript'], 
        7: 
            ['https://rickandmorty.fandom.com/wiki/Air_Force_Wong/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Fear_No_Mort/Transcript', 
            'https://rickandmorty.fandom.com/wiki/How_Poopy_Got_His_Poop_Back/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Mort:_Ragnarick/Transcript',
            'https://rickandmorty.fandom.com/wiki/Rickfending_Your_Mort/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Rise_of_the_Numbericons:_The_Movie/Transcript', 
            'https://rickandmorty.fandom.com/wiki/That%27s_Amorte/Transcript', 
            'https://rickandmorty.fandom.com/wiki/The_Jerrick_Trap/Transcript',
            'https://rickandmorty.fandom.com/wiki/Unmortricken/Transcript', 
            'https://rickandmorty.fandom.com/wiki/Wet_Kuat_Amortican_Summer/Transcript']
    }

    loop_through_episodes(all_episode_links)
    # write_episode_transcript(1, 'https://rickandmorty.fandom.com/wiki/Rixty_Minutes/Transcript')