const fetch = require("node-fetch")
const fs = require("fs")
var http = require('http')
var lineReader = require('line-reader');
let symbol = "MNST"
let content = [];
var currentPrice = '';

function url(){
    return "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+symbol+"&apikey=W94GLMLUDBL7TFZ8";
}
    
    
fs.readFile('./index.html', function (err, html) {
    if (err) {
    throw err; 
    }

http.createServer(function (request, response) {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    request.on('end', () => {
        if(body != ''){

            body = body.replace("name=", "")
            body = body.replace("&price=", " ")

            fs.appendFile('userdata.txt', body+"\n", function (err) {
                if (err) throw err;
                console.log('Added');
              });
        }
        response.end('ok');
    
    });
    console.log(getCurrentPrice('NVDA'))

    //runnib 2x, ei tea mix
    getPackage();
    getUserData();
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(html);
    response.end();
}).listen(8080)
});



function getCurrentPrice(name){
    //huj tootab igal pool
    let date = today();
    symbol = name;

    fetch(url()) 
    .then(res => res.json())
    .then(function(myjson){
        currentPrice = myjson['Time Series (Daily)'][date]["4. close"];
        
    });
    return currentPrice;
}

function today(){
    var today = new Date();
    var dd = 20/*today.getDate()*/;
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    
    if(dd<10) {
        dd = '0'+dd
    } 
    
    if(mm<10) {
        mm = '0'+mm
    } 
    date = yyyy+'-'+mm+'-'+dd;

    return date;


}

function getUserData(){
    lineReader.eachLine('userdata.txt', function(line, last) {
        content.push(line.split(" "));
        //ei toota
        if(last){
            console.log(content[0][0])
            
        }
    });
    
}





