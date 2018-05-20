# DOREMUS Bot
### A virtual assistant for answering music related questions.

## Description

##### This repository contains the code of the "DOREMUS Bot", a bot capable of answering and providing results to a set of classical music related queries.

The bot makes use of different tools:
- It's built using the [BotKit](https://github.com/howdyai/botkit) bot building tool.

- It uses the [DOREMUS](https://github.com/DOREMUS-ANR) knowledge base as source of informations to answer the queries.

- Uses [Dialogflow](https://github.com/dialogflow) as Natural Language Processing tool.

- Is capable of working with [Slack](https://slack.com) and/or [Facebook Messenger](https://www.messenger.com) - you can start messaging with the bot at the [Facebook page](https://facebook.com/doremusbot/)

The architecture is the following:
![DOREMUS Bot architecture](./final-report/images/architecture.png) 

## Getting started

### What you need
Make sure you have [Node.js](https://nodejs.org/en/download/) installed in your local machine.

### Installing

```
$ git clone https://github.com/D2KLab/music-chatbot.git
$ cd music-chatbot
$ npm install 
```

### The code organization
```
    bot.js
    .env
    
    doremus/
        bot_functions.js
    
    slack/
        slack_hears.js
        slack_cards.js
    
    facebook/
        facebook_hears.js
        facebook_cards.js
```

- [bot.js](./bot.js) is the core file of the bot. It contains the code to declare the fundamental libraries, to start the RTM, and to load the hears methods.

- [.env](./) is the secret file containing all the tokens for Slack, Facebook and BotKit Studio.

- [doremus/](./doremus/) contains the files related to the access to the informations of the DOREMUS knowledge base: in this case, contains a single file ([bot_functions.js](./doremus/bot_functions.js)) that contains all the queries that the bot can do to DOREMUS.

- [slack/](./slack/) is a directory containing the files related to Slack:

    - [slack_hears.js](./slack/slack_hears.js) contains the methods to receive the sentences sent through Slack and processed by the NLU.
    - [slack_cards.js](./slack/slack_cards.js) contains the code to build the Slack cards to make the answers prettier.

- [facebook/](./facebook/) is a directory containing the files related to Facebook:

    - [facebook_hears.js](./facebook/facebook_hears.js) contains the methods to receive the sentences sent through Facebook and processed by the NLU.
    - [facebook_cards.js](./facebook/facebook_cards.js) contains the code to build the Facebook cards to make the answers prettier.

### Configuring
Prepare a .env for your node app. You can easily copy-paste the following:
```
# Environment Config
# (reference these in your code with process.env.SECRET)

PORT=3000

# slack
slackToken=<slack token>
clientId=<your client id>
clientSecret=<your client secret>

# facebook
fbAccessToken=<fb access token>
fbVerifyToken=<fb verify token>
fbAppSecret=<fb app secret token>

# dialogflow
dialogflow=<dialogflow token>
```

You need:
- [Slack token](https://api.slack.com/apps)
- [Facebook tokens](https://developers.facebook.com/apps/)
- Dialogflow token

### Deploying
You can easily launch the bot with:
```
$ npm start 
```

Enjoy!

## The bot capabilities
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


