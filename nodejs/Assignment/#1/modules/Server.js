/*
* DATE : 15/01/2019
* Author : lbe
* */

/*
* DEFINE CONSTANTS
* */

// node modules
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const {StringDecoder} = require('string_decoder');

// custom modules
const config = require('../config/config');
const Router = require('./Router');

/*
* DEFINE PRIVATE METHODS
*
* A symbol is a unique and immutable data type and may be used as an identifier for object properties.
* The symbol object is an implicit object wrapper for the symbol primitive data type.
* */

const _getServerOption = Symbol('getServerOption');
const _requestManager = Symbol('requestManager');
const _responseManager = Symbol('responseManager');
const _payloadManager = Symbol('payloadManager');

class Server {

    /*
    * The constructor init two servers
    * */

    constructor() {

        this.httpServer = http.createServer((req, res) => {
            this[_requestManager](req,res);
        });

        this.httpsServer = https.createServer(this[_getServerOption](), (req, res) => {
            this[_requestManager](req,res);
        });

        this.router = new Router();
    }

    /*
    * Server.start is the main function to launch both servers
    * */

    start() {

        //A message his printed the first time a request is made

        this.httpServer.listen(config.httpPort, () => {
            this.constructor.logMessage(config.httpPort)
        });

        this.httpsServer.listen(config.httpsPort, () => {
            this.constructor.logMessage(config.httpsPort)
        });
    }

    static logMessage(port) {
        console.log(`The server has started on port : ${port}`);
    }

    /*
    * ---------------------- PRIVATE FUNCTIONS ---------------------------------
    *
    * */

    [_getServerOption]() {
        return {
            'key' : fs.readFileSync('./https/key.pem'),
            'cert' : fs.readFileSync('./https/cert.pem')
        }
    }

    /*
    * The request manager handle all request made to the server
    * */

    [_requestManager](req, res) {

        let requestToServer = {};

        // get the URL, then parse it
        requestToServer.parsedUrl = url.parse(req.url, true);

        // Getting the path
        requestToServer.path = requestToServer.parsedUrl.pathname;
        requestToServer.trimmedPath = requestToServer.path.replace(/^\/+|\/+$/g, '');

        // Get the query string as an object (query string = " loic.com/hello?name=loic" => {name:loic} )
        requestToServer.queryStringObject = requestToServer.parsedUrl.query;

        //Get the HTTP(s) method
        requestToServer.method = req.method.toLowerCase();

        //Get the header as an object
        requestToServer.headers = req.headers;

        // the payload manager return a new promise.
        // At the resolution of the premise, we send the payload to the responseManager with the request to the server


        this[_payloadManager](req).then( async (buffer) => {
            await this[_responseManager](requestToServer, buffer, req, res);
        }).catch((error) => {

            /*
            * We catch every error obscured during the process
            * */

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(500);
            res.end(JSON.stringify({
                message : 'Fatal Error ! Before trying to send a response',
                error : error
            }));

        });

    }

    [_payloadManager](req) {

        // Getting payload as an object (if any)

        /*
        * Payload are streams. They come in parts.
        * We need to decode this stream with a StringDecoder
        * Each time we get a piece of data, we decode is and add it to a string
        * */

        return new Promise((resolve, reject) => {

            let decoder = new StringDecoder('utf-8');
            let buffer = '';

            req.on('data', (data) => {
                buffer += decoder.write(data);
            });

            // we need to wait the end of the payload before sending the response.
            // If there is no payload, event is still fired

            req.on('end', () =>{
                buffer += decoder.end();
                resolve(buffer);
            });

            req.on('error', (e) => {
                reject(e)
            });

        });
    }

    /*
    * The response manager handle all response to the client
    * */

    [_responseManager](requestToServer, buffer, req, res) {

        return new Promise((resolve, reject) => {

            try {
                // choose the handler this request should do
                if(!this.router.exist(requestToServer.trimmedPath)) {
                    requestToServer.handler = 'notFound';
                } else {
                    requestToServer.handler = requestToServer.trimmedPath;
                }

                // route the request

                this.router[requestToServer.handler](requestToServer, (statusCode = 200, response = null) => {

                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(statusCode);
                    if(response === null) {
                        res.end('');
                    } else {
                        res.end(JSON.stringify(response));
                    }

                });

            } catch (e) {

                console.log(e);
                console.log('/ ----------------------------------------- ')
                reject(e);

            }

            resolve(true);

        });
    }
}

module.exports = Server;
