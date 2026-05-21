const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const webpush = require('web-push');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();
const appId = 'seongil-high-meal-app';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function startPushSystem() {
  console.log("⏰ 성일고 클라우드 자동 알림 시스템 가동...");

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (3600000 * 9)); 
  
  const dayOfWeek = kst.getDay();
  let targetDate = new Date(kst);
  let label = "오늘의 급식";

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

  // 요일 실시간 추출
  const alarmWeekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const targetDayName = alarmWeekDays[targetDate.getDay()];

  let notiTitle = `🔔 [${targetDayName}요일] 성일고 ${mm}월 ${dd}일 급식`;
  let notiBody = `오늘(${mm}/${dd})은 등록된 식단이 없습니다.`;

  try {
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
    const data = await res.json();

    if (data.mealServiceDietInfo) {
      const row = data.mealServiceDietInfo[1].row[0];
      const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
      notiBody = `[${label}]\n🍴 메뉴: ${cleanMenu}\n🔥 칼로리: ${row.CAL_INFO}`;
    }
  } catch (err) {
    console.error("NEIS API 오류:", err);
    return;
  }

  const collectionPath = `artifacts/${appId}/public/data/push_subscriptions`;
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log("알림을 신청한 스마트폰 기기가 없습니다.");
    return;
  }

  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.subscription) {
      users.push({ id: doc.id, subscription: data.subscription });
    }
  });

  console.log(`📡 등록된 ${users.length}개의 스마트폰 기기로 발송을 시작합니다...`);

  // 💡 [수정 완료] 클릭 시 이동할 PWA 주소 패킷을 명확하게 실어서 보냅니다.
  const payload = JSON.stringify({ 
    title: notiTitle, 
    body: notiBody,
    data: {
      // 맨 끝에 슬래시(/)를 붙여야 무조건 하위 폴더 경로로 인식하여 잘리지 않습니다.
      url: "https://phantomluk121.github.io/seongil-high-meal-app/" 
    }
  });

  const promises = users.map(user => {
    return webpush.sendNotification(user.subscription, payload)
      .catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.doc(`${collectionPath}/${user.id}`).delete();
        }
      });
  });

  await Promise.all(promises);
  console.log("🎉 성일고 아침 푸시 임무 완료!");
}

startPushSystem();
