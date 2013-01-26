// --------------------------------------------------------------------------------------------------------------------
//
// memory-match.chilts.org
//
// --------------------------------------------------------------------------------------------------------------------

var path = require('path');
var http = require('http');

var express = require('express');
var cachify = require('connect-cachify');

var redis = require('redis').createClient();
var RedisStore = require('connect-redis')(express);

var auth = require('./lib/auth.js');

var env = process.env;

// --------------------------------------------------------------------------------------------------------------------
// setup

// redis
redis.on('error', function (err) {
    console.log("Error: " + err);
});

var databaseNumber = 2;
redis.select(databaseNumber, function(err, res) {
    if (err) {
        console.log('Error selecting database ' + databaseNumber + ': ', err);
        return;
    }
    console.log('Redis database ' + databaseNumber + ' selected');
});

// --------------------------------------------------------------------------------------------------------------------
// finally, the app itself

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
// app.use(cachify.setup(assets, opts));
app.use(express.favicon());
app.use(express.static(path.join(__dirname, 'public'), { maxAge : 24*60*60 } ));

// logger
app.use(express.logger(env.NODE_ENV === 'production' ? 'default' : 'dev' ));

// bodyParser
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());

// cookies and sessions
app.use(express.cookieParser());
app.use(express.session({
    'key'    : 'sid',
    'secret' : env.SESSION_SECRET,
    'cookie' : { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    'store'  : new RedisStore({
        'db'     : databaseNumber,
        'prefix' : 'session:',
    }),
}));

// general stuff prior to our app
app.use(function(req, res, next) {
    req._ = {};

    // add the logged in user to the view
    res.locals.user = req.user || false;

    console.log('Right here for ' + req.path);

    next();
});

// ----------------------------------------------------------------------------
// routes

var routes = {};

routes.index = function(req, res) {
    res.render('index.jade', { req : req });
};

var manifest;
routes.manifest = function(req, res) {
    if ( !manifest ) {
        manifest = fs.readFileSync('./public/manifest.webapp', 'utf-8');
    }
    return res.send({ 'Content-Type' : 'application/x-web-app-manifest+json' }, manifest);
};

app.get( '/', routes.index );
app.post(
    '/login',
    auth.browserid
);
app.get(
    '/logout',
    function(req, res) {
        delete req.session.email;
        res.send('OK');
    }
);

// --------------------------------------------------------------------------------------------------------------------
// server

var server = http.createServer(app);
var port = parseInt(process.argv[2], 10) || 5000;

server.listen(port, function() {
    console.log("Memory Match (Firefox OS App) listening on port " + port);
});

// --------------------------------------------------------------------------------------------------------------------
