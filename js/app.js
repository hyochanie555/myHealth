// === 나의 헬스플랜 Application Logic ===
// 월.화.수.목.금.토.일 개별 요일 선택 지원
// 달력(Calendar) 형태의 일지, 완료 뱃지(모두 완료, N/M 완료) 및 별도 메모 기능 탑재

// Web Audio API를 활용한 효과음 합성기
const SoundEffects = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  },
  playComplete() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },
  playTimerDone() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (i * 0.15);
        osc.type = 'square';
        osc.frequency.setValueAtTime(784, start); // G5
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.12);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
};

// 앱 상태 관리
const AppState = {
  // 현재 뷰 ("routine" | "calendar" | "library")
  currentView: "routine",

  // 현재 선택된 요일 키 ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")
  selectedDay: "mon",

  // 실제 오늘 날짜 정보
  todayDateStr: "", // "YYYY-MM-DD"
  todayDayNumber: 0, // 0~6
  todayDayKey: "mon",
  todayDayKorean: "월",

  // 달력 탐색 연/월
  calYear: 2026,
  calMonth: 9, // 0~11 (9: 10월)
  calSelectedDate: "", // "YYYY-MM-DD"

  // 오늘 날짜 기준 완료 목록 캐시 (key: myhealth_done_YYYY-MM-DD)
  completedExerciseIds: new Set(),

  // 달력 통합 데이터 맵 (key: "YYYY-MM-DD" -> { doneCount, totalCount, statusText, routineTitle, memo, items: [] })
  calendarData: {},

  // 휴식 타이머
  restTimer: {
    intervalId: null,
    remainingSeconds: 0,
    totalSeconds: 0
  },

  // 유산소 타이머 (50분)
  cardioTimer: {
    intervalId: null,
    remainingSeconds: 50 * 60,
    isRunning: false
  }
};

const KOREAN_DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 앱 시작
document.addEventListener("DOMContentLoaded", () => {
  initDateAndDefaults();
  loadAllStoredData();
  bindEvents();
  renderApp();
});

function initDateAndDefaults() {
  const now = new Date();
  AppState.todayDateStr = getTodayString();
  AppState.todayDayNumber = now.getDay();
  AppState.todayDayKorean = KOREAN_DAY_NAMES[AppState.todayDayNumber];
  AppState.todayDayKey = getRoutineKeyForDay(AppState.todayDayNumber);
  
  // 시작 시 오늘 요일의 루틴으로 기본 설정
  AppState.selectedDay = AppState.todayDayKey;

  // 달력 연/월도 현재 날짜 기준으로 세팅
  AppState.calYear = now.getFullYear();
  AppState.calMonth = now.getMonth();
  AppState.calSelectedDate = AppState.todayDateStr;

  // 헤더 날짜 배너 업데이트
  const todayBadge = document.getElementById("todayBadge");
  const todayDateStr = document.getElementById("todayDateStr");
  const todayRoutineName = document.getElementById("todayRoutineName");

  if (todayBadge) todayBadge.textContent = `${AppState.todayDayKorean}요일`;
  if (todayDateStr) {
    todayDateStr.textContent = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
  }
  if (todayRoutineName) {
    const routine = WEEKLY_ROUTINES[AppState.todayDayKey];
    todayRoutineName.textContent = `오늘 추천: ${routine ? routine.dayName + ' ' + routine.subtitle : '운동하기'}`;
  }

  // 오늘 요일 뱃지(dot) 활성화
  const dotId = `dot_${AppState.todayDayKey}`;
  const dotEl = document.getElementById(dotId);
  if (dotEl) dotEl.classList.remove("hidden");
}

function loadAllStoredData() {
  // 1. 오늘 날짜 완료 운동 목록 로드
  const storedDone = localStorage.getItem(`myhealth_done_${AppState.todayDateStr}`);
  if (storedDone) {
    try {
      AppState.completedExerciseIds = new Set(JSON.parse(storedDone));
    } catch (e) {
      AppState.completedExerciseIds = new Set();
    }
  } else {
    AppState.completedExerciseIds = new Set();
  }

  // 2. 통합 달력 데이터 로드
  const storedCal = localStorage.getItem("myhealth_calendar_data");
  if (storedCal) {
    try {
      AppState.calendarData = JSON.parse(storedCal);
    } catch (e) {
      AppState.calendarData = {};
    }
  } else {
    AppState.calendarData = {};
  }
}

