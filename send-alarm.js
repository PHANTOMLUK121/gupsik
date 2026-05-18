
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
const fetch = require('node-fetch');


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function startPushSystem() {
  console.log("⏰ 성일고 백그라운드 자동 알림 시스템 작동 시작...");

  
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

  let notiTitle = `🔔 성일고 ${mm}월 ${dd}일 급식`;
  let notiBody = `오늘(${mm}/${dd})은 등록된 식단이 없습니다.`;


  try {
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530167&MLSV_YMD=${targetDateStr}`);
    const data = await res.json();

    if (data.mealServiceDietInfo) {
      const row = data.mealServiceDietInfo[1].row[0];
      
      const cleanMenu = row.DDISH_NM.replace(/<br\/>/g, ", ").replace(/\d+\./g, '').replace(/\./g, '').trim();
      const calories = row.CAL_INFO || '칼로리 정보 없음';
      notiBody = `[${label}]\n메뉴: ${cleanMenu}\n(${calories}) - 탭하여 AI 분석 확인!`;
    }
  } catch (err) {
    console.error("NEIS API 연동 실패:", err);
    return;
  }


  const { data: users, error } = await supabase.from('push_subscriptions').select('subscription');
  if (error || !users || users.length === 0) {
    console.log("알림을 구독한 스마트폰 기기가 데이터베이스에 존재하지 않습니다.");
    return;
  }

  console.log(`📡 총 ${users.length}개의 기기로 성일고 급식 푸시 알림 발송을 시작합니다...`);


  const payload = JSON.stringify({ title: notiTitle, body: notiBody });
  const promises = users.map(user => {
    return webpush.sendNotification(user.subscription, payload)
      .catch(err => {
        
        if (err.statusCode === 410 || err.statusCode === 404) {
          supabase.from('push_subscriptions').delete().eq('subscription', user.subscription);
        }
      });
  });

  await Promise.all(promises);
  console.log("🎉 매일 아침 성일고 급식 푸시 알림 발송 임무를 완료했습니다!");
}

startPushSystem();

