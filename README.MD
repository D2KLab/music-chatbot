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
    - "Give me 3 works composed by Bach"
    - "Give me 2 works for violin, clarinet and piano"
    - "Tell us 4 works for violin or piano"
    - "List me 10 works of genre concerto"
    

- find a set of artists according to some filters (number of composed works,
number of works of a given genre, etc.).

- propose to the user a future performance (that can be filtered by city and/or
date period), or show to the user the details of a past performance.

- show a card with a summary of an artist, with its birth/death place and
date, a picture and a little bio. After the card visualization, a set of works
of the artist (connection with the works-by intent) can be asked.

# How to deploy DOREMUS Bot