
const CACHE_NAME = 'seongil-smart-meal-v4'; // 버전 업그레이드로 강제 갱신 유도

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

async function fetchAndShowMealNotification() {
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

    let notiTitle = `🔔 성일고 ${mm}월 ${dd}일 알람`;
    let notiBody = "식단 데이터를 불러오는 중입니다...";

    try {
        const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
        const data = await res.json();

        if (data.mealServiceDietInfo) {
            const row = data.mealServiceDietInfo[1].row[0];
            const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
            const calories = row.CAL_INFO || '칼로리 미제공';
            notiBody = `[${label}]\n메뉴: ${cleanMenu}\n(${calories}) - 탭하여 AI 분석 확인!`;
        } else {
            notiBody = `해당 날짜(${mm}/${dd})에 등록된 식단이 없습니다.`;
        }
    } catch (error) {
        notiBody = "네트워크 상태가 불안정하거나 교육부 서버 응답이 없습니다.";
    }

    const options = {
        body: notiBody,
        icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: { url: '/' }
    };

    return self.registration.showNotification(notiTitle, options);
}

self.addEventListener('push', function(event) {
    event.waitUntil(fetchAndShowMealNotification());
});

self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SEND_TEST_ALARM') {
        event.waitUntil(fetchAndShowMealNotification());
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/'); 
        })
    );
});


```
