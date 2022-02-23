const express = require('express');
const session = require('express-session');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn } = require('../settings/isAuth');
const User = require('../models/User');
const empyUser = { googleId: "", picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/1024px-Circle-icons-profile.svg.png", name: { givenName: "UPTP", familyName: "" }, email: "", enrolled: [] }

require('../settings/auth');

router.get('/signincourse:url', (req, res, next) => {
    req.session.returnTo = `/account/course${req.params.url}`
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

    res.redirect('/welcome:logout');
});

router.get('/delete', async function (req, res) {
    //delete user document
    await User.deleteOne({_id: req.user._id})
    req.logout();
    req.session.destroy();

    res.redirect('/welcome:logout');
});

router.get('/google/failure', (req, res) => {
    res.send('Failed to authenticate..');
});

//remember me strategy
router.post('/remember', async function (req, res, next) {
    let user = String(req.body.user_id)
    //Search in db
    if (user == '' || user == "''" || user == 'undefined') user = null
    user = await User.findById(user)
    
    if (user == null) { //If not user registered
        if (req.isAuthenticated()) { //Verify in backend if registered
            res.status(200).send({ user: req.user })
        } else { //User has not authenticated
            req.logIn(empyUser, (err) => { })
            res.status(200).send({ user: empyUser })
        }

    } else { //If user registered
        req.logIn(user, (err) => { })
        res.status(200).send({ user: {_id: req.body.user_id} })
    }
})

module.exports = router;