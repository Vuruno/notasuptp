const express = require('express');
const router = express.Router();
const { isLoggedIn, isntLoggedIn } = require('../settings/isAuth');
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
        // todaySchedule: await calendar.getToday(),
        // yesterdaySchedule: await calendar.getYesterday(),
        // tomorrowSchedule: await calendar.getTomorrow(),
        // todayHw: await calendar.hwToday(),
        // yesterdayHw: await calendar.hwYesterday(),
        // tomorrowHw: await calendar.hwTomorrow(),
        allHw: await calendar.allHW()
    })
})

router.get('/welcome', isntLoggedIn, function (req, res) {
    res.render('welcome', { user: req.user || empyUser })
})

router.get('/tables', function (req, res) {
    res.render('tables', { user: req.user || empyUser })
})

router.post('/subscribe', async (req, res) => {
    global.pushSubscripton = req.body;
    res.status(200).json()
})

module.exports = router;