const express = require('express');
const session = require('express-session');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn } = require('../settings/isAuth');

require('../settings/auth');

router.get('/signincourse:url', (req, res, next) => {
    req.session.returnTo = `/account/course/${req.params.url}`
    res.redirect('/auth/google')
})

router.get('/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }
    ));

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', {
        successRedirect: req.session.returnTo || '/',
        failureRedirect: '/auth/google/failure'
    })(req, res, next);
})

router.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();

    res.redirect('/welcome');
});

router.get('/google/failure', (req, res) => {
    res.send('Failed to authenticate..');
});

module.exports = router;