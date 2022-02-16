console.log('Service worker')

self.addEventListener('push', async function (e) {
    const data = e.data.json()
    self.registration.showNotification(data.title, {
        body: data.body,
        requireInteraction: true,
        badge: 'https://cdn.glitch.global/80244fa8-0810-4834-b603-221ead0a3574/mono_icon.png?v=1644088639683',
        icon: "https://cdn.glitch.global/80244fa8-0810-4834-b603-221ead0a3574/multi_icon.png?v=1644088639995",
        actions: [
            {
                action: data.url,
                title: 'Open'
            },
            {
                action: 'close',
                title: 'Dismiss'
            }
        ]
    })
})

self.addEventListener('notificationclick', function (event) {
    const clickedNotification = event.notification;
    if (event.action == 'close') {
        event.notification.close()
    } else {
        clients.openWindow(event.action)
    }
});

