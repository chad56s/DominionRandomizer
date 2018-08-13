
var setMins = {
    "Dominion": 1,
    "Intrigue": 1,
    "Seaside": 2,
    "Alchemy": 3,
    "Prosperity": 3,
    "Cornucopia": 3,
    "Hinterlands": 3,
    "Dark Ages": 3,
    "Guilds": 3,
    "Adventures": 3,
    "Empires": 3,
    "Nocturne": 3,
    "Promos": 1
}

function getRandomNumber(min,max) {
    var range = max - min + 1;
    return Math.floor((Math.random() * range) + min);
}

var weightedSetInfo = function(cards, min, weightedPicker) {
    var setCards = cards;
    var minPicked = min;
    var wp = weightedPicker;	//we need this so we can figure out the normalizer.

    Object.defineProperties(this, {
        "cardCount": {
            get: function() { return setCards.length; }
        },
        //this property represents the likelihood that some card x will be part of a minimum draw from its deck
        "pctSomeCardInMinSet": {
            get: function() {
                if(this.cardCount && (this.cardCount - this.enforcedMin) >= 0)
                    return 1 - ((this.cardCount - this.enforcedMin)/this.cardCount);
                else
                    return 0;
            }
        },
        //this property attempts to normalize the sets by making sets with high pcts for cards to be picked be less likely that
        //the set is even picked in the first place.
        "normalizer": {
            get: function() { return this.pctSomeCardInMinSet <= 0 ? 0 : Math.round((wp.maxPctSomeCardInMinSet/this.pctSomeCardInMinSet)*1000); }
        },

        "enforcedMin": {
            get: function() { return Math.min(Math.min(minPicked,this.cardCount), wp.artificialMax); }
        }

    });

    this.selectCards = function() {
        var cards = [];
        for(var c = 0; c < this.enforcedMin; c++) {
            var p = getRandomNumber(0, this.cardCount-1);
            cards.push(setCards[p]);
            setCards.splice(p,1);
        }
        return cards;
    }

    this.setMin = function(min) { minPicked = min; }
}

/*
    cards = full json of cards, sets, etc.
    filterKingdom = optional filter function, injected to filter which cards we want to use;
        it is not necessary for the filter function to specify that we need kingdoms and landmarks and events only;
        that stuff is done here
 */
var weightedPicker = function(cards, filterKingdom) {

    var weightedSets = {};
    var _artificialMax = 100;

    Object.defineProperties(this, {
        //this property looks through the weightedSets and finds the one with the maximum chance for some card x to be chosen should the set be selected
        "maxPctSomeCardInMinSet": {
            get: function() {
                var max = 0;
                for(var set in weightedSets)
                    max = Math.max(max, weightedSets[set].pctSomeCardInMinSet);
                return max;
            }
        },
        "randMax": {
            get: function() {
                var rm = 0;
                for(var set in weightedSets)
                    rm += weightedSets[set].normalizer;
                return rm;
            }
        },
        "artificialMax": {
            get: function() { return _artificialMax; }
        }
    });

    var sets = cards.sets;
    var allCards = cards.cards;

    if(typeof filterKingdom == 'function')
        allCards = allCards.filter(filterKingdom);

    //get just the kingdom cards for now and look through those to construct the sets
    var kingdoms = allCards.filter(function(card) {
        return card.function == "Kingdom";
    });

    //TODO: events and landmarks
    var landvents = allCards.filter(function(card) {
        return card.function == "Landmark" || card.function == "Event";
    });

    //construct the set info
    for(var set = 0; set < sets.length; set++) {
        var setName = sets[set].name;
        if(!weightedSets[setName]) {
            weightedSets[setName] = new weightedSetInfo(kingdoms.filter(function(card) {
                return card.set == setName;
            }), setMins[setName], this);
        }
    }
    weightedSets["LandVents"] = new weightedSetInfo(landvents, 1, this);

    this.selectCards = function() {
        var kingdom = [];
        var landVents = [];
        var numLandVents = 0;
        var draws;

        while(kingdom.length < 10) {
            _artificialMax = 10 - kingdom.length;
            var pick = getRandomNumber(1,this.randMax);
            var set = null;
            for(set in weightedSets) {
                pick -= weightedSets[set].normalizer;
                if(pick <= 0)
                    break;
            }
            if(set == "LandVents") {
                landVents = landVents.concat(weightedSets[set].selectCards());
                if(++numLandVents == 2)
                    weightedSets[set].setMin(0);
            }
            else {
                draws = weightedSets[set].selectCards();
                if(kingdom.length + draws.length > 10)
                    draws.splice(0,(kingdom.length + draws.length - 10));
                kingdom = kingdom.concat(draws);
                weightedSets[set].setMin(1);
            }

        }

        return kingdom.concat(landVents);
    }

    var test = this.randMax;

}