/* FACEBOOK CARDS */

module.exports.getBioCard = function getBioCard(artist, fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
    var imageURLHTTPDropped = imageURL.split("://")[1]
    var bioAttachment = {
        'type': 'template',
        'payload': {
            'template_type': 'generic',
            'elements': [{
                'title': fullname,
                'image_url': "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
                'subtitle': 'Born in: ' + birthPlace +
                    '\nBirth date: ' + birthDate +
                    '\nDeath in :' + deathPlace +
                    '\nDeath date: ' + deathPlace,
                'buttons': [{
                    'type': 'postback',
                    'title': 'Get bio',
                    'payload': artist
                }]
            }, ]
        }
    };
    return bioAttachment;
}


module.exports.getPerformanceCard = function getPerformanceCard(title, subtitle, placeName, actorsName, date) {
    var performanceAttachment = {
        "type": "template",
        "payload": {
            "template_type": "list",
            "top_element_style": "compact",
            "elements": [{
                "title": title,
                "subtitle": subtitle
            }, {
                "title": "Where",
                "subtitle": placeName
            }, {
                "title": "When",
                "subtitle": date
            }, {
                "title": "Actors",
                "subtitle": actorsName
            }]
        }
    }
    return performanceAttachment;
}


module.exports.getWorkCard = function getWorkCard(title, artist, year, genre, comment, key) {
    var workAttachment = {
        "type": "template",
        "payload": {
            "template_type": "list",
            "top_element_style": "compact",
            "elements": [{
                "title": title,
                "subtitle": "by " + artist
            }, {
                "title": "Details",
                "subtitle": "Year: " + year + "\nGenre: " + genre + "\nKey: " + key
            }, {
                "title": "Comment",
                "subtitle": comment
            }]
        }
    }
    return workAttachment;
}