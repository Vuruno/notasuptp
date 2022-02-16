const cron = require('node-cron')
const { sendNotification } = require('web-push')
const webpush = require('./webpush')

// sec min hour dMonth month dWeek
// cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * * *', function () {

//     var payload = {
//         title: 'TITULO FALOPA',
//         body: "IT'S THE TERROR OF KNOWING WHAT THIS WORLD IS ABOUT",
//         url: 'https://www.google.com'
//     }
    
//     send(payload)
// })

async function send(payload) {
    if (!pushSubscripton) return
    try {
        await webpush.sendNotification(pushSubscripton, JSON.stringify(payload))
    } catch (error) {
        console.log('Error at push notification')
        console.log(error)
    }
}