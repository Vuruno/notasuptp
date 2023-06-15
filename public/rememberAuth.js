//get Cookies
let decodedCookie = document.cookie
decodedCookie = decodedCookie.split(';')
let settled = '', user_id = ''
console.log(document.cookie)

for (let x of decodedCookie) {
    console.log(x)
    if (x.split('=')[0].includes('settled')) settled = Number(x.split('=')[1].split(';')[0])
    else if (x.split('=')[0].includes('user_id')) user_id = x.split('=')[1].split(';')[0]
}
console.log("!!decodedCookie")

let currentUri = window.location.href
currentUri = window.location.href.split(':')
currentUri = currentUri[currentUri.length - 1]

//If 'settled' has not been settled or passed more than 5 minutes (300000ms) since last check
if ((isNaN(settled) || (Date.now() - settled) > 3) && currentUri != 'logout') {
    console.log('verifying saved identity')
    const options = {
        method: 'POST',
        body: JSON.stringify({ user_id: user_id }),
        headers: {
            "Content-Type": "application/json"
        }
    };

    fetch('/auth/remember', options)
        .then(response => response.json())
        .then(response => {
            // console.log(response.user)
            if (response.user == null) {
                document.cookie = "settled=false; expires=Sat, 31 Dec 2022 23:59:59 GMT;path=https://uptp.glitch.me/"
            } else {
                document.cookie = `settled=${Date.now()}; expires=Sat, 31 Dec 2022 23:59:59 GMT;path=https://uptp.glitch.me/`
                document.cookie = `user_id=${response.user._id}; expires=Sat, 31 Dec 2022 23:59:59 GMT;path=https://uptp.glitch.me/`
            }
        });
}
setTimeout(function () {
    let user_id_settled = !(user_id == null ||
        user_id == undefined ||
        user_id == 'undefined' ||
        user_id == '' ||
        user_id == "''" ||
        user_id == '""')
    let navbar_uptp = document.getElementById('myNaveNavBar').innerText == 'UPTP'

    console.log("user_id_settled",user_id_settled,"navbar_uptp",navbar_uptp)
    console.log("!user_id_settled && navbar_uptp",!user_id_settled && navbar_uptp)

    //Do not reload if user_id is not settled and navbar says 'UPTP'
    if (!user_id_settled && navbar_uptp)
        return
        
    //Do not reload if user_id is settled and navbar does not says 'UPTP'
    if (!navbar_uptp)
        return

    location.reload()
}, 3000);