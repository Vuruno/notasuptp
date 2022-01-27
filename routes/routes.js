const express = require('express');
const router = express.Router();
const { isLoggedIn, isntLoggedIn } = require('../settings/isAuth');
const Subject = require('../models/Subject')

const empyUser = { googleId: "", name: { givenName: "UPTP", familyName: "Grades" }, email: "", enrolled: [] }

// Welcome Page
router.get('/', isLoggedIn, async function (req, res) {
    let mySubjects = []
    req.user.enrolled.forEach(function (subject) { })

    if (req.user.enrolled.length < 1) res.redirect('/account/courses')
    else res.render('dashboard', { user: req.user || empyUser, allSubjects: await Subject.find() })
})

router.get('/welcome', isntLoggedIn, function (req, res) {
    res.render('welcome', { user: req.user || empyUser })
})

router.get('/tables', function (req, res) {
    res.render('tables', { user: req.user || empyUser })
})

module.exports = router;