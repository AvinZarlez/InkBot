# InkBot

This bot has been created using [Microsoft Bot Framework](https://dev.botframework.com).

This bot is designed to let you play through dialogs written in inkle's ink scripting language.

## How to use

1. Create a bot using the Microsoft Bot Framework, and get a Microsoft App ID and Password.
1. Host this project online (I recommend [Azure](https://azure.microsoft.com/)) and use this codebase.
1. Set your enviromental variables MicrosoftAppId and MicrosoftAppPassword to the values you created in step 1.
1. Lastly, write over the `story.json` file with your own story exported from [inky](https://github.com/inkle/inky).

### Structure

`app.js` runs the bot code and starts a [Restify](http://restify.com/) server.

Your `story.json` file is loaded when the bot comes online. The user's position within the ink story is saved using [inkjs](https://github.com/y-lohse/inkjs)'s built in save/load state and the bot framework's `session.dialogData`.

### Running the bot
If running locally, first run:

```
npm install
```

Then you can run the local restify server simply by running:

```
node app.js
```

Or within [Visual Studio Code](https://code.visualstudio.com/) hitting the "Start Debugging" button.

You can then talk to your bot locally using the [Bot Framework Emulator](https://docs.botframework.com/en-us/tools/bot-framework-emulator/)