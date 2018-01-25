'use strict';
const   path            =           require('path');
const   fs              =           require('fs');
const   credFile        =           path.join(__dirname, '..', "app-auth-data", "credentials.json");
const   basicAuth       =           require('azure-functions-basic-auth').init(credFile);
const   shared          =           require(path.join(__dirname, '..', 'app-shared-libraries', 'index.js'));

module.exports = function(context) {
    if(context.req.query && context.req.query.key && context.req.query.key == process.env.BILL_STATIC_KEY)
        staticFileServer(context);
    else
       send403(context);
}

function staticFileServer(context){
    shared.logData("Start staticFileServer", 1);
    var fileName = path.join(__dirname, "static", (context.req.query && context.req.query.file) ? context.req.query.file : "nonexistent.junk");
    shared.logData("Getting FileName:" + fileName, 3);

    if(!fileName.startsWith(path.join(__dirname, "static"))){
        return send403(context);
    }

    var ext = path.extname(fileName);
    shared.logData("Extension:" + ext, 3);
    shared.logData("MimeType:" + mimeTypes[ext], 6);
    if(ext == "")
        fileName = path.join(fileName, "index.html");

    fs.readFile(fileName, function(err,data){
        shared.logData("FileData:" + JSON.stringify(data), 8);
        if(err){
            context.res =  {
                status: 404,
                headers: {
                    "Content-Type" : "application/json"
                },
                body : {message: "File Not Found"}
            }
            return context.done();
        }

        context.res =  {
            status: 200,
            headers: {
                "Content-Type" : mimeTypes[ext]
            },
            isRaw: true,
            body: data
        };
        context.done();
    });
}

function send403(context){
    context.res =  {
        status: 403,
        headers: {
            "Content-Type" : "application/json"
        },
        body : {message : "Access Denied" }
    }
    return context.done();
}


const mimeTypes = {
    ".vtt" : "text/vtt",
    ".js" :  "application/javascript",
    ".json" : "application/json",
    ".html" : "text/html",
    ".txt" : "text/plain",
    ".css" : "text/css",
    ".png" : "image/png",
    ".jpg" : "image/jpeg",
    ".gif" : "image/gif",
    ".svg" : "image/svg+xml",
    ".eot" : "application/vnd.ms-fontobject ",
    ".ttf" : "application/octet-stream",
    ".woff" : "application/font-woff"
};