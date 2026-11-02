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
  // 현재 뷰 ("routine" | "calendar" | "library" | "chart")
  currentView: "routine",

  // 현재 선택된 요일 키 ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")
  selectedDay: "mon",

  // 실제 오늘 날짜 정보
  todayDateStr: "", // "YYYY-MM-DD"
  todayDayNumber: 0, // 0~6
  todayDayKey: "mon",
  todayDayKorean: "월",

  // 사용자 체중 (kg, 기본 78kg)
  userWeight: 78,

  // 도감에서 오늘 루틴에 추가한 운동 목록
  customAddedExercises: [],

  // 운동 도감 탭 상태
  libraryFilter: "all",
  librarySearchQuery: "",

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

  // 유산소 타이머 (기본 30분)
  cardioTimer: {
    intervalId: null,
    remainingSeconds: 30 * 60,
    isRunning: false
  },

  // 기구별 직전 수행 세트 기록 맵 (key: exerciseName -> { sets: [...], maxWeight, totalVolume, date })
  lastExerciseLogs: {},

  // 기구별 사용자 개인 메모 & 세팅값 (key: exerciseName -> string)
  exerciseMemos: {},

  // 총 운동시간 측정 타이머
  workoutTimer: {
    isRunning: false,
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,
    intervalId: null
  },

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

  // 4. 사용자 체중 로드
  const storedWeight = localStorage.getItem("myhealth_user_weight");
  if (storedWeight) {
    const parsed = parseFloat(storedWeight);
    if (!isNaN(parsed) && parsed > 0) AppState.userWeight = parsed;
  }
  updateHeaderWeightDisplay();

  // 5. 오늘 루틴에 추가된 커스텀 운동 로드
  const storedCustom = localStorage.getItem(`myhealth_custom_ex_${AppState.todayDateStr}`);
  if (storedCustom) {
    try {
      AppState.customAddedExercises = JSON.parse(storedCustom);
    } catch (e) {
      AppState.customAddedExercises = [];
    }
  } else {
    AppState.customAddedExercises = [];
  }

  // 6. 구 운동명(브이스쿼트, 힙쓰러스트) 과거 기록 자동 이관
  migrateLegacyExerciseLogs();

  // 7. 총 운동시간 타이머 로드 및 복원
  initWorkoutTimer();

  // 8. 기구별 사용자 메모 로드
  const storedMemos = localStorage.getItem("myhealth_exercise_memos");
  if (storedMemos) {
    try {
      AppState.exerciseMemos = JSON.parse(storedMemos);
    } catch (e) {
      AppState.exerciseMemos = {};
    }
  } else {
    AppState.exerciseMemos = {};
  }
}

// 구 기구명(프리모션 브이스쿼트 -> 바벨스쿼트 스미스머신, 힙쓰러스트 -> 데드리프트) 과거 세트/볼륨 이관
function migrateLegacyExerciseLogs() {
  const MIGRATIONS = [
    {
      legacy: [
        "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
        "프리모션 브이스쿼트",
        "뉴텍 브이스쿼트"
      ],
      target: "바벨스쿼트 (스미스 머신)"
    },
    {
      legacy: [
        "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
        "뉴텍 힙쓰러스트",
        "부티빌더 힙쓰러스트",
        "힙 쓰러스트"
      ],
      target: "데드리프트 (힙쓰러스트)"
    }
  ];

  let changedLastLogs = false;
  let changedCalendar = false;
  let changedMemos = false;

  MIGRATIONS.forEach(({ legacy, target }) => {
    // 1. AppState.lastExerciseLogs 이관
    if (!AppState.lastExerciseLogs[target]) {
      for (const leg of legacy) {
        if (AppState.lastExerciseLogs[leg]) {
          AppState.lastExerciseLogs[target] = { ...AppState.lastExerciseLogs[leg] };
          changedLastLogs = true;
          break;
        }
      }
    }

    // 2. AppState.calendarData 이관
    Object.keys(AppState.calendarData).forEach(dateKey => {
      const rec = AppState.calendarData[dateKey];
      if (rec && rec.exerciseLogs) {
        if (!rec.exerciseLogs[target]) {
          for (const leg of legacy) {
            if (rec.exerciseLogs[leg]) {
              rec.exerciseLogs[target] = { ...rec.exerciseLogs[leg] };
              changedCalendar = true;
              break;
            }
          }
        }
        if (rec.completedItems && Array.isArray(rec.completedItems)) {
          rec.completedItems = rec.completedItems.map(item => {
            if (legacy.includes(item)) {
              changedCalendar = true;
              return target;
            }
            return item;
          });
        }
      }
    });

    // 3. 기구별 메모 이관
    if (!AppState.exerciseMemos[target]) {
      for (const leg of legacy) {
        if (AppState.exerciseMemos[leg]) {
          AppState.exerciseMemos[target] = AppState.exerciseMemos[leg];
          changedMemos = true;
          break;
        }
      }
    }
  });

  if (changedLastLogs) saveLastExerciseLogs();
  if (changedCalendar) saveCalendarData();
  if (changedMemos) saveExerciseMemos();
}

