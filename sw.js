const CACHE_NAME = 'seongil-smart-meal-v2';

self.addEventListener('install', function(event) {
    self.skipWaiting();
    console.log('[Service Worker] Installed immediately');
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
    console.log('[Service Worker] Activated and claimed clients');
});

// 테스트 알림용 메시지 수신기
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SEND_TEST_ALARM') {
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
            vibrate: [200, 100, 200, 100, 200],
            data: { url: '/' }
        };
        self.registration.showNotification(event.data.title, options);
    }
});

self.addEventListener('push', function(event) {
    let payload = { title: '🔔 성일고 급식 알람', body: '오늘의 급식을 앱에서 바로 확인하세요!' };
    
    if (event.data) {
        try {
            payload = event.data.json();
        } catch(e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/'); 
            }
        })
    );
});
