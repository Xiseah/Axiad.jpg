const fetch = require("node-fetch")
const fs = require("fs")
var http = require('http')
var lineReader = require('readline');
let userData = []; // [][name, boughtFor, livePrice]
updateUserData(true); //reads userdata.txt
let apikey = "W94GLMLUDBL7TFZ8";

function url(symbol){
    return "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="+symbol+"&apikey="+apikey;
}
    
fs.readFile('./index.html', function (err, html) {
    if (err) throw err;

    http.createServer(async function (request, response) {
        if(request.url === "/favicon.ico"){
            response.end();
        }else{

            let body = '';
            request.on('data', data => {
                body += data.toString(); // convert Buffer to string
            });
            request.on('end', () => {
                if(body != ''){

                    body = body.replace("name=", "")
                    body = body.replace("&price=", " ")

                    fs.appendFile('userdata.txt', body+"\n", function (err) {
                        updateUserData(false);
                    });
                }
            });

            if(request.url === "/prices"){
                await loadPrices();//sets prices in arrays
                response.writeHeader(200, {"Content-Type": "text/plain"});
                for(let i = 0; i < userData.length; i++){
                    try{
                        response.write(userData[i][0].toString() + " :---: " + userData[i][2].toString() + "<br>");
                    }catch(e){
                        console.log("Price not loaded");
                    }
                }
                response.end();
            }

            if(request.url === "/"){

                response.writeHeader(200, {"Content-Type": "text/html"});
                response.write(html);
                response.end();
            }
        }
    }).listen(8080)
});

async function loadPrices(){
    for(let i = 0; i < userData.length; i++){
        if(userData[i][2] == undefined){
            userData[i][2] = await getCurrentPrice(userData[i][0]);
        }
        
    }
}

async function getCurrentPrice(symbol){ //call "await getCurrentPrice('NVDA');"
    //let date = today();

    const fetchResult = fetch(url(symbol))
    const response = await fetchResult;
    const jsonData = await response.json();
    //console.log(jsonData)
    try{
        console.log("price got")
        return jsonData["Global Quote"]["05. price"]; 
    }catch(e){}
    //return jsonData['Time Series (Daily)'][date]["4. close"]; 
}

/*function today(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    console.log(dd)
    if(dd<10) {
        dd = '0'+dd;
    }
    
    if(mm<10) {
        mm = '0'+mm;
    }

    return yyyy+'-'+mm+'-'+dd;
}*/

function updateUserData(init){ 
    var Reader = lineReader.createInterface({
        input: fs.createReadStream('userdata.txt')
    });
      
    Reader.on('line', function (line) {
        if(init){
            userData.push(line.split(" "));
            console.log(userData)
        }else{
            for(let i = 0; i < userData.length; i++){
                if(userData[i][0] == line.split(" ")[0] && userData[i][1] == line.split(" ")[1]){
                    break;
                }
                if(i+1 == userData.length){
                    userData.push(line.split(" "));
                    break;
                }
            }
        }
    });
}
