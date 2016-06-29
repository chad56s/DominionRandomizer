var app = angular.module("myApp",[]);

app.controller("myController",["$scope","$http",function($scope,$http){

	function resetMyKingdom() {	

		$scope.my_kingdom = {
			kingdom_cards: [],
			events: [],
			landmarks: [],
			blackmarket: [],
			bane: null,
			use_col_plat: false,
			use_shelters: false
		};
	}
	
	function getRandomNumber(min,max) {
		var range = max - min + 1;
		return Math.floor((Math.random() * range) + min);
	}
	
	//drawCard removes random card from deck and returns it
	//requirements = function that returns true if the picked card fits some criteria
	function drawCard(deck,requirements) {
		var index = 0;
		if(requirements) {
			var matchingIndices = [];
			deck.forEach(function(card,idx,ar) {
				if (requirements(card))
					matchingIndices.push(idx);
			});
			index = matchingIndices[getRandomNumber(0,matchingIndices.length-1)];
		}
		else
			index = getRandomNumber(0,deck.length - 1);
			
		return deck.splice(index,1)[0];
	}
	
	function remaining_kingdom_cards() {
		return $scope.kingdom_cards.filter(function(card) { return $scope.my_kingdom.kingdom_cards.indexOf(card) == -1 && $scope.my_kingdom.blackmarket.indexOf(card) == -1 && $scope.bane != card; });
	}
	
	function drawBane(deck) {
		var isEligibleBane = function(card) { 
			return	card.function == "Kingdom" &&
					card.costcoins >=2 && 
					card.costcoins <= 3 && 
					card.costpotions == 0 && 
					card.costdebt == 0; 
		};
		return drawCard(deck,isEligibleBane);
	}
	
	function createBlackMarket(deck) {
		
		if(deck.filter($scope.filterKingdomCards).length >= 30) {
			while($scope.my_kingdom.blackmarket.length < 30)
				$scope.my_kingdom.blackmarket.push(drawCard(deck,$scope.filterKingdomCards));
		}
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
	$scope.testing_tools = false;
	
	$scope.all_cards = [];
	$scope.randomizer_cards = [];
	$scope.kingdom_cards = [];
	
	$scope.my_settings = {
		events: {min: 0, max: 2},
		landmarks: {min: 0, max: 2},
		events_plus_landmarks: {min: 0, max: 2}
	};
	
	$scope.sets = [];
	$scope.chosen_sets = {};
	
	
	
	
	$http({
		method: 'GET',
		url: 'cards.json'
	}).then(
		function successCallback(response){
			$scope.all_cards = response.data.cards;
			$scope.sets = response.data.sets;
			
			//start out selecting  all sets
			//TODO: this should all be part of my_settings
			$scope.sets.forEach(s => {
				s.selected = true;
				s.min = 0;
				s.max = 10;}
			);
			
			//find the unique sets, construct the initial randomizer deck and collect the kingdom cards
			angular.forEach($scope.all_cards, function(card, idx) {
				card.num_times_picked = 0;
				card.array_index = idx;
				if($scope.filterIsRandomizer(card))
					$scope.randomizer_cards.push(card);
				if(card.function == "Kingdom")
					$scope.kingdom_cards.push(card);
			});
			
		},
		function failureCallback(response){
			$scope.test = response.status;
		}
	);
	
	$scope.filterIsRandomizer = function(card,index,ar) {
		return card.function == 'Kingdom' || card.function == 'Event' || card.function == 'Landmark';
	}
	
	$scope.filterCardInSelectedSet = function(card,index,ar) {	
		return $scope.sets.filter($scope.filterSelectedSets).find(s => s.name == card.set);
	}
	
	$scope.filterSelectedSets = function(set,index,ar) {
		return set.selected;
	}
	
	$scope.filterKingdomCards = function(card,index,ar) {
		return card.function == "Kingdom";
	}
	
	$scope.displayCost = function(card) {
		var cost = card.costcoins;
		if(card.costpotions > 0)
			cost += " " + card.costpotions + "P";
		if(card.costdebt > 0)
			cost += " " + card.costdebt + "D";
		
		return cost;
	}
	
	$scope.createMyKingdom = function() {
		var bDoBlackMarket = false;
		var bDesignateBane = false;
		
		resetMyKingdom();
		
		var validRandomizers = $scope.randomizer_cards.filter($scope.filterCardInSelectedSet);
		var countKingdomCards = validRandomizers.filter(c => c.function == "Kingdom").length;
		
		//total the user's minimum requirements to make sure they're not unfillable
		var minTotal = $scope.sets.reduce( (tot, set) => tot + parseInt(set.min), 0 );
		
		$scope.stats.total_created++;
		
		
		if(countKingdomCards >= 10 && minTotal <= 10) {
			var passedUpDeck = [];
			while($scope.my_kingdom.kingdom_cards.length < 10) {
				var card = drawCard(validRandomizers);
				
				if(card.function == "Kingdom") {
					$scope.my_kingdom.kingdom_cards.push(card);
					card.num_times_picked++;
					if(card.card == "Black Market")
						bDoBlackMarket = true;
					else if(card.card == "Young Witch")
						bDesignateBane = true;
				}
				else if(card.function == "Event" 
						&& $scope.my_kingdom.events.length < $scope.my_settings.events.max
						&& $scope.my_kingdom.events.length + $scope.my_kingdom.landmarks.length < $scope.my_settings.events_plus_landmarks.max) {
					$scope.my_kingdom.events.push(card);	
					card.num_times_picked++;
				}
				else if(card.function == "Landmark" 
						&& $scope.my_kingdom.landmarks.length < $scope.my_settings.landmarks.max
						&& $scope.my_kingdom.events.length + $scope.my_kingdom.landmarks.length < $scope.my_settings.events_plus_landmarks.max) {
					$scope.my_kingdom.landmarks.push(card);
					card.num_times_picked++;
				}
				else
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
				var deficit = set.min - $scope.my_kingdom.kingdom_cards.reduce( (tot, card) => { 
					return tot + (card.set == set.name ? 1 : 0); 
				}, 0 );
				var cardReqs = function(card) {
						return card.function == "Kingdom" && card.set == set.name;
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
			
			if($scope.my_kingdom.kingdom_cards.some(function(card) { return card.card == "Young Witch"; }))
				$scope.my_kingdom.bane = drawBane(validRandomizers);
			//TODO: bug: card could be in both kingdom and black market because we're using different copies of the decks for fulfilling minimum requirements and filling the black market
			if($scope.my_kingdom.kingdom_cards.some(function(card) { return card.card == "Black Market"; }))
				createBlackMarket(validRandomizers);
			
			var ucpnum1 = getRandomNumber(0,9);
			var ucpnum2 = getRandomNumber(0,9);
			var usnum1 = getRandomNumber(0,9);
			var usnum2 = getRandomNumber(0,9);
			$scope.my_kingdom.use_col_plat = $scope.my_kingdom.kingdom_cards[ucpnum1].set == "Prosperity" || $scope.my_kingdom.kingdom_cards[ucpnum1].set == "Prosperity";
			$scope.my_kingdom.use_shelters = $scope.my_kingdom.kingdom_cards[usnum1].set == "Dark Ages" || $scope.my_kingdom.kingdom_cards[usnum1].set == "Dark Ages";
			
			if($scope.my_kingdom.use_col_plat) $scope.stats.w_col_plat++;
			if($scope.my_kingdom.use_shelters) $scope.stats.w_shelt++;
			if($scope.my_kingdom.use_shelters && $scope.my_kingdom.use_col_plat) $scope.stats.w_both++;
		}
		
		
	}
	
	$scope.createMultiple = function() {
		for(var i = 0; i < $scope.how_many; i++)
			$scope.createMyKingdom();
	}
	
}]);
