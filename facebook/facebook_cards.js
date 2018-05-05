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