function saveCompletedExercises() {
  const arr = Array.from(AppState.completedExerciseIds);
  localStorage.setItem(`myhealth_done_${AppState.todayDateStr}`, JSON.stringify(arr));

  // 오늘 달력 데이터도 함께 자동 동기화 갱신!
  syncTodayCalendarRecord();
}

function saveCalendarData() {
  localStorage.setItem("myhealth_calendar_data", JSON.stringify(AppState.calendarData));
}

// 오늘 수행한 운동 진행률을 달력 데이터 객체에 실시간 기록
function syncTodayCalendarRecord() {
  const curRoutine = WEEKLY_ROUTINES[AppState.selectedDay];
  if (!curRoutine) return;

  const total = curRoutine.exercises.length;
  let done = 0;
  const completedNames = [];

  curRoutine.exercises.forEach(ex => {
    if (AppState.completedExerciseIds.has(ex.id)) {
      done++;
      completedNames.push(ex.name);
    }
  });

  const todayStr = AppState.todayDateStr;
  const prevRecord = AppState.calendarData[todayStr] || {};

  if (done > 0) {
    let statusText = `${done}/${total} 완료`;
    if (done === total) {
      statusText = "✔ 모두 완료";
    }

    AppState.calendarData[todayStr] = {
      ...prevRecord,
      date: todayStr,
      dayKey: AppState.selectedDay,
      dayKorean: AppState.todayDayKorean,
      routineTitle: curRoutine.title,
      doneCount: done,
      totalCount: total,
      statusText: statusText,
      completedItems: completedNames,
      updatedAt: Date.now()
    };
  } else if (!prevRecord.memo) {
    // 완료한 것도 없고 메모도 없으면 삭제
    delete AppState.calendarData[todayStr];
  } else {
    // 메모만 있는 경우
    AppState.calendarData[todayStr] = {
      ...prevRecord,
      doneCount: 0,
      totalCount: total,
      statusText: "0 완료"
    };
  }

  saveCalendarData();
}

