'use strict';
const   path            =           require('path');
const   fs              =           require('fs');
const   crypto          =           require('crypto');
const   OAuth           =           require('oauth-1.0a');
const   request         =           require('request');
const   credFile        =           path.join(__dirname, '..', "app-auth-data", "credentials.json");
const   basicAuth       =           require('azure-functions-basic-auth').init(credFile);
const   shared          =           require(path.join(__dirname, '..', 'app-shared-libraries', 'index.js'));
const xero_base = "https://api.xero.com/api.xro/";
const oauth = OAuth({
    consumer: {
        key: process.env.XERO_CONSUMER_KEY,
        secret: process.env.XERO_CONSUMER_SECRET
    },
    signature_method: 'RSA-SHA1',
    hash_function: function (base_string, key) {
        var sign = crypto.createSign('RSA-SHA1');
        var privateKey = (process.env.XERO_PRIVATE_KEY) ? process.env.XERO_PRIVATE_KEY : "INVALID_KEY";
        if(!privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----'))
            privateKey = "-----BEGIN RSA PRIVATE KEY-----\n" + privateKey;
        if(!privateKey.endsWith('-----END RSA PRIVATE KEY-----'))
            privateKey += '\n-----END RSA PRIVATE KEY-----';
        var ky = privateKey.toString('ascii');
        sign.update(base_string, 'UTF-8');
        return sign.sign(ky, 'base64');
    }
});

module.exports = function(context, req) {
    var request_data = {
        url: xero_base + req.params.URL,
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
