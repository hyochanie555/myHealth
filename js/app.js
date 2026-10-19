// === 나의 헬스플랜 Application Logic ===

// Web Audio API를 활용한 효과음 재생기 (사운드 파일 없이 브라우저 자체 음원 합성)
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
      // 띵-동 2화음
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
      // 삐-삐-삐 3회 알림음
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
  currentTab: "upper", // 기본값
  todayDateStr: "",
  todayDayNumber: 0,
  todayDayKorean: "",
  
  // 오늘 날짜 기준 완료 목록 캐시 (key: myhealth_done_YYYY-MM-DD)
  completedExerciseIds: new Set(),
  
  // 과거 일지 목록 (key: myhealth_logs)
  workoutLogs: [],

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

// 유틸리티
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  initDateAndDefaults();
  loadStoredData();
  bindEvents();
  renderApp();
});

function initDateAndDefaults() {
  const now = new Date();
  AppState.todayDateStr = getTodayString();
  AppState.todayDayNumber = now.getDay();
  AppState.todayDayKorean = KOREAN_DAYS[AppState.todayDayNumber];

  // 오늘 요일에 맞는 기본 루틴 설정
  AppState.currentTab = getRoutineKeyForDay(AppState.todayDayNumber);

  // 헤더 날짜 배너 업데이트
  const todayBadge = document.getElementById("todayBadge");
  const todayDateStr = document.getElementById("todayDateStr");
  const todayRoutineName = document.getElementById("todayRoutineName");

  if (todayBadge) todayBadge.textContent = `${AppState.todayDayKorean}요일`;
  if (todayDateStr) {
    const formattedDate = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
    todayDateStr.textContent = formattedDate;
  }
  if (todayRoutineName) {
    const recRoutine = WEEKLY_ROUTINES[AppState.currentTab];
    todayRoutineName.textContent = `오늘 추천: ${recRoutine ? recRoutine.title : '운동하기'}`;
  }
}

// LocalStorage 데이터 로드
function loadStoredData() {
  // 오늘 완료한 운동 로드
  const storedDone = localStorage.getItem(`myhealth_done_${AppState.todayDateStr}`);
  if (storedDone) {
    try {
      const arr = JSON.parse(storedDone);
      AppState.completedExerciseIds = new Set(arr);
    } catch (e) {
      AppState.completedExerciseIds = new Set();
    }
  } else {
    AppState.completedExerciseIds = new Set();
  }

  // 운동 일지 로드
  const storedLogs = localStorage.getItem("myhealth_logs");
  if (storedLogs) {
    try {
      AppState.workoutLogs = JSON.parse(storedLogs);
    } catch (e) {
      AppState.workoutLogs = [];
    }
  } else {
    AppState.workoutLogs = [];
  }
}

function saveCompletedExercises() {
  const arr = Array.from(AppState.completedExerciseIds);
  localStorage.setItem(`myhealth_done_${AppState.todayDateStr}`, JSON.stringify(arr));
}

function saveWorkoutLogs() {
  localStorage.setItem("myhealth_logs", JSON.stringify(AppState.workoutLogs));
}

// 이벤트 바인딩
function bindEvents() {
  // 1. 네비게이션 탭 클릭
  document.querySelectorAll(".nav-tab").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      const targetTab = tabBtn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });

  // 2. 상단 퀵 휴식 타이머 버튼
  const btnQuickRest = document.getElementById("btnQuickRest");
  if (btnQuickRest) {
    btnQuickRest.addEventListener("click", () => {
      startRestTimer(60);
    });
  }

  // 3. 플로팅 타이머 컨트롤
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
    btnTimerStop.addEventListener("click", () => {
      stopRestTimer();
    });
  }

  // 4. 오늘 운동 다시하기(리셋)
  const btnResetToday = document.getElementById("btnResetToday");
  if (btnResetToday) {
    btnResetToday.addEventListener("click", () => {
      const curRoutine = WEEKLY_ROUTINES[AppState.currentTab];
      if (!curRoutine) return;
      if (confirm(`'${curRoutine.title}'의 오늘 완료 표시를 모두 초기화하시겠습니까?`)) {
        curRoutine.exercises.forEach(ex => {
          AppState.completedExerciseIds.delete(ex.id);
        });
        saveCompletedExercises();
        renderRoutineView();
      }
    });
  }

  // 5. 완료한 운동 접기/펼치기 토글
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

  // 6. 모달 닫기
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

  // 7. 유산소 50분 타이머 컨트롤
  const btnStartCardio = document.getElementById("btnStartCardio");
  const btnPauseCardio = document.getElementById("btnPauseCardio");
  const btnResetCardio = document.getElementById("btnResetCardio");
  if (btnStartCardio) btnStartCardio.addEventListener("click", startCardioTimer);
  if (btnPauseCardio) btnPauseCardio.addEventListener("click", pauseCardioTimer);
  if (btnResetCardio) btnResetCardio.addEventListener("click", resetCardioTimer);

  // 8. 운동 일지 저장
  const btnSaveTodayLog = document.getElementById("btnSaveTodayLog");
  if (btnSaveTodayLog) {
    btnSaveTodayLog.addEventListener("click", saveTodayWorkoutNote);
  }

  const btnSaveHistoryFromDone = document.getElementById("btnSaveHistoryFromDone");
  if (btnSaveHistoryFromDone) {
    btnSaveHistoryFromDone.addEventListener("click", () => {
      switchTab("history");
    });
  }

  // 9. 데이터 백업 & 복원
  const btnExportData = document.getElementById("btnExportData");
  if (btnExportData) btnExportData.addEventListener("click", exportDataAsJson);

  const importFileInput = document.getElementById("importFileInput");
  if (importFileInput) {
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importDataFromJson(file);
    });
  }

  // 10. 머신 도감 검색 & 필터
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

