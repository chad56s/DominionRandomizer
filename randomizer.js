var app = angular.module("domRdmz",[]);

app.controller("domRdmz_ctrl",["$scope","$http",function($scope,$http){

	var SET_DARK_AGES = "Dark Ages";
	var SET_PROSPERITY = "Prosperity";

	var FUNCTION_KINGDOM = "Kingdom";
	var FUNCTION_OTHER_RANDOMIZER = "OtherRandomizer";
	var FUNCTION_ALLY = "Ally";


  //KINGDOM CARD TYPES
	var TYPE_ACTION = "Action";
	var TYPE_LIAISON = "Liaison";
	//split types
	var SPLIT_TYPES = ["Augur","Clash","Fort","Odyssey","Townsfolk","Wizard"];
  
	//OTHER RANDOMIZER CARD TYPES
	var TYPE_EVENT = "Event";
	var TYPE_LANDMARK = "Landmark";
	var TYPE_PROJECT = "Project";
	var TYPE_WAY = "Way";

	//SPECIFIC KINGDOM CARDS
	var CARD_BLACK_MARKET = "Black Market";
	var CARD_YOUNG_WITCH = "Young Witch";
	
	//SPECIFIC LANDMARKS
	var CARD_OBELISK = "Obelisk";

	//SPECIFIC WAYS
	var CARD_WAY_OF_THE_MOUSE = "Way of the Mouse";
	
	var SORT_SET_BY_NAME = 'name_display';
	var SORT_SET_BY_ORDER = 'release_order';
	
	var SORT_CARDS_BY_COST = ['costcoins','costpotions','costdebt','card'];
	var SORT_CARDS_BY_NAME = "['card']";
	var SORT_CARDS_BY_SET = "[cardSetSortOrder,'card']";
	var SORT_CARDS_BY_DRAWN = "[]";
	
	function resetMyKingdom() {	

		$scope.my_kingdom = {
			kingdom_cards: [],
			otherRandomizers: [],
			allies: [],
			blackmarket: [],
			blackmarket_flop: [],
			bane: null,
			obelisk_pile: null,
			use_col_plat: false,
			use_shelters: false,
			mouse_action: null
		};
		$scope.blackmarket_card_picked = false;
	}
	
	function getRandomNumber(min,max) {
		var range = max - min + 1;
		return Math.floor((Math.random() * range) + min);
	}
	
	//drawCard removes random card from deck and returns it
	//requirements = function that returns true if the picked card fits some criteria
	function drawCard(deck,requirements) {
		var index = chooseRandomIndex(deck,requirements);
		return index > -1 ? deck.splice(index,1)[0] : null;
	}
	//selectCard selects a random card from the deck without removing it and returns it
	//requirements = function that filters the deck down to some criteria
	function selectCard(deck,requirements) {
		var index = chooseRandomIndex(deck,requirements);
		return index > -1 ? deck[index] : null;
	}
	//helper function for drawCard and selectCard. Actually does the random selection and returns the index
	function chooseRandomIndex(deck, requirements) {
		var index = -1;
		
		if(requirements) {
			var matchingIndices = [];
			deck.forEach(function(card,idx,ar) {
				if(requirements(card))
					matchingIndices.push(idx);
			});
			if(matchingIndices.length > 0)
				index = matchingIndices[getRandomNumber(0,matchingIndices.length-1)];
		}
		else if(deck.length > 0)
			index = getRandomNumber(0,deck.length - 1);
		
		return index;
	}
  
	function cardIsType(card, type){
		return card.type.indexOf(type) != -1
	}
		
	/*
	*
	*	SPECIAL FUNCTIONS for particular cards in the kingdom (young witch, black market, obelisk)
	*
	*/
	function addBane(deck) {
		var isEligibleBane = function(card) { 
			return	card.function == FUNCTION_KINGDOM &&
					card.costcoins >=2 && 
					card.costcoins <= 3 && 
					card.costpotions == 0 && 
					card.costdebt == 0; 
		};
		$scope.my_kingdom.bane = drawCard(deck,isEligibleBane);
		$scope.my_kingdom.kingdom_cards.push($scope.my_kingdom.bane);
	}
	
	function chooseObeliskPile() {
		$scope.my_kingdom.obelisk_pile = chooseRandomKingdomPile($scope.filterActionCards);
	}
	
	function createBlackMarket(deck) {
		
		if(deck.filter($scope.filterKingdomCards).length >= 30) {
			while($scope.my_kingdom.blackmarket.length < 30)
				$scope.my_kingdom.blackmarket.push(drawCard(deck,$scope.filterKingdomCards));
		}
	}

	function addWayOfMouseAction(deck) {
		var isEligibleAction = function(card) { 
			return	card.function == FUNCTION_KINGDOM &&
					cardIsType(card,TYPE_ACTION) &&
					card.costcoins >=2 && 
					card.costcoins <= 3 && 
					card.costpotions == 0 && 
					card.costdebt == 0;
		}
		$scope.my_kingdom.mouse_action = drawCard(deck,isEligibleAction);
	}

	function chooseAlly() {
		$scope.my_kingdom.allies.push(selectCard($scope.ally_cards,function(c){ return true; }));
	}
	
	/*
	*	choose a RandomKingdomPile. Useful for things like picking a pile for Obelisk (others?)
	*/
	function chooseRandomKingdomPile(requirements) {
		return selectCard($scope.my_kingdom.kingdom_cards,requirements);
	}
	
	

	resetMyKingdom();
	
	/*
	* SCOPE VARIABLES
	*/
	$scope.how_many = 100000;
	$scope.stats = {
		total_created: 0,
		w_shelt: 0,
		w_col_plat: 0,
		w_both: 0
	};
	
	$scope.show_settings = false;
	var settingsTimeout = 0;
	$scope.changeSettingsShow = function() {
		$scope.show_settings = !$scope.show_settings;
	}
	$scope.revealSettings = function(show) {
		if(show) {
            if(settingsTimeout > 0) clearTimeout(settingsTimeout);
			$scope.show_settings = true;
		}
		else {
            settingsTimeout = setTimeout(function() {
            	$scope.show_settings = false;
            	settingsTimeout = 0;
			}, 1000);
		}
	}


	$scope.testing_tools = false;
	
	$scope.all_cards = [];
	$scope.randomizer_cards = [];
	$scope.kingdom_cards = [];
	$scope.ally_cards = [];
	$scope.split_cards = [];	//augurs, wizards, townsfolk, etc.
	$scope.blackmarket_card_picked = false;
	
	Object.defineProperties($scope, {
			"sort_sets_by_name": {
				value: SORT_SET_BY_NAME,
				writable:false
			},
			"sort_sets_by_release": {
				value: SORT_SET_BY_ORDER,
				writable:false
			}
		}
	);
	
	Object.defineProperties($scope, {
		"sort_cards_by_cost": {
			get: function() {return SORT_CARDS_BY_COST}
		},
		"sort_cards_by_name": {
			value: SORT_CARDS_BY_NAME,
			writable:false
		},
		"sort_cards_by_set": {
			value: SORT_CARDS_BY_SET,
			writable:false
		},
    "sort_cards_by_drawn": {
      value: SORT_CARDS_BY_DRAWN,
      writable:false
    }
	});
	
	$scope.sets = [];
	$scope.chosen_sets = {};
	
	$http({
		method: 'GET',
		url: 'cards.json'
	}).then(
		function successCallback(response){
			$scope.all_data = response.data;
			$scope.all_cards = response.data.cards;
			$scope.sets = response.data.sets;
			
			//start out selecting  all sets
			//TODO: this should all be part of my_settings
			$scope.sets.forEach(function(s) {
					s.selected = true;
					s.min = 0;
					s.max = 10;
					
					Object.defineProperty(s,"name_display",{get: function() {return $scope.displaySet(s);}});
				}
			);
			$scope.chunkSets();
			
			//find the unique sets, construct the initial randomizer deck and collect the kingdom cards
			angular.forEach($scope.all_cards, function(card, idx) {
				card.num_times_picked = 0;
				card.array_index = idx;
				
				//turn the type string into an array of types.
				card.type = card.type.split("-").map(function(val,idx,ar) { return val.trim(); });
				
				//turn the edition into an arry of editions
				card.edition = card.edition.split(",");
				
				if($scope.filterIsRandomizer(card))
					$scope.randomizer_cards.push(card);
				if(card.function == FUNCTION_KINGDOM)
					$scope.kingdom_cards.push(card);
				else if(card.function == FUNCTION_ALLY)
					$scope.ally_cards.push(card);
				else if(SPLIT_TYPES.indexOf(card.function) >= 0)
					$scope.split_cards.push(card);
				
				
				Object.defineProperty(card,"set_display",{get: function() {
					var set = $scope.filterCardInSelectedSet(this);
					return set ? set.name_display : this.set;
						
				}});
			});
			
		},
		function failureCallback(response){
			$scope.test = response.status;
		}
	);
	
	//FILTER: is the card a randomizer (kingdom, event or landmark)
	$scope.filterIsRandomizer = function(card,index,ar) {
		return card.function == FUNCTION_KINGDOM || card.function == FUNCTION_OTHER_RANDOMIZER;
	}
	//FILTER: is the card in one of the selected sets in the settings
	$scope.filterCardInSelectedSet = function(card,index,ar) {	
		return $scope.sets.filter($scope.filterSelectedSets).find(function(s){return s.name == card.set && card.edition.indexOf(s.edition) != -1});
	}
	//FILTER: is the set selected?
	$scope.filterSelectedSets = function(set,index,ar) {
		return set.selected;
	}
	//FILTER: is the card a kingdom card?
	$scope.filterKingdomCards = function(card,index,ar) {
		return card.function == FUNCTION_KINGDOM;
	}
	//FILTER: is the card a randomizer card other than kingdom card?
	$scope.filterOtherRandomizerCards = function(card,index,ar) {
		return card.function == FUNCTION_OTHER_RANDOMIZER;
	}
	//FILTER: is the card a kingdom card?
	$scope.filterEventCards = function(card,index,ar) {
		return cardIsType(card,TYPE_EVENT) && $scope.filterOtherRandomizerCards(card,index,ar);
	}
	//FILTER: is the card a landmark card?
	$scope.filterLandmarkCards = function(card,index,ar) {
		return cardIsType(card,TYPE_LANDMARK) && $scope.filterOtherRandomizerCards(card,index,ar);
	}
	//FILTER: is the card a project card?
	$scope.filterProjectCards = function(card,index,ar) {
		return cardIsType(card,TYPE_PROJECT) && $scope.filterOtherRandomizerCards(card,index,ar);
	}
	//FILTER: is the card a way card?
	$scope.filterWayCards = function(card,index,ar) {
		return cardIsType(card,TYPE_WAY) && $scope.filterOtherRandomizerCards(card,index,ar);
	}
	//FILTER: is the card an action card?
	$scope.filterActionCards = function(card,index,ar) {
		return cardIsType(card,TYPE_ACTION) && $scope.filterKingdomCards(card,index,ar);
	}
	//FILTER: is the card an ally card?
	$scope.filterAllyCards = function(card,index,ar) {
		return cardIsType(card,TYPE_ALLY)
	}
	//FILTER: is the card in a split pile?
	$scope.filterSplitCards = function(card,index,ar) {
		return SPLIT_TYPES.indexOf(card.function) >= 0;
	}

	$scope.cardSetSortOrder = function(card) {
		return $scope.sets.find(function(s) { return s.name == card.set})[$scope.my_settings.sort_sets_by];
	}
	
	$scope.findCard = function(deck,text) {
		return deck.find(function(c){ return c.card == text});
	}
	
	$scope.cardInDeck = function(deck,text) {
		return deck.some(function(c) { return c.card == text});
	}

	$scope.needAlly = function(deck) {
		return deck.some(function(c) { 
			var drawAlly = false;
			if(cardIsType(c, TYPE_LIAISON))
				drawAlly = true;
			else {
				//see if it's a split pile. If it is, check all the cards with that function to see if any of them is a Liaison as well.
				//(e.g. Students in the Wizard split pile)
				for(const st of SPLIT_TYPES){
					if(cardIsType(c, st))
					{
						console.log(c.card + " is of type: " + st);
						console.log("there are " + $scope.split_cards.length + " split cards");
						drawAlly = $scope.split_cards
							.filter(function(c1){ return c1.function == st;})
							.some(function(c2) { return cardIsType(c2, TYPE_LIAISON);})
					}
				}
			}
			return drawAlly;
		});
	}
	
	$scope.displayCost = function(card) {
		var cost = card.costcoins;
		if(card.costpotions > 0)
			cost += " " + card.costpotions + "P";
		if(card.costdebt > 0)
			cost += " " + card.costdebt + "D";
		
		return cost;
	}
	
	$scope.displaySet = function(set) {
		return set.edition == "1" ? set.name : set.name + " (" + ordinal_suffix_of(set.edition) + " ed.)";
	}

	$scope.my_settings = {
		events: {min: 0, max: 2},
		landmarks: {min: 0, max: 2},
		projects: {min: 0, max: 2},
		ways: {min: 0, max: 1},
		otherRandomizersTotal: {min: 0, max: 2},
		sort_sets_by: SORT_SET_BY_ORDER,
		sort_cards_by: [$scope.cardSetSortOrder,'card']
	};
  
	$scope.createMyWeightedKingdom = function() {

		resetMyKingdom();

		var validRandomizers = $scope.randomizer_cards.filter($scope.filterCardInSelectedSet)
		var myWeightedPicker = new weightedPicker($scope.all_data, $scope.filterCardInSelectedSet);

		var kingdom = myWeightedPicker.selectCards();

		$scope.my_kingdom.kingdom_cards = kingdom.filter($scope.filterKingdomCards);
		$scope.my_kingdom.otherRandomizers = kingdom.filter($scope.filterOtherRandomizerCards);

		// narrow down the valid randomizers to just kingdom cards (take the OTHER_RANDOMIZERS out) and
		// remove the cards we've already selected so that we don't pick them again for things like Young Witch and Obelisk
		var validRandomizers = (validRandomizers.filter($scope.filterKingdomCards)).filter(function(randomizer_card) {
			return !$scope.my_kingdom.kingdom_cards.find(function(kingdom_card){ return randomizer_card == kingdom_card; });
		});

		if($scope.cardInDeck($scope.my_kingdom.kingdom_cards,CARD_YOUNG_WITCH))
			addBane(validRandomizers);
		//pick a random Action for The Way of the Mouse
		if($scope.cardInDeck($scope.my_kingdom.otherRandomizers,CARD_WAY_OF_THE_MOUSE))
			addWayOfMouseAction(validRandomizers);
		if($scope.cardInDeck($scope.my_kingdom.kingdom_cards,CARD_BLACK_MARKET))
			createBlackMarket(validRandomizers);
		//check black market for young witch - I thought it best to do bane and way of mouse first for kingdom cards so that black market would have less of a chance of sucking up all the 2s and 3s
		if($scope.cardInDeck($scope.my_kingdom.blackmarket,CARD_YOUNG_WITCH))
			addBane(validRandomizers);
		//designate random Action supply pile for the Obelisk
		if($scope.cardInDeck($scope.my_kingdom.otherRandomizers,CARD_OBELISK))
			chooseObeliskPile();
		//select an ally if needed
		if($scope.needAlly($scope.my_kingdom.kingdom_cards))
			chooseAlly();

		var ucpnum1 = getRandomNumber(0,9);
		var ucpnum2 = getRandomNumber(0,9);
		var usnum1 = getRandomNumber(0,9);
		var usnum2 = getRandomNumber(0,9);
		$scope.my_kingdom.use_col_plat = $scope.my_kingdom.kingdom_cards[ucpnum1].set == SET_PROSPERITY || $scope.my_kingdom.kingdom_cards[ucpnum1].set == SET_PROSPERITY;
		$scope.my_kingdom.use_shelters = $scope.my_kingdom.kingdom_cards[usnum1].set == SET_DARK_AGES || $scope.my_kingdom.kingdom_cards[usnum1].set == SET_DARK_AGES;

		if($scope.my_kingdom.use_col_plat) $scope.stats.w_col_plat++;
		if($scope.my_kingdom.use_shelters) $scope.stats.w_shelt++;
		if($scope.my_kingdom.use_shelters && $scope.my_kingdom.use_col_plat) $scope.stats.w_both++;

	}


	$scope.createMyKingdom = function() {
		
		resetMyKingdom();
		
		var validRandomizers = $scope.randomizer_cards.filter($scope.filterCardInSelectedSet);
		var countKingdomCards = validRandomizers.filter(function(c) { return c.function == FUNCTION_KINGDOM;}).length;
		
		//total the user's minimum requirements to make sure they're not unfillable
		var minTotal = $scope.sets.reduce( function(tot, set){ return tot + parseInt(set.min)}, 0 );
		
		$scope.stats.total_created++;
		
		
		if(countKingdomCards >= 10 && minTotal <= 10) {
			var passedUpDeck = [];
			while($scope.my_kingdom.kingdom_cards.length < 10) {
				var card = drawCard(validRandomizers);
				var cardUsed = false;
        
				if(card.function == FUNCTION_KINGDOM) {
					$scope.my_kingdom.kingdom_cards.push(card);
					cardUsed = true;
					card.num_times_picked++;
				}
        		else if($scope.my_kingdom.otherRandomizers.length < $scope.my_settings.otherRandomizersTotal.max)
        		{
					var filter;
					var setting;
					
					if(cardIsType(card,TYPE_EVENT)) {
						filter = $scope.filterEventCards;
						setting = $scope.my_settings.events.max;
					}
					else if (cardIsType(card,TYPE_LANDMARK)) {
						filter = $scope.filterLandmarkCards;
						setting = $scope.my_settings.landmarks.max;
					}
					else if (cardIsType(card,TYPE_PROJECT)) {
						filter = $scope.filterProjectCards;
						setting = $scope.my_settings.projects.max;
					}
					else if (cardIsType(card,TYPE_WAY)) {
						filter = $scope.filterWayCards;
						setting = $scope.my_settings.ways.max;
					}
					if($scope.my_kingdom.otherRandomizers.filter(filter).length < setting){
						$scope.my_kingdom.otherRandomizers.push(card);
						cardUsed = true;
						card.num_times_picked++;
					}
						
				}         
				
        		if(!cardUsed)
    				passedUpDeck.push(card);
			}
			//put the passed up cards back into the randomizers
			validRandomizers = validRandomizers.concat(passedUpDeck);
			
			
			//make sure the 'minimum' requirements get met.
			var setSpares = {}; //track how many spares each set has (how many the min is exceeded by)
			var requirementCards = []; 
			var filteredSets = $scope.sets.filter($scope.filterSelectedSets);
			for(var s = 0; s < filteredSets.length; s++) {
				var set = filteredSets[s];
				//subtract the number of this set's cards in our kingdom from the min required to get the deficit
				var deficit = set.min - $scope.my_kingdom.kingdom_cards.reduce( function(tot, card) { 
					return tot + (card.set == set.name ? 1 : 0); 
				}, 0 );
				var cardReqs = function(card) {
						return card.function == FUNCTION_KINGDOM && card.set == set.name;
				};
				setSpares[set.name] = deficit < 0 ? -deficit : 0;
				//while there's a deficit, filter the valid kingdom cards to this set and pick enough to fill the deficit
				for(var d = 0; d < deficit; d++) {
					var replacer = drawCard(validRandomizers, cardReqs)
					if(replacer)
						requirementCards.push(replacer);
				}
			}
			//now loop backwards through our kingdom deck and replace the card if it's a surplus and we still have requirement cards
			//why backwards? no reason. it's my preference to remove the last surplus cards from the kingdom rather than the first.
			for(var kc = $scope.my_kingdom.kingdom_cards.length - 1; kc >= 0 && requirementCards.length; kc--) {
				if(setSpares[$scope.my_kingdom.kingdom_cards[kc].set] > 0) {
					//decrement how many spares this card's set has
					setSpares[$scope.my_kingdom.kingdom_cards[kc].set]--;
					//remove the card from the kingdom. Put it back into the randomizers
					validRandomizers.push($scope.my_kingdom.kingdom_cards[kc]);
					//put the requirement filling card into the kingdom
					$scope.my_kingdom.kingdom_cards[kc] = requirementCards.shift();
				}
			}
			
			if($scope.cardInDeck($scope.my_kingdom.kingdom_cards,CARD_YOUNG_WITCH))
				addBane(validRandomizers);
			//pick a random Action for The Way of the Mouse
			if($scope.cardInDeck($scope.my_kingdom.otherRandomizers,CARD_WAY_OF_THE_MOUSE))
				addWayOfMouseAction(validRandomizers);
			if($scope.cardInDeck($scope.my_kingdom.kingdom_cards,CARD_BLACK_MARKET))
				createBlackMarket(validRandomizers);
			//check black market for young witch - I thought it best to do bane and way of mouse first for kingdom cards so that black market would have less of a chance of sucking up all the 2s and 3s
			if($scope.cardInDeck($scope.my_kingdom.blackmarket,CARD_YOUNG_WITCH))
				addBane(validRandomizers);
			//designate random Action supply pile for the Obelisk
			if($scope.cardInDeck($scope.my_kingdom.otherRandomizers,CARD_OBELISK))
				chooseObeliskPile();
			
			var ucpnum1 = getRandomNumber(0,9);
			var ucpnum2 = getRandomNumber(0,9);
			var usnum1 = getRandomNumber(0,9);
			var usnum2 = getRandomNumber(0,9);
			$scope.my_kingdom.use_col_plat = $scope.my_kingdom.kingdom_cards[ucpnum1].set == SET_PROSPERITY || $scope.my_kingdom.kingdom_cards[ucpnum1].set == SET_PROSPERITY;
			$scope.my_kingdom.use_shelters = $scope.my_kingdom.kingdom_cards[usnum1].set == SET_DARK_AGES || $scope.my_kingdom.kingdom_cards[usnum1].set == SET_DARK_AGES;
			
			if($scope.my_kingdom.use_col_plat) $scope.stats.w_col_plat++;
			if($scope.my_kingdom.use_shelters) $scope.stats.w_shelt++;
			if($scope.my_kingdom.use_shelters && $scope.my_kingdom.use_col_plat) $scope.stats.w_both++;
		}
		
		
	}
	
	$scope.flopBlackMarket =function() {
		
		var bm = $scope.my_kingdom.blackmarket;
		var bmf = $scope.my_kingdom.blackmarket_flop;
		//if there's an existing flop, put it at the bottom of the black market
		if(bmf.length) {
			bm = $scope.my_kingdom.blackmarket = bm.concat(bmf);
			bmf = $scope.my_kingdom.blackmarket_flop = [];
		}
		$scope.blackmarket_card_picked = false;
		while(bm.length && bmf.length < 3) {
			bmf.push(bm.shift())
		}
		
	}
	
	$scope.selectBlackMarket = function(card) {
		var i = $scope.my_kingdom.blackmarket_flop.indexOf(card);
		if(i > -1) {
			$scope.my_kingdom.blackmarket_flop.splice(i,1);
			$scope.blackmarket_card_picked = true;
		}
	}
	
	$scope.returnBlackMarket = function(card) {
		var i = $scope.my_kingdom.blackmarket_flop.indexOf(card);
		if(i > -1) {
			$scope.my_kingdom.blackmarket_flop.splice(i,1);
			$scope.my_kingdom.blackmarket.push(card);
		}
	}
	
	$scope.createMultiple = function() {
		for(var i = 0; i < $scope.how_many; i++)
			$scope.createMyWeightedKingdom();
	}
	
	/*
	*	UTIL functions
	*/
	$scope.distribute = function(arr,chunks) {
		var newArr = [];
		var size = Math.ceil(arr.length / chunks);
		for (var i=0; i<arr.length; i+=size) {
			if(arr.length - i >= size)
				newArr.push(arr.slice(i, i+size));
			else
				newArr.push(arr.slice(i));
		}
		return newArr;
	}
	
	$scope.chunkSets = function() {
		$scope.chunkedSets = $scope.distribute($scope.sets.sort(function(a,b) { 
			return a[$scope.my_settings.sort_sets_by] > b[$scope.my_settings.sort_sets_by] ? 1 : -1; 
		}),2);
		return $scope.chunkedSets;
	}

}]);


if(typeof(Array.prototype.find) != 'function') {
	Array.prototype.find = function(callback) {
		for(var i = 0; i < this.length; i++) {
			if(callback(this[i]))
				return this[i];
		}
		return null;
	}
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}