// 이벤트 바인딩
function bindEvents() {
  // 1. 월.화.수.목.금.토.일 개별 요일 버튼 클릭
  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dayKey = btn.getAttribute("data-day");
      selectDay(dayKey);
    });
  });

  // 2. 서브 네비게이션 탭 (운동 루틴 / 달력 일지 / 머신 도감)
  document.querySelectorAll(".sub-nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const view = tab.getAttribute("data-view");
      switchView(view);
    });
  });

  // 3. 상단 퀵 휴식 타이머
  const btnQuickRest = document.getElementById("btnQuickRest");
  if (btnQuickRest) {
    btnQuickRest.addEventListener("click", () => startRestTimer(60));
  }

  // 4. 플로팅 타이머 컨트롤
  const btnTimerPlus30 = document.getElementById("btnTimerPlus30");
  if (btnTimerPlus30) {
    btnTimerPlus30.addEventListener("click", () => {
      if (AppState.restTimer.intervalId) {
        AppState.restTimer.remainingSeconds += 30;
        AppState.restTimer.totalSeconds += 30;
        updateTimerDisplay();
      }
    });
  }
  const btnTimerStop = document.getElementById("btnTimerStop");
  if (btnTimerStop) {
    btnTimerStop.addEventListener("click", stopRestTimer);
  }

  // 5. 오늘 운동 다시하기(리셋)
  const btnResetToday = document.getElementById("btnResetToday");
  if (btnResetToday) {
    btnResetToday.addEventListener("click", () => {
      const curRoutine = WEEKLY_ROUTINES[AppState.selectedDay];
      if (!curRoutine) return;
      if (confirm(`'${curRoutine.dayName} 플랜'의 완료 표시를 초기화하시겠습니까?`)) {
        curRoutine.exercises.forEach(ex => {
          AppState.completedExerciseIds.delete(ex.id);
        });
        saveCompletedExercises();
        renderRoutineView();
      }
    });
  }

  // 6. 완료한 운동 접기/펼치기 토글
  const btnToggleCompleted = document.getElementById("btnToggleCompleted");
  const completedList = document.getElementById("completedExercisesList");
  const toggleArrow = document.getElementById("completedToggleArrow");
  if (btnToggleCompleted && completedList) {
    btnToggleCompleted.addEventListener("click", () => {
      const isHidden = completedList.classList.toggle("hidden");
      if (toggleArrow) {
        toggleArrow.classList.toggle("rotated", !isHidden);
      }
    });
  }

  // 7. 모달 닫기
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnModalConfirm = document.getElementById("btnModalConfirm");
  const modalOverlay = document.getElementById("machineDetailModal");
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnModalConfirm) btnModalConfirm.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // 8. 유산소 타이머 컨트롤
  const btnStartCardio = document.getElementById("btnStartCardio");
  const btnPauseCardio = document.getElementById("btnPauseCardio");
  const btnResetCardio = document.getElementById("btnResetCardio");
  if (btnStartCardio) btnStartCardio.addEventListener("click", startCardioTimer);
  if (btnPauseCardio) btnPauseCardio.addEventListener("click", pauseCardioTimer);
  if (btnResetCardio) btnResetCardio.addEventListener("click", resetCardioTimer);

  // 9. 달력 월 이동 버튼들
  const btnPrevMonth = document.getElementById("btnPrevMonth");
  const btnNextMonth = document.getElementById("btnNextMonth");
  const btnCalGoToday = document.getElementById("btnCalGoToday");

  if (btnPrevMonth) {
    btnPrevMonth.addEventListener("click", () => {
      AppState.calMonth--;
      if (AppState.calMonth < 0) {
        AppState.calMonth = 11;
        AppState.calYear--;
      }
      renderCalendar();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener("click", () => {
      AppState.calMonth++;
      if (AppState.calMonth > 11) {
        AppState.calMonth = 0;
        AppState.calYear++;
      }
      renderCalendar();
    });
  }

  if (btnCalGoToday) {
    btnCalGoToday.addEventListener("click", () => {
      const now = new Date();
      AppState.calYear = now.getFullYear();
      AppState.calMonth = now.getMonth();
      AppState.calSelectedDate = AppState.todayDateStr;
      renderCalendar();
      renderSelectedDateDetail();
    });
  }

  // 10. 선택 날짜 별도 메모 저장
  const btnSaveDateMemo = document.getElementById("btnSaveDateMemo");
  if (btnSaveDateMemo) {
    btnSaveDateMemo.addEventListener("click", saveDateMemo);
  }

  const btnSaveHistoryFromDone = document.getElementById("btnSaveHistoryFromDone");
  if (btnSaveHistoryFromDone) {
    btnSaveHistoryFromDone.addEventListener("click", () => {
      switchView("calendar");
      AppState.calSelectedDate = AppState.todayDateStr;
      renderCalendar();
      renderSelectedDateDetail();
      const memoInput = document.getElementById("dateMemoInput");
      if (memoInput) memoInput.focus();
    });
  }

  // 11. 데이터 백업 & 복원
  const btnExportData = document.getElementById("btnExportData");
  if (btnExportData) btnExportData.addEventListener("click", exportDataAsJson);

  const importFileInput = document.getElementById("importFileInput");
  if (importFileInput) {
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importDataFromJson(file);
    });
  }

  // 12. 머신 도감 검색 & 필터
  const machineSearchInput = document.getElementById("machineSearchInput");
  if (machineSearchInput) {
    machineSearchInput.addEventListener("input", (e) => {
      filterMachinesLibrary(e.target.value.trim());
    });
  }

  const categoryFilters = document.getElementById("categoryFilters");
  if (categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {
      const pill = e.target.closest(".cat-pill");
      if (!pill) return;
      categoryFilters.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const cat = pill.getAttribute("data-cat");
      filterMachinesLibrary(machineSearchInput ? machineSearchInput.value.trim() : "", cat);
    });
  }
}

// 요일 개별 선택 함수 (월/화/수/목/금/토/일)
function selectDay(dayKey) {
  AppState.selectedDay = dayKey;

  // 요일 버튼 스타일 업데이트
  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-day") === dayKey);
  });

  // 루틴 뷰로 이동
  switchView("routine");
}

