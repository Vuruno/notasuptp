const fs = require('fs');

const { google } = require('googleapis');

const clientId = process.env.CAL_CLIENT_ID
const clientSecret = process.env.CAL_CLIENT_SECRET
const refreshToken = process.env.CAL_REFRESH_TOKEN

const hw_cal = 'icehfm82elrc31e610rt7q25bs@group.calendar.google.com'
const uptp_cal = 'pns03hvmc8vjar6525g38h32jk@group.calendar.google.com'

const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(clientId, clientSecret);
oAuth2Client.setCredentials({ refresh_token: refreshToken });
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
const UTC = process.env.UTC

//SORT BY START (ms)
function order(eventsArray) {
    eventsArray.sort(function (a, b) {
        return new Date(typeof a.start.dateTime != 'undefined' ? a.start.dateTime : a.start.date).getTime()
            - new Date(typeof b.start.dateTime != 'undefined' ? b.start.dateTime : b.start.date).getTime()
    })
    return eventsArray
}

//RETURN URL FRON DESCRIPTION OR '#'
function url(description) {
    let url
    try {
        url = new URL(description);
    } catch (_) {
        return '#schedule';
    }
    return url
}

//CREATE AN ARRAY WITH EACH INDEX WITH EVENTS OF THIS DAY (0-6 sunday-saturday)
function week(eventsArray) {
    let weekarray = [[], [], [], [], [], [], []]

    for (a of eventsArray) {
        let startDay = new Date(typeof a.start.dateTime != 'undefined' ? a.start.dateTime : a.start.date).getDay()
        weekarray[startDay].push(a)
    }

    return weekarray
}

async function getWeek() {
    //SET START OF SEARCH
    const timeMin = new Date()
    timeMin.setHours(0)
    switch (timeMin.getDay()) {
        case 0: timeMin.setDate(timeMin.getDate() + 1) //SUNDAY
        case 6: timeMin.setDate(timeMin.getDate() + 2) //SATURDAY
        default: timeMin.setDate(timeMin.getDate() + 1 - timeMin.getDay())  //DAYS SINCE MONDAY
    }

    //SET END OF SEARCH
    const timeMax = new Date()
    timeMax.setHours(23); timeMax.setMinutes(59)
    switch (timeMax.getDay()) {
        case 0: timeMax.setDate(timeMax.getDate() + 5) //SUNDAY
        case 6: timeMax.setDate(timeMax.getDate() + 6) //SATURDAY
        default: timeMax.setDate(timeMax.getDate() + 6 - timeMax.getDay())  //DAYS TO FRIDAY
    }

    events = await calendar.events.list({
        calendarId: uptp_cal,
        timeMin: timeMin,
        timeMax: timeMax
    })
    // ORDER AND THEN PUT INTO DAYS
    return week(order(events.data.items))
}

async function allHW() {
    //SET START OF SEARCH
    const timeMin = new Date()
    timeMin.setHours(0); timeMin.setMinutes(0)
    switch (timeMin.getDay()) {
        case 0: timeMin.setDate(timeMin.getDate() + 1) //SUNDAY
        case 6: timeMin.setDate(timeMin.getDate() + 2) //SATURDAY
        default: timeMin.setDate(timeMin.getDate() + 1 - timeMin.getDay())  //DAYS SINCE MONDAY
    }

    //SET END OF SEARCH
    const timeMax = new Date()
    timeMax.setHours(23); timeMax.setMinutes(59)
    timeMax.setMonth(timeMax.getMonth() + 3)

    events = await calendar.events.list({
        calendarId: hw_cal,
        timeMin: timeMin,
        timeMax: timeMax
    })

    return order(events.data.items)
}

module.exports = { getWeek, allHW }