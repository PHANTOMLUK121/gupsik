
const CACHE_NAME = 'seongil-smart-meal-v6';

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
    let notiBody = "식단 데이터를 분석 중입니다...";

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
        
        if (event.data.title && event.data.body) {
            self.registration.showNotification(event.data.title, {
                body: event.data.body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
                vibrate: [200, 50, 200]
            });
        } else {
            
            event.waitUntil(fetchAndShowMealNotification());
        }
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
