
const CACHE_NAME = 'seongil-smart-meal-v3';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

// 백그라운드에서 실시간 날짜 계산 및 교육부 API 호출을 담당하는 핵심 함수
async function fetchAndShowMealNotification() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    let targetDate = new Date(now);
    let label = "오늘의 급식";

    // 주말(토=6, 일=0)인 경우 다음 주 월요일로 날짜를 점프시킴
    if (dayOfWeek === 6) { 
        targetDate.setDate(targetDate.getDate() + 2);
        label = "다음 주 월요일 급식 미리보기";
    } else if (dayOfWeek === 0) {
        targetDate.setDate(targetDate.getDate() + 1);
        label = "내일(월요일) 급식 미리보기";
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${yyyy}${mm}${dd}`;

    let notiTitle = `🔔 성일고 ${mm}월 ${dd}일 알람`;
    let notiBody = "식단 데이터를 불러오는 중입니다...";

    try {
        // 성일고등학교 고유 코드 (J10: 경기도교육청, 7530167: 성일고)를 직접 타격하여 속도 극대화
        const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
        const data = await res.json();

        if (data.mealServiceDietInfo) {
            // 데이터가 존재하면 알레르기 번호를 정제하여 알림 바디에 장착
            const row = data.mealServiceDietInfo[1].row[0];
            const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
            notiBody = `[${label}]\n메뉴: ${cleanMenu}\n(${row.CAL_INFO}) - 탭하여 AI 분석 확인!`;
        } else {
            notiBody = `해당 날짜(${mm}/${dd})에 등록된 식단이 없습니다.`;
        }
    } catch (error) {
        console.error("백그라운드 통신 에러:", error);
        notiBody = "네트워크 오프라인 상태이거나 교육부 서버 응답이 없습니다.";
    }

    const options = {
        body: notiBody,
        icon: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3408/3408506.png',
        vibrate: [200, 100, 200, 100, 200], // 강력한 진동 패턴
        requireInteraction: true, // 알람을 수동으로 지우기 전까지 유지
        data: { url: '/' }
    };

    return self.registration.showNotification(notiTitle, options);
}

// 외부 서버에서 Push 알림이 올 때 (앱이 완전히 꺼져 있을 때 작동)
self.addEventListener('push', function(event) {
    event.waitUntil(fetchAndShowMealNotification());
});

// 메인 앱(index.html)에서 가상 테스트 버튼을 눌렀을 때
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SEND_TEST_ALARM') {
        event.waitUntil(fetchAndShowMealNotification());
    }
});

// 알림창 클릭 시 앱으로 이동
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
