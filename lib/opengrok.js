
function base64Encode(str) {
    return new Buffer(str).toString('base64');
}

function wwwAuthentication(username, password) {
    // WWW-Authenticate: Basic realm="xxxx"
    // see: http://www.keakon.net/2010/01/30/%E7%94%A8WWW-Authenticate%E5%AE%9E%E7%8E%B0%E7%99%BB%E5%BD%95%E9%AA%8C%E8%AF%81
    return 'Basic ' + base64Encode(username + ':' + password);
}


var http  = require('http'),
    fs    = require('fs'),
    jsdom = require('jsdom');

function findRawurl(page, callback) {
    // <div id="page">
    //     <div id="whole_header">
    //         <form action="/source/search">
    //             <div id="header">
    //                 <div id="Masthead">
    //                     <div id="bar">
    //                         <ul>
    //                             <li>
    //                                 <a href="/data/raw/test/include/header.h">
    //                                     <span id="download"></span>
    //                                     Download
    //                                 </a>
    //                             </li>
    //                         </ul>
    //                     </div>
    //                 </div>
    //             </div>
    //         </form>
    //     </div>
    // </div>

    // use jsdom to parse html page
    jsdom.env(
        page,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
            callback(window.$("#download").parent().attr('href'))
        }
    );
}


// Let's rip it. XOXO, Yingxiao-ing !
var rip = function(host, port, path, username, password) {

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

        var content = '';

        response.on('data', function(chunk) {
            if(chunk) {
                content += chunk;
            }
        });

        response.on('end', function() {
            findRawurl(content, function(url) {
                var rawUrl;
                rawUrl = host + ':' + port + url;
                fs.writeFileSync('/tmp/xx.txt', rawUrl, 'utf8');
            });
        });
    });

    request.end();
};


exports.rip = rip;



