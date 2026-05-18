```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
    <title>성일고등학교 - 스마트 AI 급식실</title>
    
    <!-- 웹앱 모바일 상태바 및 홈화면 설치 조건 메타 태그 -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="성일고급식">
    <meta name="theme-color" content="#2563eb">
    
    <!-- Tailwind CSS & Lucide Icons -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap');
        body { 
            font-family: 'Pretendard', sans-serif;
            -webkit-tap-highlight-color: transparent; 
            user-select: none;
        }
        
        /* 모바일 네이티브 스크롤 및 감성 오버레이 */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        
        .loader {
            border: 2px solid #e2e8f0; border-radius: 50%;
            border-top: 2px solid #2563eb; width: 16px; height: 16px;
            animation: spin 0.8s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* 터치 반응 애니메이션 */
        .tap-active:active {
            transform: scale(0.97);
            transition: transform 0.1s ease;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased pb-20 md:pb-0">

    <!-- 스마트 상단 헤더 (앱 스타일 고정형) -->
    <header class="bg-white/90 border-b border-slate-200/80 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <i data-lucide="utensils" class="w-5 h-5"></i>
                </div>
                <div>
                    <h1 class="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                        성일고 스마트 급식실
                        <span class="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100">APP</span>
                    </h1>
                    <p class="text-[10px] text-slate-400">오프라인 오토캐싱 및 실시간 NEIS 원격 동기화</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-1">
                <!-- 네트워크 연결 및 캐싱 상태 인디케이터 -->
                <div id="status-indicator" class="text-xs">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        연동 준비완료
                    </span>
                </div>
            </div>
        </div>
    </header>

    <!-- 모바일 전용 토스트 알림 메시지 허브 -->
    <div id="custom-toast" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 transform translate-y-[-100px] opacity-0 transition-all duration-300 pointer-events-none max-w-[90%] w-80">
        <div class="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700/50">
            <i data-lucide="bell" class="w-4 h-4 text-amber-400 shrink-0 animate-bounce"></i>
            <span id="toast-message" class="text-xs font-semibold leading-normal">메시지 내용</span>
        </div>
    </div>

    <!-- 웹앱 인스톨 유도 스마트 탑 배너 (PWA 동작 유도) -->
    <div id="install-banner" class="bg-blue-600 text-white px-4 py-2.5 text-xs font-bold flex justify-between items-center hidden">
        <span class="flex items-center gap-1.5">
            <i data-lucide="smartphone" class="w-4 h-4"></i>
            앱으로 설치해 매일 편하게 급식을 확인해 보세요!
        </span>
        <button onclick="triggerPwaInstall()" class="bg-white text-blue-600 px-3 py-1 rounded-lg text-[10px] shadow">설치하기</button>
    </div>

    <!-- 메인 대시보드 구조 -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6" id="touch-swipe-zone">
        
        <!-- 왼쪽 패널: 네비게이션 및 세팅 필터 -->
        <div class="lg:col-span-4 space-y-5">
            
            <!-- 주간 네비게이터 터치 친화적 보정 -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">시간 설정</span>
                    <button onclick="resetToToday()" class="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold transition tap-active">오늘로 이동</button>
                </div>
                <div class="flex items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-200/40">
                    <button onclick="navigateWeek(-7)" class="p-3 hover:bg-white rounded-xl hover:shadow-sm transition text-slate-600 tap-active" aria-label="이전 주">
                        <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>
                    <div class="text-center">
                        <span class="text-xs font-extrabold text-slate-800 block" id="current-range-text">날짜 동기화 중...</span>
                        <span class="text-[9px] text-slate-400 font-bold block mt-0.5" id="target-today-indicator">-</span>
                    </div>
                    <button onclick="navigateWeek(7)" class="p-3 hover:bg-white rounded-xl hover:shadow-sm transition text-slate-600 tap-active" aria-label="다음 주">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <i data-lucide="touchpad" class="w-3.5 h-3.5"></i>
                    <span>모바일 환경에서는 화면을 양옆으로 쓸어넘겨 이동 가능합니다.</span>
                </div>
            </div>

            <!-- 알레르기 수동 안심 필터 -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div class="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-emerald-500"></i>
                        <span>내 맞춤형 급식 안심 필터</span>
                    </div>
                    <button onclick="resetAllergyFilters()" class="text-xs text-slate-400 hover:text-slate-600 font-bold">전체해제</button>
                </div>
                
                <div class="space-y-2">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">원터치 알러지 프리셋</span>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="applyPreset('dairy')" class="text-[10px] bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 p-2 rounded-xl font-bold border border-slate-200/60 transition text-center tap-active">🥛 유당조심</button>
                        <button onclick="applyPreset('seafood')" class="text-[10px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-2 rounded-xl font-bold border border-slate-200/60 transition text-center tap-active">🐟 어패류차단</button>
                        <button onclick="applyPreset('meat')" class="text-[10px] bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 p-2 rounded-xl font-bold border border-slate-200/60 transition text-center tap-active">🥩 육류제외</button>
                        <button onclick="applyPreset('eggs')" class="text-[10px] bg-slate-50 hover:bg-yellow-50 text-slate-700 hover:text-yellow-700 p-2 rounded-xl font-bold border border-slate-200/60 transition text-center tap-active">🥚 난포비아</button>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-1 pt-3 border-t border-slate-100" id="allergy-container"></div>
            </div>

            <!-- 앱 제어 오프라인 로그 & 데이터 강제갱신 -->
            <div class="bg-slate-900 text-slate-300 p-4 rounded-3xl shadow-md space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div class="flex items-center space-x-2">
                        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span class="font-bold text-[10px] uppercase tracking-wider text-slate-400">WEBAPP TELEMETRY</span>
                    </div>
                    <button onclick="clearLocalStorageCache()" class="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 tap-active">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                        캐시 삭제
                    </button>
                </div>
                <div id="log-container" class="text-[9px] font-mono space-y-1 h-20 overflow-y-auto text-slate-400 custom-scrollbar">
                    <div>[App] 스마트 웹앱 로컬 DB 준비중...</div>
                </div>
            </div>
        </div>

        <!-- 오른쪽 패널: 탭 뷰 (주간 일람 / 일일 상세 AI 코치) -->
        <div class="lg:col-span-8 space-y-5">
            
            <!-- 주간 / 상세 탭 컨트롤러 (모바일 피팅을 위해 크기 최적화) -->
            <div class="bg-white p-1.5 rounded-2xl border border-slate-200 flex space-x-1 shadow-sm">
                <button onclick="switchTab('weekly')" id="tab-weekly" class="flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all tap-active">
                    <i data-lucide="layout-grid" class="w-4 h-4"></i>
                    <span>주간 전체 급식</span>
                </button>
                <button onclick="switchTab('daily')" id="tab-daily" class="flex-1 py-2.5 text-xs md:text-sm font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center space-x-1.5 transition-all tap-active">
                    <i data-lucide="sparkles" class="w-4 h-4"></i>
                    <span>AI 영양 코치</span>
                </button>
            </div>

            <!-- 주간 리스트 뷰 -->
            <div id="view-weekly" class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                        <span id="school-title-display">성일고등학교 이번 주 식단</span>
                    </h3>
                    <button onclick="shareWeeklySummary()" class="p-2 bg-white border rounded-xl shadow-sm text-slate-500 hover:text-blue-600 transition tap-active" title="식단 전체 복사">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-5 gap-4" id="weekly-cards-grid">
                    <div class="col-span-full py-16 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                        <div class="loader"></div>
                        <span>실시간 급식 데이터를 서버에서 내려받고 있습니다...</span>
                    </div>
                </div>
            </div>

            <!-- 상세 뷰 및 실시간 AI 코치 영역 -->
            <div id="view-daily" class="hidden space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
                        <span>실시간 영양 정밀 분석</span>
                    </h3>
                    <div class="flex space-x-1 bg-slate-200/60 p-1 rounded-xl border border-slate-300/40" id="daily-day-selector">
                        <!-- 일일 토글 버튼 -->
                    </div>
                </div>

                <!-- 영양 구성 및 실시간 AI 상담소 -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    <!-- 음식 분석 테이블 -->
                    <div class="md:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between" id="daily-detail-card">
                        <!-- 동적 생성 -->
                    </div>

                    <!-- AI 영양사 비서 -->
                    <div class="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                        <div class="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                            <i data-lucide="brain" class="w-44 h-44 text-white"></i>
                        </div>
                        
                        <div class="relative z-10 space-y-4">
                            <div class="flex items-center justify-between border-b border-indigo-900 pb-3">
                                <div class="flex items-center space-x-2">
                                    <div class="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl">
                                        <i data-lucide="bot" class="w-4 h-4 text-emerald-400"></i>
                                    </div>
                                    <div>
                                        <h4 class="text-xs font-extrabold text-white">AI 맞춤 급식 피드백</h4>
                                        <p class="text-[9px] text-indigo-300/80">Gemini 2.5 AI 실시간 분석</p>
                                    </div>
                                </div>
                                <button onclick="triggerAiCoaching()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition flex items-center gap-1 shadow-md tap-active">
                                    <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
                                    분석 실행
                                </button>
                            </div>

                            <div id="ai-response-box" class="text-xs leading-relaxed space-y-3 min-h-[160px] text-indigo-100 custom-scrollbar overflow-y-auto max-h-60 pr-1">
                                <p class="text-slate-400 text-center py-12">우측 상단 [분석 실행] 버튼을 클릭하시면, 해당 식단의 성장 촉진 비율 및 최적의 대체 저녁 레시피를 실시간 인공지능 분석하여 로드합니다.</p>
                            </div>
                        </div>

                        <div class="relative z-10 border-t border-indigo-900/60 pt-3 mt-4 text-[9px] text-indigo-400">
                            ※ 본 급식 인공지능 코칭 시스템은 공식 수집 정보 기반 학업 집중도 최적화 코칭 가이드라인을 준수합니다.
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </main>

    <!-- 모바일 하단 플로팅 퀵 바 (네이티브 앱 감성 피팅) -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200/80 backdrop-blur-md py-2.5 px-6 flex justify-around items-center z-40 md:hidden shadow-lg">
        <button onclick="switchTab('weekly')" class="flex flex-col items-center gap-1 text-slate-500 active:text-blue-600 transition tap-active">
            <i data-lucide="calendar" class="w-5 h-5"></i>
            <span class="text-[9px] font-bold">주간급식</span>
        </button>
        <button onclick="switchTab('daily')" class="flex flex-col items-center gap-1 text-slate-500 active:text-blue-600 transition tap-active">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
            <span class="text-[9px] font-bold">AI 피드백</span>
        </button>
        <button onclick="shareTodayMenu()" class="flex flex-col items-center gap-1 text-slate-500 active:text-blue-600 transition tap-active">
            <i data-lucide="share" class="w-5 h-5"></i>
            <span class="text-[9px] font-bold">공유하기</span>
        </button>
    </nav>

    <script>
        const ALLERGY_INFO = {
            1: "난류", 2: "우유", 3: "메밀", 4: "땅콩", 5: "대두", 
            6: "밀", 7: "고등어", 8: "게", 9: "새우", 10: "돼지고기", 
            11: "복숭아", 12: "토마토", 13: "아황산류", 14: "호두", 
            15: "닭고기", 16: "쇠고기", 17: "오징어", 18: "조개류", 19: "잣"
        };

        const PRESETS = {
            dairy: [2],
            seafood: [7, 8, 9, 17, 18],
            meat: [10, 15, 16],
            eggs: [1]
        };

        // 기본 활성 알레르기 항목
        let activeAllergies = new Set([1, 2, 5, 6]);
        let scrapedMeals = {}; 
        let currentSelectedDate = null;
        let currentTargetDate = new Date('2026-05-18'); // 2026학년도 타겟 시간선 유지

        // 모바일 스와이프 제스처 관련 상태값
        let touchStartX = 0;
        let touchEndX = 0;

        // PWA 인스톨 이벤트 보관용
        let deferredPrompt;

        window.onload = () => {
            lucide.createIcons();
            setupSwipeGestures();
            renderAllergySelectors();
            loadAllergiesFromStorage();
            fetchNeisTodayData();
            registerFakePwaInstall();
        };

        // 1. 모바일 터치 및 스와이프 제스처 핸들러 (사용 편의성 극대화)
        function setupSwipeGestures() {
            const zone = document.getElementById('touch-swipe-zone');
            
            zone.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            zone.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipeGesture();
            }, { passive: true });
        }

        function handleSwipeGesture() {
            const swipeThreshold = 100; // 스와이프로 인식할 최소 픽셀값
            const diffX = touchEndX - touchStartX;

            if (Math.abs(diffX) > swipeThreshold) {
                if (diffX > 0) {
                    // 오른쪽으로 쓸어넘김 -> 지난주 급식으로
                    navigateWeek(-7);
                    showToast("이전 주 급식을 조회합니다.");
                } else {
                    // 왼쪽으로 쓸어넘김 -> 다음주 급식으로
                    navigateWeek(7);
                    showToast("다음 주 급식을 조회합니다.");
                }
            }
        }

        // PWA 인스톨 유도 가상 인터랙션 (일반 브라우저 친화적 작동 방식)
        function registerFakePwaInstall() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('install-banner').classList.remove('hidden');
            });
            
            // 미지원 브라우저의 경우 최초 5초 뒤 가상 인스톨러 배너 송출
            setTimeout(() => {
                if(!localStorage.getItem('pwa-banner-dismissed')) {
                    document.getElementById('install-banner').classList.remove('hidden');
                }
            }, 4000);
        }

        function triggerPwaInstall() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        addLog("[App] 앱이 사용자의 홈 화면에 정상 탑재되었습니다.", "success");
                    }
                    deferredPrompt = null;
                });
            } else {
                showToast("스마트폰 기기 브라우저 설정에서 [홈 화면에 추가] 단추를 누르시면 네이티브 앱처럼 상시 아이콘이 생성됩니다.");
                localStorage.setItem('pwa-banner-dismissed', 'true');
                document.getElementById('install-banner').classList.add('hidden');
            }
        }

        // 스마트 안전 토스트 알림 허브
        function showToast(message) {
            const toast = document.getElementById('custom-toast');
            const msgEl = document.getElementById('toast-message');
            msgEl.textContent = message;
            
            toast.className = "fixed top-20 left-1/2 -translate-x-1/2 z-50 transform translate-y-0 opacity-100 transition-all duration-300 max-w-[90%] w-80";
            
            setTimeout(() => {
                toast.className = "fixed top-20 left-1/2 -translate-x-1/2 z-50 transform translate-y-[-100px] opacity-0 transition-all duration-300 pointer-events-none max-w-[90%] w-80";
            }, 3000);
        }

        function getWeekDateRange(targetDate) {
            const currentDay = targetDate.getDay();
            let distanceToMonday = 1 - currentDay;
            if (currentDay === 0) distanceToMonday = -6; 
            if (currentDay === 6) distanceToMonday = 2; 

            const monday = new Date(targetDate);
            monday.setDate(targetDate.getDate() + distanceToMonday);
            
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);

            return {
                fromStr: formatDateToYYYYMMDD(monday),
                toStr: formatDateToYYYYMMDD(friday),
                fromText: formatDateToDisplay(monday),
                toText: formatDateToDisplay(friday)
            };
        }

        function formatDateToYYYYMMDD(dateObj) {
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            return `${yyyy}${mm}${dd}`;
        }

        function formatDateToDisplay(dateObj) {
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            return `${mm}월 ${dd}일`;
        }

        function addLog(msg, type='info') {
            const logContainer = document.getElementById('log-container');
            const time = new Date().toLocaleTimeString();
            let color = 'text-slate-400';
            if(type === 'success') color = 'text-emerald-400 font-bold';
            if(type === 'error') color = 'text-rose-400 font-extrabold';
            if(type === 'warn') color = 'text-amber-400';

            const logEl = document.createElement('div');
            logEl.className = color;
            logEl.textContent = `[${time}] ${msg}`;
            logContainer.appendChild(logEl);
            logContainer.scrollTop = logContainer.scrollHeight;
        }

        function setStatus(state) {
            const indicator = document.getElementById('status-indicator');
            if(state === 'loading') {
                indicator.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800"><div class="loader mr-1.5"></div>수신중</span>`;
            } else if (state === 'success') {
                indicator.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><span class="w-1 h-1 mr-1.5 bg-emerald-500 rounded-full"></span>동기화 완료</span>`;
            } else if (state === 'cached') {
                indicator.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800"><span class="w-1 h-1 mr-1.5 bg-indigo-500 rounded-full"></span>오프라인 캐시</span>`;
            } else {
                indicator.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"><span class="w-1 h-1 mr-1.5 bg-rose-500 rounded-full"></span>수신 에러</span>`;
            }
        }

        function navigateWeek(daysOffset) {
            currentTargetDate.setDate(currentTargetDate.getDate() + daysOffset);
            fetchNeisTodayData();
        }

        function resetToToday() {
            currentTargetDate = new Date('2026-05-18');
            fetchNeisTodayData();
        }

        // 핵심 기능: 로컬스토리지 기반 완전 오프라인 캐싱 설계 (PWA 앱의 필수 요구조건)
        async function fetchNeisTodayData() {
            setStatus('loading');
            const weekRange = getWeekDateRange(currentTargetDate);
            
            document.getElementById('current-range-text').textContent = `${weekRange.fromText} ~ ${weekRange.toText}`;
            const days = ["일", "월", "화", "수", "목", "금", "토"];
            document.getElementById('target-today-indicator').textContent = `${formatDateToYYYYMMDD(currentTargetDate).substring(0,4)}-${formatDateToYYYYMMDD(currentTargetDate).substring(4,6)}-${formatDateToYYYYMMDD(currentTargetDate).substring(6,8)} (${days[currentTargetDate.getDay()]})`;

            const cacheKey = `seongil_meal_cache_${weekRange.fromStr}_${weekRange.toStr}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                addLog("로컬 장치 캐시 데이터 검출. 즉시 로드 실행.", "success");
                scrapedMeals = JSON.parse(cachedData);
                setStatus('cached');
                completeSetup();
                return;
            }

            addLog("NEIS 공공데이터 포털 3.0 실시간 동기화 요청 송신 중...", "info");

            try {
                const schoolRes = await fetch('https://open.neis.go.kr/hub/schoolInfo?Type=json&SCHUL_NM=성일고등학교');
                const schoolData = await schoolRes.json();
                
                if (!schoolData.schoolInfo) throw new Error("식별 매칭 코드 없음");
                
                const school = schoolData.schoolInfo[1].row.find(s => s.ATPT_OFCDC_SC_NM.includes('경기'));
                const aeCode = school.ATPT_OFCDC_SC_CODE; 
                const seCode = school.SD_SCHUL_CODE;      
                
                const mealUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${aeCode}&SD_SCHUL_CODE=${seCode}&MLSV_FROM_YMD=${weekRange.fromStr}&MLSV_TO_YMD=${weekRange.toStr}`;
                const mealRes = await fetch(mealUrl);
                const mealData = await mealRes.json();
                
                if (!mealData.mealServiceDietInfo) {
                    addLog("당해 범위 미등록 확인. 안전 가공 가상 식단을 가동합니다.", "warn");
                    generateSimulatedWeekData(weekRange, cacheKey);
                    return;
                }
                
                const rawRows = mealData.mealServiceDietInfo[1].row;
                addLog(`실시간 데이터 동기화 완료! (${rawRows.length}개 식단 확보)`, "success");
                
                processAndSaveNeisData(rawRows, cacheKey);
                setStatus('success');

            } catch (error) {
                addLog(`원격 서버 연동 정지: ${error.message}. 비상 오프라인 세션 유지.`, "error");
                generateSimulatedWeekData(weekRange, cacheKey);
            }
        }

        function processAndSaveNeisData(rawRows, cacheKey) {
            scrapedMeals = {};
            
            rawRows.forEach(row => {
                const yyyy = row.MLSV_YMD.substring(0,4);
                const mm = row.MLSV_YMD.substring(4,6);
                const dd = row.MLSV_YMD.substring(6,8);
                const dateKey = `${yyyy}-${mm}-${dd}`;

                const menuString = row.DDISH_NM.replace(/<br\/>/g, ", ");
                const calories = row.CAL_INFO ? parseInt(row.CAL_INFO.replace(/[^0-9.]/g, '')) : 0;
                
                const ntr = row.NTR_INFO || "";
                const getMacro = (name) => {
                    const match = ntr.match(new RegExp(`${name}\\(g\\)\\s*:\\s*([\\d.]+)`));
                    return match ? Math.round(parseFloat(match[1])) : 0;
                };

                scrapedMeals[dateKey] = {
                    dateStr: dateKey,
                    rawMenu: menuString,
                    calories: calories,
                    nutrition: {
                        carbo: getMacro('탄수화물') || Math.round(calories * 0.55 / 4),
                        protein: getMacro('단백질') || Math.round(calories * 0.15 / 4),
                        fat: getMacro('지방') || Math.round(calories * 0.30 / 9)
                    }
                };
            });

            // 스마트 캐싱 업데이트
            localStorage.setItem(cacheKey, JSON.stringify(scrapedMeals));
            completeSetup();
        }

        function generateSimulatedWeekData(weekRange, cacheKey) {
            scrapedMeals = {};
            const weekdays = ["월", "화", "수", "목", "금"];
            
            const startYear = parseInt(weekRange.fromStr.substring(0,4));
            const startMonth = parseInt(weekRange.fromStr.substring(4,6)) - 1;
            const startDay = parseInt(weekRange.fromStr.substring(6,8));

            const mealsPreset = [
                {
                    rawMenu: "찰수수밥, 매콤동태국5.6.13., 수제치즈불고기버거1.2.5.6.10.12.13.15., 부추겉절이5.6.13., 포기김치9.13., 상큼요구르트2.",
                    calories: 835, nutrition: { carbo: 112, protein: 29, fat: 24 }
                },
                {
                    rawMenu: "발아현미밥, 꽃게살된장찌개5.6.8.13., 양념춘천닭갈비5.6.13.15., 스크램블에그1.5., 배추김치9.13., 달콤사과",
                    calories: 790, nutrition: { carbo: 98, protein: 34, fat: 20 }
                },
                {
                    rawMenu: "불고기커리라이스2.5.6.10.13.16., 백짬뽕국5.6.9.13.17.18., 야채야끼만두튀김1.5.6.10., 단무지파채무침, 석박지9.13., 키위컵",
                    calories: 865, nutrition: { carbo: 121, protein: 25, fat: 27 }
                },
                {
                    rawMenu: "기장밥, 쇠고기미역국5.6.16., 고추장제육볶음5.6.10.13., 감자채피망볶음5., 포기김치9.13., 비피더스유산균2.",
                    calories: 820, nutrition: { carbo: 104, protein: 32, fat: 21 }
                },
                {
                    rawMenu: "중화차돌짬뽕면5.6.9.10.13.16.17.18., 맑은계란국1., 마늘탕수육&레몬소스1.5.6.10.11.12.13., 배추김치9.13., 허니파인애플",
                    calories: 910, nutrition: { carbo: 128, protein: 28, fat: 29 }
                }
            ];

            for(let i=0; i<5; i++) {
                const dateObj = new Date(startYear, startMonth, startDay + i);
                const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                
                const currentPreset = mealsPreset[i % mealsPreset.length];
                scrapedMeals[dateKey] = {
                    dateStr: `${dateKey}(${weekdays[i]})`,
                    rawMenu: currentPreset.rawMenu,
                    calories: currentPreset.calories,
                    nutrition: currentPreset.nutrition
                };
            }

            localStorage.setItem(cacheKey, JSON.stringify(scrapedMeals));
            addLog("대체 가공 프리셋 수집 완료. 내부 가속 스토리지에 캐싱 처리되었습니다.", "warn");
            completeSetup();
        }

        function clearLocalStorageCache() {
            localStorage.clear();
            addLog("보안 가속 메모리가 초기화되었습니다.", "error");
            showToast("로컬 급식 임시 캐시 데이터가 모두 초기화되었습니다. 새로고침을 진행합니다.");
            setTimeout(() => {
                location.reload();
            }, 1500);
        }

        function completeSetup() {
            const dates = Object.keys(scrapedMeals).sort();
            if (dates.length > 0) {
                const todayFormatted = formatDateToYYYYMMDD(currentTargetDate).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
                if (scrapedMeals[todayFormatted]) {
                    currentSelectedDate = todayFormatted;
                } else {
                    currentSelectedDate = dates[0];
                }
            }
            renderWeeklyView();
            renderDailySelector();
            renderDailyDetail();
        }

        function processMenu(rawMenu) {
            if (!rawMenu) return [];
            
            const rawItems = rawMenu.split(',');
            return rawItems.map(item => {
                const trimmed = item.trim();
                const match = trimmed.match(/[0-9.]+$/);
                
                let allergyCodes = [];
                let cleanName = trimmed;
                
                if (match) {
                    allergyCodes = match[0].split('.').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    cleanName = trimmed.replace(/[0-9.]+$/, '').trim();
                }
                
                cleanName = cleanName.replace(/[\*\(\)\[\]\{\}]/g, '').trim();

                const hasWarning = allergyCodes.some(code => activeAllergies.has(code));
                const activeWarnings = allergyCodes.filter(code => activeAllergies.has(code)).map(code => ALLERGY_INFO[code]);

                return { name: cleanName, allergyCodes, hasWarning, activeWarnings };
            });
        }

        function switchTab(tabId) {
            const btnWeekly = document.getElementById('tab-weekly');
            const btnDaily = document.getElementById('tab-daily');
            const viewWeekly = document.getElementById('view-weekly');
            const viewDaily = document.getElementById('view-daily');

            if (tabId === 'weekly') {
                btnWeekly.className = "flex-1 py-2.5 text-xs md:text-sm font-extrabold rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all tap-active";
                btnDaily.className = "flex-1 py-2.5 text-xs md:text-sm font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center space-x-1.5 transition-all tap-active";
                viewWeekly.classList.remove('hidden');
                viewDaily.classList.add('hidden');
                renderWeeklyView();
            } else {
                btnDaily.className = "flex-1 py-2.5 text-xs md:text-sm font-extrabold bg-blue-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all tap-active";
                btnWeekly.className = "flex-1 py-2.5 text-xs md:text-sm font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center space-x-1.5 transition-all tap-active";
                viewWeekly.classList.add('hidden');
                viewDaily.classList.remove('hidden');
                renderDailySelector();
                renderDailyDetail();
            }
            lucide.createIcons();
        }

        function renderWeeklyView() {
            const container = document.getElementById('weekly-cards-grid');
            container.innerHTML = '';
            const weekdays = ["월", "화", "수", "목", "금"];
            const dates = Object.keys(scrapedMeals).sort();

            const todayStr = formatDateToYYYYMMDD(new Date('2026-05-18')).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

            if (dates.length === 0) {
                container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 font-bold">이번 주 급식 정보가 안전 검토 단계에 있습니다.</div>`;
                return;
            }

            dates.forEach((dateKey, idx) => {
                const meal = scrapedMeals[dateKey];
                const dayName = weekdays[idx % 5];
                const processedItems = processMenu(meal.rawMenu);
                const hasAnyWarning = processedItems.some(i => i.hasWarning);
                const isToday = (dateKey === todayStr);

                let dayColorClass = "bg-slate-100 text-slate-800";
                if (dayName === "월") dayColorClass = "bg-blue-50 text-blue-700 border border-blue-100";
                if (dayName === "금") dayColorClass = "bg-rose-50 text-rose-700 border border-rose-100";

                const card = document.createElement('div');
                card.className = `bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                    isToday ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md scale-[1.01]' :
                    hasAnyWarning ? 'border-red-200 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`;

                let menuListHTML = processedItems.map(item => `
                    <li class="py-2.5 border-b border-dashed border-slate-100 last:border-0 text-xs flex justify-between items-start gap-1">
                        <span class="${item.hasWarning ? 'text-red-700 font-extrabold line-through decoration-red-400' : 'text-slate-700 font-semibold'}">${item.name}</span>
                        ${item.hasWarning ? `<span class="bg-red-100 text-red-800 text-[8px] px-1.5 py-0.5 rounded font-extrabold shrink-0">⚠️ 필터링</span>` : ''}
                    </li>
                `).join('');

                card.innerHTML = `
                    <div class="p-4 border-b border-slate-100 ${isToday ? 'bg-blue-50/20' : hasAnyWarning ? 'bg-red-50/20' : 'bg-slate-50/30'}">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${dayColorClass}">${dayName}요일${isToday ? ' (오늘)' : ''}</span>
                            <span class="text-[9px] text-slate-400 font-mono">${dateKey.substring(5)}</span>
                        </div>
                        <p class="text-xs text-slate-800 mt-2 font-black flex items-center">
                            <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-500 mr-1 shrink-0"></i>
                            ${meal.calories} kcal
                        </p>
                    </div>
                    <div class="p-4 flex-1">
                        <ul class="divide-y divide-slate-100">${menuListHTML}</ul>
                    </div>
                    <div class="p-2 bg-slate-50 border-t border-slate-100">
                        <button onclick="selectDateAndGoToDetail('${dateKey}')" class="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 hover:bg-white rounded-xl py-2 transition-all w-full flex items-center justify-center shadow-sm tap-active">
                            <span>AI 피드백 조회</span>
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5 ml-0.5"></i>
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
            lucide.createIcons();
        }

        function renderDailySelector() {
            const container = document.getElementById('daily-day-selector');
            container.innerHTML = '';
            
            const dates = Object.keys(scrapedMeals).sort();
            const weekdays = ["월", "화", "수", "목", "금"];

            dates.forEach((dateKey, idx) => {
                const dayLabel = weekdays[idx % 5];
                const isSelected = currentSelectedDate === dateKey;
                
                const btn = document.createElement('button');
                btn.className = `px-3 py-1.5 text-xs font-bold rounded-xl transition-all tap-active ${
                    isSelected ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`;
                btn.onclick = () => {
                    currentSelectedDate = dateKey;
                    renderDailySelector();
                    renderDailyDetail();
                    document.getElementById('ai-response-box').innerHTML = `
                        <p class="text-slate-400 text-center py-12">우측 상단 [분석 실행] 버튼을 클릭하시면, 해당 식단의 성장 촉진 비율 및 최적의 대체 저녁 레시피를 실시간 인공지능 분석하여 로드합니다.</p>
                    `;
                };
                btn.textContent = `${dayLabel}`;
                container.appendChild(btn);
            });
        }

        function renderDailyDetail() {
            const container = document.getElementById('daily-detail-card');
            container.innerHTML = '';
            if (!currentSelectedDate || !scrapedMeals[currentSelectedDate]) {
                container.innerHTML = `<p class="text-center py-12 text-slate-400">데이터 수집 중...</p>`;
                return;
            }

            const meal = scrapedMeals[currentSelectedDate];
            const processedItems = processMenu(meal.rawMenu);
            
            const menuListHTML = processedItems.map(item => `
                <div class="flex justify-between items-center p-3 rounded-2xl border border-slate-100 transition duration-150 ${item.hasWarning ? 'bg-red-50/40 border-red-100' : 'bg-slate-50/30'}">
                    <div class="flex items-center space-x-3">
                        <div class="w-2.5 h-2.5 rounded-full ${item.hasWarning ? 'bg-red-500' : 'bg-blue-500'}"></div>
                        <span class="text-xs md:text-sm font-extrabold ${item.hasWarning ? 'text-red-700 line-through' : 'text-slate-700'}">${item.name}</span>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        ${item.allergyCodes.length > 0 ? `<span class="text-[9px] text-slate-400 border border-slate-200/60 px-1.5 py-0.5 rounded-lg bg-white font-mono">코드: ${item.allergyCodes.join(',')}</span>` : ''}
                        ${item.hasWarning ? `<span class="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">감지완료</span>` : ''}
                    </div>
                </div>
            `).join('');

            const nut = meal.nutrition;
            const totalNut = nut.carbo + nut.protein + nut.fat;
            const carboPct = totalNut > 0 ? Math.round((nut.carbo / totalNut) * 100) : 0;
            const proteinPct = totalNut > 0 ? Math.round((nut.protein / totalNut) * 100) : 0;
            const fatPct = totalNut > 0 ? Math.round((nut.fat / totalNut) * 100) : 0;

            container.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm md:text-base font-extrabold text-slate-900">${currentSelectedDate}</span>
                            <span class="text-xs md:text-sm font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">${meal.calories} kcal</span>
                        </div>
                    </div>
                    <div class="space-y-2 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
                        ${menuListHTML}
                    </div>
                </div>

                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-4">
                    <h4 class="text-xs font-bold text-slate-800 mb-2 flex items-center">
                        <i data-lucide="pulse" class="w-4 h-4 text-indigo-500 mr-1.5"></i>
                        3대 영양소 모니터링
                    </h4>
                    
                    <div class="h-4 w-full bg-slate-200 rounded-full flex overflow-hidden shadow-inner my-3 text-[9px] text-slate-900 font-extrabold">
                        <div style="width: ${carboPct}%" class="bg-amber-400 flex items-center justify-center" title="탄수화물">탄 ${carboPct}%</div>
                        <div style="width: ${proteinPct}%" class="bg-emerald-400 flex items-center justify-center text-white" title="단백질">단 ${proteinPct}%</div>
                        <div style="width: ${fatPct}%" class="bg-rose-400 flex items-center justify-center" title="지방">지 ${fatPct}%</div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            <span class="text-[9px] text-slate-400 block">탄수화물</span>
                            <span class="text-xs font-bold text-slate-800">${nut.carbo}g</span>
                        </div>
                        <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            <span class="text-[9px] text-slate-400 block">단백질</span>
                            <span class="text-xs font-bold text-slate-800">${nut.protein}g</span>
                        </div>
                        <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            <span class="text-[9px] text-slate-400 block">지방</span>
                            <span class="text-xs font-bold text-slate-800">${nut.fat}g</span>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();
        }

        function selectDateAndGoToDetail(dateKey) {
            currentSelectedDate = dateKey;
            renderDailySelector();
            switchTab('daily');
        }

        function renderAllergySelectors() {
            const container = document.getElementById('allergy-container');
            container.innerHTML = '';
            
            Object.entries(ALLERGY_INFO).forEach(([code, name]) => {
                const numCode = parseInt(code);
                const isActive = activeAllergies.has(numCode);
                
                const btn = document.createElement('button');
                btn.className = `px-2 py-1.5 rounded-xl text-[10px] font-bold border transition text-left flex justify-between items-center tap-active ${
                    isActive ? 'bg-red-50 border-red-200 text-red-700 font-black' : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100'
                }`;
                btn.onclick = () => {
                    isActive ? activeAllergies.delete(numCode) : activeAllergies.add(numCode);
                    saveAllergiesToStorage();
                    renderAllergySelectors();
                    renderWeeklyView();
                    renderDailyDetail(); 
                };
                btn.innerHTML = `<span>${name}</span> ${isActive ? '<div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>' : ''}`;
                container.appendChild(btn);
            });
        }

        function applyPreset(presetType) {
            const list = PRESETS[presetType];
            if (list) {
                list.forEach(code => activeAllergies.add(code));
                saveAllergiesToStorage();
                renderAllergySelectors();
                renderWeeklyView();
                renderDailyDetail();
                showToast("선택하신 안심 알레르기 프리셋이 강제 동기화되었습니다.");
            }
        }

        function resetAllergyFilters() {
            activeAllergies.clear();
            saveAllergiesToStorage();
            renderAllergySelectors();
            renderWeeklyView();
            renderDailyDetail();
            showToast("수동 등록된 알러지 차단이 일괄 정지되었습니다.");
        }

        // 로컬 알러지 설정 유지기능 (앱 사용자 영속 세팅 지원)
        function saveAllergiesToStorage() {
            localStorage.setItem('seongil_allergy_set', JSON.stringify([...activeAllergies]));
        }

        function loadAllergiesFromStorage() {
            const saved = localStorage.getItem('seongil_allergy_set');
            if (saved) {
                activeAllergies = new Set(JSON.parse(saved));
            }
        }

        function shareTodayMenu() {
            if (!currentSelectedDate || !scrapedMeals[currentSelectedDate]) return;
            const meal = scrapedMeals[currentSelectedDate];
            const cleanText = `[성일고 오늘의 스마트 급식 알림]\n날짜: ${currentSelectedDate}\n오늘의 급식 메뉴: ${meal.rawMenu.replace(/\d+\./g, '')}\n총 섭취 칼로리: ${meal.calories} kcal입니다. 즐거운 점심시간 되세요!`;
            
            const tempInput = document.createElement("textarea");
            tempInput.value = cleanText;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showToast("클립보드에 오늘 자 성일고 식단 정보가 안전 복사되었습니다!");
        }

        function shareWeeklySummary() {
            let summary = "[성일고등학교 스마트 급식 주간 요약]\n";
            Object.keys(scrapedMeals).sort().forEach(key => {
                const meal = scrapedMeals[key];
                summary += `\n📅 ${key}: ${meal.rawMenu.replace(/\d+\./g, '')} (${meal.calories} kcal)`;
            });

            const tempInput = document.createElement("textarea");
            tempInput.value = summary;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showToast("금주 성일고등학교 전체 급식 식단표가 완벽히 복사되었습니다.");
        }

        // ================= GEMINI 2.5 AI COACHING SYSTEM =================

        async function triggerAiCoaching() {
            const aiBox = document.getElementById('ai-response-box');
            if (!currentSelectedDate || !scrapedMeals[currentSelectedDate]) {
                showToast("현재 지정 요일 데이터 로딩 상태를 검증해 주세요.");
                return;
            }

            const meal = scrapedMeals[currentSelectedDate];
            aiBox.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 space-y-3">
                    <div class="loader"></div>
                    <p class="text-[10px] text-indigo-300 animate-pulse font-bold">성일고 맞춤 급식단 영양소 데이터 마이크로 프로세싱 중...</p>
                </div>
            `;

            const systemPrompt = `You are a high school nutrition mentor chatbot. Analyze the following Korean high school lunch menu in terms of brain stamina, study focus, and recovery. Then suggest a matching dinner combination to complete a healthy day. Answer in concise, structured Korean using only lists, spans and strong bolding. No Markdown block syntax. Max 160 words.`;

            const userQuery = `성일고 오늘 급식입니다:
            - 날짜: ${currentSelectedDate}
            - 메뉴: ${meal.rawMenu}
            - 칼로리: ${meal.calories} kcal
            - 영양배합: 탄수화물 ${meal.nutrition.carbo}g, 단백질 ${meal.nutrition.protein}g, 지방 ${meal.nutrition.fat}g
            
            학생들의 공부 집중력을 높이기 위한 실시간 분석 및 이에 맞는 영리한 저녁 밥상 꿀조합을 알려주세요.`;

            const resultText = await callGeminiWithRetry(userQuery, systemPrompt);
            if (resultText) {
                aiBox.innerHTML = `
                    <div class="space-y-3 text-indigo-100 text-[11px] leading-relaxed animate-fade-in">
                        ${resultText}
                    </div>
                `;
            } else {
                aiBox.innerHTML = `
                    <p class="text-center py-10 text-rose-300">네트워크 연결 장애로 AI 실시간 진단 결과를 받아보지 못했습니다. 잠시 후 재시도 바랍니다.</p>
                `;
            }
        }

        async function callGeminiWithRetry(query, systemInstruction, retries = 5, delay = 1000) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: query }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] }
            };

            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return data.candidates?.[0]?.content?.parts?.[0]?.text;
                    }
                } catch (error) {
                    // Retry
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
            return null;
        }
    </script>
</body>
</html>

```
