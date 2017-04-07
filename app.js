
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
        builder.Prompts.confirm(session, "Would you like to play a game?");
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('/loop', session.dialogData.save)
        }
        else {
            session.send("No? Oh well! Ask again later.");
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
        }

        var str = inkStory.ContinueMaximally();

        while (inkStory.currentChoices.length == 1) {
            str += "\n\n...\n\n" + inkStory.currentChoices[0].text;
            inkStory.ChooseChoiceIndex(0);
            inkStory.ContinueMaximally();
        }

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
    },
    function (session, results, choices) {

        if (session.dialogData.save != null) {
            inkStory.state.LoadJson(session.dialogData.save);

            if (results.response) {
                inkStory.ChooseChoiceIndex(results.response.index);
                session.dialogData.save = inkStory.state.toJson();

                session.beginDialog('/loop', session.dialogData.save)
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