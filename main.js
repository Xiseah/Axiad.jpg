console.log("Starting..");
const fetch = require("node-fetch");
const fs = require("fs");
var http = require('http');
const {promisify} = require('util');
var lineReader = require('readline');
let userData = []; // [index][name, quantity, boughtFor, Prices]
let apikey = "W94GLMLUDBL7TFZ8";
updateUserData().then(() => startServer()); //sets userdata, then starts the server

function startServer(){
    fs.readFile('./index.html', function (err, html) {
        if (err) throw err;
        console.log("Ready");
        http.createServer(function (request, response) {
            
            switch(request.url){
                case "/favicon.ico":
                    response.end();
                    break;
    
                case "/prices": 
                    updateUserData().then(() => {
                        response.writeHeader(200, {"Content-Type": "text/plain"});
                        if (userData != undefined){
                            
                            for(let i = 0; i < userData.length; i++){
                                try{
                                    for(let j = 0; j < 3; j++){
                                        response.write(userData[i][j].toString() + "&");
                                    }
                                    for(let j = 0; j < userData[i][3].length; j++){
                                        response.write(userData[i][3][j].toString() + " ");
                                        if(j == userData[i][3].length-1){
                                            response.write("&")
                                        }
                                    }
                                }catch(e){
                                    console.log("Price not loaded")
                                }
                            }
                            response.end();
                            return;
                        }else{
                            response.end();
                            return;
                        }
                    });
                    break;

                case "/":
                    let body = '';
                    request.on('data', data => {
                        body += data.toString(); // convert Buffer to string
                    });
                    request.on('end', () => {
                        if(body != ''){
                            body = body.replace("name=", "")
                            body = body.replace("&qty=", " ")
                            body = body.replace("&price=", " ")
    
                            fs.appendFile('userdata.txt', body+"\n", function (err){
                                updateUserData();
                            });
                            
                        }
                    });
                    response.writeHeader(200, {"Content-Type": "text/html"});
                    response.write(html);
                    response.end();
                    break;
    
                case "/css":
                    fs.readFile('./styles.css', function (err, css) {
                        if (err) throw err;
                        response.writeHeader(200, {"Content-Type": "text/css"});
                        response.write(css);
                        response.end();
                    });
                    break;
    
                case "/delete":
                    let nr = '';
                    request.on('data', data => {
                        nr = data.toString();
                    });
                    request.on('end', () => {
                        if(nr != ''){
                            deleteData(parseInt(nr)-1).then(() => { //row-1 == array index
                                response.end();
                            });
                        }
                    });
                    break;
                default:
                    response.end();
                    break;
            }
        }).listen(8080)
    });
}

function url(symbol){
    return "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="
            +symbol+"&apikey="+apikey;
}

function getPrices(symbol){
    return fetch(url(symbol))
    .then(result => {
        return result.json();
    }).then(json => {
        let dates = Object.keys(json["Time Series (Daily)"]);
        let arr = [];
        for(let i = 0; i < dates.length; i++){
            arr.push([dates[i], json["Time Series (Daily)"][dates[i]]["4. close"]])
            if(i == dates.length-1){ //last cycle
                return arr;
            }
        }
    }).catch(err => {
        console.log("Price not loaded")
        return "err";
    })
}

function loadPrices(){
    return new Promise(async function(resolve, reject) {
        if(userData != undefined && userData != [] && userData.length != 0){
            for(let i = 0; i < userData.length; i++){
                if(userData[i][3] == undefined || userData[i][3] == "not_loaded"){
                    let prices = await getPrices(userData[i][0]);
                    if(prices == "err"){
                        userData[i][3] = "not_loaded";
                    }else{
                        userData[i][3] = prices;
                    }
                }
                if(i == userData.length-1){ //on last cycle
                    resolve();
                }
            }
        }else{
            resolve();
        }
    });
}

function deleteData(row){
    return new Promise(function(resolve, reject) {
        
        getUserData()
        .then(text => {
            let data = text.toString().split("\n");
            data.splice(row, 1);
            return data;

        }).then(data => {
            let result = "";
            for(let i = 0; i < data.length; i++){
                result += data[i].toString();
                if(i != data.length-1){ 
                    result += "\n";
                    if(i == data.length-2){ //on last cycle
                        return result;
                    }
                }
            }

        }).then(result => {
            if(result == undefined){ //if userdata.txt empty
                result = ""; 
            }
            
            fs.writeFile("./userdata.txt", result, 'utf8', function (err) {
                if (err) {
                    console.log(err)
                }
                return;
            });

        }).then(() => { 
            userData.splice(row, 1); //remove array from userData

        }).then(() => {
            updateUserData().then(() => {
                updateUserData().then(() => {
                    resolve();
                })
            })

        }).catch(err => {
            console.log(err);
            reject();
        });
    });
}

function getUserData(){
    return new Promise(function(resolve, reject) {
        fs.readFile("./userdata.txt", (err, data) => {
            if(err) {
                console.log(err);
                reject();
            }else{
                resolve(data);
            }
        });
    });
}

function updateUserData(){

    return new Promise(function(resolve, reject) {
        
        getUserData()
        .then((data) => {
            return data.toString().split("\n");
        })
        .then(arr => {
            arr.splice(arr.length-1, 1);
            let data = [];
            for(let i = 0; i < arr.length; i++){
                data.push(arr[i].split(" "));
                if(i == arr.length-1){ //if on last cycle
                    return data;
                }
            }
        })
        .then(data => { //data is array of txt file; compare it to userData
            
            if(data == undefined){ // if all removed
                userData = [];
                return;
            }else if(userData == undefined || userData.length == 0){ //if all is already removed and 1st one added
                userData = data;
                return;
            }else if(userData.length < data.length){ //if an element is added
                userData.push(data[data.length-1]); //push the added element
                return;
            }
        })
        .then(() => {
            //sets prices in arrays
            loadPrices()
            .then(() => {
                resolve();
            })
        })
        .catch(err => {
            console.log(err);
            reject();
        });
    });
}
