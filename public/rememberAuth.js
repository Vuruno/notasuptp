//If 'settled' has'nt been settled or passed more than 5 minutes (300000ms) since last check
if (isNaN(localStorage.getItem("settled")) || (Date.now() - localStorage.getItem("settled")) > 30) {
    console.log('verifying saved identity')
    const options = {
        method: 'POST',
        body: JSON.stringify({ user_id: localStorage.getItem("user_id") }),
        headers: {
            "Content-Type": "application/json"
        }
    };

    fetch('/auth/remember', options)
        .then(response => response.json())
        .then(response => {
            // console.log(response.user)
            if (response.user == null) {
                localStorage.setItem("settled", "false")
            } else {
                localStorage.setItem("settled", Date.now())
                localStorage.setItem("user_id", response.user._id)
            }
        });
}
setTimeout(function () {
    if (localStorage.getItem("user_id") == null ||
        localStorage.getItem("user_id") == undefined ||
        localStorage.getItem("user_id") == 'undefined' ||
        localStorage.getItem("user_id") == '') return
    if (document.getElementById('myNaveNavBar').innerText != 'UPTP') return
    location.reload()
}, 2000);