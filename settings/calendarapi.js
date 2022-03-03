const fs = require('fs');
var dateParse = require('dateparse');

const { google } = require('googleapis');
const Subject = require('../models/Subject');
const dateparse = require('dateparse');
const { ECDH } = require('crypto');

const clientId = process.env.CAL_CLIENT_ID
const clientSecret = process.env.CAL_CLIENT_SECRET
const refreshToken = process.env.CAL_REFRESH_TOKEN

const hw_cal = 'icehfm82elrc31e610rt7q25bs@group.calendar.google.com'
const uptp_cal = 'pns03hvmc8vjar6525g38h32jk@group.calendar.google.com'

const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(clientId, clientSecret);
oAuth2Client.setCredentials({ refresh_token: refreshToken });
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

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
        let startDay
        if (a.start.dateTime == undefined) {
            startDay = new Date(a.start.date).getUTCDay()
        } else {
            startDay = new Date(a.start.dateTime).getDay()
        }
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

async function allHW(user) {
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

    //Just return my subjects hw
    enrolled = user.enrolled

    var myEvents = []
    for (ev of events.data.items) {
        let subject = ev.summary.split(':')[0]

        enrolled.map(function (x) {
            if (x.subject.toLowerCase() == subject.toLowerCase()) myEvents.push(ev)
        })
    }

    return myEvents
}

async function allUptpCal() {
    var allevents = await calendar.events.list({
        calendarId: uptp_cal,
        timeMin: new Date(),
    })
    return order(allevents.data.items)
}

async function createHW(body) {
    var { subject, title, date, time, description, link } = body
    let end = dateparse(`${date} ${time}`)
    let start

    var hw = await calendar.events.insert({
        calendarId: hw_cal,
        resource: {
            start: { dateTime: end },
            end: { dateTime: end },
            description: `${description}\n${link}`,
            summary: `${subject}: ${title}`
        }
    })

    return hw.data.id
}

async function updateHW(body) {
    var { id, subject, title, date, time, description, link } = body
    let end = dateparse(`${date} ${time}`)

    var hw = await calendar.events.update({
        calendarId: hw_cal,
        eventId: id,
        resource: {
            start: { dateTime: end },
            end: { dateTime: end },
            description: `${description}\n${link}`,
            summary: `${subject}: ${title}`
        }
    })

    return hw.data.id
}

async function deleteHW(id) {
    try {
        await calendar.events.delete({
            calendarId: hw_cal,
            eventId: id,
        })
    } catch (err) {
        console.log(err)
    }
}

async function getHW(id) {
    try {
        hw = await calendar.events.get({
            calendarId: hw_cal,
            eventId: id,
        })
    } catch (err) {
        hw = null
    }

    return hw
}

async function updateSubjectName(prevsubject, subject) {
    let min = new Date()
    let max = new Date()
    min.setUTCDate(min.getUTCDate()-7)
    max.setUTCMonth(max.getUTCMonth() + 5)

    //Update the UPTP events
    var uptpEvents = await calendar.events.list({
        calendarId: uptp_cal,
        timeMin: min,
        timeMax: max,
        maxResults: 1000
    })
    
    for (evt of uptpEvents.data.items) {
        if (evt.summary == prevsubject) {
            await calendar.events.update({
                calendarId: uptp_cal,
                eventId: evt.id,
                resource: {
                    summary: subject,
                    start: evt.start,
                    end: evt.end,
                    description: evt.description
                }
            })
        }
    }

    //Update the HW events
    var hwEvents = await calendar.events.list({
        calendarId: hw_cal,
        timeMin: min,
        timeMax: max
    })

    for (evt of hwEvents.data.items) {
        if (evt.summary.split(':')[0] == prevsubject) {
            await calendar.events.update({
                calendarId: hw_cal,
                eventId: evt.id,
                resource: {
                    summary: `${subject}: ${evt.summary.split(':')[1]}`,
                    start: evt.start,
                    end: evt.end,
                    description: evt.description
                }
            })
        }
    }
}

//ADMIN STUFF
function getDates(from, to, day) {
    from = dateparse(`${from} 00:00`)
    to = dateparse(`${to} 00:00`)
    day = Number(day)
    var dates = []

    if (isNaN(day)) {
        dates = [new Date(from)]

        while (from.getDate() + 1 <= to.getDate() || from.getMonth() < to.getMonth()) {
            dates.push(new Date(from.setDate(from.getDate() + 1)));
        }
    } else {
        // Set to first Monday
        from.setDate(from.getDate() + (7 + day - from.getDay()) % 7);
        dates = [new Date(from)];

        // Create Dates for all Mondays up to end year and month
        while (from.getDate() + 7 <= to.getDate() || from.getMonth() < to.getMonth()) {
            dates.push(new Date(from.setDate(from.getDate() + 7)));
        }
    }

    return dates;
}

async function newSubject(body) {
    var { subject, day, start, end, from, to, description, allDay } = body
    var dates = getDates(from, to, day)

    for (date of dates) {
        let startTime = new Date(date)
        let endTime = new Date(date)

        if (allDay == undefined) {
            startTime.setHours(start.split(':')[0])
            startTime.setMinutes((start.split(':')[1]))
            endTime.setHours(end.split(':')[0])
            endTime.setMinutes((end.split(':')[1]))
            startTime = { dateTime: new Date(startTime) }
            endTime = { dateTime: new Date(endTime) }
        } else {
            startTime.setMonth(startTime.getMonth() + 1)
            startTime = { date: `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()}` }
            endTime.setDate(endTime.getDate() + 1)
            endTime.setMonth(endTime.getMonth() + 1)
            endTime = { date: `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()}` }
        }
        await calendar.events.insert({
            calendarId: uptp_cal,
            resource: {
                start: startTime,
                end: endTime,
                description: description,
                summary: subject.trim()
            }
        })
    }
}

async function deleteSubject(body) {
    var { subject, from, to } = body
    from = new Date(from)
    to = new Date(to)

    var allEvents = await calendar.events.list({
        calendarId: uptp_cal,
        timeMin: from,
        timeMax: to
    })
    for (elem of allEvents.data.items) {
        if (elem.summary.trim() == subject.trim()) {
            try {
                await calendar.events.delete({
                    calendarId: uptp_cal,
                    eventId: elem.id,
                })
            } catch (err) {
                console.log(err)
            }
        }
    }
}

module.exports = { getWeek, allHW, allUptpCal, createHW, updateHW, deleteHW, getHW, newSubject, deleteSubject, updateSubjectName}