// 서브 뷰 전환 ("routine" | "calendar" | "library")
function switchView(viewName) {
  AppState.currentView = viewName;

  // 서브 네비게이션 탭 스타일
  document.querySelectorAll(".sub-nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-view") === viewName);
  });

  const routineView = document.getElementById("routineView");
  const calendarView = document.getElementById("calendarView");
  const libraryView = document.getElementById("libraryView");

  routineView.classList.remove("active");
  calendarView.classList.remove("active");
  libraryView.classList.remove("active");

  if (viewName === "calendar") {
    calendarView.classList.add("active");
    renderCalendar();
    renderSelectedDateDetail();
  } else if (viewName === "library") {
    libraryView.classList.add("active");
    renderLibraryView();
  } else {
    routineView.classList.add("active");
    renderRoutineView();
  }
}

function renderApp() {
  selectDay(AppState.selectedDay);
}

// === 1. 루틴 뷰 렌더링 ===
function renderRoutineView() {
  const routine = WEEKLY_ROUTINES[AppState.selectedDay];
  if (!routine) return;

  const currentDayTag = document.getElementById("currentDayTag");
  const currentRoutineTitle = document.getElementById("currentRoutineTitle");
  const currentRoutineSubtitle = document.getElementById("currentRoutineSubtitle");
  const currentRoutineTime = document.getElementById("currentRoutineTime");
  const cardioTimerBox = document.getElementById("cardioTimerBox");

  if (currentDayTag) currentDayTag.textContent = `${routine.dayName} 플랜`;
  if (currentRoutineTitle) currentRoutineTitle.textContent = routine.title;
  if (currentRoutineSubtitle) currentRoutineSubtitle.textContent = routine.subtitle;
  if (currentRoutineTime) currentRoutineTime.textContent = routine.estimatedTime;

  // 유산소 타이머 노출 여부 (수요일/토요일 유산소 탭)
  if (cardioTimerBox) {
    cardioTimerBox.classList.toggle("hidden", routine.type !== "cardio");
  }

  // 운동 분류 (남은 운동 vs 완료 운동)
  const allExercises = routine.exercises;
  const activeExercises = [];
  const completedExercises = [];

  allExercises.forEach(ex => {
    if (AppState.completedExerciseIds.has(ex.id)) {
      completedExercises.push(ex);
    } else {
      activeExercises.push(ex);
    }
  });

  // 진행도 갱신
  const totalCount = allExercises.length;
  const doneCount = completedExercises.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const progressNumbers = document.getElementById("progressNumbers");
  const progressBar = document.getElementById("progressBar");
  const remainingCountText = document.getElementById("remainingCountText");
  const activeCountPill = document.getElementById("activeExerciseCount");
  const completedCountNum = document.getElementById("completedCountNumber");

  if (progressNumbers) progressNumbers.textContent = `${doneCount} / ${totalCount} 완료 (${percent}%)`;
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (remainingCountText) remainingCountText.textContent = `남은 운동: ${activeExercises.length}개`;
  if (activeCountPill) activeCountPill.textContent = activeExercises.length;
  if (completedCountNum) completedCountNum.textContent = doneCount;

  // 모두 완료 축하 배너
  const allDoneCelebration = document.getElementById("allDoneCelebration");
  if (allDoneCelebration) {
    allDoneCelebration.classList.toggle("hidden", !(totalCount > 0 && activeExercises.length === 0));
  }

  // 남은 운동 카드 렌더링
  const activeListEl = document.getElementById("activeExercisesList");
  if (activeListEl) {
    activeListEl.innerHTML = "";
    activeExercises.forEach(ex => {
      const cardEl = createExerciseCardElement(ex);
      activeListEl.appendChild(cardEl);
    });
  }

  // 완료한 운동 목록 렌더링
  const completedListEl = document.getElementById("completedExercisesList");
  if (completedListEl) {
    completedListEl.innerHTML = "";
    if (completedExercises.length === 0) {
      completedListEl.innerHTML = `<div style="text-align:center; padding:12px; color:var(--text-dim); font-size:12px;">아직 완료한 운동이 없습니다.</div>`;
    } else {
      completedExercises.forEach(ex => {
        const rowEl = createCompletedRowElement(ex);
        completedListEl.appendChild(rowEl);
      });
    }
  }
}

