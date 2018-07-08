/* SLACK CARDS */

module.exports.getBioCard = function getBioCard(fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
    var imageURLHTTPDropped = imageURL.split("://")[1];
    var bioAttachment = {
        "attachments": [{
            "pretext": "This is what I found:",
            "fallback": "New message from DOREMUS Bot!",
            "title": fullname,
            "image_url": "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
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
    };
    return bioAttachment;
};


module.exports.getArtistCard = function getArtistCard(fullname, birthPlace, birthDate, deathPlace, deathDate, count) {

    var artistAttachment = {
        "attachments": [{
            "fallback": "New message from DOREMUS Bot!",
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
    };
    return artistAttachment;
};


module.exports.getWorkCard = function getWorkCard(title, artist, year, genre, comment, key) {
    var workAttachment = {
        "attachments": [{
            "title": title,
            "fallback": "New message from DOREMUS Bot!",
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

module.exports.getHelpCard = function getHelpCard(language) {

    var helpAttachment;

    if (language === 'en') {
        helpAttachment = {
            "attachments": [{
                "title": "Some things you can ask me:",
                "fallback": "New message from DOREMUS Bot!",
                "fields": [{
                    "title": "Give me 3 works composed by Bach",
                    "value": "You can find the WORKS with your preferred filters.",
                    "short": false
                }, {
                    "title": "Give me 2 works for violin, clarinet and piano",
                    "value": "Not only by artist but also by multiple instruments!",
                    "short": false
                }, {
                    "title": "Tell me 5 sonatas written between 1782 and 1821",
                    "value": "And even more: genre and composition year.",
                    "short": false
                }, {
                    "title": "Find one artist, born between 1752 and 1772, who wrotes more works for clarinet",
                    "value": "You can find the ARTISTS with your preferred filters",
                    "short": false
                }, {
                    "title": "What do you know about Beethoven?",
                    "value": "Once you know the name of an artist, you can get the bio.",
                    "short": false
                }, {
                    "title": "... now give me 5 of his works, written for clarinet",
                    "value": "Hey, I remember when we are talking about an artist!",
                    "short": false
                }, {
                    "title": "Tell me one event in Paris in the next month!",
                    "value": "I'm also good at discovering EVENTS in your favourite places",
                    "short": false
                }],
                "color": "#4283f4"
            }]
        }
    } else if (language === 'fr') {
        helpAttachment = {
            "attachments": [{
                "title": "Tu me peux demander:",
                "fallback": "Nouveau message de DOREMUS Bot!",
                "fields": [{
                    "title": "Donne-moi deux oeuvres de Bach",
                    "value": "Tu peux trouver les oeuvres avec tes filtres favoris.",
                    "short": false
                }, {
                    "title": "Donne-moi deux oeuvres pour violin, clarinette et piano",
                    "value": "Aussi avec plusieurs instruments!",
                    "short": false
                }, {
                    "title": "Trouve-moi un compositeur qui a écrit plus oeuvres pour clarinette",
                    "value": "Tu peux trouver les compositeurs avec des filtres!",
                    "short": false
                }, {
                    "title": "Parle-moi de Beethoven",
                    "value": "Tu peux obtenir le bio d'un compositeur",
                    "short": false
                }, {
                    "title": "... alors donne-moi deux de ses aria pour violin et clarinette",
                    "value": "Hey, je me souviens qu'on parle d'un compositeur!",
                    "short": false
                }, {
                    "title": "Proposes-moi un évènement le mois prochain",
                    "value": "Je suis aussi capable de trouver des performances de musique!",
                    "short": false
                }],
                "color": "#4283f4"
            }]
        };
    }
    return helpAttachment;
};


module.exports.getPerformanceCard = function getPerformanceCard(title, subtitle, placeName, actorsName, date) {
    var performanceAttachment = {
        "attachments": [{
            "title": title,
            "text": subtitle,
            "fallback": "New message from DOREMUS Bot!",
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
    };
    return performanceAttachment;
};