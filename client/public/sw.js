self.addEventListener('push', e => {
    const data = e.data ? e.data.json() : { title: 'Notification', body: 'New Message from BMTechX' };
    console.log('Push Received...', data);

    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/vite.svg', // Vite's default public icon
            badge: '/vite.svg'
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                return client.focus();
            }
            return clients.openWindow('/dashboard');
        })
    );
});
