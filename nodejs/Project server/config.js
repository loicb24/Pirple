/*
* Create and export configuration variables
* */

// Container for all environnements
let environments = {};

// staging and defautl
environments.staging = {
    httpPort : 3000,
    httpsPort : 3001,
    'envName' : 'staging'
};

// production environnement
environments.production = {
    httpPort : 5000,
    httpsPort : 5001,
    'envName' : 'production'
};

// determine environment

let currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check the current environment typed by the user. If not exist, select default one

let envToExport = typeof (environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module

module.exports = envToExport;

