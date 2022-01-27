const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const RememberMeStrategy = require('passport-remember-me').Strategy;
const User = require('../models/User');
const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
require('dotenv').config()

var express = require('express');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACKURL,
  passReqToCallback: true
},
  async function (request, accessToken, refreshToken, profile, done) {
    let user = await User.findOne({ googleId: profile.id })

    if (user) return done(null, user)

    const newUser = new User({ googleId: profile.id, name: profile.name, email: profile.email, enrolled: [] })
    await newUser.save()
    return done(null, newUser)
  }
));

passport.use(new RememberMeStrategy(
  function(token, done) {
    Token.consume(token, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user);
    });
  },
  function(user, done) {
    var token = utils.generateToken(64);
    Token.save(token, { userId: user.id }, function(err) {
      if (err) { return done(err); }
      return done(null, token);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});