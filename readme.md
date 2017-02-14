# Botkit Starter Kit for Slack Apps

This repo contains everything you need to get started building a Slack App with Botkit and Botkit Studio!

[Botkit Studio](https://studio.botkit.ai/) is a set of tools that adds capabilities to the open source Botkit library by offering hosted GUI interfaces for script management and action trigger definition. Botkit Studio is built by [Howdy.](https://howdy.ai), the company that created and maintains the open source Botkit library.

**Note: Botkit Studio is in private beta right now.** [Click here](https://howdyai.typeform.com/to/JNTm22) to join the waitlist for access or [email us](mailto:info@howdy.ai).

### Create your new Slack app

To get started click Create New App at [https://api.slack.com/apps]([https://api.slack.com/apps). Don’t worry about your app submission to the Slack App Directory right now...you can always decide to submit it later.

After you’ve chosen a name and which team your app will live on, note the _Client ID_ and _Client Secret_ from the **App Credentials** view. You will need to paste these into your .env file to get your app up and running.

Once you’ve collected those keys, set up your default username in the **Bot Users** section and save your changes to continue.

### Remix this Botkit Slack App Starter Kit
Gomix is a fantastic tool for experimenting with bots without worrying about complex local development configurations. We’ve made it simple by creating a [Slack App Starter Kit](https://gomix.com/#!/project/botkit-slack) you can remix.

### Add your keys to Gomix and run

Gomix safely stores your keys in an .env folder. Paste your clientId, clientSecret, and studio_token (if you're using Botkit Studio) values in here. Don’t worry...if anyone remixes your project, your keys won’t be shared.

Once you’ve included your app credentials, click **Show Live** to get your bot server running. This will open Gomix’s instant hosting and deployment magic. You’ll need to have this server running for Slack to confirm your app’s endpoints and finish your configuration.

## Get your app talking to Slack
You’re almost there! Now you just need to get your environment variables set so your app can communicate with Slack and vice versa.

### Configure permissions
Return to your Slack app settings and navigate to **OAuth & Permissions**. There, paste in your _Redirect URL_, which is your own, remixed Gomix URL plus “/oauth”, like this example:

`https://botkit-slack.gomix.me/oauth`

Copy that URL from your browser window and paste into your settings. Save your changes and confirm your _Redirect URL_ to continue.

### Add a Bot User
Create a username and enable the Online notifier in the Bot Users section.

### Enable Interactive Messages
You’ll want to enable Interactive Messages for your app, so go ahead and do that too. That will be your Gomix URL, followed by “/slack/receive”, like this:

`https://botkit-slack.gomix.me/slack/receive`

Type that URL into the Request URL field to enable Interactive Messages.

### Enable and subscribe to Slack events
Now you can head over to **Event Subscriptions** and flip that toggle to enable Slack events! Here, you’ll paste in the same _Request URL_ you used for Interactive Messages.

**Enable Events** and enter your _Request URL_ to continue. Then, subscribe to the events your apps requires below. For the purposes of this example, we’re going to subscribe to some **Bot Events** that allows this Botkit bot to hear messages wherever they’re posted:

* `message.im`
* `message.mpim`
* `message.channels`
* `message.groups`

### Subscribe to events in Slack

Now comes the fun part…
Add your new app by clicking the “Add to Slack” button and select a team. Authorize your bot and it will magically begin talking to you in Slack!

### Congratulations! 

You just brought a brand new Slack app to life using the Events API, Botkit and Gomix. Now your adventure as a Slack developer officially begins with Botkit! 🎉

All of Botkit’s powerful functionality works with the Slack API automatically! Check out the Slack Events API documentation and the Botkit documentation to get started.

Continue your journey to becoming a champion botmaster by [reading the Botkit Studio SDK documentation here.](https://github.com/howdyai/botkit/blob/master/readme-studio.md)

### Credits
Written by [@esoelzer](https://twitter.com/esoelzer). Thanks to [@benbrown](https://twitter.com/benbrown) and [@peterswimm](https://twitter.com/peterswimm) for engineering and testing. [Botkit](https://github.com/howdyai/botkit) and [Botkit Studio](https://studio.botkit.ai/) are made by the [Howdy](https://howdy.ai/) team in Austin, TX.
