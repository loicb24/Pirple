'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const {StringDecoder} = require('string_decoder');
const config = require('./config');


// Init http server
let server = http.createServer((req, res) => {
    unifiedServer(req, res)
});

server.listen(config.httpPort, () =>  {
    console.log('the server has started on ' + config.httpPort + '. ' +
        '\r\nThe configuration is `' + config.envName + '`');
});

const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

// Init https server
let httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res)
});

httpsServer.listen(config.httpsPort, () =>  {
    console.log('the server has started on ' + config.httpsPort + '. ' +
        '\r\nThe configuration is `' + config.envName + '`');
});





// define handlers

let handlers = {};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};


// define a request router
let router = {
  'sample' : handlers.sample
};


// All the server logic for both servers

let unifiedServer = function(req, res) {
    //res.end('hello world');

    // get the URL, then parse it
    let parsedUrl = url.parse(req.url, true);

    // Getting the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object (query string = " loic.com/hello?name=loic" => {name:loic} )
    let queryStringObject = parsedUrl.query;

    //Get the HTTP method
    let method = req.method.toLowerCase();

    //Get the header as an object
    let headers = req.headers;

    //Getting payload as an object (if any)

    /*
    * Payload are streams. They come in parts.
    * We need to decode this stream with a StringDecoder
    * Each time we get a piece of data, we decode is and add it to a string
    * */

    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    // we need to wait the end of the payload before sending the response.
    // If there is no payload, event is still fired

    req.on('end', () =>{
        buffer += decoder.end();

        // choose the handler this request should do
        let choosedHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        // construct data object to collect the data

        let data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        // route the request to the handler

        choosedHandler(data, (statusCode = 200, payload = {}) => {

            if(typeof (statusCode) !== "number") {
                throw new Error('incorrect status code');
            }

            let payLoadString = JSON.stringify(data);


            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payLoadString);

            console.log("hello world !");

        });
    });
};