// 개별 운동 카드 HTML 생성
function createExerciseCardElement(ex) {
  const machine = ex.machineId ? MACHINES_DATA.find(m => m.id === ex.machineId) : findMachineByName(ex.name);
  const card = document.createElement("div");
  card.className = "exercise-card";
  card.id = `card_${ex.id}`;

  // 사진 우선순위: ex.customImage > machine.image > 고품질 fallback
  const imgUrl = ex.customImage || (machine ? machine.image : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80");
  const catLabel = machine ? machine.categoryLabel : (ex.isWarmup ? "웜업" : "루틴");

  card.innerHTML = `
    <div class="card-top">
      <div class="card-thumb-wrap" title="사진을 누르면 상세 사용법이 열립니다">
        <img src="${imgUrl}" alt="${ex.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';">
        <span class="badge-order">${ex.order}</span>
      </div>
      <div class="card-info">
        <div>
          <div class="card-target-row">
            <span class="badge-cat">${catLabel}</span>
            <span class="card-target-text">${ex.target}</span>
          </div>
          <div class="card-title">${ex.name}</div>
          ${ex.alternative ? `<div class="card-alt-text">대체: ${ex.alternative}</div>` : ''}
        </div>
        <div class="card-routine-metrics">
          <span class="metric-sets">${ex.setsReps}</span>
          ${ex.restSec > 0 ? `<span class="metric-rest">⏱️ 휴식 ${ex.restSec}초</span>` : ''}
        </div>
      </div>
    </div>
    <div class="card-tip-box">
      <span class="tip-icon">💡</span>
      <span>${ex.tip}</span>
    </div>
    <div class="card-actions">
      <button class="btn-card-action btn-guide" data-action="guide">📖 사용법</button>
      ${ex.restSec > 0 ? `<button class="btn-card-action btn-rest" data-action="rest" data-sec="${ex.restSec}">⏱️ ${ex.restSec}초</button>` : ''}
      <button class="btn-card-action btn-complete" data-action="complete">오늘 완료 ✔</button>
    </div>
  `;

  // 이벤트 연결
  const thumbWrap = card.querySelector(".card-thumb-wrap");
  const titleEl = card.querySelector(".card-title");
  const btnGuide = card.querySelector('[data-action="guide"]');
  const btnRest = card.querySelector('[data-action="rest"]');
  const btnComplete = card.querySelector('[data-action="complete"]');

  const openGuide = () => {
    if (machine) {
      openMachineModal(machine);
    } else {
      openCustomExerciseModal(ex, imgUrl);
    }
  };

  if (thumbWrap) thumbWrap.addEventListener("click", openGuide);
  if (titleEl) titleEl.addEventListener("click", openGuide);
  if (btnGuide) btnGuide.addEventListener("click", openGuide);

  if (btnRest) {
    btnRest.addEventListener("click", () => startRestTimer(ex.restSec));
  }

  // 오늘 완료 버튼 클릭 시 카드가 샤라락 사라짐!
  if (btnComplete) {
    btnComplete.addEventListener("click", () => {
      dismissCardAndComplete(card, ex);
    });
  }

  return card;
}

// 카드 사라짐(Dismiss) 애니메이션 처리
function dismissCardAndComplete(cardEl, ex) {
  SoundEffects.playComplete();
  cardEl.classList.add("dismissing");

  AppState.completedExerciseIds.add(ex.id);
  saveCompletedExercises();

  setTimeout(() => {
    renderRoutineView();
  }, 320);
}

// 완료된 운동 목록 행
function createCompletedRowElement(ex) {
  const row = document.createElement("div");
  row.className = "completed-item-row";
  row.innerHTML = `
    <div class="completed-item-left">
      <span class="check-icon-done">✔</span>
      <span class="completed-item-name">${ex.order}. ${ex.name} (${ex.setsReps})</span>
    </div>
    <button class="btn-undo-exercise" title="다시 남은 운동으로 되돌리기">되돌리기 ↩</button>
  `;

  const btnUndo = row.querySelector(".btn-undo-exercise");
  btnUndo.addEventListener("click", () => {
    AppState.completedExerciseIds.delete(ex.id);
    saveCompletedExercises();
    renderRoutineView();
  });

  return row;
}

// === 2. 달력 (Calendar) 렌더링 로직 ===
function renderCalendar() {
  const year = AppState.calYear;
  const month = AppState.calMonth;

  // 헤더 타이틀 (예: 2026년 10월)
  const monthTitle = document.getElementById("calendarMonthTitle");
  if (monthTitle) {
    monthTitle.textContent = `${year}년 ${month + 1}월`;
  }

  const grid = document.getElementById("calendarDaysGrid");
  if (!grid) return;
  grid.innerHTML = "";

  // 이번 달 1일의 요일 (0: 일요일 ~ 6: 토요일)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // 이번 달의 총 일수
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 1일 이전의 빈칸들 채우기
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "cal-day-cell empty";
    grid.appendChild(emptyCell);
  }

  // 1일부터 말일까지 채우기
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cell = document.createElement("div");
    cell.className = "cal-day-cell";
    cell.setAttribute("data-date", dateStr);

    if (dateStr === AppState.todayDateStr) {
      cell.classList.add("today");
    }
    if (dateStr === AppState.calSelectedDate) {
      cell.classList.add("selected");
    }

    // 해당 날짜에 저장된 기록이 있는지 확인
    const record = AppState.calendarData[dateStr];
    let badgeHtml = "";
    let memoIcon = "";
    let memoPreview = "";

    if (record) {
      if (record.statusText) {
        const isAllDone = record.doneCount > 0 && record.doneCount === record.totalCount;
        const badgeClass = isAllDone ? "all-done" : "part-done";
        badgeHtml = `<div class="cal-status-badge ${badgeClass}">${record.statusText}</div>`;
      }
      if (record.memo && record.memo.trim().length > 0) {
        memoIcon = "📝";
        memoPreview = `<div class="cal-memo-preview">${escapeHtml(record.memo)}</div>`;
      }
    }

    cell.innerHTML = `
      <div class="cal-cell-header">
        <span class="cal-day-num">${d}</span>
        <div class="cal-cell-icons">
          <span>${memoIcon}</span>
        </div>
      </div>
      ${badgeHtml}
      ${memoPreview}
    `;

    // 셀 클릭 시 해당 날짜 선택
    cell.addEventListener("click", () => {
      document.querySelectorAll(".cal-day-cell").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
      AppState.calSelectedDate = dateStr;
      renderSelectedDateDetail();
    });

    grid.appendChild(cell);
  }
}

