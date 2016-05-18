// var Botkit = require('botkit');

// //adding this to keep heroku dyno awake...not sure if I will keep it
// var http = require('http');

// // Expect a SLACK_TOKEN environment variable
// var slackToken = process.env.SLACK_TOKEN
// if (!slackToken) {
//   console.error('SLACK_TOKEN is required!')
//   process.exit(1)
// }

// var controller = Botkit.slackbot({
// 	//debug: true
// });

// controller.spawn({
// 	token: slackToken
// }).startRTM();

// // controller.storage.teams.all(function(err, teams) {
// //   if (err) {
// //     console.log(err)
// //   }

// //   if(teams && teams.length){
// //     console.log('Connecting ' + teams.length + ' teams');
// //     teams.forEach(function(team){
// //       var bot = controller.spawn(team).startRTM(function(rtmErr) {
// //         if (rtmErr) {
// //           console.log('Error connecting bot to Slack:', rtmErr);
// //           return;
// //         }
// //       });
// //     });
// //   }
// // });

// controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
// 	bot.reply(message, 'Hello yourself!');
	
// });

// controller.hears('metta', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {

// 	bot.startConversation(message, function(err,convo) {

// 		convo.say('Hello there.');
// 		convo.say('To practice loving-kindness meditation, sit in a comfortable and relaxed manner. Take two or three deep breaths with slow, long and complete exhalations. Let go of any concerns or preoccupations. For a few minutes, feel or imagine the breath moving through the center of your chest - in the area of your heart.');
// 		convo.ask('Say anything to continue on with the practice.', function(response,convo) {
// 			convo.next();
// 		});
// 		convo.say('Metta is first practiced toward oneself, since we often have difficulty loving others without first loving ourselves. Sitting quietly, mentally repeat, slowly and steadily, the following phrases:');
// 		convo.say('May I be happy. ');
// 		convo.say('May I be well.');
// 		convo.say('May I be safe.');
// 		convo.say('May I be peaceful and at ease.');
// 		//convo.stop();
// 	});

// });



// controller.hears('breathe', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
// 	bot.startConversation(message, function(err,convo) {
// 		convo.ask('Hello friend, what a perfect time to breathe. How long would you like to practice for? Reply with a number 1-10.', [
// 			{
// 				//regexp to match 1-10
// 				pattern: '[1-9]|10',
// 				callback: function(response,convo) {
// 					var time = response.text * 60000;
// 					convo.say({text: 'Begin by taking a moment to check in with yourself.', delay: 3000});
// 					convo.say({text: 'Notice any tension in your body.', delay: 3000});
// 					convo.say({text: 'Now, gently bring your attention to your breath.', delay: 4000});
// 					convo.say({text: 'Find an aspect of your breathing to focus on.', delay: 4000});
// 					convo.say({text: 'The air flowing in and out of your nose. Your chest rising and falling. Your belling expanding and contracting.', delay: 4000});
// 					convo.say({text: 'For the next ' + response.text + ' minutes, keep your attention on your breath. When you notice your attention wandering to any sensation or thought not related to your breath, become aware of this, and simply bring attention back to your breath.', delay: 6000});
// 					convo.say({text: 'Now would be a good time to close your eyes. I will notify you  when it is time to end the practice.', delay: 8000});
// 					convo.say({text: 'Thank yourself for taking this time to breathe. May you be happy, healthy, safe, and live with well-being.', delay: time});
// 					convo.next();
// 				}
// 			},
// 			{
// 				//if response is not 1 - 10, repeat
// 				default: true,
// 				callback: function(response,convo) {
// 					convo.repeat();
// 					convo.next();
// 				}
// 			}
// 		]);
// 	});
// });

// // To keep Heroku's free dyno awake
// http.createServer(function(request, response) {
//     response.writeHead(200, {'Content-Type': 'text/plain'});
//     response.end('Ok, dyno is awake.');
// }).listen(process.env.PORT || 5000);

var Botkit = require('botkit');


// Botkit-based Redis store
var Redis_Store = require('./redis_storage.js');
var redis_url = process.env.REDIS_URL ||"redis://127.0.0.1:6379";
var redis_store = new Redis_Store({url: redis_url});

// Programmatically use appropriate process environment variables
try {
  require('./env.js');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('Not using environment variables from env.js');
  }
}

var port = process.env.PORT || process.env.port;

if (!process.env.clientId || !process.env.clientSecret || !port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  storage: redis_store,
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot','commands','incoming-webhook'],
  }
);

controller.setupWebserver(port,function(err,webserver) {
	webserver.get('/',function(req,res) {
		res.sendFile('index.html', {root: __dirname});
	});

	controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});

controller.hears('hello','direct_message',function(bot,message) {
  bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
});

// controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
//   bot.api.reactions.add({
//     timestamp: message.ts,
//     channel: message.channel,
//     name: 'robot_face',
//   },function(err) {
//     if (err) { console.log(err) }
//     bot.reply(message,'I heard you loud and clear boss.');
//   });
// });

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

// // To keep Heroku's free dyno awake
// http.createServer(function(request, response) {
//     response.writeHead(200, {'Content-Type': 'text/plain'});
//     response.end('Ok, dyno is awake.');
// }).listen(process.env.PORT || 5000);

controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});
