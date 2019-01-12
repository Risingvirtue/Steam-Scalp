var fs = require('fs');
var request = require('request');

function getArtifactInfo(callback) {
	var cardInfo = [];
	var counter = 0;
	for (var i = 0; i < 3; i++) {
		var url = 'https://steamcommunity.com/market/search/render/?' + 
            'search_descriptions=0&sort_column=name&sort_dir=asc&appid=583950&norender=1&start=' + 
			100 * counter + '&count=100';
		counter++;
		request(url, function (err, response, body) {
			if (err) {
				console.log(err);
			}
			if (!err && response.statusCode == 200) {
				body = JSON.parse(body);
				var results = body.results;
				cardInfo = cardInfo.concat(results);
				if (cardInfo.length == body.total_count) {
					saveCardInfo(JSON.stringify(cardInfo), callback);
					
				}
			}
		}); 
	}
}

function saveCardInfo(cardInfo, callback) {
	fs.writeFile("./cardInfo.txt", cardInfo, function(err) {
		if(err) {
			return console.log(err);
		}

		console.log("The file was saved!");
		if (callback) {
			callback();
		}
	});
}

function getCardTotal() {
	fs.readFile('./cardInfo.txt', 'utf8', function(err, contents) {
		var cardInfo = JSON.parse(contents);
		var sum = 0;
		var max = 0;
		var name = "";
		for (var i = 0; i < cardInfo.length; i++) {
			var price = cardInfo[i].sell_price;
			if (max < price) {
				max = price;
				name = cardInfo[i].name;
			}
			sum += price;
		}
		
		console.log("Highest Priced Card:", name, "Price:", formatPrice(max));
		console.log("Cost of all the cards:", formatPrice(sum));
		
	});
}

function formatPrice(price) {
	price = price / 100;
	return '$' + price;
}

getArtifactInfo(getCardTotal);

//getCardTotal();