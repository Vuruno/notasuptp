console.log('Service Worker Works');

self.addEventListener('push', e => {
    const data = e.data.json();
    self.registration.showNotification(data.title, {
        body: data.message,
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Archlinux-icon-crystal-64.svg/1024px-Archlinux-icon-crystal-64.svg.png'
    });
});