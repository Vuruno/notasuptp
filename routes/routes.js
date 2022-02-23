const express = require('express');
const router = express.Router();
const { isLoggedIn, isntLoggedIn, isAdmin } = require('../settings/isAuth');
const Subject = require('../models/Subject')
const calendar = require('../settings/calendarapi')

//NOTIFICATION HANDELERS
const webpush = require('../settings/webpush')
let pushSubscripton;

const empyUser = { googleId: "", picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/1024px-Circle-icons-profile.svg.png", name: { givenName: "UPTP", familyName: "" }, email: "", enrolled: [] }

// Welcome Page
router.get('/', async function (req, res) {
    res.render('dashboard', {
        user: req.user || empyUser,
        allSubjects: await Subject.find(),
        weekSchedule: await calendar.getWeek(),
        allHw: await calendar.allHW(req.user || empyUser)
    })
})

router.get('/welcome', isntLoggedIn, function (req, res) {
    res.render('welcome', { user: req.user || empyUser, status: '' })
})

router.get('/welcome:status', isntLoggedIn, function (req, res) {
    res.render('welcome', { user: req.user || empyUser, status: req.params.status })
})

router.get('/tables', function (req, res) {
    res.render('tables', { user: req.user || empyUser })
})

router.post('/subscribe', async (req, res) => {
    global.pushSubscripton = req.body;
    res.status(200).json()
})

//ADMIN STUFF
router.post('/showalluptpcalevents', isAdmin, async function (req, res) {
    console.log('all uptp calendar events:')
    let allEvents = await calendar.allUptpCal()
    console.log(allEvents)
})

router.get('/calendarNewSubject', isAdmin, async function (req, res) {
    res.render('calendarNewSubject', {user: req.user || empyUser, allSubjects : await Subject.find()})
})

router.get('/calendarDeleteSubject', isAdmin, async function (req, res) {
    res.render('calendarDeleteSubject', {user: req.user || empyUser, allSubjects : await Subject.find()})
})

router.post('/calNewSubject', isAdmin, async function (req, res) {
    await calendar.newSubject(req.body)
    res.redirect('/calendarNewSubject')
})

router.post('/calDeleteSubject', isAdmin, async function (req, res) {
    await calendar.deleteSubject(req.body)
    res.redirect('/calendarDeleteSubject')
})

module.exports = router;