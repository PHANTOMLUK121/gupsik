```javascript
const CACHE_NAME = 'seongil-smart-meal-v2';

// 1. 서비스 워커가 설치되자마자 대기 상태를 무시하고 즉시 실행되게 합니다.
self.addEventListener('install', function(event) {
    self.skipWaiting();
    console.log('[Service Worker] Installed immediately');
});

// 2. 활성화되자마자 열려있는 모든 페이지의 알림 제어권을 획득합니다.
self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
    console.log('[Service Worker] Activated and claimed clients');
});

// 3. 실제 푸시 알람 서버(또는 가상 테스트)로부터 신호가 오면 핸드폰 화면에 팝업을 그립니다.
self.addEventListener('push', function(event) {
    let payload = { title: '🔔 성일고 급식 알람', body: '오늘의 급식을 앱에서 바로 확인하세요!' };
    
    // 만약 서버에서 데이터가 넘어왔다면 텍스트를 분석하여 덮어씌웁니다.
    if (event.data) {
        try {
            payload = event.data.json();
        } catch(e) {
            payload.body = event.data.text();
        }
    }

    // 스마트폰 팝업창 세부 디자인 (아이콘, 진동 패턴 등)
    const options = {
        body: payload.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png', // 푸시 팝업 메인 아이콘
        badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png', // 안드로이드 상단바 작은 아이콘
        vibrate: [200, 100, 200, 100, 200], // 징-징-징-
        requireInteraction: true, // 사용자가 손으로 직접 알림을 지우기 전까지 유지
        data: { url: '/' } // 클릭 시 앱 메인화면으로 이동
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// 4. 사용자가 핸드폰 상단 알림바를 눌렀을 때 앱을 자동으로 열어주는 기능
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // 알림창 닫기
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // 이미 켜둔 탭이 있다면 그 탭을 최상단으로 끌어올림
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // 앱이 완전히 꺼져있었다면 새 창으로 열기
            if (clients.openWindow) {
                return clients.openWindow('/'); 
            }
        })
    );
});


```
