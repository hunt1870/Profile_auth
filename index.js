var express = require("express");
var app = express();
var session = require("express-session");
var passport = require("passport");
var googlestrat = require("passport-google-oauth").OAuth2Strategy;
var GOOGLE_CLIENT_ID = "";
var GOOGLE_CLIENT_SECRET = "";
var facebookstrat = require("passport-facebook").Strategy;
var FACEBOOK_CLIENT_ID = "";
var FACEBOOK_CLIENT_SECRET = "";

const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('./config/cert.key'),
    cert: fs.readFileSync('./config/cert.crt')
};

app.set('view engine','ejs');

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
}));
app.use(express.static(__dirname + '/views'));
app.use(passport.initialize());
app.use(passport.session());

var uProfile;

passport.serializeUser(function(user,cb){
    cb(null,user);
});

passport.deserializeUser(function(obj,cb){
    cb(null, obj);
});

passport.use(new googlestrat({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/callback"
    },
    function(accessToken,refreshToken,profile,done){
        uProfile = profile;
        return done(null, uProfile);
    }
));

passport.use(new facebookstrat({
    clientID: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/facebook/callback"
    }, function(accessToken,refreshToken,profile,done){
        uProfile = profile;
        return done(null, uProfile);
    }
));

app.get('/error', (req, res) => res.send("Login error - something is wrong please login again"));

app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile.ejs', {
        user: req.user
    })
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email']}));
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect: '/error',
        successRedirect: '/profile'
    }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/error',
        successRedirect: '/profile'
    }));

app.get('/logout', function (req, res) {
    req.logout(function(err){
        if (err){
            return next(err);
        }
        res.redirect('/');
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

app.get('/', function (req, res) {
    res.render('welcome.ejs');
});

https.createServer(options, app).listen(3000, () => {
    console.log(`HTTPS server started on port 3000`);
});