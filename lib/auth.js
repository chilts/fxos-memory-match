var qs = require('qs');
var https = require('https');

var redis = require('redis').createClient();

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

var audience = 'http://' + process.env.DOMAIN + '/';

exports.browserid = function(req, resp) {
    function onVerifyResp(bidRes) {
        var data = "";
        bidRes.setEncoding('utf8');
        bidRes.on('data', function (chunk) {
            data += chunk;
        });
        bidRes.on('end', function () {
            var verified = JSON.parse(data);
            resp.contentType('application/json');
            if (verified.status == 'okay') {
                console.info('browserid auth successful, setting req.session.email');
                req.session.email = verified.email;

                // ok, add this user to the user set
                redis.sadd('users', verified.email, function(err, isNew) {
                    if (err) return console.log('Redis Error:', err);

                    // if this userId has just been added to the set
                    if ( isNew ) {
                        // give this user an id
                        var userId = Date.now();

                        // increment 'count:users' and 'count:users:2013-12-11' (no need to check if it worked or not)
                        var dateKey = 'count:users:date:' + (new Date()).toISOString().substr(0, 10);
                        var hourKey = 'count:users:hour:' + (new Date()).toISOString().substr(0, 13);
                        redis.multi()
                            .incr('count:users')
                            .incr(dateKey)
                            .sadd('count:users:date:set', dateKey)
                            .incr(hourKey)
                            .sadd('count:users:hour:set', hourKey)
                            .set('user:' + verified.email, userId)
                            .exec(function(err, result) {
                                if (err) console.log('Redis Error: ', err);
                            })
                        ;
                    }
                    // else, no need to add them again, we already know about them
                });

                // req.user = verified.email;
                resp.redirect('/');
            } else {
                console.error(verified.reason);
                resp.writeHead(403);
            }
            resp.write(data);
            resp.end();
        });
    };

    var assertion = req.body.assertion;

    var body = qs.stringify({
        assertion: assertion,
        audience: audience
    });
    console.info('verifying with browserid');
    var request = https.request({
        host: 'verifier.login.persona.org',
        path: '/verify',
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'content-length': body.length
        }
    }, onVerifyResp);
    request.write(body);
    request.end();
}
