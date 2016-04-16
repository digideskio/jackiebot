var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var secrets = require('./secrets')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('heyyy! what\'s up?')
})

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === secrets.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i]
    sender = event.sender.id
    if (event.message && event.message.text) {
      text = event.message.text
      if (text === 'Generic') {
        sendGenericMessage(sender)
      } else if (text.indexOf("startups") !== -1) {
        sendTextMessage(sender, "omg, i'm so over startups")
      } else {
        sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
      }
    }
    if (event.postback) {
      text = JSON.stringify(event.postback)
      sendTextMessage(sender, "Postback received: "+text.substring(0, 200), secrets.PAGE_ACCESS_TOKEN)
      continue
    }
  }
  res.sendStatus(200)
})

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: secrets.PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "THE FUTURE",
          "subtitle": "zuck wants us to take vr selfies",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com",
            "title": "web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        }, {
          "title": "THE FUTURE",
          "subtitle": "well, if you\'re on a budget",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: secrets.PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: {
      recipient: {
        id: sender
      },
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

app.listen(app.get('port'), function() {
  console.log('running on port', app.get('port'))
})