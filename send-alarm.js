
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const webpush = require('web-push');
const fetch = require('node-fetch');

// 1. 파이어베이스 권한 서비스 인증서 연결
// GitHub Secrets에 서비스 어카운트 비밀번호(FIREBASE_SERVICE_ACCOUNT)를 등록해야 합니다.
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
  const kst = new Date(utc + (3600000 * 9)); // KST 보정
  
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

  let notiTitle = `🔔 성일고 ${mm}월 ${dd}일 급식`;
  let notiBody = `오늘(${mm}/${dd})은 등록된 식단이 없습니다.`;

  // NEIS API 연동
  try {
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
    const data = await res.json();

    if (data.mealServiceDietInfo) {
      const row = data.mealServiceDietInfo[1].row[0];
      const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
      notiBody = `[${label}]\n메뉴: ${cleanMenu}\n(${row.CAL_INFO}) - 탭하여 영양 분석 확인!`;
    }
  } catch (err) {
    console.error("NEIS API 오류:", err);
    return;
  }

  // 규칙 1: 클라우드 연동 공식 경로에서 구독 주소록 추출
  // collection(db, 'artifacts', appId, 'public', 'data', 'push_subscriptions')
  const collectionPath = `artifacts/${appId}/public/data/push_subscriptions`;
  console.log(`📂 주소록 수집 경로: ${collectionPath}`);
  
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log("알림을 허용한 스마트폰 기기가 존재하지 않습니다.");
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

  const payload = JSON.stringify({ title: notiTitle, body: notiBody });
  const promises = users.map(user => {
    return webpush.sendNotification(user.subscription, payload)
      .catch(err => {
        // 끊긴 기기(앱 삭제) 자동 정리
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.doc(`${collectionPath}/${user.id}`).delete();
        }
      });
  });

  await Promise.all(promises);
  console.log("🎉 성일고 스마트 아침 푸시 임무를 완전히 수행했습니다!");
}

startPushSystem();


