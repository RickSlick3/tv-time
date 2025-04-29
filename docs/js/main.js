Promise.all([
  d3.csv('data/all_characters_stats_combined.csv'),
  d3.csv('data/characters_top_phrases.csv'),
  d3.csv('data/cooccurrences_by_lines.csv'),
  d3.csv('data/cooccurrences_by_markers.csv'),
  d3.csv('data/main_characters_per_episode.csv'),
  d3.csv('data/pair_top_phrases.csv')
]).then(data => {
  const lineData = data[0].filter(x => +x.all_lines > 9)
  .sort((a, b) => +b.all_lines - +a.all_lines);
  console.log(data[1]);

  const prominentCharacters = data[0].filter(x => +x.all_lines > 9)
  .sort((a, b) => +b.all_lines - +a.all_lines).map(x => x.name);
  console.log(prominentCharacters);

  const wordCloudCharacters = data[1].map(x => x.name);
  
  const rank = new Map(prominentCharacters.map((name, i) => [name, i]));

  const sortedWordCloudCharacters = wordCloudCharacters
    .slice()    // clone if you don’t want to mutate the original
    .sort((a, b) => {
      const ra = rank.get(a) ?? Infinity;
      const rb = rank.get(b) ?? Infinity;
      return ra - rb;
  });


  const images = ["abradolph lincoler.jpg", "agency director.jpeg", "alan.jpg", "alien doctor.jpg", "annie.webp", 
    "army general.webp", "arthricia.jpeg", "beta-7.jpg", "beth.webp", "birdperson.jpg", "blim blam.webp", "brad.jpg",
    "cornvelious daniel.jpg", "doofus rick.webp", "dr. bloom.jpg", "dr. wong.webp", "ethan.webp", "eyehole man.jpg",
    "fart.webp", "flippy nips.webp", "gearhead.webp", "mr. goldenfold.webp", "ice-t.jpg", "jacob.webp", "jaguar.jpg", "jerry.webp",
    "jessica.webp", "kyle.webp", "leonard.jpeg", "lucy.webp", "meeseeks.webp", "million ants.jpeg", "morty.webp", 
    "mr poopybutthole.jpg", "nathan.webp", "needful.webp", "pencilvester.jpg", "pickle rick.webp", "president.webp",
    "prince nebulon.webp", "principal vagina.webp", "rick.webp", "scary terry.webp", "scroopy noopers.webp", "snuffles.webp",
    "squanchy.webp", "stacy.webp", "summer.webp", "supernova.webp", "tammy.webp", "toxic morty.webp", "toxic rick.jpg",
    "unity.webp", "vance.webp", "zeep.jpeg", "placeholder.png"];

  let episodeSet = new Set(data[3].map(x => x.episode));
  const episodes = [...episodeSet];
  console.log(episodes);

  let characterLinesChart = new CharacterLines({parentElement: "#bar-chart"}, lineData, episodes, images);
  characterLinesChart.updateVis();

  let mainCharactersChart = new MainCharacters({parentElement: "#presence-chart"}, data[4]);
  mainCharactersChart.updateVis();

  let characterInfo = new CharacterInfo({parentElement: "#character-focus"}, data[1], prominentCharacters);
  characterInfo.updateVis();

  let characterInteractions = new CharacterInteractions({parentElement: "#interaction-arc"}, data[2]);
  characterInteractions.updateVis();

  let characterPhraseNetwork = new CharacterPhraseNetwork({parentElement: "#pair-phrase-character-focus"}, data[5], prominentCharacters);

  let episodeChart = new EpisodeChart({parentElement: "#cloud-character-focus"}, data[0], sortedWordCloudCharacters, images);
  
  let characterWordCloud = new CharacterWordCloud({parentElement: "#cloud-character-focus",
    onCharacterChange: selectedCharacter => {
      // Update the map data when bin selection changes.
      characterWordCloud.updateVis(selectedCharacter);
      episodeChart.updateVis(selectedCharacter);
    }
  }, data[1], sortedWordCloudCharacters);
  console.log(characterWordCloud.selectedCharacter);
  //episodeChart.updateVis();

}).catch(error => console.error(error));