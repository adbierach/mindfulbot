




var Botkit = require('botkit');
require('./env.js');

// // Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

// var controller = Botkit.slackbot({
//  //debug: true
// });

// controller.spawn({
//  token: slackToken
// }).startRTM();


// Botkit-based Redis store
var Redis_Store = require('./redis_storage.js');
var redis_url = "redis://127.0.0.1:6379";
var redis_store = new Redis_Store({url: redis_url});





var port = process.env.port;


var controller = Botkit.slackbot({
  debug: true,
  storage: redis_store,
});

controller.spawn({
  token: slackToken
}).startRTM();

// controller.setupWebserver(port,function(err,webserver) {
// 	webserver.get('/',function(req,res) {
// 		res.sendFile('index.html', {root: __dirname});
// 	});

// 	controller.createWebhookEndpoints(controller.webserver);

//   controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
//     if (err) {
//       res.status(500).send('ERROR: ' + err);
//     } else {
//       res.send('Success!');
//     }
//   });
// });


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

controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
	bot.reply(message, 'Hello yourself!');
	
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
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
          convo.say({text: '',attachments: [
        {
            "fallback": "Breathe with the shape",
            //"pretext": "Say breathe",
            "title": "Breathe with the shape",
            //"title_link": "https://groove.hq/path/to/ticket/1943",
            //"text": "Breathe with the shape",
            "color": "#7CD197",
            "image_url": "http://static.highexistence.com/wp-content/uploads/2014/12/tumblr_nexv126czE1ql82o1o1_500.gif"
        }], delay: 1000});
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

controller.hears(['attach'],['direct_message','direct_mention'],function(bot,message) {

  var attachments = [];
  var attachment = {
    title: 'This is an attachment',
    color: '#FFCC99',
    fields: [],
  };

  attachment.fields.push({
    label: 'Field',
    value: 'A longish value',
    short: false,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachments.push(attachment);

  bot.reply(message,{
    text: 'See below...',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

controller.hears('help', ['direct_message', 'direct_mention', 'mention'], function(bot,message) {
      //Using attachments
    var attachments = [
        {
            "fallback": "Say breathe for breath awareness",
            //"pretext": "Say breathe",
            "title": "Breathe",
            "text": "Say breathe for breath awareness",
            "color": "#7CD197"
            //"image_url": "http://static.highexistence.com/wp-content/uploads/2014/12/tumblr_nexv126czE1ql82o1o1_500.gif"
        },
        {
            "fallback": "Say 'metta' for loving-kindness",
            //"pretext": "Say metta",
            "title": "Metta",
            //"title_link": "https://groove.hq/path/to/ticket/1943",
            "text": "Say 'metta' for loving-kindness",
            "color": "#7CD197"
        },
        {
            "fallback": "Learn about the science behind mindfulness",
            "title": "Science",
            //"title_link": "https://groove.hq/path/to/ticket/1943",
            "text": "Learn about the science behind mindfulness",
            "color": "#7CD197"
        },
        {
            "fallback": "A list of resources and products to grow your mindfulness practice.",
            "title": "Resources",
            //"title_link": "https://groove.hq/path/to/ticket/1943",
            "text": "A list of resources and products to grow your mindfulness practice.",
            "color": "#7CD197"
        }
    ];

  bot.reply(message,{
    text: 'I understand these commands:',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
  
});

controller.hears('interactive', 'direct_message', function(bot, message) {

    bot.reply(message, {
        attachments:[
            {
                title: 'Do you want to interact with my buttons?',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                        "name":"no",
                        "text": "No",
                        "value": "no",
                        "type": "button",
                    }
                ]
            }
        ]
    });    
});

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {

    // check message.actions and message.callback_id to see what action to take...
    if (message.callback_id !== '123') {
      console.log('naaaahhhh man');
      return;
    }

    bot.replyInteractive(message, {
        text: '...',
        attachments: [
            {
                title: 'My buttons',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes!",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                       "text": "No!",
                        "name": "no",
                        "value": "delete",
                        "style": "danger",
                        "type": "button",
                        "confirm": {
                          "title": "Are you sure?",
                          "text": "This will do something!",
                          "ok_text": "Yes",
                          "dismiss_text": "No"
                        }
                    }
                ]
            }
        ]
    });

});