// 탭 전환 함수
function switchTab(tabKey) {
  AppState.currentTab = tabKey;

  // 탭 버튼 active 클래스 갱신
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-tab") === tabKey);
  });

  // 뷰 섹션 표시/숨김
  const routineView = document.getElementById("routineView");
  const historyView = document.getElementById("historyView");
  const libraryView = document.getElementById("libraryView");

  if (tabKey === "history") {
    routineView.classList.remove("active");
    libraryView.classList.remove("active");
    historyView.classList.add("active");
    renderHistoryView();
  } else if (tabKey === "library") {
    routineView.classList.remove("active");
    historyView.classList.remove("active");
    libraryView.classList.add("active");
    renderLibraryView();
  } else {
    // upper, lower, cardio, recovery (루틴 뷰)
    historyView.classList.remove("active");
    libraryView.classList.remove("active");
    routineView.classList.add("active");
    renderRoutineView();
  }
}

function renderApp() {
  switchTab(AppState.currentTab);
}

// === 1. 루틴 화면 렌더링 ===
function renderRoutineView() {
  const routine = WEEKLY_ROUTINES[AppState.currentTab];
  if (!routine) return;

  // 헤더 카드 업데이트
  const currentRoutineTitle = document.getElementById("currentRoutineTitle");
  const currentRoutineSubtitle = document.getElementById("currentRoutineSubtitle");
  const currentRoutineTime = document.getElementById("currentRoutineTime");
  const cardioTimerBox = document.getElementById("cardioTimerBox");

  if (currentRoutineTitle) currentRoutineTitle.textContent = routine.title;
  if (currentRoutineSubtitle) currentRoutineSubtitle.textContent = routine.subtitle;
  if (currentRoutineTime) currentRoutineTime.textContent = routine.estimatedTime;

  // 유산소 전용 타이머 박스 노출 여부
  if (cardioTimerBox) {
    cardioTimerBox.classList.toggle("hidden", AppState.currentTab !== "cardio");
  }

  // 운동 목록 분류 (남은 운동 vs 완료한 운동)
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

  // 진행도 업데이트
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

  // 모든 운동 완료 축하 배너
  const allDoneCelebration = document.getElementById("allDoneCelebration");
  if (allDoneCelebration) {
    allDoneCelebration.classList.toggle("hidden", !(totalCount > 0 && activeExercises.length === 0));
  }

  // 남은 운동 카드 렌더링
  const activeListEl = document.getElementById("activeExercisesList");
  if (activeListEl) {
    activeListEl.innerHTML = "";
    activeExercises.forEach(ex => {
      const cardEl = createExerciseCardElement(ex, false);
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
function createExerciseCardElement(ex, isCompleted) {
  const machine = ex.machineId ? MACHINES_DATA.find(m => m.id === ex.machineId) : findMachineByName(ex.name);
  const card = document.createElement("div");
  card.className = "exercise-card";
  card.id = `card_${ex.id}`;

  const imgUrl = machine ? machine.image : "https://placehold.co/400x300/172033/ffffff?text=운동+가이드";
  const catLabel = machine ? machine.categoryLabel : "기본";

  card.innerHTML = `
    <div class="card-top">
      <div class="card-thumb-wrap" title="사진을 누르면 상세 사용법이 열립니다">
        <img src="${imgUrl}" alt="${ex.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1e293b/38bdf8?text=${encodeURIComponent(ex.name)}';">
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
      ${machine ? `<button class="btn-card-action btn-guide" data-action="guide">📖 사용법</button>` : ''}
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
      openSimpleModal(ex);
    }
  };

  if (thumbWrap) thumbWrap.addEventListener("click", openGuide);
  if (titleEl) titleEl.addEventListener("click", openGuide);
  if (btnGuide) btnGuide.addEventListener("click", openGuide);

  if (btnRest) {
    btnRest.addEventListener("click", () => {
      startRestTimer(ex.restSec);
    });
  }

  // 오늘 완료 버튼 (클릭 시 카드가 샤라락 사라짐!)
  if (btnComplete) {
    btnComplete.addEventListener("click", () => {
      dismissCardAndComplete(card, ex);
    });
  }

  return card;
}

// 카드 사라짐(Dismiss) 애니메이션 처리 후 상태 갱신
function dismissCardAndComplete(cardEl, ex) {
  // 1. 소리 재생
  SoundEffects.playComplete();

  // 2. 부드럽게 축소 및 페이드아웃 클래스 부여
  cardEl.classList.add("dismissing");

  // 3. 상태 추가 및 저장
  AppState.completedExerciseIds.add(ex.id);
  saveCompletedExercises();

  // 4. 애니메이션이 끝난 후 DOM 리렌더링
  setTimeout(() => {
    renderRoutineView();
  }, 320);
}

// 완료된 운동 목록 행 생성 (되돌리기 가능)
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

// === 2. 모달 팝업 로직 ===
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

function openSimpleModal(ex) {
  const modal = document.getElementById("machineDetailModal");
  if (!modal) return;

  document.getElementById("modalMachineImage").src = "https://placehold.co/600x400/1e293b/ffffff?text=운동+가이드";
  document.getElementById("modalBrandBadge").textContent = "FREE WEIGHT / GENERAL";
  document.getElementById("modalCategoryBadge").textContent = "운동 팁";
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

// === 3. 휴식 타이머 로직 ===
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
      // 스마트폰 진동 지원
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

// === 4. 유산소 50분 전용 타이머 ===
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

// === 5. 운동 일지 & 히스토리 뷰 ===
function renderHistoryView() {
  // 통계 계산
  const totalDays = AppState.workoutLogs.length;
  const currentYearMonth = getTodayString().slice(0, 7); // YYYY-MM
  const thisMonthDays = AppState.workoutLogs.filter(l => l.date && l.date.startsWith(currentYearMonth)).length;

  document.getElementById("totalWorkoutDays").textContent = totalDays;
  document.getElementById("thisMonthWorkoutDays").textContent = thisMonthDays;
  document.getElementById("recentStreak").textContent = totalDays > 0 ? "🔥 ON" : "0";

  // 일지 목록 렌더링
  const listEl = document.getElementById("historyLogsList");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (AppState.workoutLogs.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding:30px 10px; color:var(--text-dim);">아직 저장된 운동 일지가 없습니다.<br/>오늘 완료 후 첫 일지를 남겨보세요!</div>`;
    return;
  }

  // 최신순 정렬
  const sorted = [...AppState.workoutLogs].reverse();
  sorted.forEach((log, index) => {
    const card = document.createElement("div");
    card.className = "log-card";
    card.innerHTML = `
      <div class="log-card-header">
        <span class="log-date">${log.date} (${log.dayKorean || ''})</span>
        <span class="log-routine-badge">${log.routineTitle || '운동'}</span>
      </div>
      <div class="log-note">${log.note ? escapeHtml(log.note) : '운동을 성실히 완료했습니다.'}</div>
      <div class="log-exercises-summary">
        완료 운동: ${log.completedItems ? log.completedItems.join(", ") : '세부 기록 없음'}
      </div>
    `;
    listEl.appendChild(card);
  });
}

function saveTodayWorkoutNote() {
  const noteInput = document.getElementById("todayWorkoutNote");
  const note = noteInput ? noteInput.value.trim() : "";

  const curRoutine = WEEKLY_ROUTINES[AppState.currentTab] || { title: "자율 운동" };
  const completedList = [];

  if (curRoutine.exercises) {
    curRoutine.exercises.forEach(ex => {
      if (AppState.completedExerciseIds.has(ex.id)) {
        completedList.push(ex.name);
      }
    });
  }

  // 기존 오늘 기록이 있으면 업데이트, 없으면 추가
  const todayStr = AppState.todayDateStr;
  const existingIdx = AppState.workoutLogs.findIndex(l => l.date === todayStr);

  const newLog = {
    date: todayStr,
    dayKorean: AppState.todayDayKorean,
    routineTitle: curRoutine.title,
    note: note,
    completedItems: completedList,
    timestamp: Date.now()
  };

  if (existingIdx >= 0) {
    AppState.workoutLogs[existingIdx] = newLog;
  } else {
    AppState.workoutLogs.push(newLog);
  }

  saveWorkoutLogs();
  alert("오늘의 운동 일지가 저장되었습니다! 💾");
  if (noteInput) noteInput.value = "";
  renderHistoryView();
}

function exportDataAsJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    logs: AppState.workoutLogs,
    currentDayDone: Array.from(AppState.completedExerciseIds)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myHealth_backup_${AppState.todayDateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDataFromJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.logs)) {
        AppState.workoutLogs = data.logs;
        saveWorkoutLogs();
        alert("성공적으로 운동 기록을 복원했습니다!");
        renderHistoryView();
      } else {
        alert("올바르지 않은 백업 파일 형식입니다.");
      }
    } catch (err) {
      alert("파일을 읽는 도중 오류가 발생했습니다.");
    }
  };
  reader.readAsText(file);
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
        <img src="${m.image}" alt="${m.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1e293b/38bdf8?text=${encodeURIComponent(m.name)}';">
        <span class="lib-brand">${m.brand}</span>
      </div>
      <div class="lib-body">
        <h4>${m.name}</h4>
        <p>${m.target}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      openMachineModal(m);
    });
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
