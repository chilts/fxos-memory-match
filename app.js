// --------------------------------------------------------------------------------------------------------------------
//
// memory-match.chilts.org
//
// --------------------------------------------------------------------------------------------------------------------

var path = require('path');
var http = require('http');

var express = require('express');
var cachify = require('connect-cachify');

// --------------------------------------------------------------------------------------------------------------------

var env = process.env;
var app = express();

// ----------------------------------------------------------------------------
// views

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = env.NODE_ENV !== 'production'
app.locals.env = env.NODE_ENV;

// ----------------------------------------------------------------------------
// static routing

var assets = {
    '/s/js/all.min.js' : [
        '/s/js/jquery-1.8.3.js',
        '/s/js/jquery.easing-1.3.js',
        '/s/js/jquery.transit-0.9.9.js',
        '/s/js/ready.js',
    ],
    '/s/css/all.min.css' : [
        '/s/css/style.css',
    ],
};

var opts = {
    root       : path.join(__dirname, 'public'),
    production : env.NODE_ENV === 'production',
    // debug      : true,
};

// static routes
app.use(cachify.setup(assets, opts));
app.use(express.favicon());
app.use(express.static(path.join(__dirname, 'public'), { maxAge : 24*60*60 } ));

// logger
app.use(express.logger(env.NODE_ENV === 'production' ? 'default' : 'dev' ));

// bodyParser
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());

// ----------------------------------------------------------------------------
// routes

var routes = {};

routes.index = function(req, res) {
    res.render('index.jade');
};

var manifest;
routes.manifest = function(req, res) {
    if ( !manifest ) {
        manifest = fs.readFileSync('./public/manifest.webapp', 'utf-8');
    }
    return res.send({ 'Content-Type' : 'application/x-web-app-manifest+json' }, manifest);
};

app.get( '/', routes.index );

// --------------------------------------------------------------------------------------------------------------------
// server

var server = http.createServer(app);
var port = parseInt(process.argv[2], 10) || 5000;

server.listen(port, function() {
    console.log("Memory Match (Firefox OS App) listening on port " + port);
});

// --------------------------------------------------------------------------------------------------------------------
