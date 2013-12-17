
function base64Encode(str) {
    return new Buffer(str).toString('base64');
}

function wwwAuthentication(username, password) {
    // WWW-Authenticate: Basic realm="xxxx"
    // see: http://www.keakon.net/2010/01/30/%E7%94%A8WWW-Authenticate%E5%AE%9E%E7%8E%B0%E7%99%BB%E5%BD%95%E9%AA%8C%E8%AF%81
    return 'Basic ' + base64Encode(username + ':' + password);
}


// Let's rip it. XOXO, Yingxiao-ing !
var rip = function(host, port, path, username, password) {

    var http = require('http');

    var authentication,
        client,
        headers,
        request;

    authentication = wwwAuthentication(username, password);
    headers = {
        'Host': host,
        'Authorization': authentication
    };

    client = http.createClient(port, host);
    request = client.request('GET', path, headers);
    request.on('response', function(response) {
        response.setEncoding('utf8');
        console.log('Response Status: '  + response.statusCode);
        console.log('Response Headers: ' + JSON.stringify(response.headers));

        response.on('data', function(chunk) {
            if(chunk) {
                console.log(chunk);
            }
        });

        response.on('end', function() {
            console.log("end of request")
        });
    });

    request.end();
};


exports.rip = rip;