// 과거 기록 조회 시 이관 매핑 fallback 지원
function getPreviousExerciseLog(exerciseName) {
  if (!exerciseName) return null;
  if (AppState.lastExerciseLogs[exerciseName]) return AppState.lastExerciseLogs[exerciseName];

  const LEGACY_MAP = {
    "바벨스쿼트 (스미스 머신)": [
      "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
      "프리모션 브이스쿼트",
      "뉴텍 브이스쿼트"
    ],
    "데드리프트 (힙쓰러스트)": [
      "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
      "뉴텍 힙쓰러스트",
      "부티빌더 힙쓰러스트",
      "힙 쓰러스트"
    ]
  };

  if (LEGACY_MAP[exerciseName]) {
    for (const leg of LEGACY_MAP[exerciseName]) {
      if (AppState.lastExerciseLogs[leg]) {
        return AppState.lastExerciseLogs[leg];
      }
    }
  }

  return null;
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

function saveCustomAddedExercises() {
  localStorage.setItem(`myhealth_custom_ex_${AppState.todayDateStr}`, JSON.stringify(AppState.customAddedExercises));
}

function saveExerciseMemos() {
  localStorage.setItem("myhealth_exercise_memos", JSON.stringify(AppState.exerciseMemos));
}

function updateHeaderWeightDisplay() {
  const label = document.getElementById("headerWeightLabel");
  if (label) label.textContent = `${AppState.userWeight}kg`;
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

  // 3-1. 체중 설정 버튼 및 모달
  const btnUserWeight = document.getElementById("btnUserWeight");
  if (btnUserWeight) {
    btnUserWeight.addEventListener("click", openWeightModal);
  }
  const btnCloseWeightModal = document.getElementById("btnCloseWeightModal");
  if (btnCloseWeightModal) {
    btnCloseWeightModal.addEventListener("click", closeWeightModal);
  }
  const btnSaveWeight = document.getElementById("btnSaveWeight");
  if (btnSaveWeight) {
    btnSaveWeight.addEventListener("click", () => {
      const input = document.getElementById("inputUserWeight");
      if (input) saveUserWeight(input.value);
    });
  }
  document.querySelectorAll(".weight-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-weight");
      const input = document.getElementById("inputUserWeight");
      if (input) input.value = w;
      document.querySelectorAll(".weight-preset-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // 3-2. 상단 '운동 추가' 버튼 (도감 뷰로 이동)
  const btnAddFromLibraryTop = document.getElementById("btnAddFromLibraryTop");
  if (btnAddFromLibraryTop) {
    btnAddFromLibraryTop.addEventListener("click", () => {
      switchView("library");
    });
  }

  // 3-3. 총 운동시간 측정 타이머 컨트롤
  const btnStartWorkoutTimer = document.getElementById("btnStartWorkoutTimer");
  if (btnStartWorkoutTimer) {
    btnStartWorkoutTimer.addEventListener("click", () => {
      startWorkoutTimer();
    });
  }
  const btnFinishWorkoutTimer = document.getElementById("btnFinishWorkoutTimer");
  if (btnFinishWorkoutTimer) {
    btnFinishWorkoutTimer.addEventListener("click", () => {
      if (confirm("오늘의 총 운동을 완료하고 운동시간을 기록하시겠습니까?")) {
        finishWorkoutTimer();
      }
    });
  }
  const btnResetWorkoutTimer = document.getElementById("btnResetWorkoutTimer");
  if (btnResetWorkoutTimer) {
    btnResetWorkoutTimer.addEventListener("click", () => {
      resetWorkoutTimer();
    });
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
        AppState.customAddedExercises.forEach(ex => {
          AppState.completedExerciseIds.delete(ex.id);
        });
        // 오늘 날짜의 세트 완료 기록도 모두 초기화
        const todayRec = AppState.calendarData[AppState.todayDateStr];
        if (todayRec && todayRec.exerciseLogs) {
          Object.values(todayRec.exerciseLogs).forEach(log => {
            if (log.sets && Array.isArray(log.sets)) {
              log.sets.forEach(s => { s.isCompleted = false; });
            }
          });
        }
        saveCompletedExercises();
        saveCalendarData();
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

  // 6-1. 달력 수행한 운동 내역 아코디언 토글
  const btnToggleWorkoutSummary = document.getElementById("btnToggleWorkoutSummary");
  const panelWorkoutSummary = document.getElementById("panelWorkoutSummary");
  if (btnToggleWorkoutSummary && panelWorkoutSummary) {
    btnToggleWorkoutSummary.addEventListener("click", () => {
      const isHidden = panelWorkoutSummary.classList.toggle("hidden");
      btnToggleWorkoutSummary.classList.toggle("open", !isHidden);
    });
  }

  // 6-2. 도감 검색 및 필터 이벤트
  const libSearchInput = document.getElementById("libSearchInput");
  if (libSearchInput) {
    libSearchInput.addEventListener("input", (e) => {
      AppState.librarySearchQuery = e.target.value.trim();
      renderLibraryView();
    });
  }
  document.querySelectorAll(".lib-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lib-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.libraryFilter = btn.getAttribute("data-cat");
      renderLibraryView();
    });
  });

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

  // 14. 데이터 이동 & 백업 모달 바인딩
  const btnBackupModal = document.getElementById("btnBackupModal");
  const btnCalBackupLink = document.getElementById("btnCalBackupLink");
  const btnCloseBackupModal = document.getElementById("btnCloseBackupModal");
  const backupModalOverlay = document.getElementById("backupModal");

  if (btnBackupModal) btnBackupModal.addEventListener("click", openBackupModal);
  if (btnCalBackupLink) btnCalBackupLink.addEventListener("click", openBackupModal);
  if (btnCloseBackupModal) btnCloseBackupModal.addEventListener("click", closeBackupModal);
  if (backupModalOverlay) {
    backupModalOverlay.addEventListener("click", (e) => {
      if (e.target === backupModalOverlay) closeBackupModal();
    });
  }

  // 1) 클립보드 복사
  const btnCopyData = document.getElementById("btnCopyData");
  if (btnCopyData) {
    btnCopyData.addEventListener("click", async () => {
      const dataStr = exportAllHealthData();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(dataStr);
        } else {
          const ta = document.createElement("textarea");
          ta.value = dataStr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        alert("✅ 운동 데이터가 클립보드에 복사되었습니다!\n\n크롬이나 다른 기기에서 '2. 새 브라우저에서 붙여넣은 데이터 적용하기'를 실행하시면 즉시 연동됩니다.");
      } catch (err) {
        const importTa = document.getElementById("importTextarea");
        if (importTa) {
          importTa.value = dataStr;
          importTa.select();
          alert("데이터 코드가 아래 텍스트 상자에 생성되었습니다. 전체 선택 후 복사해주세요.");
        }
      }
    });
  }

  // 2) 백업 파일 다운로드
  const btnDownloadData = document.getElementById("btnDownloadData");
  if (btnDownloadData) {
    btnDownloadData.addEventListener("click", () => {
      const dataStr = exportAllHealthData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `myHealth_backup_${AppState.todayDateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // 3) 붙여넣은 텍스트 데이터 적용
  const btnApplyImport = document.getElementById("btnApplyImport");
  const importTextarea = document.getElementById("importTextarea");
  if (btnApplyImport && importTextarea) {
    btnApplyImport.addEventListener("click", () => {
      importAllHealthData(importTextarea.value);
    });
  }

  // 4) 백업 파일 직접 불러오기
  const btnTriggerFileInput = document.getElementById("btnTriggerFileInput");
  const importFileInput = document.getElementById("importFileInput");
  if (btnTriggerFileInput && importFileInput) {
    btnTriggerFileInput.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        importAllHealthData(evt.target.result);
        importFileInput.value = "";
      };
      reader.readAsText(file);
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
function getDayExercises(dayKey) {
  const routine = WEEKLY_ROUTINES[dayKey];
  if (!routine) return [];
  const base = [...routine.exercises];
  if (dayKey === AppState.todayDayKey && AppState.customAddedExercises && AppState.customAddedExercises.length > 0) {
    return [...base, ...AppState.customAddedExercises];
  }
  return base;
}

// 서브 뷰 전환 ("routine" | "calendar" | "library" | "chart")
function switchView(viewName) {
  AppState.currentView = viewName;

  // 서브 네비게이션 탭 스타일
  document.querySelectorAll(".sub-nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-view") === viewName);
  });

  const routineView = document.getElementById("routineView");
  const calendarView = document.getElementById("calendarView");
  const chartView = document.getElementById("chartView");
  const libraryView = document.getElementById("libraryView");

  if (routineView) routineView.classList.remove("active");
  if (calendarView) calendarView.classList.remove("active");
  if (chartView) chartView.classList.remove("active");
  if (libraryView) libraryView.classList.remove("active");

  if (viewName === "calendar") {
    if (calendarView) calendarView.classList.add("active");
    renderCalendar();
    renderSelectedDateDetail();
  } else if (viewName === "chart") {
    if (chartView) chartView.classList.add("active");
    renderChartView();
  } else if (viewName === "library") {
    if (libraryView) libraryView.classList.add("active");
    renderLibraryView();
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
  const allExercises = getDayExercises(AppState.selectedDay);
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

let isInteractingPopover = false;

// 화면 다른 곳을 터치하면 열려있는 커스텀 드롭다운 닫기
document.addEventListener("pointerdown", (e) => {
  if (activeCustomDropdown && !e.target.closest(".custom-dropdown-popover") && !e.target.closest(".set-picker-trigger")) {
    closeCustomDropdown();
  }
});

// 화면 스크롤 시 열려있는 팝오버 닫기 (단, 팝오버 목록 터치/스크롤 중에는 닫히지 않음)
window.addEventListener("scroll", () => {
  if (activeCustomDropdown && !isInteractingPopover) {
    closeCustomDropdown();
  }
}, { passive: true });

// 커스텀 드롭다운 열기 (화면 점프/스크롤 이동 없이 제자리에서 즉시 선택!)
function openCustomDropdown(triggerBtn, type, currentVal, onSelect) {
  if (activeCustomDropdown && activeCustomDropdown._trigger === triggerBtn) {
    closeCustomDropdown();
    return;
  }
  closeCustomDropdown();

  const popover = document.createElement("div");
  popover.className = "custom-dropdown-popover";
  popover._trigger = triggerBtn;

  popover.addEventListener("touchstart", () => { isInteractingPopover = true; }, { passive: true });
  popover.addEventListener("touchend", () => { setTimeout(() => { isInteractingPopover = false; }, 200); }, { passive: true });
  popover.addEventListener("pointerenter", () => { isInteractingPopover = true; });
  popover.addEventListener("pointerleave", () => { isInteractingPopover = false; });

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

  // 트리거 버튼 위치 기준 팝오버 배치 (화면 스크롤 없이 제자리에 배치)
  const rect = triggerBtn.getBoundingClientRect();
  const popoverW = 120;
  let left = rect.left + window.scrollX;
  if (left + popoverW > window.innerWidth - 8) {
    left = window.innerWidth - popoverW - 8;
  }

  const popoverH = 220;
  let top = rect.bottom + window.scrollY + 4;
  // 화면 하단 여백이 부족하고 상단 여백이 충분하면 버튼 위쪽으로 띄움
  if (rect.bottom + popoverH > window.innerHeight && rect.top > popoverH) {
    top = rect.top + window.scrollY - popoverH - 4;
  }

  popover.style.left = `${Math.max(8, left)}px`;
  popover.style.top = `${top}px`;
  popover.style.minWidth = `${Math.max(rect.width, 100)}px`;

  // 현재 선택된 값으로 popover '내부' 스크롤만 이동 (페이지 전체 창 스크롤 절대 방지!)
  const selItem = popover.querySelector(".custom-dropdown-item.selected");
  if (selItem) {
    const itemOffset = selItem.offsetTop;
    const itemH = selItem.offsetHeight;
    const pHeight = popover.clientHeight;
    popover.scrollTop = Math.max(0, itemOffset - (pHeight / 2) + (itemH / 2));
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
function createSetRowHtml(setNumber, weight, reps, isBodyweight, isCompleted, isAssisted = false, isDoubleSide = false) {
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
    let assistedBadge = "";
    if (isAssisted) {
      const actualW = Math.max(0, AppState.userWeight - weight);
      assistedBadge = `<span class="assisted-info-badge" title="실제 든 중량 = 체중(${AppState.userWeight}kg) - 보조핀(${weight}kg)">실${actualW}kg</span>`;
    }
    const doubleSideBadge = isDoubleSide
      ? `<span class="double-side-badge" title="양쪽 수행 (좌우 각각 수행하여 볼륨 2배 계산)">양쪽×2</span>`
      : "";

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
        ${assistedBadge}
        ${doubleSideBadge}
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
  const isAssisted = Boolean(ex.isAssistedPullup || (ex.name && ex.name.includes("풀업 어시스트")));
  const isDoubleSide = Boolean(ex.isDoubleSide || (ex.name && ex.name.includes("사이드 벤드")));

  rows.forEach((r, idx) => {
    const wBtn = r.querySelector(".weight-trigger");
    const rBtn = r.querySelector(".reps-trigger");
    const w = wBtn ? parseFloat(wBtn.getAttribute("data-val")) || 0 : 0;
    const reps = rBtn ? parseInt(rBtn.getAttribute("data-val"), 10) || 0 : 0;
    const isCompleted = r.classList.contains("completed");

    // 실제 든 중량 계산 (어시스트 머신: 체중 - 핀 보조무게)
    const actualW = isAssisted ? Math.max(0, AppState.userWeight - w) : w;
    const mult = isDoubleSide ? 2 : 1;
    const setVol = actualW * reps * mult;

    // 어시스트 뱃지 실시간 업데이트
    if (isAssisted) {
      const badge = r.querySelector(".assisted-info-badge");
      if (badge) badge.textContent = `실${actualW}kg`;
    }

    sets.push({
      set: idx + 1,
      weight: w,
      actualWeight: actualW,
      reps: reps,
      isCompleted: isCompleted
    });

    if (actualW > maxWeight) maxWeight = actualW;
    totalVolume += setVol;
  });

  const logData = {
    date: AppState.todayDateStr,
    sets: sets,
    maxWeight: maxWeight,
    totalVolume: totalVolume,
    isBodyweight: Boolean(ex.isBodyweight),
    isAssistedPullup: isAssisted,
    isDoubleSide: isDoubleSide
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

// 유산소 시간 기록 저장 헬퍼
function saveCardioExercise(ex, minutes) {
  const logData = {
    date: AppState.todayDateStr,
    isCardio: true,
    durationMinutes: minutes,
    sets: [{ set: 1, weight: 0, reps: minutes, isCompleted: true }],
    maxWeight: 0,
    totalVolume: 0
  };
  AppState.lastExerciseLogs[ex.name] = logData;
  saveLastExerciseLogs();

  const todayStr = AppState.todayDateStr;
  const curRecord = AppState.calendarData[todayStr] || {};
  const exerciseLogs = curRecord.exerciseLogs || {};
  exerciseLogs[ex.name] = logData;
  curRecord.exerciseLogs = exerciseLogs;
  AppState.calendarData[todayStr] = curRecord;
  saveCalendarData();
}

// 개별 운동 카드 HTML 생성
function createExerciseCardElement(ex) {
  const machine = ex.machineId ? MACHINES_DATA.find(m => m.id === ex.machineId) : findMachineByName(ex.name);
  const card = document.createElement("div");
  card.className = "exercise-card";
  card.id = `card_${ex.id}`;

  const isAssisted = Boolean(ex.isAssistedPullup || (ex.name && ex.name.includes("풀업 어시스트")));
  const isDoubleSide = Boolean(ex.isDoubleSide || (ex.name && ex.name.includes("사이드 벤드")));

  // 초보자를 위한 상세 가이드 팁 추출 (커스텀 팁 지원)
  const setupTip = ex.customSetupTip || ((machine && machine.setupTip)
    ? machine.setupTip
    : (ex.alternative ? `대체/머신: ${ex.alternative}` : "체형에 맞춰 손잡이와 좌석/발판 위치를 안정되게 세팅합니다."));
  const formTip = ex.customFormTip || ((machine && machine.formTip)
    ? machine.formTip
    : (ex.tip || "반동 없이 목표 근육의 수축과 이완을 느끼며 천천히 진행합니다."));
  const cautionTip = ex.customCaution || ((machine && machine.caution)
    ? machine.caution
    : "관절에 무리한 부담이 가지 않도록 복압과 기본 정렬을 유지합니다.");

  // 사진 우선순위: ex.customImage > machine.image > 고품질 fallback
  const imgUrl = ex.customImage || (machine ? machine.image : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80");
  const catLabel = machine ? machine.categoryLabel : (ex.isWarmup ? "웜업" : (ex.isCardioTime ? "유산소" : (ex.isBodyweight ? "맨몸" : "루틴")));

  const isSetTrackable = !ex.isWarmup && !ex.isCardioTime && Boolean(ex.setsReps && ex.setsReps.includes("세트"));
  let setLoggerHtml = "";

  if (ex.isCardioTime) {
    // 유산소 전용 시간(분) 입력 UI
    const defaultMins = ex.defaultMinutes || 30;
    const prevLog = getPreviousExerciseLog(ex.name);
    const initialMins = (prevLog && prevLog.durationMinutes) ? prevLog.durationMinutes : defaultMins;

    setLoggerHtml = `
      <div class="cardio-time-box" id="logger_${ex.id}">
        <div class="cardio-time-header">
          <span class="cardio-time-title">🏃‍♂️ 달리기 지속 시간 설정</span>
          <span class="cardio-current-badge"><strong id="cardioVal_${ex.id}">${initialMins}</strong>분</span>
        </div>
        <div class="cardio-time-presets" id="cardioPresets_${ex.id}">
          <button type="button" class="time-preset-pill ${initialMins === 15 ? 'active' : ''}" data-mins="15">15분</button>
          <button type="button" class="time-preset-pill ${initialMins === 20 ? 'active' : ''}" data-mins="20">20분</button>
          <button type="button" class="time-preset-pill ${initialMins === 30 ? 'active' : ''}" data-mins="30">30분</button>
          <button type="button" class="time-preset-pill ${initialMins === 40 ? 'active' : ''}" data-mins="40">40분</button>
          <button type="button" class="time-preset-pill ${initialMins === 50 ? 'active' : ''}" data-mins="50">50분</button>
          <button type="button" class="time-preset-pill ${initialMins === 60 ? 'active' : ''}" data-mins="60">60분</button>
        </div>
        <div class="cardio-custom-row">
          <span style="font-size:11px; color:var(--text-muted);">직접 입력:</span>
          <input type="number" id="cardioInput_${ex.id}" class="cardio-custom-input" min="1" max="180" value="${initialMins}" />
          <span style="font-size:12px; color:#fff;">분 달리기</span>
        </div>
      </div>
    `;
  } else if (isSetTrackable) {
    const prevLog = getPreviousExerciseLog(ex.name);
    const todayRec = AppState.calendarData[AppState.todayDateStr];
    const todayLog = (todayRec && todayRec.exerciseLogs) ? todayRec.exerciseLogs[ex.name] : null;

    let initialSets = [];
    let prevHint = ex.isBodyweight ? "맨몸 운동 (횟수만 기록)" : "기본 권장 세트";

    if (todayLog && todayLog.sets && todayLog.sets.length > 0 && todayLog.sets.some(s => s.isCompleted)) {
      // 오늘 세션을 진행하면서 실제로 완료(체크)한 세트가 있는 경우: 해당 체크 상태 유지
      // (단, 운동 카드가 아직 미완료인데 모든 세트가 완료 상태면 비정상 복제이므로 체크 해제)
      const isCardDone = AppState.completedExerciseIds.has(ex.id);
      const allDone = todayLog.sets.every(s => s.isCompleted);
      initialSets = todayLog.sets.map((s, idx) => ({
        set: idx + 1,
        weight: s.weight,
        reps: s.reps,
        isCompleted: (!isCardDone && allDone) ? false : Boolean(s.isCompleted)
      }));
      if (ex.isBodyweight) {
        prevHint = `오늘 진행: ${initialSets.length}세트 (최고 ${Math.max(...initialSets.map(s => s.reps))}회)`;
      } else if (isAssisted) {
        prevHint = `오늘 진행: 보조 ${initialSets[0]?.weight || 55}kg (실중량 ${Math.max(0, AppState.userWeight - (initialSets[0]?.weight || 55))}kg)`;
      } else if (isDoubleSide) {
        prevHint = `오늘 진행: 최고 ${Math.max(...initialSets.map(s => s.weight))}kg (양쪽×2 볼륨)`;
      } else {
        prevHint = `오늘 진행: 최고 ${Math.max(...initialSets.map(s => s.weight))}kg (${initialSets.length}세트)`;
      }
    } else if (prevLog && prevLog.sets && prevLog.sets.length > 0) {
      // 이전 날짜 기록: 중량과 횟수는 그대로 가져오되, 시작 시점에는 체크 해제(초기화) 상태!
      initialSets = prevLog.sets.map((s, idx) => ({
        set: idx + 1,
        weight: s.weight,
        reps: s.reps,
        isCompleted: false
      }));
      if (ex.isBodyweight) {
        prevHint = `직전 기록: ${initialSets.length}세트 (최고 ${Math.max(...initialSets.map(s => s.reps))}회)`;
      } else if (isAssisted) {
        prevHint = `직전: 보조 ${prevLog.sets[0]?.weight || 55}kg (실중량 ${Math.max(0, AppState.userWeight - (prevLog.sets[0]?.weight || 55))}kg)`;
      } else if (isDoubleSide) {
        prevHint = `직전 기록: 최고 ${prevLog.maxWeight}kg (${initialSets.length}세트 | 양쪽×2 볼륨)`;
      } else {
        prevHint = `직전 기록: 최고 ${prevLog.maxWeight}kg (${initialSets.length}세트)`;
      }
    } else {
      // 권장 세트 파싱
      const matchSets = ex.setsReps.match(/(\d+)세트/);
      const setCount = matchSets ? parseInt(matchSets[1], 10) : 3;
      const matchReps = ex.setsReps.match(/(\d+)(?:~(\d+))?회/);
      const repsCount = matchReps ? parseInt(matchReps[1], 10) : (ex.isBodyweight ? 15 : 12);
      const defaultWeight = ex.isBodyweight ? 0 : (isAssisted ? 55 : (isDoubleSide ? 10 : 20));

      for (let i = 1; i <= setCount; i++) {
        initialSets.push({ set: i, weight: defaultWeight, reps: repsCount, isCompleted: false });
      }
      if (isAssisted) {
        prevHint = `권장: 3세트 (보조 55kg 기준 실중량 ${Math.max(0, AppState.userWeight - 55)}kg)`;
      } else if (isDoubleSide) {
        prevHint = `권장: ${ex.setsReps} (좌우 양쪽 수행 × 2배 볼륨)`;
      } else if (ex.isBodyweight) {
        prevHint = `권장: ${ex.setsReps} (맨몸)`;
      } else {
        prevHint = `권장 루틴: ${ex.setsReps}`;
      }
    }

    const setRowsHtml = initialSets.map(s => 
      createSetRowHtml(s.set, s.weight, s.reps, ex.isBodyweight, s.isCompleted, isAssisted, isDoubleSide)
    ).join("");

    setLoggerHtml = `
      <div class="set-logger-wrap" id="logger_${ex.id}">
        <div class="set-logger-header">
          <span class="set-logger-title">⚡ 세트별 기록</span>
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
            ${ex.isMain ? `<span class="badge-main-lift">🔥 메인 다관절</span>` : (ex.categoryRole ? `<span class="badge-sub-lift">${escapeHtml(ex.categoryRole)}</span>` : '')}
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

    <!-- 나의 운동 메모 & 기구 세팅값 -->
    <div class="card-memo-section">
      <div class="card-memo-header">
        <span class="card-memo-icon">📝</span>
        <span class="card-memo-title">나의 기구 세팅 &amp; 운동 메모</span>
        <span class="card-memo-saved-hint hidden" id="memoSavedHint_${ex.id}">저장됨 ✔</span>
      </div>
      <div class="card-memo-input-wrap">
        <input type="text" class="card-memo-input" id="memoInput_${ex.id}" 
               placeholder="예: 안장 높이 4번, 손잡이 넓게 잡기, 허리 곧게 펴기" 
               value="${escapeHtml(AppState.exerciseMemos[ex.name] || '')}" />
      </div>
    </div>

    <!-- 초보자를 위한 기구 상세 가이드 & 권장 수량/횟수 가이드 -->
    <div class="card-detail-guide-box">
      <div class="guide-compact-content">
        <span class="guide-inline-badge badge-form">💡 자세</span><span class="guide-inline-text">${escapeHtml(formTip)}</span>
        <span class="guide-inline-badge badge-setup">⚙️ 세팅</span><span class="guide-inline-text">${escapeHtml(setupTip)}</span>
        <span class="guide-inline-badge badge-caution">⚠️ 주의</span><span class="guide-inline-text">${escapeHtml(cautionTip)}</span>
      </div>
      <div class="card-target-guide-bar">
        <span class="guide-target-badge">🎯 권장 가이드</span>
        <span class="guide-target-val"><strong>${escapeHtml(ex.setsReps)}</strong>${ex.restSec > 0 ? ` · 휴식 ${ex.restSec}초` : ''}${ex.targetRpe ? ` · 강도 RPE ${ex.targetRpe}` : ''}</span>
      </div>
    </div>

    ${setLoggerHtml}

    <div class="card-actions">
      <button class="btn-card-action btn-guide" data-action="guide">📖 설명</button>
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

  // 나의 운동 메모 입력 및 자동 저장 이벤트
  const memoInput = card.querySelector(`#memoInput_${ex.id}`);
  const memoSavedHint = card.querySelector(`#memoSavedHint_${ex.id}`);
  if (memoInput) {
    memoInput.addEventListener("input", (e) => {
      AppState.exerciseMemos[ex.name] = e.target.value.trim();
      saveExerciseMemos();
      if (memoSavedHint) {
        memoSavedHint.classList.remove("hidden");
        clearTimeout(memoInput._saveTimer);
        memoInput._saveTimer = setTimeout(() => {
          memoSavedHint.classList.add("hidden");
        }, 1200);
      }
    });
  }

  // 초시계 버튼 클릭 시 상단 타이머 시작 (현재 세트 번호 및 다음 운동 자동 탐색)
  if (btnRest) {
    btnRest.addEventListener("click", () => {
      let compCount = 0;
      if (rowsContainer) {
        compCount = rowsContainer.querySelectorAll(".set-row.completed").length;
      }
      startRestTimer(ex.restSec || 60, ex, compCount > 0 ? compCount : 1);
    });
  }

  // 유산소 전용 프리셋 및 인풋 이벤트
  if (ex.isCardioTime) {
    const presetsBox = card.querySelector(`#cardioPresets_${ex.id}`);
    const cardioInput = card.querySelector(`#cardioInput_${ex.id}`);
    const cardioBadgeVal = card.querySelector(`#cardioVal_${ex.id}`);

    const setCardioMinutes = (m) => {
      if (cardioInput) cardioInput.value = m;
      if (cardioBadgeVal) cardioBadgeVal.textContent = m;
      if (presetsBox) {
        presetsBox.querySelectorAll(".time-preset-pill").forEach(p => {
          p.classList.toggle("active", parseInt(p.getAttribute("data-mins"), 10) === m);
        });
      }
      // 상단 유산소 타이머 동기화
      AppState.cardioTimer.remainingSeconds = m * 60;
      updateCardioDisplay();
    };

    if (presetsBox) {
      presetsBox.addEventListener("click", (e) => {
        const pill = e.target.closest(".time-preset-pill");
        if (pill) {
          const m = parseInt(pill.getAttribute("data-mins"), 10);
          setCardioMinutes(m);
        }
      });
    }

    if (cardioInput) {
      cardioInput.addEventListener("input", (e) => {
        const m = parseInt(e.target.value, 10);
        if (!isNaN(m) && m > 0) {
          setCardioMinutes(m);
        }
      });
    }
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

          ensureWorkoutTimerStarted();
          autoSaveExerciseSets(ex, rowsContainer);
        });
        return;
      }

      // 2. 세트 상태 버튼 토글 (완료/미완료)
      const statusBtn = e.target.closest(".set-status-btn");
      if (statusBtn) {
        const row = statusBtn.closest(".set-row");
        if (row) {
          ensureWorkoutTimerStarted();
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
            const newRowHtml = createSetRowHtml(1, ex.isBodyweight ? 0 : (isAssisted ? 55 : (isDoubleSide ? 10 : 20)), 10, ex.isBodyweight, false, isAssisted, isDoubleSide);
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
      ensureWorkoutTimerStarted();
      const remaining = rowsContainer.querySelectorAll(".set-row");
      const nextSetNum = remaining.length + 1;
      let lastWeight = ex.isBodyweight ? 0 : (isAssisted ? 55 : (isDoubleSide ? 10 : 20));
      let lastReps = 10;

      if (remaining.length > 0) {
        const lastRow = remaining[remaining.length - 1];
        const wTrigger = lastRow.querySelector(".weight-trigger");
        const rTrigger = lastRow.querySelector(".reps-trigger");
        if (wTrigger) lastWeight = parseFloat(wTrigger.getAttribute("data-val")) || (isAssisted ? 55 : (isDoubleSide ? 10 : 20));
        if (rTrigger) lastReps = parseInt(rTrigger.getAttribute("data-val"), 10) || 10;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = createSetRowHtml(nextSetNum, lastWeight, lastReps, ex.isBodyweight, false, isAssisted, isDoubleSide).trim();
      rowsContainer.appendChild(tempDiv.firstChild);
      autoSaveExerciseSets(ex, rowsContainer);
    });
  }

  // 완료 및 저장
  const saveAndComplete = () => {
    ensureWorkoutTimerStarted();
    if (ex.isCardioTime) {
      const cardioInput = card.querySelector(`#cardioInput_${ex.id}`);
      const mins = cardioInput ? (parseInt(cardioInput.value, 10) || 30) : 30;
      saveCardioExercise(ex, mins);
    } else if (isSetTrackable && rowsContainer) {
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

// 카드 사라짐(Dismiss) 애니메이션 처리 후 남은 종목 최상단으로 화면 이동
function dismissCardAndComplete(cardEl, ex) {
  SoundEffects.playComplete();
  cardEl.classList.add("dismissing");

  ensureWorkoutTimerStarted();
  AppState.completedExerciseIds.add(ex.id);
  saveCompletedExercises();

  // 모든 운동 완료 시 총 운동시간 타이머 자동 완료
  const todayExercises = getDayExercises(AppState.selectedDay);
  const remainingCount = todayExercises.filter(e => !AppState.completedExerciseIds.has(e.id)).length;
  if (remainingCount === 0 && AppState.workoutTimer.isRunning) {
    finishWorkoutTimer();
  }

  setTimeout(() => {
    renderRoutineView();

    // 남은 종목 중 최상단으로 화면 부드럽게 이동 (상단 고정 헤더 & 타이머 고려하여 처음부터 완벽히 보이도록 스크롤)
    const activeList = document.getElementById("activeExercisesList");
    if (activeList) {
      const firstCard = activeList.querySelector(".exercise-card");
      if (firstCard) {
        const header = document.querySelector(".app-header");
        const headerH = header ? header.offsetHeight : 65;
        const timerBar = document.getElementById("floatingTimerBar");
        const isTimerVisible = timerBar && !timerBar.classList.contains("hidden") && timerBar.offsetHeight > 0;
        const timerH = isTimerVisible ? (timerBar.getBoundingClientRect().bottom + 8) : 0;
        const topOffset = Math.max(headerH, timerH) + 14;

        const cardRect = firstCard.getBoundingClientRect();
        const targetScrollY = window.scrollY + cardRect.top - topOffset;

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: "smooth"
        });
      } else {
        const sectionTitle = document.querySelector(".section-title-bar");
        if (sectionTitle) {
          const header = document.querySelector(".app-header");
          const topOffset = (header ? header.offsetHeight : 65) + 14;
          const rect = sectionTitle.getBoundingClientRect();
          window.scrollTo({
            top: Math.max(0, window.scrollY + rect.top - topOffset),
            behavior: "smooth"
          });
        }
      }
    }
  }, 320);
}

// 완료된 운동 목록 행
function createCompletedRowElement(ex) {
  const row = document.createElement("div");
  row.className = "completed-item-row";

  const todayRecord = AppState.calendarData[AppState.todayDateStr] || {};
  const log = todayRecord.exerciseLogs ? todayRecord.exerciseLogs[ex.name] : null;

  let setsSummaryHtml = "";
  if (log && log.isCardio) {
    setsSummaryHtml = `<div class="completed-sets-summary">${log.durationMinutes}분 달리기 완료 (유산소)</div>`;
  } else if (log && log.sets && log.sets.length > 0) {
    const isDoubleSide = Boolean(log.isDoubleSide || ex.isDoubleSide || (ex.name && ex.name.includes("사이드 벤드")));
    if (log.isBodyweight || ex.isBodyweight) {
      const maxReps = Math.max(...log.sets.map(s => s.reps));
      setsSummaryHtml = `<div class="completed-sets-summary">${log.sets.length}세트 완료 (최고 ${maxReps}회 | 맨몸)</div>`;
    } else if (log.isAssistedPullup || ex.isAssistedPullup) {
      setsSummaryHtml = `<div class="completed-sets-summary">${log.sets.length}세트 완료 (보조 ${log.sets[0]?.weight || 55}kg | 실중량 ${log.maxWeight}kg | 볼륨 ${log.totalVolume.toLocaleString()}kg)</div>`;
    } else if (isDoubleSide) {
      setsSummaryHtml = `<div class="completed-sets-summary">${log.sets.length}세트 완료 (최고 ${log.maxWeight}kg | <span class="double-side-badge">양쪽×2</span> 볼륨 ${log.totalVolume.toLocaleString()}kg)</div>`;
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
    let durationBadgeHtml = "";
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
      if (record.workoutDurationMinutes && record.workoutDurationMinutes > 0) {
        const dur = record.workoutDurationMinutes;
        const timeStr = dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60}m` : `${dur}분`;
        durationBadgeHtml = `<span class="cal-mini-time">⏱️ ${timeStr}</span>`;
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
        ${durationBadgeHtml}
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
  const panelDurationBanner = document.getElementById("panelDurationBanner");
  const panelDurationValue = document.getElementById("panelDurationValue");
  const btnEditDuration = document.getElementById("btnEditDuration");
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

  // 당일 총 운동시간 배너 갱신
  if (record && ((record.workoutDurationMinutes && record.workoutDurationMinutes > 0) || (record.completedItems && record.completedItems.length > 0))) {
    if (panelDurationBanner) panelDurationBanner.classList.remove("hidden");
    if (panelDurationValue) {
      const durMins = record.workoutDurationMinutes || 0;
      if (durMins > 0) {
        const hours = Math.floor(durMins / 60);
        const mins = durMins % 60;
        const timeStr = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
        const rangeStr = (record.workoutStartTime && record.workoutEndTime)
          ? ` (${record.workoutStartTime} ~ ${record.workoutEndTime})`
          : "";
        panelDurationValue.textContent = `${timeStr}${rangeStr}`;
      } else {
        panelDurationValue.textContent = "0분 (수정 가능)";
      }
    }
  } else {
    if (panelDurationBanner) panelDurationBanner.classList.add("hidden");
  }

  if (btnEditDuration) {
    btnEditDuration.onclick = () => {
      const curVal = (record && record.workoutDurationMinutes) ? record.workoutDurationMinutes : "";
      const input = prompt("총 운동시간(분 단위 숫자)을 입력하세요 (예: 58):", curVal);
      if (input !== null) {
        const parsed = parseInt(input.trim(), 10);
        if (!isNaN(parsed) && parsed >= 0) {
          if (!AppState.calendarData[targetDateStr]) {
            AppState.calendarData[targetDateStr] = {
              date: targetDateStr,
              completedItems: [],
              mainPart: "운동",
              statusText: "기록"
            };
          }
          AppState.calendarData[targetDateStr].workoutDurationMinutes = parsed;
          saveCalendarData();
          renderCalendar();
          renderSelectedDateDetail();
        } else {
          alert("0 이상의 분 단위 숫자를 입력해주세요.");
        }
      }
    };
  }

  if (record && record.completedItems && record.completedItems.length > 0) {
    const completedCount = record.completedItems ? record.completedItems.length : 0;
    const countEl = document.getElementById("panelWorkoutCount");
    if (countEl) countEl.textContent = completedCount;

    // 상태 뱃지
    if (panelStatusBadge) {
      panelStatusBadge.className = `status-pill ${record.badgeClass || "status-part-done"}`;
      panelStatusBadge.textContent = record.statusText || `${completedCount}개 완료`;
    }

    // 운동 상세 및 세트 목록 렌더링
    if (panelWorkoutSummary) {
      const mainPartText = record.mainPart ? `[${record.mainPart}] ` : "";
      const exerciseLogs = record.exerciseLogs || {};

      let cardsHtml = `
        <div style="font-weight:700; margin-bottom:8px; color:#fff; display:flex; align-items:center; justify-content:space-between;">
          <span>${mainPartText}총 ${completedCount}개 운동 완료</span>
        </div>
      `;

      cardsHtml += record.completedItems.map(item => {
        const log = exerciseLogs[item];
        if (log && log.isCardio) {
          return `
            <div class="workout-detail-card">
              <div class="workout-detail-title-row">
                <span class="workout-detail-name">🏃‍♂️ ${escapeHtml(item)}</span>
                <span class="workout-detail-metrics">${log.durationMinutes}분 지속 완료</span>
              </div>
            </div>
          `;
        } else if (log && log.sets && log.sets.length > 0) {
          const isBody = Boolean(log.isBodyweight);
          const isAssisted = Boolean(log.isAssistedPullup);
          const setsList = log.sets.map(s => {
            let setVal = `${s.weight}kg×${s.reps}회`;
            if (isBody) {
              setVal = `${s.reps}회`;
            } else if (isAssisted) {
              setVal = `보조${s.weight}kg(실${s.actualWeight ?? Math.max(0, AppState.userWeight - s.weight)}kg)×${s.reps}회`;
            }
            return `<span class="set-chip">${s.set}세트: ${setVal}</span>`;
          }).join("");

          const maxReps = Math.max(...log.sets.map(s => s.reps));
          const isDouble = Boolean(log.isDoubleSide || (item && item.includes("사이드 벤드")));
          let metricStr = `최고 ${log.maxWeight}kg | 볼륨 ${log.totalVolume.toLocaleString()}kg`;
          if (isBody) {
            metricStr = `최고 ${maxReps}회 | 맨몸`;
          } else if (isAssisted) {
            metricStr = `실중량 최고 ${log.maxWeight}kg | 볼륨 ${log.totalVolume.toLocaleString()}kg`;
          } else if (isDouble) {
            metricStr = `최고 ${log.maxWeight}kg | 양쪽×2 볼륨 ${log.totalVolume.toLocaleString()}kg`;
          }

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

// === 4. 상단 휴식 타이머 로직 ===
function startRestTimer(seconds, currentEx = null, currentSetNumber = null) {
  ensureWorkoutTimerStarted();
  stopRestTimer();
  SoundEffects.init();

  AppState.restTimer.totalSeconds = seconds;
  AppState.restTimer.remainingSeconds = seconds;

  const bar = document.getElementById("floatingTimerBar");
  if (bar) {
    bar.classList.remove("timer-flash-alert");
    bar.classList.remove("hidden");
  }

  // 1. 세트 진행 정보 표기
  const setInfoEl = document.getElementById("floatingTimerSetInfo");
  if (setInfoEl) {
    if (currentEx) {
      if (currentSetNumber && currentSetNumber > 0) {
        setInfoEl.textContent = `${currentEx.name} · ${currentSetNumber}세트 완료 후 휴식 중`;
      } else {
        setInfoEl.textContent = `${currentEx.name} · 세트 휴식 중`;
      }
    } else {
      setInfoEl.textContent = "세트 간 휴식 중";
    }
  }

  // 2. 다음 운동할 기구 이름과 사진 안내
  const nextPreviewEl = document.getElementById("floatingTimerNextPreview");
  const nextImgEl = document.getElementById("floatingTimerNextImg");
  const nextNameEl = document.getElementById("floatingTimerNextName");

  const todayExercises = getDayExercises(AppState.selectedDay);
  let nextEx = null;

  if (currentEx) {
    const currentIdx = todayExercises.findIndex(e => e.id === currentEx.id);
    if (currentIdx !== -1) {
      // 현재 운동 다음부터 미완료 운동 찾기
      for (let i = currentIdx + 1; i < todayExercises.length; i++) {
        if (!AppState.completedExerciseIds.has(todayExercises[i].id)) {
          nextEx = todayExercises[i];
          break;
        }
      }
    }
  }

  // 미완료 중 다음 운동이 없으면 남은 것 중 첫 번째
  if (!nextEx) {
    nextEx = todayExercises.find(e => !AppState.completedExerciseIds.has(e.id) && (!currentEx || e.id !== currentEx.id));
  }

  if (nextEx && nextPreviewEl) {
    const nextMachine = nextEx.machineId ? MACHINES_DATA.find(m => m.id === nextEx.machineId) : findMachineByName(nextEx.name);
    const nextImgUrl = nextMachine ? nextMachine.image : (nextEx.customImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80');

    if (nextImgEl) nextImgEl.src = nextImgUrl;
    if (nextNameEl) nextNameEl.textContent = nextEx.name;
    const nextSubEl = document.getElementById("floatingTimerNextSub");
    if (nextSubEl) nextSubEl.textContent = nextEx.target || "다음 기구 준비";
    nextPreviewEl.style.display = "flex";
  } else if (nextPreviewEl) {
    nextPreviewEl.style.display = "none";
  }

  updateTimerDisplay();

  AppState.restTimer.intervalId = setInterval(() => {
    AppState.restTimer.remainingSeconds--;
    if (AppState.restTimer.remainingSeconds <= 0) {
      // 카운트다운 완료 시 3초간 강력 반짝임 알림 후 자동 꺼짐
      clearInterval(AppState.restTimer.intervalId);
      AppState.restTimer.intervalId = null;

      const secEl = document.getElementById("floatingTimerSeconds");
      if (secEl) secEl.textContent = 0;
      const fillEl = document.getElementById("timerProgressFill");
      if (fillEl) fillEl.style.width = "0%";

      const setInfoEl = document.getElementById("floatingTimerSetInfo");
      if (setInfoEl) setInfoEl.textContent = "🔔 휴식 완료! 다음 운동을 시작하세요!";

      // 완료 알림음 및 진동
      SoundEffects.playTimerDone();
      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 400]);
      }

      // 3초간 반짝이면서 알려줌
      if (bar) {
        bar.classList.add("timer-flash-alert");
      }

      // 3초 후 자동 종료 (초시계 화면꺼짐)
      setTimeout(() => {
        stopRestTimer();
      }, 3000);
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
  if (bar) {
    bar.classList.remove("timer-flash-alert");
    bar.classList.add("hidden");
  }
}

// === 4-1. 체중 설정 모달 관련 로직 ===
function openWeightModal() {
  const modal = document.getElementById("weightModal");
  const input = document.getElementById("inputUserWeight");
  if (input) input.value = AppState.userWeight;

  document.querySelectorAll(".weight-preset-btn").forEach(btn => {
    btn.classList.toggle("active", parseFloat(btn.getAttribute("data-weight")) === AppState.userWeight);
  });

  if (modal) modal.classList.remove("hidden");
}

function closeWeightModal() {
  const modal = document.getElementById("weightModal");
  if (modal) modal.classList.add("hidden");
}

function saveUserWeight(weightVal) {
  const num = parseFloat(weightVal);
  if (!isNaN(num) && num > 0) {
    AppState.userWeight = num;
    localStorage.setItem("myhealth_user_weight", String(num));
    updateHeaderWeightDisplay();
    closeWeightModal();
    renderRoutineView();
  }
}

// === 4-2. 운동 도감 (Library) 뷰 로직 ===
function renderLibraryView() {
  const grid = document.getElementById("libraryMachinesGrid");
  if (!grid) return;

  const catFilter = AppState.libraryFilter || "all";
  const query = (AppState.librarySearchQuery || "").toLowerCase().replace(/[\s\(\)\-\_]/g, "");

  const filtered = MACHINES_DATA.filter(m => {
    const matchCat = catFilter === "all" || m.category === catFilter;
    if (!matchCat) return false;
    if (!query) return true;
    const mName = m.name.toLowerCase().replace(/[\s\(\)\-\_]/g, "");
    const mTarget = (m.target || "").toLowerCase().replace(/[\s\(\)\-\_]/g, "");
    return mName.includes(query) || mTarget.includes(query);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 28px; margin-bottom: 8px;">🔍</p>
        <p style="font-size: 14px;">검색 결과와 일치하는 기구가 없습니다.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    const isAlreadyAdded = AppState.customAddedExercises.some(ex => ex.machineId === m.id) ||
      (WEEKLY_ROUTINES[AppState.selectedDay] && WEEKLY_ROUTINES[AppState.selectedDay].exercises.some(ex => ex.machineId === m.id));

    return `
      <div class="lib-machine-card" data-id="${m.id}">
        <div class="lib-machine-thumb-wrap" data-action="guide">
          <img src="${m.image}" alt="${m.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';">
          <span class="lib-brand-pill">${m.brand}</span>
        </div>
        <div class="lib-card-body">
          <div class="lib-card-meta">
            <span class="badge-cat">${m.categoryLabel}</span>
          </div>
          <div class="lib-card-name">${m.name}</div>
          <div class="lib-card-target">${m.target}</div>
          <div class="lib-card-actions">
            <button type="button" class="btn-lib-guide" data-action="guide">📖 설명</button>
            <button type="button" class="btn-add-today-routine" data-action="add-today" data-id="${m.id}">
              ${isAlreadyAdded ? "루틴에 있음 ✔" : "+ 오늘 루틴에 추가"}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // 이벤트 연결
  grid.querySelectorAll('[data-action="guide"]').forEach(el => {
    el.addEventListener("click", (e) => {
      const card = e.target.closest(".lib-machine-card");
      const id = card.getAttribute("data-id");
      const m = MACHINES_DATA.find(x => x.id === id);
      if (m) openMachineModal(m);
    });
  });

  grid.querySelectorAll('[data-action="add-today"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const m = MACHINES_DATA.find(x => x.id === id);
      if (m) {
        addMachineToTodayRoutine(m);
        btn.textContent = "루틴에 추가됨 ✔";
        btn.style.background = "var(--accent-green)";
        btn.style.color = "#000";
      }
    });
  });
}

