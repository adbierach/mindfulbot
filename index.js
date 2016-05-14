var Botkit = require('botkit');


// Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

var controller = Botkit.slackbot({
	//debug: true
});

controller.spawn({
	token: slackToken
}).startRTM();

controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
	bot.reply(message, 'Hello yourself!');
	
});

controller.hears('metta', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {

	bot.startConversation(message, function(err,convo) {

		convo.say('Hello there.');
		convo.say('To practice loving-kindness meditation, sit in a comfortable and relaxed manner. Take two or three deep breaths with slow, long and complete exhalations. Let go of any concerns or preoccupations. For a few minutes, feel or imagine the breath moving through the center of your chest - in the area of your heart.');
		convo.ask('Say anything to continue on with the practice.', function(response,convo) {
			convo.next();
		});
		convo.say('Metta is first practiced toward oneself, since we often have difficulty loving others without first loving ourselves. Sitting quietly, mentally repeat, slowly and steadily, the following phrases:');
		convo.say('May I be happy. ');
		convo.say('May I be well.');
		convo.say('May I be safe.');
		convo.say('May I be peaceful and at ease.');
		//convo.stop();
	});

});



controller.hears('breathe', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
	bot.startConversation(message, function(err,convo) {
		convo.ask('Hello friend, what a perfect time to breathe. How long would you like to practice for? Reply with a number 1-10.', [
			{
				//regexp to match 1-10
				pattern: '[1-9]|10',
				callback: function(response,convo) {
					var time = response.text * 60000;
					convo.say({text: 'Begin by taking a moment to check in with yourself.', delay: 3000});
					convo.say({text: 'Notice any tension in your body.', delay: 3000});
					convo.say({text: 'Now, gently bring your attention to your breath.', delay: 4000});
					convo.say({text: 'Find an aspect of your breathing to focus on.', delay: 4000});
					convo.say({text: 'The air flowing in and out of your nose. Your chest rising and falling. Your belling expanding and contracting.', delay: 4000});
					convo.say({text: 'For the next ' + response.text + ' minutes, keep your attention on your breath. When you notice your attention wandering to any sensation or thought not related to your breath, become aware of this, and simply bring attention back to your breath.', delay: 6000});
					convo.say({text: 'Now would be a good time to close your eyes. I will notify you  when it is time to end the practice.', delay: 8000});
					convo.say({text: 'Thank yourself for taking this time to breathe. May you be happy, healthy, safe, and live with well-being.', delay: time});
					convo.next();
				}
			},
			{
				//if response is not 1 - 10, repeat
				default: true,
				callback: function(response,convo) {
					convo.repeat();
					convo.next();
				}
			}
		]);
	});
});

// To keep Heroku's free dyno awake
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Ok, dyno is awake.');
}).listen(process.env.PORT || 5000);

