
//Install dependencies 
"use strict";
var restify = require('restify');
var builder = require('botbuilder');

var Story = require('inkjs').Story;

//Set up Restify Server 
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//Set up static front-end web chat iframe viewer
server.get('/', restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));


//Create chat bot 
var connector = new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword']
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen())

bot.dialog('/', [
    function (session) {
        session.dialogData.save = null;
        builder.Prompts.confirm(session, "Hello! Would you like to play a story?");
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('/loop', session.dialogData.save)
        }
        else {
            session.send("No? Oh well! That's all I do. If you change your mind, ask again later.");
        }
    }
]);

var json = require('./story.json');
var inkStory = new Story(json);

bot.dialog('/loop', [
    function (session, args) {
        session.dialogData.save = args || null;

        if (session.dialogData.save != null) {
            inkStory.state.LoadJson(session.dialogData.save);
        }
        else {
            session.send("NEW GAME");
            inkStory.ResetState();
        }

        if (!inkStory.canContinue && inkStory.currentChoices.length === 0) {
            session.send("GAME OVER");

            session.dialogData.save = null;

            session.endDialog();
        }

        // write the story one line at a time to the string until we find a choice
        var str = "";
        var custom = false;
        var continueStory = false;
        do {
            //Write the whole story until we find a choice 
            //var str = inkStory.ContinueMaximally(); //Disabled to check for custom dialogs.

            while (inkStory.canContinue) {
                str += "\n" + inkStory.Continue();

                custom = false;
                inkStory.currentTags.forEach(function (element) {
                    if (element == "customDialog:custom") {
                        custom = true;
                    }
                }, this);
                if (custom) {

                    session.send(str);
                    //session.dialogData.save = inkStory.state.toJson(); //Unneeded line?
                    session.replaceDialog('/custom', inkStory.state.toJson())
                    break;
                }
            }
            if (!custom && inkStory.currentChoices.length == 1) {
                str += "\n\n...\n\n" + inkStory.currentChoices[0].text + "\n\n...\n\n";
                inkStory.ChooseChoiceIndex(0);
                continueStory = true;
            }
            else {
                continueStory = false;
            }
        }
        while (continueStory);

        if (!custom) {
            if (inkStory.currentChoices.length > 0) {

                var choices = {};
                for (var i = 0; i < inkStory.currentChoices.length; ++i) {
                    choices[inkStory.currentChoices[i].text] = i;
                }

                session.dialogData.save = inkStory.state.toJson();

                //session.send("Save Data: "+session.dialogData.save);

                builder.Prompts.choice(session, str, choices);
            }
            else {
                session.send(str);
                session.send("GAME OVER");

                session.dialogData.save = null;

                session.endDialog();
            }
        }
    },
    function (session, results) {

        if (session.dialogData.save != null) {
            inkStory.state.LoadJson(session.dialogData.save);

            if (results.response) {
                inkStory.ChooseChoiceIndex(results.response.index);
                session.dialogData.save = inkStory.state.toJson();

                session.replaceDialog('/loop', session.dialogData.save)
            }
            else {
                session.send("ERROR :( I didn't get a response!");
            }
        }
        else {
            session.send("ERROR loading json!");
        }

    }
]);


bot.dialog('/custom', [
    function (session, save) {
        session.dialogData.save = save;
        builder.Prompts.confirm(session, "Welcome to the custom dialog! Did you make it ok?");
    },
    function (session, results) {
        if (results.response) {
            session.send("Good! Let's continue then.");
        }
        else {
            session.send("Oops! Let's continue anyway.");
        }
        session.replaceDialog('/loop', session.dialogData.save)
    }
]);