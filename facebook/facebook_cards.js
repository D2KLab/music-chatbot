/* FACEBOOK CARDS */

/*******************************************************************************/
module.exports.getBioCard = function getBioCard(artist, fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
  var imageURLHTTPDropped = imageURL.split("://")[1]
  var bioAttachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[
                {
                    'title': fullname,
                    'image_url': "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
                    'subtitle':'Born in: ' + birthPlace +
                               '\nBirth date: ' + birthDate +
                               '\nDeath in :' + deathPlace +
                               '\nDeath date: ' + deathPlace,                
                    'buttons':[
                        {
                        'type':'postback',
                        'title':'Get bio',
                        'payload': artist
                        }
                    ]
                },
            ]
        }
    };
  return bioAttachment;
}
/*******************************************************************************/


/*******************************************************************************/
module.exports.getPerformanceCard = function getPerformanceCard(title, subtitle, placeName, actorsName, date) {
  var performanceAttachment = {
    "attachments": [{
        "title": title,
        "text": subtitle,
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "fields": [
            {
                "title": "Where",
                "value": placeName,
                "short": true
            },
            {
                "title": "When",
                "value": date,
                "short": true
            },
            {
                "title": "Actors",
                "value": actorsName,
                "short": false
            }
        ],
        "color": "#f4b042"
    }]
  }
  
  var attachment = {
      "type": "template",
      "payload": {
        "template_type": "list",
        "top_element_style": "compact",
        "elements": [
          {
            "title": title,
            "subtitle": subtitle,
          },
          {
            "title": "Where",
            "subtitle": placeName,
          },
          {
            "title": "When",
            "subtitle": date,        
          }
        ],
         "buttons": [
          {
            "title": "View More",
            "type": "postback",
            "payload": "payload"            
          }
        ]  
      }
  }
  return attachment;
}