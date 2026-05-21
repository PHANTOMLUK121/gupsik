const CACHE_NAME = 'seongil-smart-meal-v6';

// PWA 설치 필수 조건: 파일 기본 캐싱 설정
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
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});

// 💡 공통으로 사용할 유저님의 정확한 성일고 급식 앱 주소 정의
const APP_URL = 'https://phantomluk121.github.io/seongil-high-meal-app/';

async function fetchAndShowMealNotification(pushData = null) {
    let notiTitle = "";
    let notiBody = "";
    
    // 💡 1. 만약 GitHub Actions 서버에서 푸시 패킷(title, body)을 직접 보내왔다면 그 데이터를 우선 사용합니다.
    if (pushData && pushData.title && pushData.body) {
        notiTitle = pushData.title;
        notiBody = pushData.body;
    } else {
        // 💡 2. 서버 데이터가 없거나 로컬 테스트일 경우에만 기존 NEIS API 추출 로직을 작동시킵니다.
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
        // 💡 [수정] 서버에서 보낸 링크 주소가 있다면 사용하고, 없으면 완벽한 고유 풀 주소를 매핑합니다.
        data: { url: (pushData && pushData.data && pushData.data.url) ? pushData.data.url : APP_URL }
    };

    return self.registration.showNotification(notiTitle, options);
}

// 💡 [수정] 서버 원격 알림 수신 핸들러 보완
self.addEventListener('push', function(event) {
    let pushData = null;
    if (event.data) {
        try {
            pushData = event.data.json();
        } catch (e) {
            console.log("텍스트 형태의 푸시 수신");
        }
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
                data: { url: APP_URL } // 테스트 알림에도 안전 주소 매핑
            });
        } else {
            event.waitUntil(fetchAndShowMealNotification());
        }
    }
});

// 💡 [완벽 수정] 사용자가 알림창을 클릭했을 때의 주소 이동 로직 고정
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // 알림창 닫기

    // 알림에 저장된 안전한 목적지 주소 가져오기 (없으면 성일고 급식 앱 주소로 백업)
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : APP_URL;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // 이미 급식 앱 창이 켜져 있다면 새로 띄우지 않고 해당 창으로 포커스 이동
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                // 정확하게 도메인 하위 전체 경로까지 체크하도록 보완
                if (client.url.includes('seongil-high-meal-app') && 'focus' in client) {
                    return client.focus();
                }
            }
            // 켜진 창이 없다면 주소가 잘리지 않는 온전한 고유 풀 주소(APP_URL)로 새 창 가동
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
