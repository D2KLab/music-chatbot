# DOREMUS Bot
### A virtual assistant for answering music related questions.
This repository contains the code of the "DOREMUS Bot", a bot capable of answering and providing results to a set of classical music related queries.

The bot makes use of different tools:
- It's built using the [BotKit](https://github.com/howdyai/botkit) bot building tool.

- It uses the [DOREMUS](https://github.com/DOREMUS-ANR) knowledge base as source of informations to answer the queries.

- [Dialogflow](https://github.com/dialogflow) as Natural Language Processing tool.

- Is capable of working with [Slack](https://slack.com) and/or [Facebook Messanger](https://www.messenger.com).

The architecture is the following:
![DOREMUS Bot architecture](./final-report/images/architecture.png) 

# The bot capabilities
The intents are grouped in a simple and clear way, according to what the user
wants to retrieve from the DOREMUS knowledge base. The bot can:

- retrieve a set of works according to different filters (artists who composed
the works, instruments used, music genre and/or year of composition).
    - *"Give me 3 works composed by Bach"*
    - *"Give me 2 works for violin, clarinet and piano"*
    - *"Tell us 4 works for violin or piano"*
    - *"List me 10 works of genre concerto"*
    - *"Tell me one work composed during 1811"*
    - *"Give us 3 works written between 1782 and 1821"*

- find a set of artists according to some filters (number of composed works,
number of works of a given genre, etc.).
    - *"Find the five artists who composed more concerto works"*
    - *"Find the 3 artists, born between 1752 and 1772, who composed more works"*
    - *"Find one artist, born between 1752 and 1772, who wrote more works for clarinet"*

- propose to the user a future performance (that can be filtered by city and/or
date period), or show to the user the details of a past performance.
    - *"Tell me one event in Paris in the next month!"*

- show a card with a summary of an artist, with its birth/death place and
date, a picture and a little bio. After the card visualization, a set of works
of the artist (connection with the works-by intent) can be asked.
    - *"Tell me something about Mozart"*
    - *"What do you know about Beethoven?"*
    
The bot is also capable of mixing the "artist discovering" and "works finding" intents:
after asking the bot of the details of an artist, the user can retrieve its works,
applying the usual filters. Let's make an example:

    - *"Tell me something about Mozart"* - User
    - [Result with bio, picture, birth/death date/place]
    - *"Now give me 5 of his works, written for clarinet"* - User
    - [Result with the 5 works of that artist]

# How to deploy DOREMUS Bot