// 선택된 날짜 상세 패널 및 메모 입력 렌더링
function renderSelectedDateDetail() {
  const targetDateStr = AppState.calSelectedDate || AppState.todayDateStr;
  const d = new Date(targetDateStr + "T00:00:00");
  const dayOfWeek = KOREAN_DAY_NAMES[d.getDay()];

  const panelFullDateStr = document.getElementById("panelFullDateStr");
  const panelStatusBadge = document.getElementById("panelStatusBadge");
  const panelWorkoutSummary = document.getElementById("panelWorkoutSummary");
  const dateMemoInput = document.getElementById("dateMemoInput");

  if (panelFullDateStr) {
    panelFullDateStr.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayOfWeek}요일)`;
  }

  const record = AppState.calendarData[targetDateStr];

  if (record) {
    // 상태 뱃지
    if (panelStatusBadge) {
      panelStatusBadge.className = "status-pill";
      if (record.doneCount > 0 && record.doneCount === record.totalCount) {
        panelStatusBadge.classList.add("status-all-done");
        panelStatusBadge.textContent = "✔ 모두 완료";
      } else if (record.doneCount > 0) {
        panelStatusBadge.classList.add("status-part-done");
        panelStatusBadge.textContent = `${record.doneCount}/${record.totalCount} 완료`;
      } else {
        panelStatusBadge.classList.add("status-none");
        panelStatusBadge.textContent = "운동 없음";
      }
    }

    // 운동 목록 칩
    if (panelWorkoutSummary) {
      let itemsHtml = "";
      if (record.completedItems && record.completedItems.length > 0) {
        itemsHtml = `
          <div style="font-weight:700; margin-bottom:6px; color:#fff;">${record.routineTitle || '운동 루틴'}</div>
          <div>${record.completedItems.map(item => `<span class="workout-item-chip">${escapeHtml(item)}</span>`).join('')}</div>
        `;
      } else {
        itemsHtml = `<div class="empty-workout-msg">완료한 운동 목록이 없습니다.</div>`;
      }
      panelWorkoutSummary.innerHTML = itemsHtml;
    }

    // 메모 값 로드
    if (dateMemoInput) {
      dateMemoInput.value = record.memo || "";
    }
  } else {
    // 기록이 없는 날짜
    if (panelStatusBadge) {
      panelStatusBadge.className = "status-pill status-none";
      panelStatusBadge.textContent = "기록 없음";
    }
    if (panelWorkoutSummary) {
      panelWorkoutSummary.innerHTML = `<div class="empty-workout-msg">이 날짜에 기록된 운동 정보가 없습니다.</div>`;
    }
    if (dateMemoInput) {
      dateMemoInput.value = "";
    }
  }
}

// 선택된 날짜에 별도 메모 저장
function saveDateMemo() {
  const targetDateStr = AppState.calSelectedDate || AppState.todayDateStr;
  const memoInput = document.getElementById("dateMemoInput");
  const memoText = memoInput ? memoInput.value.trim() : "";

  const prevRecord = AppState.calendarData[targetDateStr] || {};
  AppState.calendarData[targetDateStr] = {
    ...prevRecord,
    date: targetDateStr,
    memo: memoText,
    updatedAt: Date.now()
  };

  saveCalendarData();
  alert(`[${targetDateStr}] 메모가 안전하게 저장되었습니다! 📝`);

  renderCalendar();
  renderSelectedDateDetail();
}

// === 3. 모달 팝업 로직 ===
function openMachineModal(machine) {
  const modal = document.getElementById("machineDetailModal");
  if (!modal) return;

  document.getElementById("modalMachineImage").src = machine.image;
  document.getElementById("modalBrandBadge").textContent = machine.brand;
  document.getElementById("modalCategoryBadge").textContent = machine.categoryLabel;
  document.getElementById("modalTargetText").textContent = machine.target;
  document.getElementById("modalMachineName").textContent = machine.name;

  document.getElementById("modalSetupTip").textContent = machine.setupTip || "체형에 맞게 좌석 및 패드 높이를 조절합니다.";
  document.getElementById("modalFormTip").textContent = machine.formTip || "반동 없이 목표 근육의 수축과 이완을 느끼며 진행하세요.";
  document.getElementById("modalCaution").textContent = machine.caution || "관절 통증이 느껴지면 즉시 중단하고 자세를 점검하세요.";

  modal.classList.remove("hidden");
}

function openCustomExerciseModal(ex, imgUrl) {
  const modal = document.getElementById("machineDetailModal");
  if (!modal) return;

  document.getElementById("modalMachineImage").src = imgUrl;
  document.getElementById("modalBrandBadge").textContent = "EXERCISE GUIDE";
  document.getElementById("modalCategoryBadge").textContent = "운동 가이드";
  document.getElementById("modalTargetText").textContent = ex.target;
  document.getElementById("modalMachineName").textContent = ex.name;

  document.getElementById("modalSetupTip").textContent = "안전한 자세와 관절 가동 범위를 먼저 점검합니다.";
  document.getElementById("modalFormTip").textContent = ex.tip;
  document.getElementById("modalCaution").textContent = "정확한 궤적으로 무리하지 않는 중량/강도로 진행하세요.";

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("machineDetailModal");
  if (modal) modal.classList.add("hidden");
}

// === 4. 휴식 타이머 로직 ===
function startRestTimer(seconds) {
  stopRestTimer();
  SoundEffects.init();

  AppState.restTimer.totalSeconds = seconds;
  AppState.restTimer.remainingSeconds = seconds;

  const bar = document.getElementById("floatingTimerBar");
  if (bar) bar.classList.remove("hidden");

  updateTimerDisplay();

  AppState.restTimer.intervalId = setInterval(() => {
    AppState.restTimer.remainingSeconds--;
    if (AppState.restTimer.remainingSeconds <= 0) {
      stopRestTimer();
      SoundEffects.playTimerDone();
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const secEl = document.getElementById("floatingTimerSeconds");
  const fillEl = document.getElementById("timerProgressFill");
  if (secEl) secEl.textContent = AppState.restTimer.remainingSeconds;

  if (fillEl && AppState.restTimer.totalSeconds > 0) {
    const pct = (AppState.restTimer.remainingSeconds / AppState.restTimer.totalSeconds) * 100;
    fillEl.style.width = `${pct}%`;
  }
}

function stopRestTimer() {
  if (AppState.restTimer.intervalId) {
    clearInterval(AppState.restTimer.intervalId);
    AppState.restTimer.intervalId = null;
  }
  const bar = document.getElementById("floatingTimerBar");
  if (bar) bar.classList.add("hidden");
}

// === 5. 유산소 50분 타이머 ===
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateCardioDisplay() {
  const display = document.getElementById("cardioTimerDisplay");
  if (display) {
    display.textContent = formatTime(AppState.cardioTimer.remainingSeconds);
  }
}

function startCardioTimer() {
  if (AppState.cardioTimer.isRunning) return;
  AppState.cardioTimer.isRunning = true;

  document.getElementById("btnStartCardio").classList.add("hidden");
  document.getElementById("btnPauseCardio").classList.remove("hidden");

  AppState.cardioTimer.intervalId = setInterval(() => {
    if (AppState.cardioTimer.remainingSeconds > 0) {
      AppState.cardioTimer.remainingSeconds--;
      updateCardioDisplay();
      if (AppState.cardioTimer.remainingSeconds === 0) {
        pauseCardioTimer();
        SoundEffects.playTimerDone();
        alert("🎉 50분 유산소 운동 완료! 지방이 완벽하게 연소되었습니다!");
      }
    }
  }, 1000);
}

function pauseCardioTimer() {
  AppState.cardioTimer.isRunning = false;
  if (AppState.cardioTimer.intervalId) {
    clearInterval(AppState.cardioTimer.intervalId);
    AppState.cardioTimer.intervalId = null;
  }
  document.getElementById("btnStartCardio").classList.remove("hidden");
  document.getElementById("btnPauseCardio").classList.add("hidden");
}

function resetCardioTimer() {
  pauseCardioTimer();
  AppState.cardioTimer.remainingSeconds = 50 * 60;
  updateCardioDisplay();
}

// === 6. 머신 도감 33종 렌더링 ===
function renderLibraryView() {
  filterMachinesLibrary("");
}

function filterMachinesLibrary(query, category = "all") {
  const grid = document.getElementById("machinesGrid");
  if (!grid) return;

  const q = query.toLowerCase();
  const filtered = MACHINES_DATA.filter(m => {
    const matchCat = category === "all" || m.category === category;
    const matchQuery = !q || m.name.toLowerCase().includes(q) || m.target.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  grid.innerHTML = "";
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-dim);">검색 결과와 일치하는 머신이 없습니다.</div>`;
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement("div");
    card.className = "lib-card";
    card.innerHTML = `
      <div class="lib-thumb">
        <img src="${m.image}" alt="${m.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';">
        <span class="lib-brand">${m.brand}</span>
      </div>
      <div class="lib-body">
        <h4>${m.name}</h4>
        <p>${m.target}</p>
      </div>
    `;
    card.addEventListener("click", () => openMachineModal(m));
    grid.appendChild(card);
  });
}

// === 7. 데이터 백업 & 복원 ===
function exportDataAsJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    calendarData: AppState.calendarData,
    currentDayDone: Array.from(AppState.completedExerciseIds)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myHealth_calendar_backup_${AppState.todayDateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDataFromJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.calendarData && typeof data.calendarData === 'object') {
        AppState.calendarData = data.calendarData;
        saveCalendarData();
        alert("달력 운동 기록과 메모를 성공적으로 복원했습니다!");
        renderCalendar();
        renderSelectedDateDetail();
      } else {
        alert("올바르지 않은 백업 파일 형식입니다.");
      }
    } catch (err) {
      alert("파일을 읽는 도중 오류가 발생했습니다.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
