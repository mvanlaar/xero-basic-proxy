'use strict';
const   path            =           require('path');
const   fs              =           require('fs');
const   crypto          =           require('crypto');
const   OAuth           =           require('oauth-1.0a');
const   request         =           require('request');
const   credFile        =           path.join(__dirname, '..', "app-auth-data", "credentials.json");
const   basicAuth       =           require('azure-functions-basic-auth').init(credFile);
const   shared          =           require(path.join(__dirname, '..', 'app-shared-libraries', 'index.js'));
const mailplus_base = "https://restapi.mailplus.nl:443/integrationservice-1.1.0/";
const oauth = OAuth({
    consumer: {
        key: process.env.MAILPLUS_CONSUMER_KEY,
        secret: process.env.MAILPLUS_CONSUMER_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});

module.exports = function(context, req) {
    var request_data = {
        url: mailplus_base + req.params.URL,
        method: req.method,
        form: req.body,
        headers: {}
    };

    if(req.headers['accept'])
        request_data.headers['Accept'] = req.headers['accept'];
    request_data.headers.Authorization = oauth.toHeader(oauth.authorize(request_data, {
                                    key: process.env.XERO_CONSUMER_KEY,
                                    secret: process.env.XERO_CONSUMER_SECRET
                            })).Authorization;

    request(request_data, function(error, response, body) {
        if(error){
            context.res = {
                status: 500,
                headers: {"content-type": "application/json"},
                body: { error: error.message, stack: (error.stack) ? error.stack : "" }
            };
        } else {
            context.res =  {
                status: response.statusCode,
                headers: response.headers,
                body: response.body
            };
        }
        context.done();
    });
}
