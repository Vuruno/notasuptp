const PUBLIC_NOTIFY_KEY = "BGouhgLk7T48gpK5G9rZqfkTMQUT8YSRzxm5BZHZQS6fWZPpzSDe0nazEeE0YIbnWgrw1F9CN4h-HOD1meWcR4g"

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const subscription = async function () {
    //Service worker
    const register = await navigator.serviceWorker.register('/worker.js', {
      scope: '/'
    })
    console.log('new Servise worker')

    const subscriptionJSON = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_NOTIFY_KEY)
    })

    // Send Notification
    await fetch("/subscribe", {
      method: "POST",
      body: JSON.stringify(subscriptionJSON),
      headers: {
        "Content-Type": "application/json"
      },
         
    });
    console.log("Subscribed!");
  }

subscription()