function addMachineToTodayRoutine(machine) {
  const isAssisted = machine.id === "m11" || machine.name.includes("풀업 어시스트");
  const newEx = {
    id: `custom_${Date.now()}_${machine.id}`,
    order: "+",
    name: machine.name,
    alternative: "",
    machineId: machine.id,
    target: machine.target,
    setsReps: isAssisted ? "3세트 × 10~12회" : "4세트 × 10~12회",
    restSec: 60,
    isAssistedPullup: isAssisted,
    isBodyweight: false,
    tip: machine.setupTip || "올바른 자세와 통제된 속도로 수축 및 이완을 진행합니다.",
    youtubeQuery: `${machine.name} 사용법 자세`
  };

  AppState.customAddedExercises.push(newEx);
  saveCustomAddedExercises();

  alert(`'${machine.name}'이(가) 오늘의 운동 루틴에 추가되었습니다!\n남은 운동 목록에서 세트 기록과 완료가 가능합니다.`);
  switchView("routine");
}

// === 4-1. 총 운동시간 측정 타이머 (Stopwatch) ===
function formatStopwatchDigits(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeOfDay(dateObj) {
  const h = String(dateObj.getHours()).padStart(2, '0');
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function initWorkoutTimer() {
  try {
    const raw = localStorage.getItem("myhealth_workout_timer");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.date === AppState.todayDateStr) {
        AppState.workoutTimer.startTime = data.startTime;
        AppState.workoutTimer.startTimeStr = data.startTimeStr;
        AppState.workoutTimer.endTime = data.endTime;
        AppState.workoutTimer.endTimeStr = data.endTimeStr;
        AppState.workoutTimer.isFinished = Boolean(data.isFinished);

        if (data.isRunning && data.startTime) {
          AppState.workoutTimer.isRunning = true;
          AppState.workoutTimer.elapsedSeconds = Math.max(0, Math.floor((Date.now() - data.startTime) / 1000));
          resumeWorkoutTimerTicker();
        } else {
          AppState.workoutTimer.isRunning = false;
          AppState.workoutTimer.elapsedSeconds = data.elapsedSeconds || 0;
        }
      } else {
        localStorage.removeItem("myhealth_workout_timer");
      }
    }
  } catch (e) {
    console.error("Failed to load workout timer:", e);
  }
  updateWorkoutTimerUI();
}

