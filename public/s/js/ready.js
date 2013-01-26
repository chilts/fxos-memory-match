// Immediately Invoked Function Expression - http://benalman.com/news/2010/11/immediately-invoked-function-expression/
(function() {

var startIntroSequence;

$(function() {
    // ------------------------------------------------------------------------
    // constants

    var icons = [
        'alligator',
        'ant',
        'bat',
        'bear',
        'bee',
        'bird',
        'bulldog',
        'bull',
        'butterfly',
        'cat',
        'chicken',
        'cow',
        'crab',
        'crocodile',
        'deer',
        'dog',
        'donkey',
        'duck',
        'eagle',
        'elephant',
        'fish',
        'fox',
        'frog',
        'giraffe',
        'gorilla',
        'hippo',
        'horse',
        'insect',
        'lion',
        'monkey',
        'moose',
        'mouse',
        'owl',
        'panda',
        'penguin',
        'pig',
        'rabbit',
        'rhino',
        'rooster',
        'shark',
        'sheep',
        'snake',
        'tiger',
        'turkey',
        'turtle',
        'wolf'
    ];

    // ------------------------------------------------------------------------
    // set up some selectors

    var $start = $('#start');
    var $join = $('#join');
    var $frontImgs = $('.front img');
    var $backImgs = $('.back img');
    var $cards = $('.card');
    var $fronts = $('.front');
    var $backs = $('.back');
    var $infoStart = $('.info-start');
    var $infoEnd = $('.info-end');

    var endSequenceTimeout;
    var endSequenceInMotion;
    var introInterval;
    var deck;
    var $currentImg;
    var pairsFound;

    var resetAll = function() {
        if ( endSequenceTimeout ) {
            clearTimeout(endSequenceTimeout);
        }

        if ( introInterval ) {
            clearInterval(introInterval);
        }

        // reset all vars
        introInterval = undefined;
        endSequenceTimeout = undefined;
        endSequenceInMotion = false;
        deck = [];
        $currentImg = undefined;
        pairsFound = 0;

        // reset all the cards and images (to show the front of the cards)
        $cards.css({ 'rotate' : '0deg', 'rotateX' : '0deg', 'rotateY' : '0deg', 'scale' : 1.0 });
        $frontImgs.stop(false, true).css({ 'top' : 0 }).show();
        $frontImgs.parent().stop(false, true).css({ 'rotate' : '0deg', 'scale' : 1.0 });
        $backImgs.parent().stop(false, true).css({ 'rotate' : '0deg', 'scale' : 1.0 });

        // show the front of the cards
        $backs.stop(false, true).addClass('hide').css({ 'rotate' : '0deg', 'scale' : 1.0 });
        $fronts.stop(false, true).removeClass('hide').css({ 'rotate' : '0deg', 'scale' : 1.0 });

        // put the start button back, hide the other info
        $infoStart.show();
        $infoEnd.hide();
    };

    // ------------------------------------------------------------------------
    // intro animation

    startIntroSequence = function() {
        $('.info').hide()
        $infoStart.show();

        introInterval = setInterval(function() {
            var img = Math.floor(Math.random()*$frontImgs.size());
            var icon = Math.floor(Math.random()*icons.length);

            var $img = $($frontImgs[img]);
            var degrees = Math.random()*60 - 30;
            var spin = false, rotate = false;
            if ( degrees > -2 && degrees < 0 ) {
                spin = true;
            }
            if ( degrees > 0 && degrees < 2 ) {
                rotate = true;
            }

            function switchImage() {
                if ( !introInterval ) return;
                $img.fadeOut(200, function() {
                    $img.attr('src', '/s/i/' + icons[icon] + '.png').fadeIn(200);
                });
            }

            var scale = Math.random()/2 + 1.25;
            if ( spin ) {
                // spin it
                $img.parent()
                    .transition({ 'rotate' : '+=180deg', 'scale' : scale })
                    .transition({ 'rotate' : '+=180deg', 'scale' : 1.0 }, switchImage)
                ;
            }
            else if ( rotate ) {
                // rotate it
                $img.parent()
                    .transition({ 'rotateYw' : '+=360deg', 'scale' : scale })
                    .transition({ 'rotateY' : '+=360deg', 'scale' : 1.0 }, switchImage)
                ;
            }
            else {
                // a normal rotation
                $img.parent()
                    .transition({ 'rotate' : '+=' + degrees + 'deg', 'scale' : scale })
                    .transition({ 'rotate' : '-=' + degrees + 'deg', 'scale' : 1.0 }, switchImage)
                ;
            }

        }, 750);
    };

    var bounceMe = function($img) {
        var jumpHeight = 12 + Math.round(Math.random()*8);
        var speed = 150 + Math.round(Math.random()*50);

        $img.animate({
            'top' : '-=' + jumpHeight + 'px'
        }, speed, 'easeOutCubic', function() {
            $img.animate({
                'top' : '+=' + jumpHeight + 'px'
            }, speed, 'easeInCubic', function() {
                if ( endSequenceInMotion ) {
                    bounceMe($img);
                }
            })
        });
    };

    var startEndSequence = function() {
        endSequenceInMotion = true;

        // ok, let's figure out how long this took the user
        game.ended = Date.now();
        // console.log('You took ' + ( game.ended - game.started ) + ' milliseconds');
        // console.log('You did ' + game.clicks + ' clicks');

        // emit the end game
        socket.emit('finished', game);

        $infoStart.hide();
        $infoEnd.show();
        $('#time').html(game.ended - game.started);
        $('#clicks').html(game.clicks);

        if ( navigator.onLine ) {
            $.ajax({
                type    : 'POST',
                url     : '/save',
                data    : { time : game.ended - game.started, clicks : game.clicks },
                success : function(res, status, xhr) {
                    console.log('Saved');
                },
                error   : function(xhr, status, error) {
                    console.error("Save failure: " + error);
                }
            });
        }
        else {
            console.log('Not posting scores since not online.');
        }

        // reset the front images first
        $frontImgs.transition({ 'scale' : 1, 'opacity' : 1 });

        setTimeout(function() {
            for ( var i = 0; i < $frontImgs.size(); i++ ) {
                bounceMe( $($frontImgs[i]) );
            }

            // only show the end sequence for 10s
            endSequenceTimeout = setTimeout(function() {
                resetAll();
                startIntroSequence();
            }, 10000);
        }, 1000);
    };

    // ------------------------------------------------------------------------
    // playing the game

    var game;

    var newGame = function() {
        // firstly, reset everything
        resetAll();

        game = game || {};
        game.started = Date.now();
        game.clicks = 0;

        // stopEndSequence();
        $fronts.addClass('hide');
        $backs.removeClass('hide');
        shuffleCards();
        dealOutCards();
    };

    var shuffleArray = function(a) {
        var rand, temp;
        for( var i = 0; i < a.length; i++ ) {
            rand = Math.floor(Math.random()*a.length);
            temp = a[rand];
            a[rand] = a[i];
            a[i] = temp;
        }
    }

    var shuffleCards = function() {
        var i;

        // firstly, get a list of 9 cards we want
        // shuffleIcons();
        shuffleArray(icons);

        // get the first 9 cards twice (to make up the pairs)
        deck = [];
        for ( i = 0; i < $frontImgs.size()/2; i++ ) {
            deck.push(icons[i]);
            deck.push(icons[i]);
        }

        // shuffle the cardImages
        shuffleArray(deck);
    };

    var dealOutCards = function() {
        $frontImgs.each(function(i, el) {
            el.src = '/s/i/' + deck[i] + '.png';
        });
    };

    // ------------------------------------------------------------------------
    // event handlers

    $start.click(function() {
        // reset everything
        resetAll();

        // randomise cards (not sure why we do this on nextTick())
        setTimeout(newGame, 0);
    });

    $backs.click(function() {
        var $back = $(this);
        var $front = $(this).prev();
        var $img = $front.find('img');

        game.clicks++;

        $back
            .transition({ 'rotateY' : '+=90deg', 'scale' : 2 }, 250, 'linear', function() {
                $back.addClass('hide');
                $front.removeClass('hide');
                $front
                    .css({ 'rotateY' : '+=90deg', 'scale' : 2 })
                    .transition({ 'rotateY' : '-=90deg', 'scale' : 1.0 }, 250, 'linear', function() {
                        // okay, we've turned over the card, now check if we have a pair
                        if ( $currentImg ) {
                            if ( $img.attr('src') === $currentImg.attr('src') ) {
                                var toFade = [ $img, $currentImg ];
                                $currentImg = undefined;
                                pairsFound++;

                                // fade both of these in a short while
                                setTimeout(function() {
                                    toFade[0].transition({ 'scale' : 2, 'opacity' : 0 });
                                    toFade[1].transition({ 'scale' : 2, 'opacity' : 0 });

                                    // if we have all of the pairs, go into the endSequence()
                                    if ( pairsFound === $frontImgs.size()/2 ) {
                                        startEndSequence();
                                    }
                                }, 1000);
                            }
                            else {
                                // turn them both over in a few seconds
                                var toTurnBack = [ $img, $currentImg ];
                                $currentImg = undefined;
                                setTimeout(function() {
                                    toTurnBack[0].parent().addClass('hide').next().css({ 'scale' : 1, 'rotateY' : '0deg' }).removeClass('hide');
                                    toTurnBack[1].parent().addClass('hide').next().css({ 'scale' : 1, 'rotateY' : '0deg' }).removeClass('hide');
                                }, 1000);
                            }
                        }
                        else {
                            $currentImg = $img;
                        }
                    });
            });
    });

    // ------------------------------------------------------------------------
    // initial setup

    // start the random showing of the cards
    resetAll();

    // ------------------------------------------------------------------------
    // non game specific stuff

    $('#login').click(function(ev) {
        ev.preventDefault();
        navigator.id.get(function(assertion) {
            if ( !assertion ) {
                // not logged in, so refresh
                return location.reload();
            }

            // send to the server for verification
            $.ajax({
                type    : 'POST',
                url     : '/login',
                data    : { assertion: assertion },
                success : function(res, status, xhr) {
                    location = '/';
                },
                error   : function(xhr, status, error) {
                    alert("Login failure: " + error);
                    return location.reload();
                }
            });
        });
    });

    $('#logout').click(function(ev) {
        ev.preventDefault();
        // send to the server for verification
        $.ajax({
            url     : '/logout',
            success : function(res, status, xhr) {
                location = '/';
            },
            error   : function(xhr, status, error) {
                alert("Logout failure: " + error);
                return location.reload();
            }
        });
    });

    // ------------------------------------------------------------------------
    // socket io

    var socket = io.connect('http://memory-match.chilts.org/');
    socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
    });
    socket.on('wowza', function (data) {
        console.log(data);
        socket.emit('my other event', { id : data.id });
    });

    $join.click(function() {
        // reset everything
        resetAll();

        // tell the server that you want to join a game
        var email = $('#email').text();
        socket.emit('join', email);

        // wait for the 'start' event from socket.io
        socket.on('start', function(gameId) {
            console.log('gameId is:' + gameId);
            game = {
                started : Date.now(),
                clicks  : 0,
                id      : gameId,
                email   : email,
            };

            if ( false ) {
                setTimeout(function() {
                    console.log('Emitting finished');
                    game.ended = Date.now();
                    socket.emit('finished', game);
                }, Math.random()*20000);
            }

            newGame();
        });

        socket.on('won', function(email) {
            $('.info').hide();
            $('.info-won').show();
        });

        socket.on('lost', function(email) {
            $('.info').hide();
            $('.info-lost').show();
        });

    });

    // ------------------------------------------------------------------------

});

$(window).load(function () {
    startIntroSequence();
});

}());
