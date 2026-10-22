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
  },

  // 기구별 직전 수행 세트 기록 맵 (key: exerciseName -> { sets: [...], maxWeight, totalVolume, date })
  lastExerciseLogs: {},

  // 성장 차트 표시 모드 ("max" | "vol")
  chartMode: "max"
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

  // 3. 기구별 직전 수행 세트 기록 맵 로드 (key: exerciseName -> { sets: [...], maxWeight, totalVolume, date })
  const storedLastLogs = localStorage.getItem("myhealth_last_logs");
  if (storedLastLogs) {
    try {
      AppState.lastExerciseLogs = JSON.parse(storedLastLogs);
    } catch (e) {
      AppState.lastExerciseLogs = {};
    }
  } else {
    AppState.lastExerciseLogs = {};
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

function saveLastExerciseLogs() {
  localStorage.setItem("myhealth_last_logs", JSON.stringify(AppState.lastExerciseLogs));
}

// 전체 루틴 운동 ID -> 운동 이름 매핑 생성
function getAllExercisesIdToNameMap() {
  const map = {};
  if (typeof WEEKLY_ROUTINES !== 'undefined') {
    Object.values(WEEKLY_ROUTINES).forEach(routine => {
      routine.exercises.forEach(ex => {
        map[ex.id] = ex.name;
      });
    });
  }
  return map;
}

// 오늘 수행한 운동 진행률을 달력 데이터 객체에 실시간 지능형 누적 기록
function syncTodayCalendarRecord() {
  const todayStr = AppState.todayDateStr;
  const prevRecord = AppState.calendarData[todayStr] || {};

  // 오늘 완료된 모든 운동 ID로부터 운동 이름 수집 (중복 제거)
  const idMap = getAllExercisesIdToNameMap();
  const completedNamesSet = new Set();

  AppState.completedExerciseIds.forEach(id => {
    if (idMap[id]) {
      completedNamesSet.add(idMap[id]);
    }
  });

  const completedNames = Array.from(completedNamesSet);

  if (completedNames.length > 0) {
    const analysis = typeof analyzeWorkoutParts === 'function'
      ? analyzeWorkoutParts(completedNames)
      : { mainPart: "운동", badgeText: `${completedNames.length}개 완료`, badgeClass: "badge-upper", counts: { total: completedNames.length } };

    // 당일 세트 기록 보존 및 총 볼륨 계산
    const exerciseLogs = prevRecord.exerciseLogs || {};
    let totalVolume = 0;
    completedNames.forEach(name => {
      if (exerciseLogs[name] && exerciseLogs[name].totalVolume) {
        totalVolume += exerciseLogs[name].totalVolume;
      }
    });

    AppState.calendarData[todayStr] = {
      ...prevRecord,
      date: todayStr,
      dayKey: AppState.todayDayKey,
      dayKorean: AppState.todayDayKorean,
      routineTitle: `${AppState.todayDayKorean}요일 운동 기록`,
      completedItems: completedNames,
      mainPart: analysis.mainPart,
      statusText: analysis.badgeText,
      badgeClass: analysis.badgeClass,
      doneCount: completedNames.length,
      totalCount: completedNames.length,
      counts: analysis.counts,
      exerciseLogs: exerciseLogs,
      totalVolume: totalVolume,
      updatedAt: Date.now()
    };
  } else if (!prevRecord.memo) {
    // 운동도 없고 메모도 없으면 삭제
    delete AppState.calendarData[todayStr];
  } else {
    // 메모만 남아있는 경우
    AppState.calendarData[todayStr] = {
      ...prevRecord,
      completedItems: [],
      mainPart: "없음",
      statusText: "",
      badgeClass: "none",
      doneCount: 0,
      totalCount: 0,
      exerciseLogs: {},
      totalVolume: 0
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

  // 7. 모달 닫기 및 이미지 줌
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnModalConfirm = document.getElementById("btnModalConfirm");
  const modalOverlay = document.getElementById("machineDetailModal");
  const modalMachineImage = document.getElementById("modalMachineImage");

  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnModalConfirm) btnModalConfirm.addEventListener("click", closeModal);
  if (modalMachineImage) {
    modalMachineImage.addEventListener("click", () => {
      modalMachineImage.classList.toggle("zoomed");
    });
  }
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

  // 10. 과거/원하는 날짜 운동 기록 편집 폼 토글
  const btnToggleEditWorkout = document.getElementById("btnToggleEditWorkout");
  const workoutEditorBox = document.getElementById("workoutEditorBox");
  if (btnToggleEditWorkout && workoutEditorBox) {
    btnToggleEditWorkout.addEventListener("click", () => {
      const isHidden = workoutEditorBox.classList.toggle("hidden");
      btnToggleEditWorkout.textContent = isHidden ? "✏️ 운동 기록 수정/추가" : "운동 목록 닫기 ▲";
    });
  }

  // 11. 퀵 프리셋 버튼 클릭 (+ 하체, + 상체, + 유산소, 전체 해제)
  document.querySelectorAll(".btn-preset-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      applyWorkoutPreset(preset);
    });
  });

  // 12. 선택 날짜 운동 기록 및 메모 저장
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

  // 13. 데이터 백업 & 복원
  const btnExportData = document.getElementById("btnExportData");
  if (btnExportData) btnExportData.addEventListener("click", exportDataAsJson);

  const importFileInput = document.getElementById("importFileInput");
  if (importFileInput) {
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importDataFromJson(file);
    });
  }

  // 14. 성장 그래프 기구 선택 및 모드 토글
  const chartExerciseSelect = document.getElementById("chartExerciseSelect");
  if (chartExerciseSelect) {
    chartExerciseSelect.addEventListener("change", (e) => {
      renderExerciseChart(e.target.value);
    });
  }

  const btnChartModeMax = document.getElementById("btnChartModeMax");
  const btnChartModeVol = document.getElementById("btnChartModeVol");
  if (btnChartModeMax && btnChartModeVol) {
    btnChartModeMax.addEventListener("click", () => {
      btnChartModeMax.classList.add("active");
      btnChartModeVol.classList.remove("active");
      AppState.chartMode = "max";
      if (chartExerciseSelect) renderExerciseChart(chartExerciseSelect.value);
    });
    btnChartModeVol.addEventListener("click", () => {
      btnChartModeVol.classList.add("active");
      btnChartModeMax.classList.remove("active");
      AppState.chartMode = "vol";
      if (chartExerciseSelect) renderExerciseChart(chartExerciseSelect.value);
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

// 서브 뷰 전환 ("routine" | "calendar" | "chart")
function switchView(viewName) {
  AppState.currentView = viewName;

  // 서브 네비게이션 탭 스타일
  document.querySelectorAll(".sub-nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-view") === viewName);
  });

  const routineView = document.getElementById("routineView");
  const calendarView = document.getElementById("calendarView");
  const chartView = document.getElementById("chartView");

  if (routineView) routineView.classList.remove("active");
  if (calendarView) calendarView.classList.remove("active");
  if (chartView) chartView.classList.remove("active");

  if (viewName === "calendar") {
    if (calendarView) calendarView.classList.add("active");
    renderCalendar();
    renderSelectedDateDetail();
  } else if (viewName === "chart") {
    if (chartView) chartView.classList.add("active");
    renderChartView();
  } else {
    if (routineView) routineView.classList.add("active");
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

// 전역 커스텀 인라인 드롭다운 팝오버 관리
let activeCustomDropdown = null;

function closeCustomDropdown() {
  if (activeCustomDropdown) {
    activeCustomDropdown.remove();
    activeCustomDropdown = null;
  }
}

// 화면 다른 곳을 터치하면 열려있는 커스텀 드롭다운 닫기
document.addEventListener("pointerdown", (e) => {
  if (activeCustomDropdown && !e.target.closest(".custom-dropdown-popover") && !e.target.closest(".set-picker-trigger")) {
    closeCustomDropdown();
  }
});

// 화면 스크롤 시 열려있는 팝오버 닫기
window.addEventListener("scroll", () => {
  if (activeCustomDropdown) {
    closeCustomDropdown();
  }
}, { passive: true });

// 커스텀 드롭다운 열기 (모바일 OS 피커창/완료버튼 없이 페이지 내에서 바로 선택!)
function openCustomDropdown(triggerBtn, type, currentVal, onSelect) {
  if (activeCustomDropdown && activeCustomDropdown._trigger === triggerBtn) {
    closeCustomDropdown();
    return;
  }
  closeCustomDropdown();

  const popover = document.createElement("div");
  popover.className = "custom-dropdown-popover";
  popover._trigger = triggerBtn;

  let options = [];
  if (type === "weight") {
    for (let w = 0; w <= 160; w += 5) options.push(w);
    const num = parseFloat(currentVal) || 0;
    if (num > 0 && !options.includes(num)) {
      options.push(num);
      options.sort((a, b) => a - b);
    }
  } else {
    for (let r = 1; r <= 35; r++) options.push(r);
    options.push(40, 50);
    const num = parseInt(currentVal, 10) || 10;
    if (num > 0 && !options.includes(num)) {
      options.push(num);
      options.sort((a, b) => a - b);
    }
  }

  const unitStr = (type === "weight") ? "kg" : "회";
  popover.innerHTML = options.map(val => {
    const isSel = (Number(val) === Number(currentVal));
    return `
      <div class="custom-dropdown-item ${isSel ? 'selected' : ''}" data-val="${val}">
        <span>${val} ${unitStr}</span>
        ${isSel ? '<span class="item-check">✔</span>' : ''}
      </div>
    `;
  }).join("");

  document.body.appendChild(popover);
  activeCustomDropdown = popover;

  // 트리거 버튼 위치 기준 팝오버 배치
  const rect = triggerBtn.getBoundingClientRect();
  const popoverW = 115;
  let left = rect.left + window.scrollX;
  if (left + popoverW > window.innerWidth - 8) {
    left = window.innerWidth - popoverW - 8;
  }
  let top = rect.bottom + window.scrollY + 4;
  if (rect.bottom + 230 > window.innerHeight && rect.top > 230) {
    top = rect.top + window.scrollY - 224;
  }

  popover.style.left = `${Math.max(8, left)}px`;
  popover.style.top = `${top}px`;
  popover.style.minWidth = `${Math.max(rect.width, 100)}px`;

  // 현재 선택된 값으로 스크롤 이동
  const selItem = popover.querySelector(".custom-dropdown-item.selected");
  if (selItem) {
    selItem.scrollIntoView({ block: "center", behavior: "instant" });
  }

  // 항목 터치 시 즉시 선택 & 닫기 (완료 버튼 누를 필요 없음!)
  popover.addEventListener("click", (e) => {
    const item = e.target.closest(".custom-dropdown-item");
    if (!item) return;
    const selectedVal = item.getAttribute("data-val");
    closeCustomDropdown();
    onSelect(selectedVal);
  });
}

// 세트 행 HTML 생성 헬퍼 (커스텀 인라인 드롭다운 트리거 버튼 사용)
function createSetRowHtml(setNumber, weight, reps, isBodyweight, isCompleted) {
  const compClass = isCompleted ? "completed" : "";
  const checkIcon = isCompleted ? "✔" : "";

  if (isBodyweight) {
    return `
      <div class="set-row bodyweight-row ${compClass}" data-set="${setNumber}">
        <button type="button" class="set-status-btn ${compClass}" title="세트 완료 상태 전환">
          <span class="set-status-icon">${checkIcon}</span>
          <span class="set-num-text">${setNumber}세트</span>
        </button>
        <span class="bodyweight-pill">맨몸</span>
        <div class="set-picker-wrap reps-wrap full-reps">
          <button type="button" class="set-picker-trigger reps-trigger" data-type="reps" data-val="${reps}" aria-label="${setNumber}세트 횟수">
            <span class="picker-val">${reps}</span><span class="picker-unit">회</span>
            <span class="picker-arrow">▾</span>
          </button>
        </div>
        <button type="button" class="btn-del-set" title="이 세트 삭제">✕</button>
      </div>
    `;
  } else {
    return `
      <div class="set-row ${compClass}" data-set="${setNumber}">
        <button type="button" class="set-status-btn ${compClass}" title="세트 완료 상태 전환">
          <span class="set-status-icon">${checkIcon}</span>
          <span class="set-num-text">${setNumber}세트</span>
        </button>
        <div class="set-picker-wrap weight-wrap">
          <button type="button" class="set-picker-trigger weight-trigger" data-type="weight" data-val="${weight}" aria-label="${setNumber}세트 무게">
            <span class="picker-val">${weight}</span><span class="picker-unit">kg</span>
            <span class="picker-arrow">▾</span>
          </button>
        </div>
        <span class="set-times">×</span>
        <div class="set-picker-wrap reps-wrap">
          <button type="button" class="set-picker-trigger reps-trigger" data-type="reps" data-val="${reps}" aria-label="${setNumber}세트 횟수">
            <span class="picker-val">${reps}</span><span class="picker-unit">회</span>
            <span class="picker-arrow">▾</span>
          </button>
        </div>
        <button type="button" class="btn-del-set" title="이 세트 삭제">✕</button>
      </div>
    `;
  }
}

// 자동 저장 헬퍼
function autoSaveExerciseSets(ex, rowsContainer) {
  if (!rowsContainer) return;
  const rows = rowsContainer.querySelectorAll(".set-row");
  const sets = [];
  let maxWeight = 0;
  let totalVolume = 0;

  rows.forEach((r, idx) => {
    const wBtn = r.querySelector(".weight-trigger");
    const rBtn = r.querySelector(".reps-trigger");
    const w = wBtn ? parseFloat(wBtn.getAttribute("data-val")) || 0 : 0;
    const reps = rBtn ? parseInt(rBtn.getAttribute("data-val"), 10) || 0 : 0;
    const isCompleted = r.classList.contains("completed");
    sets.push({ set: idx + 1, weight: w, reps: reps, isCompleted: isCompleted });
    if (w > maxWeight) maxWeight = w;
    totalVolume += (w * reps);
  });

  const logData = {
    date: AppState.todayDateStr,
    sets: sets,
    maxWeight: maxWeight,
    totalVolume: totalVolume,
    isBodyweight: Boolean(ex.isBodyweight)
  };

  AppState.lastExerciseLogs[ex.name] = logData;
  saveLastExerciseLogs();

  const todayStr = AppState.todayDateStr;
  const curRecord = AppState.calendarData[todayStr] || {};
  const exerciseLogs = curRecord.exerciseLogs || {};
  exerciseLogs[ex.name] = logData;
  curRecord.exerciseLogs = exerciseLogs;

  // 총 볼륨 갱신
  let dayVolume = 0;
  if (curRecord.completedItems) {
    curRecord.completedItems.forEach(name => {
      if (exerciseLogs[name] && exerciseLogs[name].totalVolume) {
        dayVolume += exerciseLogs[name].totalVolume;
      }
    });
  }
  curRecord.totalVolume = dayVolume;
  AppState.calendarData[todayStr] = curRecord;
  saveCalendarData();
}

// 개별 운동 카드 HTML 생성
function createExerciseCardElement(ex) {
  const machine = ex.machineId ? MACHINES_DATA.find(m => m.id === ex.machineId) : findMachineByName(ex.name);
  const card = document.createElement("div");
  card.className = "exercise-card";
  card.id = `card_${ex.id}`;

  // 사진 우선순위: ex.customImage > machine.image > 고품질 fallback
  const imgUrl = ex.customImage || (machine ? machine.image : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80");
  const catLabel = machine ? machine.categoryLabel : (ex.isWarmup ? "웜업" : (ex.isBodyweight ? "맨몸" : "루틴"));

  const ytQuery = ex.youtubeQuery || (machine ? machine.name + " 운동 사용법" : ex.name + " 운동");
  const ytUrl = makeYoutubeSearchUrl(ytQuery);

  const isSetTrackable = !ex.isWarmup && Boolean(ex.setsReps && ex.setsReps.includes("세트"));
  let setLoggerHtml = "";

  if (isSetTrackable) {
    const prevLog = AppState.lastExerciseLogs[ex.name];
    let initialSets = [];
    let prevHint = ex.isBodyweight ? "맨몸 운동 (횟수만 기록)" : "기본 권장 세트";

    if (prevLog && prevLog.sets && prevLog.sets.length > 0) {
      initialSets = prevLog.sets.map((s, idx) => ({
        set: idx + 1,
        weight: s.weight,
        reps: s.reps,
        isCompleted: s.isCompleted || false
      }));
      prevHint = ex.isBodyweight
        ? `직전 기록: ${initialSets.length}세트 (최고 ${Math.max(...initialSets.map(s => s.reps))}회)`
        : `직전 기록: 최고 ${prevLog.maxWeight}kg (${initialSets.length}세트)`;
    } else {
      // 권장 세트 파싱
      const matchSets = ex.setsReps.match(/(\d+)세트/);
      const setCount = matchSets ? parseInt(matchSets[1], 10) : 3;
      const matchReps = ex.setsReps.match(/(\d+)(?:~(\d+))?회/);
      const repsCount = matchReps ? parseInt(matchReps[1], 10) : (ex.isBodyweight ? 15 : 12);
      const defaultWeight = ex.isBodyweight ? 0 : 20;

      for (let i = 1; i <= setCount; i++) {
        initialSets.push({ set: i, weight: defaultWeight, reps: repsCount, isCompleted: false });
      }
      prevHint = ex.isBodyweight ? `권장: ${ex.setsReps} (맨몸)` : `권장 루틴: ${ex.setsReps}`;
    }

    const setRowsHtml = initialSets.map(s => 
      createSetRowHtml(s.set, s.weight, s.reps, ex.isBodyweight, s.isCompleted)
    ).join("");

    setLoggerHtml = `
      <div class="set-logger-wrap" id="logger_${ex.id}">
        <div class="set-logger-header">
          <span class="set-logger-title">⚡ 세트별 기록 (터치 시 즉시 선택)</span>
          <span class="prev-log-hint">${escapeHtml(prevHint)}</span>
        </div>
        <div class="set-rows-list" id="rows_${ex.id}">
          ${setRowsHtml}
        </div>
        <div class="set-logger-footer">
          <button type="button" class="btn-add-set" id="btnAddSet_${ex.id}">+ 세트 추가</button>
          <button type="button" class="btn-save-sets" id="btnSaveSets_${ex.id}">완료 &amp; 세트 저장 ✔</button>
        </div>
      </div>
    `;
  }

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
    ${setLoggerHtml}
    <div class="card-actions">
      <button class="btn-card-action btn-guide" data-action="guide">📖 설명</button>
      <a class="btn-card-action btn-youtube" href="${ytUrl}" target="_blank" rel="noopener noreferrer" title="유튜브에서 한국어 인기 영상 보기">▶ 영상</a>
      ${ex.restSec > 0 ? `<button class="btn-card-action btn-rest" data-action="rest" data-sec="${ex.restSec}">⏱️ ${ex.restSec}초</button>` : ''}
      <button class="btn-card-action btn-complete" data-action="complete">완료 ✔</button>
    </div>
  `;

  // 이벤트 연결
  const thumbWrap = card.querySelector(".card-thumb-wrap");
  const titleEl = card.querySelector(".card-title");
  const btnGuide = card.querySelector('[data-action="guide"]');
  const btnRest = card.querySelector('[data-action="rest"]');
  const btnComplete = card.querySelector('[data-action="complete"]');
  const btnSaveSets = card.querySelector(`#btnSaveSets_${ex.id}`);
  const btnAddSet = card.querySelector(`#btnAddSet_${ex.id}`);
  const rowsContainer = card.querySelector(`#rows_${ex.id}`);

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

  // 커스텀 인라인 드롭다운 및 인터랙션 핸들러
  if (rowsContainer) {
    rowsContainer.addEventListener("click", (e) => {
      // 1. 커스텀 드롭다운 트리거 버튼 클릭 (무게 / 횟수)
      const triggerBtn = e.target.closest(".set-picker-trigger");
      if (triggerBtn) {
        const type = triggerBtn.getAttribute("data-type");
        const currentVal = triggerBtn.getAttribute("data-val");
        const row = triggerBtn.closest(".set-row");

        openCustomDropdown(triggerBtn, type, currentVal, (newVal) => {
          // 버튼 UI 갱신
          triggerBtn.setAttribute("data-val", newVal);
          const valSpan = triggerBtn.querySelector(".picker-val");
          if (valSpan) valSpan.textContent = newVal;

          // 해당 세트 완료 표시
          if (row) {
            row.classList.add("completed");
            const statusBtn = row.querySelector(".set-status-btn");
            if (statusBtn) statusBtn.classList.add("completed");
            const icon = row.querySelector(".set-status-icon");
            if (icon) icon.textContent = "✔";

            // 이후 미완료 세트에 값 자동 동기화 (1세트 선택 시 2, 3세트 자동 동기화)
            const allRows = Array.from(rowsContainer.querySelectorAll(".set-row"));
            const currentIdx = allRows.indexOf(row);

            for (let i = currentIdx + 1; i < allRows.length; i++) {
              const nextRow = allRows[i];
              if (!nextRow.classList.contains("completed")) {
                if (type === "weight") {
                  const nextW = nextRow.querySelector(".weight-trigger");
                  if (nextW) {
                    nextW.setAttribute("data-val", newVal);
                    const s = nextW.querySelector(".picker-val");
                    if (s) s.textContent = newVal;
                  }
                } else if (type === "reps") {
                  const nextR = nextRow.querySelector(".reps-trigger");
                  if (nextR) {
                    nextR.setAttribute("data-val", newVal);
                    const s = nextR.querySelector(".picker-val");
                    if (s) s.textContent = newVal;
                  }
                }
              }
            }
          }

          autoSaveExerciseSets(ex, rowsContainer);
        });
        return;
      }

      // 2. 세트 상태 버튼 토글 (완료/미완료)
      const statusBtn = e.target.closest(".set-status-btn");
      if (statusBtn) {
        const row = statusBtn.closest(".set-row");
        if (row) {
          const isDone = row.classList.toggle("completed");
          statusBtn.classList.toggle("completed", isDone);
          const icon = statusBtn.querySelector(".set-status-icon");
          if (icon) icon.textContent = isDone ? "✔" : "";
          autoSaveExerciseSets(ex, rowsContainer);
        }
        return;
      }

      // 3. 세트 삭제 (✕)
      if (e.target.closest(".btn-del-set")) {
        const row = e.target.closest(".set-row");
        if (row) {
          row.remove();
          const remaining = rowsContainer.querySelectorAll(".set-row");
          if (remaining.length === 0) {
            const newRowHtml = createSetRowHtml(1, ex.isBodyweight ? 0 : 20, 10, ex.isBodyweight, false);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = newRowHtml.trim();
            rowsContainer.appendChild(tempDiv.firstChild);
          } else {
            remaining.forEach((r, idx) => {
              const numText = r.querySelector(".set-num-text");
              if (numText) numText.textContent = `${idx + 1}세트`;
              r.setAttribute("data-set", idx + 1);
            });
          }
          autoSaveExerciseSets(ex, rowsContainer);
        }
      }
    });
  }

  // + 세트 추가 버튼
  if (btnAddSet && rowsContainer) {
    btnAddSet.addEventListener("click", () => {
      const remaining = rowsContainer.querySelectorAll(".set-row");
      const nextSetNum = remaining.length + 1;
      let lastWeight = ex.isBodyweight ? 0 : 20;
      let lastReps = 10;

      if (remaining.length > 0) {
        const lastRow = remaining[remaining.length - 1];
        const wTrigger = lastRow.querySelector(".weight-trigger");
        const rTrigger = lastRow.querySelector(".reps-trigger");
        if (wTrigger) lastWeight = parseFloat(wTrigger.getAttribute("data-val")) || 20;
        if (rTrigger) lastReps = parseInt(rTrigger.getAttribute("data-val"), 10) || 10;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = createSetRowHtml(nextSetNum, lastWeight, lastReps, ex.isBodyweight, false).trim();
      rowsContainer.appendChild(tempDiv.firstChild);
      autoSaveExerciseSets(ex, rowsContainer);
    });
  }


  // 완료 및 저장
  const saveAndComplete = () => {
    if (isSetTrackable && rowsContainer) {
      // 모든 세트를 완료로 표시
      rowsContainer.querySelectorAll(".set-row").forEach(r => {
        r.classList.add("completed");
        const statusBtn = r.querySelector(".set-status-btn");
        if (statusBtn) statusBtn.classList.add("completed");
        const icon = r.querySelector(".set-status-icon");
        if (icon) icon.textContent = "✔";
      });
      autoSaveExerciseSets(ex, rowsContainer);
    }
    dismissCardAndComplete(card, ex);
  };

  if (btnSaveSets) btnSaveSets.addEventListener("click", saveAndComplete);
  if (btnComplete) btnComplete.addEventListener("click", saveAndComplete);

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

  const todayRecord = AppState.calendarData[AppState.todayDateStr] || {};
  const log = todayRecord.exerciseLogs ? todayRecord.exerciseLogs[ex.name] : null;

  let setsSummaryHtml = "";
  if (log && log.sets && log.sets.length > 0) {
    if (log.isBodyweight || ex.isBodyweight) {
      const maxReps = Math.max(...log.sets.map(s => s.reps));
      setsSummaryHtml = `<div class="completed-sets-summary">${log.sets.length}세트 완료 (최고 ${maxReps}회 | 맨몸)</div>`;
    } else {
      setsSummaryHtml = `<div class="completed-sets-summary">${log.sets.length}세트 완료 (최고 ${log.maxWeight}kg | 볼륨 ${log.totalVolume.toLocaleString()}kg)</div>`;
    }
  }

  row.innerHTML = `
    <div class="completed-item-left">
      <span class="check-icon-done">✔</span>
      <div>
        <span class="completed-item-name">${ex.order}. ${ex.name}</span>
        ${setsSummaryHtml}
      </div>
    </div>
    <button class="btn-undo-exercise" title="다시 남은 운동으로 되돌리기">되돌리기 ↩</button>
  `;

  const btnUndo = row.querySelector(".btn-undo-exercise");
  btnUndo.addEventListener("click", () => {
    AppState.completedExerciseIds.delete(ex.id);
    if (todayRecord.exerciseLogs && todayRecord.exerciseLogs[ex.name]) {
      delete todayRecord.exerciseLogs[ex.name];
    }
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

  // 이번 달 통계 계산 (01일부터 말일까지)
  let monthDoneDays = 0;
  let monthAllDoneDays = 0;
  let totalMemos = 0;

  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  Object.keys(AppState.calendarData).forEach(dateKey => {
    const rec = AppState.calendarData[dateKey];
    if (rec.memo && rec.memo.trim().length > 0) {
      totalMemos++;
    }

    if (dateKey.startsWith(prefix)) {
      if (rec.completedItems && rec.completedItems.length > 0) {
        monthDoneDays++;
        if (rec.statusText && (rec.statusText.includes("✔") || rec.completedItems.length >= 6)) {
          monthAllDoneDays++;
        }
      }
    }
  });

  const calMonthDoneDays = document.getElementById("calMonthDoneDays");
  const calMonthAllDoneDays = document.getElementById("calMonthAllDoneDays");
  const calTotalMemoCount = document.getElementById("calTotalMemoCount");

  if (calMonthDoneDays) calMonthDoneDays.textContent = `${monthDoneDays}일`;
  if (calMonthAllDoneDays) calMonthAllDoneDays.textContent = `${monthAllDoneDays}일`;
  if (calTotalMemoCount) calTotalMemoCount.textContent = `${totalMemos}개`;

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

  // 1일부터 말일까지 채우기 (모바일 핏 컴팩트 레이아웃)
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
    let volumeBadgeHtml = "";
    let memoIcon = "";

    if (record) {
      if (record.statusText) {
        const badgeClass = record.badgeClass || (record.doneCount > 0 && record.doneCount === record.totalCount ? "all-done" : "part-done");
        const shortName = record.mainPart || "운동";
        badgeHtml = `<span class="cal-mini-badge ${badgeClass}">${escapeHtml(shortName)}</span>`;
      }
      if (record.totalVolume && record.totalVolume > 0) {
        const volStr = record.totalVolume >= 1000
          ? (record.totalVolume / 1000).toFixed(1) + "t"
          : record.totalVolume.toLocaleString() + "k";
        volumeBadgeHtml = `<span class="cal-mini-vol">${volStr}</span>`;
      }
      if (record.memo && record.memo.trim().length > 0) {
        memoIcon = "📝";
      }
    }

    cell.innerHTML = `
      <div class="cal-cell-header">
        <span class="cal-day-num">${d}</span>
        <div class="cal-cell-icons">
          <span>${memoIcon}</span>
        </div>
      </div>
      <div class="cal-cell-body">
        ${badgeHtml}
        ${volumeBadgeHtml}
      </div>
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
  const panelVolumeBanner = document.getElementById("panelVolumeBanner");
  const panelVolumeValue = document.getElementById("panelVolumeValue");
  const dateMemoInput = document.getElementById("dateMemoInput");

  if (panelFullDateStr) {
    panelFullDateStr.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayOfWeek}요일)`;
  }

  const record = AppState.calendarData[targetDateStr];

  // 당일 총 운동 볼륨 배너 갱신
  if (record && record.totalVolume && record.totalVolume > 0) {
    if (panelVolumeBanner) panelVolumeBanner.classList.remove("hidden");
    if (panelVolumeValue) {
      const tonStr = (record.totalVolume / 1000).toFixed(2);
      panelVolumeValue.textContent = `${record.totalVolume.toLocaleString()} kg (${tonStr}톤)`;
    }
  } else {
    if (panelVolumeBanner) panelVolumeBanner.classList.add("hidden");
  }

  if (record && record.completedItems && record.completedItems.length > 0) {
    // 상태 뱃지
    if (panelStatusBadge) {
      panelStatusBadge.className = `status-pill ${record.badgeClass || "status-part-done"}`;
      panelStatusBadge.textContent = record.statusText || `${record.completedItems.length}개 완료`;
    }

    // 운동 상세 및 세트 목록 렌더링
    if (panelWorkoutSummary) {
      const mainPartText = record.mainPart ? `[${record.mainPart}] ` : "";
      const exerciseLogs = record.exerciseLogs || {};

      let cardsHtml = `
        <div style="font-weight:700; margin-bottom:8px; color:#fff; display:flex; align-items:center; justify-content:space-between;">
          <span>${mainPartText}총 ${record.completedItems.length}개 운동 완료</span>
        </div>
      `;

      cardsHtml += record.completedItems.map(item => {
        const log = exerciseLogs[item];
        if (log && log.sets && log.sets.length > 0) {
          const isBody = Boolean(log.isBodyweight);
          const setsList = log.sets.map(s => {
            const setVal = isBody ? `${s.reps}회` : `${s.weight}kg×${s.reps}회`;
            return `<span class="set-chip">${s.set}세트: ${setVal}</span>`;
          }).join("");
          const maxReps = Math.max(...log.sets.map(s => s.reps));
          const metricStr = isBody 
            ? `최고 ${maxReps}회 | 맨몸` 
            : `최고 ${log.maxWeight}kg | 볼륨 ${log.totalVolume.toLocaleString()}kg`;

          return `
            <div class="workout-detail-card">
              <div class="workout-detail-title-row">
                <span class="workout-detail-name">⚡ ${escapeHtml(item)}</span>
                <span class="workout-detail-metrics">${metricStr}</span>
              </div>
              <div class="workout-detail-sets-list">${setsList}</div>
            </div>
          `;
        } else {
          return `
            <div class="workout-detail-card">
              <div class="workout-detail-title-row">
                <span class="workout-detail-name">✔ ${escapeHtml(item)}</span>
              </div>
            </div>
          `;
        }
      }).join("");

      panelWorkoutSummary.innerHTML = cardsHtml;
    }

    // 메모 값 로드
    if (dateMemoInput) {
      dateMemoInput.value = record.memo || "";
    }
  } else {
    // 기록이 없거나 메모만 있는 경우
    if (panelStatusBadge) {
      panelStatusBadge.className = "status-pill status-none";
      panelStatusBadge.textContent = (record && record.memo) ? "메모만 있음" : "기록 없음";
    }
    if (panelWorkoutSummary) {
      panelWorkoutSummary.innerHTML = `<div class="empty-workout-msg">이 날짜에 기록된 운동 정보가 없습니다. (위 '✏️ 운동 기록 수정/추가'로 추가 가능)</div>`;
    }
    if (dateMemoInput) {
      dateMemoInput.value = (record && record.memo) ? record.memo : "";
    }
  }

  // 운동 편집기 체크박스 목록 갱신
  renderWorkoutEditor(targetDateStr);
}

// 과거 날짜 운동 종목 체크박스 편집기 렌더링
function renderWorkoutEditor(targetDateStr) {
  const container = document.getElementById("editableExercisesList");
  if (!container || typeof ALL_EDITABLE_EXERCISES === "undefined") return;

  const record = AppState.calendarData[targetDateStr] || {};
  const completedSet = new Set(record.completedItems || []);

  container.innerHTML = "";
  ALL_EDITABLE_EXERCISES.forEach((group, gIdx) => {
    const groupEl = document.createElement("div");
    groupEl.className = "edit-cat-group";

    const titleEl = document.createElement("div");
    titleEl.className = "edit-cat-title";
    titleEl.innerHTML = `<span>📌 ${group.category}</span>`;
    groupEl.appendChild(titleEl);

    const gridEl = document.createElement("div");
    gridEl.className = "edit-checkbox-grid";

    group.items.forEach((itemName, iIdx) => {
      const checkId = `edit_chk_${gIdx}_${iIdx}`;
      const isChecked = completedSet.has(itemName);

      const label = document.createElement("label");
      label.className = "edit-check-label";
      label.htmlFor = checkId;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = checkId;
      input.className = "workout-edit-chk";
      input.value = itemName;
      input.checked = isChecked;
      input.setAttribute("data-category", group.category);

      const span = document.createElement("span");
      span.textContent = itemName;

      label.appendChild(input);
      label.appendChild(span);
      gridEl.appendChild(label);
    });

    groupEl.appendChild(gridEl);
    container.appendChild(groupEl);
  });
}

// 퀵 프리셋 버튼 핸들러 (하체, 상체, 유산소, 전체해제)
function applyWorkoutPreset(preset) {
  const checkboxes = document.querySelectorAll(".workout-edit-chk");
  if (!checkboxes.length) return;

  if (preset === "clear") {
    checkboxes.forEach(cb => cb.checked = false);
    return;
  }

  checkboxes.forEach(cb => {
    const cat = cb.getAttribute("data-category") || "";
    if (preset === "lower" && cat.includes("하체")) {
      cb.checked = true;
    } else if (preset === "upper" && cat.includes("상체")) {
      cb.checked = true;
    } else if (preset === "cardio" && cat.includes("유산소")) {
      cb.checked = true;
    }
  });
}

// 선택된 날짜에 운동 목록 & 메모 통합 저장
function saveDateMemo() {
  const targetDateStr = AppState.calSelectedDate || AppState.todayDateStr;
  const memoInput = document.getElementById("dateMemoInput");
  const memoText = memoInput ? memoInput.value.trim() : "";

  // 현재 체크된 모든 운동 수집
  const checkedBoxes = document.querySelectorAll(".workout-edit-chk:checked");
  const selectedItems = Array.from(checkedBoxes).map(cb => cb.value);

  const prevRecord = AppState.calendarData[targetDateStr] || {};

  if (selectedItems.length > 0) {
    const analysis = typeof analyzeWorkoutParts === "function"
      ? analyzeWorkoutParts(selectedItems)
      : { mainPart: "운동", badgeText: `${selectedItems.length}개 완료`, badgeClass: "badge-upper", counts: { total: selectedItems.length } };

    // 세트 기록 보존 및 볼륨 계산
    const exerciseLogs = prevRecord.exerciseLogs || {};
    let totalVolume = 0;
    selectedItems.forEach(name => {
      if (exerciseLogs[name] && exerciseLogs[name].totalVolume) {
        totalVolume += exerciseLogs[name].totalVolume;
      }
    });

    AppState.calendarData[targetDateStr] = {
      ...prevRecord,
      date: targetDateStr,
      completedItems: selectedItems,
      mainPart: analysis.mainPart,
      statusText: analysis.badgeText,
      badgeClass: analysis.badgeClass,
      doneCount: selectedItems.length,
      totalCount: selectedItems.length,
      counts: analysis.counts,
      exerciseLogs: exerciseLogs,
      totalVolume: totalVolume,
      memo: memoText,
      updatedAt: Date.now()
    };

    // 만약 저장 대상이 '오늘'인 경우, 루틴 뷰의 완료 상태와도 상호 동기화!
    if (targetDateStr === AppState.todayDateStr) {
      const selectedSet = new Set(selectedItems);
      AppState.completedExerciseIds.clear();

      Object.values(WEEKLY_ROUTINES).forEach(routine => {
        routine.exercises.forEach(ex => {
          if (selectedSet.has(ex.name)) {
            AppState.completedExerciseIds.add(ex.id);
          }
        });
      });

      localStorage.setItem(`myhealth_done_${AppState.todayDateStr}`, JSON.stringify(Array.from(AppState.completedExerciseIds)));
      renderRoutineView();
    }
  } else if (memoText) {
    // 운동은 없지만 메모만 있는 경우
    AppState.calendarData[targetDateStr] = {
      ...prevRecord,
      date: targetDateStr,
      completedItems: [],
      mainPart: "없음",
      statusText: "",
      badgeClass: "none",
      doneCount: 0,
      totalCount: 0,
      memo: memoText,
      updatedAt: Date.now()
    };

    if (targetDateStr === AppState.todayDateStr) {
      AppState.completedExerciseIds.clear();
      localStorage.removeItem(`myhealth_done_${AppState.todayDateStr}`);
      renderRoutineView();
    }
  } else {
    // 운동도 없고 메모도 없으면 삭제
    delete AppState.calendarData[targetDateStr];
    if (targetDateStr === AppState.todayDateStr) {
      AppState.completedExerciseIds.clear();
      localStorage.removeItem(`myhealth_done_${AppState.todayDateStr}`);
      renderRoutineView();
    }
  }

  saveCalendarData();
  SoundEffects.playComplete();
  alert(`[${targetDateStr}] 운동 기록과 메모가 안전하게 저장되었습니다! 💾`);

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

  const ytBtn = document.getElementById("modalYoutubeLink");
  if (ytBtn) {
    const ytQuery = machine.name + " 운동 사용법 자세";
    ytBtn.href = makeYoutubeSearchUrl(ytQuery);
  }

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

  const ytBtn = document.getElementById("modalYoutubeLink");
  if (ytBtn) {
    const ytQuery = ex.youtubeQuery || (ex.name + " 운동 자세");
    ytBtn.href = makeYoutubeSearchUrl(ytQuery);
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("machineDetailModal");
  if (modal) modal.classList.add("hidden");
  const modalImg = document.getElementById("modalMachineImage");
  if (modalImg) modalImg.classList.remove("zoomed");
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


// === 6. 기구별 최고 무게 & 성장 그래프 뷰 (Chart View) ===
function renderChartView() {
  const selectEl = document.getElementById("chartExerciseSelect");
  if (!selectEl) return;

  // 셀렉트 박스 옵션이 비어있는 경우 채우기
  if (selectEl.options.length === 0) {
    const exerciseCategories = [
      {
        category: "하체 & 힙",
        items: [
          "뉴텍 레그 프레스 (or 시티드 레그 프레스)",
          "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
          "뉴텍 레그 익스텐션",
          "뉴텍 라잉 레그 컬",
          "뉴텍 힙 어덕션 (허벅지 안쪽 모으는)",
          "뉴텍 힙 어브덕션 (엉덩이 바깥쪽 벌리는)",
          "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
          "백익스텐션 (허리 기립근 & 둔근)"
        ]
      },
      {
        category: "가슴 & 삼두",
        items: [
          "뉴텍 시티드 체스트 프레스",
          "뉴텍 펙덱플라이 (핀머신)",
          "뉴텍 시티드 딥 (핀머신)"
        ]
      },
      {
        category: "등 & 이두",
        items: [
          "렉스코 랫풀다운",
          "뉴텍 시티드로우 (핀머신)",
          "뉴텍 암컬 (핀머신)"
        ]
      },
      {
        category: "어깨 & 복근/옆구리",
        items: [
          "뉴텍 숄더프레스 (핀머신)",
          "뉴텍 사이드 레터럴 레이즈 (핀머신)",
          "복근운동 - 누워서 다리들기 (레그레이즈)",
          "옆구리운동 - 바벨 옆으로 들기 (사이드 벤드)",
          "풀업 머신 행잉 니 레이즈 (딥스 팔걸이 활용)",
          "원암 덤벨 사이드 벤드 (덤벨존 활용)"
        ]
      }
    ];

    selectEl.innerHTML = "";
    exerciseCategories.forEach(grp => {
      const optGroup = document.createElement("optgroup");
      optGroup.label = grp.category;
      grp.items.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        optGroup.appendChild(opt);
      });
      selectEl.appendChild(optGroup);
    });
  }

  const selectedName = selectEl.value;
  renderExerciseChart(selectedName);
}

function renderExerciseChart(exerciseName) {
  if (!exerciseName) return;

  const mode = AppState.chartMode || "max"; // "max" (최고 무게) | "vol" (총 볼륨)

  // calendarData에서 해당 운동이 수행된 날짜별 기록 추출
  const dateKeys = Object.keys(AppState.calendarData).sort();
  const historyData = [];

  dateKeys.forEach(dKey => {
    const rec = AppState.calendarData[dKey];
    if (rec.exerciseLogs && rec.exerciseLogs[exerciseName]) {
      const log = rec.exerciseLogs[exerciseName];
      historyData.push({
        date: dKey,
        dateShort: dKey.slice(5).replace("-", "/"), // MM/DD
        maxWeight: log.maxWeight || 0,
        totalVolume: log.totalVolume || 0,
        sets: log.sets || []
      });
    }
  });

  // 통계 계산
  let allTimePr = 0;
  let latestWeight = 0;
  let cumulativeVol = 0;
  const sessionCount = historyData.length;

  if (sessionCount > 0) {
    allTimePr = Math.max(...historyData.map(h => h.maxWeight));
    latestWeight = historyData[historyData.length - 1].maxWeight;
    cumulativeVol = historyData.reduce((sum, h) => sum + h.totalVolume, 0);
  }

  // 지표 카드 업데이트
  const statPr = document.getElementById("chartStatPrWeight");
  const statLatest = document.getElementById("chartStatLatestWeight");
  const statVol = document.getElementById("chartStatTotalVolume");
  const statCount = document.getElementById("chartStatSessionCount");

  if (statPr) statPr.textContent = allTimePr > 0 ? `${allTimePr} kg` : "0 kg";
  if (statLatest) statLatest.textContent = latestWeight > 0 ? `${latestWeight} kg` : "0 kg";
  if (statVol) {
    statVol.textContent = cumulativeVol >= 1000 
      ? `${(cumulativeVol / 1000).toFixed(1)} 톤` 
      : `${cumulativeVol.toLocaleString()} kg`;
  }
  if (statCount) statCount.textContent = `${sessionCount} 회`;

  const svgBox = document.getElementById("svgChartBox");
  const historyList = document.getElementById("chartHistoryList");

  if (sessionCount === 0) {
    if (svgBox) {
      svgBox.innerHTML = `
        <div class="chart-empty-msg">
          🏋️ 아직 <strong>[${escapeHtml(exerciseName)}]</strong>의 세트 기록이 없습니다.<br>
          💪 <strong>[운동 루틴]</strong>에서 세트별 무게(kg)를 입력하고 완료하면<br>
          여기에 날짜별 최고 무게 상승 곡선과 역대 PR이 그려집니다!
        </div>
      `;
    }
    if (historyList) {
      historyList.innerHTML = `<div style="text-align:center; color:var(--text-dim); padding:16px; font-size:12px;">기록된 과거 세트 히스토리가 없습니다.</div>`;
    }
    return;
  }

  // SVG 차트 그리기
  const values = historyData.map(h => (mode === "max" ? h.maxWeight : h.totalVolume));
  const maxVal = Math.max(...values, 10) * 1.15;
  const minVal = 0;

  const svgW = 500;
  const svgH = 220;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 35;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  const coords = historyData.map((h, idx) => {
    const val = mode === "max" ? h.maxWeight : h.totalVolume;
    const x = historyData.length === 1 
      ? padLeft + plotW / 2 
      : padLeft + (idx / (historyData.length - 1)) * plotW;
    const y = padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
    return { x, y, val, date: h.date, dateShort: h.dateShort, maxWeight: h.maxWeight, totalVolume: h.totalVolume };
  });

  // 그리드 라인 (4분할)
  let gridLinesHtml = "";
  for (let i = 0; i <= 3; i++) {
    const yVal = Math.round(minVal + ((maxVal - minVal) / 3) * i);
    const lineY = padTop + plotH - (i / 3) * plotH;
    gridLinesHtml += `
      <line x1="${padLeft}" y1="${lineY}" x2="${svgW - padRight}" y2="${lineY}" stroke="#27354d" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${padLeft - 6}" y="${lineY + 4}" fill="#64748b" font-size="10" text-anchor="end" font-weight="600">${yVal}</text>
    `;
  }

  // 선 & 면적 패스
  let linePathD = "";
  let areaPathD = "";

  if (coords.length === 1) {
    linePathD = `M ${coords[0].x - 30} ${coords[0].y} L ${coords[0].x + 30} ${coords[0].y}`;
    areaPathD = `M ${coords[0].x - 30} ${coords[0].y} L ${coords[0].x + 30} ${coords[0].y} L ${coords[0].x + 30} ${padTop + plotH} L ${coords[0].x - 30} ${padTop + plotH} Z`;
  } else {
    linePathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, "");
    areaPathD = `${linePathD} L ${coords[coords.length - 1].x} ${padTop + plotH} L ${coords[0].x} ${padTop + plotH} Z`;
  }

  // 포인트 마커 및 텍스트 라벨
  let pointsHtml = "";
  coords.forEach((pt, idx) => {
    const isPr = mode === "max" && pt.maxWeight === allTimePr && allTimePr > 0;
    const markerColor = isPr ? "#fbbf24" : "#10b981";
    const labelY = pt.y - 10;
    const labelText = isPr ? `👑 ${pt.val}kg` : `${pt.val}${mode === "max" ? "kg" : ""}`;

    pointsHtml += `
      <g class="chart-point-group" data-idx="${idx}">
        <circle cx="${pt.x}" cy="${pt.y}" r="${isPr ? 7 : 5}" fill="${markerColor}" stroke="#0f172a" stroke-width="2.5" />
        ${isPr ? `<circle cx="${pt.x}" cy="${pt.y}" r="11" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.6" />` : ''}
        <text x="${pt.x}" y="${labelY}" fill="${isPr ? '#fbbf24' : '#f8fafc'}" font-size="${isPr ? 12 : 10}" font-weight="800" text-anchor="middle">${labelText}</text>
        <text x="${pt.x}" y="${padTop + plotH + 18}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">${pt.dateShort}</text>
      </g>
    `;
  });

  const lineColor = mode === "max" ? "#10b981" : "#38bdf8";
  const gradColor = mode === "max" ? "#10b981" : "#38bdf8";

  if (svgBox) {
    svgBox.innerHTML = `
      <svg viewBox="0 0 ${svgW} ${svgH}">
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${gradColor}" stop-opacity="0.35" />
            <stop offset="100%" stop-color="${gradColor}" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${areaPathD}" fill="url(#chartAreaGrad)" />
        <path d="${linePathD}" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        ${pointsHtml}
      </svg>
    `;
  }

  // 히스토리 리스트 렌더링 (최신 날짜부터 역순)
  if (historyList) {
    const reversedHistory = [...historyData].reverse();
    historyList.innerHTML = reversedHistory.map(h => {
      const isPr = h.maxWeight === allTimePr && allTimePr > 0;
      const setsStr = h.sets && h.sets.length > 0 
        ? h.sets.map(s => `${s.weight}k×${s.reps}`).join(", ") 
        : "기록 없음";
      const prBadge = isPr ? `<span style="color:#fbbf24; font-weight:800; font-size:10px; margin-left:4px;">👑 PR</span>` : "";

      return `
        <div class="history-item-row">
          <div>
            <div class="history-date">📅 ${h.date} ${prBadge}</div>
            <div class="history-sets-text">${escapeHtml(setsStr)}</div>
          </div>
          <div class="history-metrics">
            <div class="history-max-weight">${h.maxWeight} kg</div>
            <div class="history-vol">볼륨 ${h.totalVolume.toLocaleString()}kg</div>
          </div>
        </div>
      `;
    }).join("");
  }
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