function saveWorkoutTimerState() {
  const timer = AppState.workoutTimer;
  const state = {
    date: AppState.todayDateStr,
    isRunning: timer.isRunning,
    isFinished: timer.isFinished,
    startTime: timer.startTime,
    startTimeStr: timer.startTimeStr,
    endTime: timer.endTime,
    endTimeStr: timer.endTimeStr,
    elapsedSeconds: timer.elapsedSeconds
  };
  localStorage.setItem("myhealth_workout_timer", JSON.stringify(state));
}

function startWorkoutTimer() {
  if (AppState.workoutTimer.isRunning) return;

  const now = Date.now();
  if (!AppState.workoutTimer.startTime || AppState.workoutTimer.isFinished) {
    AppState.workoutTimer.startTime = now;
    AppState.workoutTimer.startTimeStr = formatTimeOfDay(new Date(now));
    AppState.workoutTimer.elapsedSeconds = 0;
  } else {
    // 재개하는 경우
    AppState.workoutTimer.startTime = now - (AppState.workoutTimer.elapsedSeconds * 1000);
  }

  AppState.workoutTimer.isRunning = true;
  AppState.workoutTimer.isFinished = false;
  AppState.workoutTimer.endTime = null;
  AppState.workoutTimer.endTimeStr = null;

  saveWorkoutTimerState();
  resumeWorkoutTimerTicker();
  updateWorkoutTimerUI();
}

