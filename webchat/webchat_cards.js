/* WEBCHAT CARDS */

module.exports.getBioCard = function getBioCard(fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
    var imageURLHTTPDropped = imageURL.split("://")[1]
    var bioAttachment = {
        "attachments": [{
            "text": "This is what I found:",
            "title": fullname,
            "files": [{
                "image": "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
            }],
            "fields": [{
                "title": "Born in",
                "value": birthPlace,
                "short": true
            }, {
                "title": "Birth date",
                "value": birthDate,
                "short": true
            }, {
                "title": "Dead in",
                "value": deathPlace,
                "short": true
            }, {
                "title": "Death date",
                "value": deathDate,
                "short": true
            }, {
                "title": "Bio",
                "value": bio,
                "short": false
            }],
            "color": "good"
        }]
    }
    return bioAttachment;
}


module.exports.getArtistCard = function getArtistCard(fullname, birthPlace, birthDate, deathPlace, deathDate, count) {

    var artistAttachment = {
        "attachments": [{
            "title": fullname,
            "fields": [{
                "title": "Born in",
                "value": birthPlace,
                "short": true
            }, {
                "title": "Birth date",
                "value": birthDate,
                "short": true
            }, {
                "title": "Dead in",
                "value": deathPlace,
                "short": true
            }, {
                "title": "Death date",
                "value": deathDate,
                "short": true
            }, {
                "title": "Number of works",
                "value": count,
                "short": true
            }],
            "color": "good"
        }]
    }
    return artistAttachment;
}


module.exports.getWorkCard = function getWorkCard(title, artist, year, genre, comment, key) {
    var workAttachment = {
        "attachments": [{
            "title": title,
            "fields": [{
                "title": "Composer",
                "value": artist,
                "short": true
            }, {
                "title": "Year",
                "value": year,
                "short": true
            }, {
                "title": "Genre",
                "value": genre,
                "short": true
            }, {
                "title": "Key",
                "value": key,
                "short": true
            }, {
                "title": "Comment",
                "value": comment,
                "short": false
            }],
            "color": "#4283f4"
        }]
    }
    return workAttachment;
}


module.exports.getPerformanceCard = function getPerformanceCard(title, subtitle, placeName, actorsName, date) {
    var performanceAttachment = {
        "attachments": [{
            "title": title,
            "text": subtitle,
            "fields": [{
                "title": "Where",
                "value": placeName,
                "short": true
            }, {
                "title": "When",
                "value": date,
                "short": true
            }, {
                "title": "Actors",
                "value": actorsName,
                "short": false
            }],
            "color": "#f4b042"
        }]
    }
    return performanceAttachment;
}