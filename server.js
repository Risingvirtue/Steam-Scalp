var fs = require('fs');
var request = require('request');
var date = new Date();
async function getArtifactInfo(callback) {
	var promiseArr = [];
	for (var i = 0; i < 3; i++) {
		var url = 'https://steamcommunity.com/market/search/render/?' + 
            'search_descriptions=0&sort_column=name&sort_dir=asc&' + 
			'appid=583950&norender=1&start=' + 
			100 * i + '&count=100';
		var currPromise = new Promise((resolve, reject) => {
			request(url, function (err, response, body) {
				if (err) {
					reject(err);
				}
				if (!err && response.statusCode == 200) {
					body = JSON.parse(body);
					var results = body.results;
					resolve(results);
				} else {
					reject('fail');
				}
			}); 
		});
		promiseArr.push(currPromise);
	}
	try {
		const cardInfo = await Promise.all(promiseArr);
		
		const formatedCards = formatCardInfo(cardInfo);
		
		const oldInfo = await getCardPrice();
	
		setCardPrice(oldInfo, formatedCards);
		alertCardPrice(oldInfo);
		saveFile(JSON.stringify(oldInfo), './cardPrice.txt');
		if (callback) {
			callback();
		}
	} catch (e) {
		console.log(e);
	}
}


var interval = setInterval(getArtifactInfo, 5000);
//getArtifactInfo(getCardTotal);
function formatCardInfo(cardInfo) {
	var dict = {};
	for (var i = 0; i < cardInfo.length; i++) {
		for (var j = 0; j < cardInfo[i].length; j++) {
			var id = cardInfo[i][j].hash_name;
			dict[id] = {name: cardInfo[i][j].name, 
						price: cardInfo[i][j].sell_price}
		}
	}
	
	return dict;
	
}

async function saveFile(cardInfo, file) {
	fs.writeFile(file, cardInfo, function(err) {
		if(err) {
			console.log(err);
		}
		console.log("The file was saved!");
	});
}

async function getCardPrice() {
	return new Promise((resolve, reject) => {
		fs.readFile('./cardPrice.txt', 'utf8', function(err, contents) {
			if (err) reject(err);
			
			var cardInfo = JSON.parse(contents);
			resolve(cardInfo);
		});
	})
	
	
}

function setCardPrice(oldInfo, cardInfo) {
	for (card in cardInfo) {
		if (!(card in oldInfo)) {
			oldInfo[card] = {name: cardInfo[card].name, prev: 0, curr: cardInfo[card]["price"]}
		} else {
			oldInfo[card]["prev"] = oldInfo[card]["curr"];
			oldInfo[card]["curr"] = cardInfo[card]["price"];
		}	
	}
}

function alertCardPrice(cardInfo) {
	for (card in cardInfo) {
		var prev = cardInfo[card]["prev"];
		var curr = cardInfo[card]["curr"];
		var name = cardInfo[card]["name"];
		if (curr < prev) {
			console.log(`Card: ${name}\nPrevious Price: ${prev},Current Price ${curr}`);
		}
	}
}

function getCardTotal() {
	fs.readFile('./cardPrice.txt', 'utf8', function(err, contents) {
		var cardInfo = JSON.parse(contents);
		var sum = 0;
		var max = 0;
		var name = "";
		for (card in cardInfo) {
			var price = cardInfo[card].curr;
			if (max < price) {
				max = price;
				name = cardInfo[card].name;
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