function resumeWorkoutTimerTicker() {
  if (AppState.workoutTimer.intervalId) {
    clearInterval(AppState.workoutTimer.intervalId);
  }

  AppState.workoutTimer.intervalId = setInterval(() => {
    if (AppState.workoutTimer.isRunning && AppState.workoutTimer.startTime) {
      AppState.workoutTimer.elapsedSeconds = Math.max(0, Math.floor((Date.now() - AppState.workoutTimer.startTime) / 1000));
      updateWorkoutTimerUI();
    }
  }, 1000);
}

function ensureWorkoutTimerStarted() {
  // 이미 측정 중이거나 이미 완료된 타이머라면 자동 시작하지 않음
  if (AppState.workoutTimer.isRunning || AppState.workoutTimer.isFinished) return;
  startWorkoutTimer();
}

function finishWorkoutTimer() {
  if (!AppState.workoutTimer.isRunning && !AppState.workoutTimer.startTime) return;

  const now = Date.now();
  AppState.workoutTimer.isRunning = false;
  AppState.workoutTimer.isFinished = true;
  AppState.workoutTimer.endTime = now;
  AppState.workoutTimer.endTimeStr = formatTimeOfDay(new Date(now));

  if (AppState.workoutTimer.intervalId) {
    clearInterval(AppState.workoutTimer.intervalId);
    AppState.workoutTimer.intervalId = null;
  }

  const elapsed = AppState.workoutTimer.elapsedSeconds;
  const durationMinutes = Math.max(1, Math.round(elapsed / 60));

  // 오늘 달력 데이터에 기록
  const todayStr = AppState.todayDateStr;
  const curRecord = AppState.calendarData[todayStr] || {};
  curRecord.workoutDurationMinutes = durationMinutes;
  curRecord.workoutStartTime = AppState.workoutTimer.startTimeStr;
  curRecord.workoutEndTime = AppState.workoutTimer.endTimeStr;
  AppState.calendarData[todayStr] = curRecord;
  saveCalendarData();
  saveWorkoutTimerState();
  updateWorkoutTimerUI();

  renderCalendar();
  if (AppState.calSelectedDate === todayStr) {
    renderSelectedDateDetail();
  }
}

