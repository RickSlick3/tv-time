# TV Time

#### Contributors

- Casey Jackson
- Ricky Roberts

## Documentation

**Link to Application:** [rickslick3.github.io/tv-time/](https://rickslick3.github.io/tv-time/) <br/>
**Link to Demonstration:** [Application Demo Video](https://www.youtube.com/watch?v=xvFZjo5PgG0) TODO

[**Rick and Morty**](https://en.wikipedia.org/wiki/Rick_and_Morty) is an animated sci-fi comedy series that follows the misadventures of an eccentric, alcoholic scientist, Rick Sanchez, and his good-hearted but easily influenced grandson, Morty Smith. Traveling across dimensions and encountering bizarre alien worlds, the duo’s chaotic adventures blend dark humor, philosophical themes, and sharp satire.

![rick and morty image](/documentation-files/rick-and-morty.jpg)

This application was created to visualize text analysis on transcripts from seasons 1, 2 and 3 of **Rick and Morty**. This will allow users to see visual representations of answers to the questions: Who appears in the show? How often do characters speak? How much do they say? What do they tend to talk about? How often do they share a scene with other characters? And More.

### The Data

The transcripts we used for the application are from [The Rick and Morty Wiki](https://rickandmorty.fandom.com/wiki/Category:Transcripts). On this page there are links to fan-made transcripts for each episode of the entire show, as well as links to pages that hold only transcripts for specific seasons. 

**Note:** Since these transcripts are fan made, formatting is inconsitent and some transcripts are missing entirely. Because of this, our analysis only includes seasons 1, 2, and 3, and processed as consitently as possible. 

To obtain useable transcripts for our analysis, we used pythons requests and beautiful soup libraries to retrieve them from the wiki. Our script downloads and saves transcripts for Rick and Morty episodes from the fandom website. It first connects to the main transcripts page to find links for each season, then visits each season page to collect links to individual episode transcripts. For every episode, it downloads the transcript, extracts and cleans the text to remove formatting issues, and organizes the dialogue properly. It matches each episode to its correct number, and saves the result as a text file inside folders by season.

Then, we used a separate python script to read the transcripts and create easy-to-use formatted data for each of our individual visualizations. 

[Click here](https://github.com/RickSlick3/tv-time/blob/main/scraping.py) to view our scraping script. <br/>
[Click here](https://github.com/RickSlick3/tv-time/blob/main/preprocessing.py) to view our transcript processing script <br/>
[Click here](https://github.com/RickSlick3/tv-time/tree/main/transcripts) to view all our transcripts.

### Visualization Components and Discoveries

This applications provides several visualizations to provide insights of different data:

#### Bar Chart: Character Lines and Words

![bar chart](/documentation-files/bar-chart.png)

This bar chart shows an ordering of characters by how many lines they speak. Using the dropdowns above, this chart can be filtered by either season or ondividual episode. The user can also change the metric from lines to individual words per character. Hvering over each individual bar will show a tooltip with exact numbers of lines, words, and episode appearances per character. This can allow a user to understand how often a character appears, how much they speak in each episode or season, and ultimately how central the character is to the overall show. 

#### Stacked Bar Chart: Main Characters Presence in Episodes

![stacked bar chart](/documentation-files/stacked-bar-chart.png)

The stacked bar chart focuses on the main charactersand their proportions of lines and words in each season or episode. The user can filter the chart by either lines or words using the dropdown, as well as by individual episode or season. The user can hover over the different portions of the bars to see the characters total words or lines in the specific season or episode. This allows the user to visualize the proportions of how much or often each main character speaks relative to each other in a specific episode.

#### Episode Chart and Word Cloud: Characters Most Used Words and Phrases

![character info](/documentation-files/character-info.png)

These two visualizations are linked; the episode chart shows how many episodes a character appears in throughout the show, and the word cloud shows their most used words and phrases along with relatively how often they say them. The user can interact with these visuals using the dropdown to select a character of interest to change the visuals. Thy can also use the dropdown tochange he word cloud from single words to 3, 4, and 5 wrd phrases. The user can also hover over the episode chart to see a tooltip for how many lines a character says in that episode. This allows the user to see how often characters appear over the course of the show, how much they speak in each episode, and their most common words and phrases. 

#### Arc Diagram: Character Interactions Per Episode or Season

![arc diagram](/documentation-files/arc-diagram.png)

The arc diagram shows each character interactions represented by arcs. These arcs are undirected, and show if two characters appear in the same scene within a season or episode. Using the dropdown, the user can filter the diagram by season episode, or all seasons. This allows the user to understand which characters may interact with the most other characters, or how central they are to the individual epiosde or season. 

#### Network Graph: What Charaters Say To Each Other

![network graph](/documentation-files/network.png)

In this diagram, each character is represented by a node. The links represent characters speaking with one another in the same scene. As opposed to the arc diagram, these links are directed and show specifically what one character says to the other. When hovering over a node, a tooltip will appear to display who the character is, and the most common phrases they say to others. This can allow the user to understand what attitude that character hs toward another or the type of relationship they have.

![network graph with tooltip](/documentation-files/network-tooltip.png)

### Design Choices and Process

#### Designs

Here is a link to our digital sketches: [Design Plan Charts](/documentation-files/tv-time-visual-sketches.pdf)

Our ideas were chosen based on the project requirements. Basic analytics such as lines or words per character can shown through a line or bar graph. Our sketches highlight our ideas to show potentially directed links between characters throughout the show, such as what one character says to another. This type of data cannot be show witha normal two-axis graph. These network graph sketches can allow either directed or non-directed connections. We used the arc diagram to show interactiosn between characters since those are non-directed, and the network graph to show what one character says to another so that each connection has a direction.  

#### Structure and Libraries

Our main application is made using Vanilla JavaScript, D3.js, HTML, and CSS. We structured our application code in multiple files to separate each visualization. The visualization instances are all created from a main JavaScript file which allow us to connect visualizatons using callbacks if needed. This overall structure of our project allows code to be compartmentalized while also being able to link through a common function or file.

To create our transcripts, we used Python with a few libraries:
- **requests:** Used to make HTTP GET requests and retrieve the raw page content for the main transcripts page, season pages, and individual episode pages.
- **Beautiful Soup (bs4):** Used to find specific elements like \<a> links for seasons and episodes, \<div> containers holding the transcript text, and to clean up unwanted HTML tags like \<br> inside paragraphs.
- **NavigablString (bs4):** Used to identify and manipulate plain text nodes inside the HTML tree, specifically to replace literal newline characters inside text nodes with spaces to clean the formatting before extracting.

Our app can be launched locally on a port from our [index.html](https://github.com/RickSlick3/tv-time/blob/main/docs/index.html) file, or by using this link: [rickslick3.github.io/tv-time/](https://rickslick3.github.io/tv-time/)

## Contributions

#### Casey Jackson:

Created of the following visualizations: info screen,  bar chart for character lines/words per episode, stacked bar chart for main character lines/words, episode chart and general info in character information section. Added character pictures to charts.

#### Ricky Roberts:

Scraped and formatted episode transcripts in text files. Processed transcripts and placed findings in CSV files to be used in the data visualizations. Created the word cloud, arc diagram, and network graph visualizations. 
