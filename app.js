
//Install dependencies 
"use strict";
var restify = require('restify');
var builder = require('botbuilder');

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
        builder.Prompts.confirm(session, "Do you think the bot is working?");
    },
    function (session, results) {
        if (results.response) {
            session.send("I think so too!");
        }
        else
        {
            session.send(":( Oh no!");
        }
        session.endDialog();
    }
]);