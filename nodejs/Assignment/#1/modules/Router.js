/*
* DATE : 15/01/2019
* Author : lbe
* */

class Router {

    constructor() {

    }

    /*
    *  AVAILABLE ROUTES
    * */

    ping(data, callback) {
        callback(200, 'Pong');
    }

    hello(data, callback) {
        callback(200, { greeting : `Hello from server`});
    }

    notFound(data, callback) {
        callback(404, { message : `Page not found`});
    }

    /*
    * Useful methods
    * */

    exist(request) {
        return ( typeof this[request] === 'function');
    }

    call(request) {
        if(this[request] === 'undefined') {
           return this.notFound;
        } else {
            return this[request];
        }
    }
}

module.exports = Router;