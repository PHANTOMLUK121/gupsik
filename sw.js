// 💡 버전을 v7로 올려서 스마트폰 브라우저가 "어? 파일 바뀌었네?" 하고 새로 다운로드하게 만듭니다.
const CACHE_NAME = 'seongil-smart-meal-v7';

const PRECACHE_ASSETS = [
    './index.html',
    './manifest.json'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting(); // 💡 새 서비스 워커가 발견되면 대기 없이 즉시 적용
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim()); // 💡 활성화 즉시 페이지 제어권 획득
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});

const APP_URL = 'https://phantomluk121.github.io/seongil-high-meal-app/';

async function fetchAndShowMealNotification(pushData = null) {
    let notiTitle = "";
    let notiBody = "";
    
    if (pushData && pushData.title && pushData.body) {
        notiTitle = pushData.title;
        notiBody = pushData.body;
    } else {
        const now = new Date();
        const dayOfWeek = now.getDay();
        let targetDate = new Date(now);
        let label = "오늘의 급식";

        if (dayOfWeek === 6) { 
            targetDate.setDate(targetDate.getDate() + 2);
            label = "다음 주 월요일 급식";
        } else if (dayOfWeek === 0) {
            targetDate.setDate(targetDate.getDate() + 1);
            label = "내일(월요일) 급식";
        }

        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const targetDateStr = `${yyyy}${mm}${dd}`;

        notiTitle = `🔔 성일고 ${mm}월 ${dd}일 알람`;

        try {
            const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
            const data = await res.json();

            if (data.mealServiceDietInfo) {
                const row = data.mealServiceDietInfo[1].row[0];
                const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
                const calories = row.CAL_INFO || '칼로리 정보 없음';
                notiBody = `[${label}]\n메뉴: ${cleanMenu}\n(${calories}) - 터치해서 AI 분석 확인!`;
            } else {
                notiBody = `[${label}]\n해당 요일은 휴일이거나 급식이 등록되지 않았습니다.`;
            }
        } catch (error) {
            notiBody = "네트워크 오프라인 상태라 급식을 불러올 수 없습니다.";
        }
    }

    const options = {
        body: notiBody,
        icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: { url: (pushData && pushData.data && pushData.data.url) ? pushData.data.url : APP_URL }
    };

    return self.registration.showNotification(notiTitle, options);
}

self.addEventListener('push', function(event) {
    let pushData = null;
    if (event.data) {
        try { pushData = event.data.json(); } catch (e) {}
    }
    event.waitUntil(fetchAndShowMealNotification(pushData));
});

self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SEND_TEST_ALARM') {
        if (event.data.title && event.data.body) {
            self.registration.showNotification(event.data.title, {
                body: event.data.body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
                vibrate: [200, 50, 200],
                data: { url: APP_URL } 
            });
        } else {
            event.waitUntil(fetchAndShowMealNotification());
        }
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); 

    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : APP_URL;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes('seongil-high-meal-app') && 'focus' in client) {
                    // 💡 [핵심 추가] 이미 창이 열려있는데 만약 이상한 주소(잘린 주소)에 멈춰있다면, 정확한 주소로 강제 리다이렉트 시킵니다.
                    if (client.navigate && client.url !== targetUrl) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
