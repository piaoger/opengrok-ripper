
var ripper = require('./../index.js');

var username = 'piaoger',
    password = 'nopwd';

var host = 'myopengrok',
    port = '8021',
    path = '/src/xref/test/include/header.h';

ripper.rip(host, port, path, username, password);