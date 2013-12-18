
function base64Encode(str) {
    return new Buffer(str).toString('base64');
}

function wwwAuthentication(username, password) {
    // WWW-Authenticate: Basic realm="xxxx"
    // see: http://www.keakon.net/2010/01/30/%E7%94%A8WWW-Authenticate%E5%AE%9E%E7%8E%B0%E7%99%BB%E5%BD%95%E9%AA%8C%E8%AF%81
    return 'Basic ' + base64Encode(username + ':' + password);
}

function isDirPath(path) {
    return path.length > 0 && path[path.length - 1] === '/';
}

var http  = require('http'),
    fs    = require('fs'),
    jsdom = require('jsdom');

function findRawUrl(page, callback) {
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
            var href = window.$("#download").parent().attr('href');
            callback(href)
        }
    );
}




function findDirlist(page, callback) {

   // xref in whole_header div. xref will be used for compose full path of a download link
   // <div id="Masthead">
   //     <tt>
   //         <a href="/data/xref/">xref</a>
   //             : /
   //         <a href="/data/xref/test/">test</a>
   //             /
   //    </tt>
   // </div>

    //
    // <table id="dirlist">
    //     <tbody>
    //         <tr>
    //             <td>
    //                 <p class="p"></p>
    //             </td>
    //             <td>
    //                 <a href="err.h">err.h</a>
    //             </td>
    //             <td>19-Dec-2013</td>
    //             <td>10.2 KiB</td>
    //         </tr>
    //     </tbody>
    // </table>

    // use jsdom to parse html page
    jsdom.env(
        page,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {

            // Get xref
            var xref = window.$('#Masthead tt a:last-child').attr('href');

            var dirlist = [];
            window.$('#dirlist tbody').children('tr').each( function() {
                var tr = window.$(this);
                var a = tr.find('td a:first');
                if(a) {
                    var href = a.attr('href');
                    if(href) {
                        var aText = a.text();
                        if(href === aText) {
                            if(href !== '..') {
                                dirlist.push(xref + href);
                            }

                        } else {
                            if(isDirPath(href)) {
                                dirlist.push(xref + href);
                            } else {
                                console.log('something wrong with opengrok...');
                                dirlist.push(xref + aText);
                            }

                        }
                    }
                }
            });
            callback(dirlist);
        }
    );
}


// Let's rip it. XOXO, Yingxiao-ing !
// @param path dir or file path, you should append "/" to the end of path if not you will get a HTTP response status code 302
//
var rip = function(host, port, path, username, password) {

    var authentication,
        client,
        headers,
        request;

    authentication = wwwAuthentication(username, password);
    headers = {
        'Host': host,
        'port': port,
        'Authorization': authentication
    };

    client = http.createClient(port, host);
    request = client.request('GET', path, headers);
    request.on('response', function(response) {
        response.setEncoding('utf8');
        console.log('Response Status: '  + response.statusCode);
        if(response.statusCode === 302) {
            console.log('error 302 is found.....');
            var redirectUrl = response.headers.location;
            console.log('we should redirect to new location : ' + redirectUrl);
        }

        console.log('Response Headers: ' + JSON.stringify(response.headers));

        var content = '';

        response.on('data', function(chunk) {
            content += chunk;
        });

        response.on('end', function() {
            if( content.length > 0) {
                if(isDirPath(path)) {
                    findDirlist(content, function(dirList) {
                        //fs.writeFileSync('/tmp/dir.txt', JSON.stringify(dirList), 'utf8');
                        console.log(dirList);
                    });
                } else {
                    findRawUrl(content, function(url) {
                        var rawUrl;
                        rawUrl = host + ':' + port + url;
                        //fs.writeFileSync('/tmp/file.txt', rawUrl, 'utf8');
                        console.log(rawUrl);
                    });
                }

            }
        });

    });


    request.end();
};


exports.rip = rip;