function resetWorkoutTimer() {
  if (!confirm("오늘의 총 운동시간 기록 및 타이머를 리셋하시겠습니까?")) return;

  if (AppState.workoutTimer.intervalId) {
    clearInterval(AppState.workoutTimer.intervalId);
    AppState.workoutTimer.intervalId = null;
  }

  AppState.workoutTimer.isRunning = false;
  AppState.workoutTimer.isFinished = false;
  AppState.workoutTimer.startTime = null;
  AppState.workoutTimer.startTimeStr = null;
  AppState.workoutTimer.endTime = null;
  AppState.workoutTimer.endTimeStr = null;
  AppState.workoutTimer.elapsedSeconds = 0;

  localStorage.removeItem("myhealth_workout_timer");

  const todayStr = AppState.todayDateStr;
  if (AppState.calendarData[todayStr]) {
    delete AppState.calendarData[todayStr].workoutDurationMinutes;
    delete AppState.calendarData[todayStr].workoutStartTime;
    delete AppState.calendarData[todayStr].workoutEndTime;
    saveCalendarData();
    renderCalendar();
    if (AppState.calSelectedDate === todayStr) {
      renderSelectedDateDetail();
    }
  }

  updateWorkoutTimerUI();
}

function updateWorkoutTimerUI() {
  const section = document.getElementById("workoutTimerSection");
  const statusEl = document.getElementById("workoutTimerStatus");
  const digitsEl = document.getElementById("workoutTimerDigits");
  const btnStart = document.getElementById("btnStartWorkoutTimer");
  const btnFinish = document.getElementById("btnFinishWorkoutTimer");
  const btnReset = document.getElementById("btnResetWorkoutTimer");

  if (!section || !statusEl || !digitsEl) return;

  const timer = AppState.workoutTimer;
  digitsEl.textContent = formatStopwatchDigits(timer.elapsedSeconds || 0);

  if (timer.isRunning) {
    section.classList.add("running");
    section.classList.remove("finished");
    statusEl.textContent = `운동 중 🔥 (${timer.startTimeStr} 시작)`;
    if (btnStart) btnStart.classList.add("hidden");
    if (btnFinish) btnFinish.classList.remove("hidden");
    if (btnReset) btnReset.classList.add("hidden");
  } else if (timer.isFinished) {
    section.classList.remove("running");
    section.classList.add("finished");
    const durMins = Math.max(1, Math.round(timer.elapsedSeconds / 60));
    statusEl.textContent = `운동 완료 ✔ (${timer.startTimeStr} ~ ${timer.endTimeStr || ''} | 총 ${durMins}분)`;
    if (btnStart) {
      btnStart.classList.remove("hidden");
      btnStart.textContent = "▶ 재개하기";
    }
    if (btnFinish) btnFinish.classList.add("hidden");
    if (btnReset) btnReset.classList.remove("hidden");
  } else {
    section.classList.remove("running");
    section.classList.remove("finished");
    statusEl.textContent = "오늘의 총 운동시간";
    if (btnStart) {
      btnStart.classList.remove("hidden");
      btnStart.textContent = "▶ 운동 시작";
    }
    if (btnFinish) btnFinish.classList.add("hidden");
    if (btnReset) btnReset.classList.add("hidden");
  }
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
  ensureWorkoutTimerStarted();
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
        alert("🎉 목표 유산소 달리기 완료! 심폐 지구력과 지방 연소 목표를 달성하셨습니다!");
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
  AppState.cardioTimer.remainingSeconds = 30 * 60;
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
          "바벨스쿼트 (스미스 머신)",
          "데드리프트 (힙쓰러스트)",
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
          "행잉 레그 레이즈 (서서 다리 올리기)",
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

// === 7. 데이터 백업 & 브라우저 간 이동 ===
function openBackupModal() {
  const modal = document.getElementById("backupModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeBackupModal() {
  const modal = document.getElementById("backupModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function exportAllHealthData() {
  const exportObj = {
    app: "myHealth",
    version: 2,
    exportedAt: new Date().toISOString(),
    calendarData: AppState.calendarData || {},
    lastExerciseLogs: AppState.lastExerciseLogs || {},
    exerciseMemos: AppState.exerciseMemos || {},
    dailyDones: {}
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("myhealth_done_")) {
        try {
          exportObj.dailyDones[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          exportObj.dailyDones[key] = localStorage.getItem(key);
        }
      }
    }
  } catch (err) {
    console.warn("Storage export warn:", err);
  }

  return JSON.stringify(exportObj, null, 2);
}

function importAllHealthData(jsonStr) {
  if (!jsonStr || !jsonStr.trim()) {
    alert("데이터 코드를 먼저 붙여넣어 주세요.");
    return false;
  }

  try {
    const data = JSON.parse(jsonStr.trim());
    if (!data || typeof data !== "object") {
      alert("올바르지 않은 데이터 형식입니다.");
      return false;
    }

    // 1. 달력 데이터 병합
    if (data.calendarData && typeof data.calendarData === "object") {
      AppState.calendarData = { ...AppState.calendarData, ...data.calendarData };
      saveCalendarData();
    }

    // 2. 기구별 직전 수행 세트 기록 병합
    if (data.lastExerciseLogs && typeof data.lastExerciseLogs === "object") {
      AppState.lastExerciseLogs = { ...AppState.lastExerciseLogs, ...data.lastExerciseLogs };
      saveLastExerciseLogs();
    }

    // 3. 기구별 메모 복원
    if (data.exerciseMemos && typeof data.exerciseMemos === "object") {
      AppState.exerciseMemos = { ...AppState.exerciseMemos, ...data.exerciseMemos };
      saveExerciseMemos();
    }

    // 4. 일별 완료 목록 복원
    if (data.dailyDones && typeof data.dailyDones === "object") {
      Object.keys(data.dailyDones).forEach(k => {
        const val = data.dailyDones[k];
        const valStr = typeof val === "string" ? val : JSON.stringify(val);
        localStorage.setItem(k, valStr);
      });
      // 오늘 날짜 세트도 즉시 다시 로드
      const todayDone = localStorage.getItem(`myhealth_done_${AppState.todayDateStr}`);
      if (todayDone) {
        try {
          AppState.completedExerciseIds = new Set(JSON.parse(todayDone));
        } catch (e) {}
      }
    }

    alert("🎉 데이터 복원이 성공적으로 완료되었습니다!\n운동 기록과 달력이 즉시 갱신됩니다.");
    closeBackupModal();
    renderApp();
    return true;
  } catch (err) {
    console.error("Import error:", err);
    alert("데이터를 해석하는 도중 오류가 발생했습니다. 올바른 백업 코드인지 확인해주세요.");
    return false;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
