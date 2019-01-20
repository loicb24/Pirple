'use strict';

const Server = require('./modules/Server');

/* ----- start the server ------*/

let newServerInstance = new Server();
newServerInstance.start();

