export type Language = "en" | "tr";

export interface FinderQuestionCopy {
  title: string;
  options: Record<string, string>;
}

export interface FinderCopy {
  title: string;
  trigger: string;
  intro: string;
  step: (current: number, total: number) => string;
  questions: Record<"color" | "firstMove" | "risk" | "approach" | "theory", FinderQuestionCopy>;
  back: string;
  restart: string;
  resultsSubtitle: string;
  noMatch: string;
  studyThis: string;
  close: string;
}

export interface HomeCopy {
  navLabel: string;
  startTrainer: string;
  startTrainerHint: string;
}

export interface NotificationsCopy {
  // The corner icon-button's tooltip / screen-reader label, per state.
  enableLabel: string;
  disableLabel: string;
  deniedLabel: string;
  // The scheduled notification's own text, not shown in-app.
  title: string;
  body: string;
}

export interface StepsCopy {
  title: string;
  stageLabel: (stage: number, total: number) => string;
  finishedLabel: string;
  rule: (runs: number) => string;
  shownRunLabel: string;
  introStatus: string;
  hintStatus: string;
  recallStatus: (streak: number, runs: number) => string;
  mistakeStatus: string;
  cleanFlash: (streak: number, runs: number) => string;
  uncountedFlash: string;
  failedFlash: string;
  stagePassedFlash: string;
  learned: string;
  refreshed: string;
  toPractice: string;
}

export interface MapCopy {
  navLabel: string;
  trainerNavLabel: string;
  openingsNavLabel: string;
  title: string;
  subtitle: string;
  howToUse: string;
  rankTitles: [string, string, string, string, string];
  pointsLabel: (points: number, total: number) => string;
  // Index 0 is the "not started" state; 1-4 are the actual medal tiers
  // (bronze, silver, gold, diamond), unlocked by repeating a line.
  medalNames: [string, string, string, string, string];
  capstoneLabel: (family: string, medal: string) => string;
  capstoneLockedHint: string;
  lineLockedHint: string;
  completionsLabel: (n: number) => string;
  nextMedalHint: (remaining: number, nextMedal: string) => string;
  maxMedalHint: string;

  // A due line's spaced-repetition state — separate from the medal/rank
  // copy above, which only ever counts total completions.
  dueTitle: string;
  dueSubtitle: (n: number) => string;
  dueDaysLabel: (daysOverdue: number) => string;
}

export interface Dictionary {
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  noOpeningsMatch: (query: string) => string;
  masteredTooltip: string;

  playAs: string;
  white: string;
  black: string;
  mode: string;
  quiz: string;
  study: string;
  stepsMode: string;
  restart: string;
  stepBack: string;
  stepForward: string;
  hintButton: string;

  moveHintTitle: string;

  progressLabel: (current: number, total: number) => string;
  lineComplete: (mode: "quiz" | "study") => string;
  playAgain: string;
  nextOpening: string;
  replayingLine: string;
  notQuite: string;
  yourMove: (color: string) => string;
  hintLabel: string;
  wrongAttempts: (n: number) => string;
  movesHeading: string;

  switchToLight: string;
  switchToDark: string;

  howToUse: string;
  dismissGuide: string;

  extendPrompt: string;
  extendButton: string;

  finder: FinderCopy;
  map: MapCopy;
  home: HomeCopy;
  notifications: NotificationsCopy;
  steps: StepsCopy;
}

const en: Dictionary = {
  appTitle: "Opening Trainer",
  appSubtitle: "Drill chess openings until they're automatic.",
  searchPlaceholder: "Search openings…",
  searchAriaLabel: "Search openings",
  noOpeningsMatch: (query) => `No openings match "${query}".`,
  masteredTooltip: "Completed as this color",

  playAs: "Play as",
  white: "White",
  black: "Black",
  mode: "Mode",
  quiz: "Practice",
  study: "Study",
  stepsMode: "Step by step",
  restart: "Restart",
  stepBack: "Previous move",
  stepForward: "Next move",
  hintButton: "Hint",

  moveHintTitle: "Move Hint",

  progressLabel: (current, total) => `Move ${current} of ${total}`,
  lineComplete: (mode) => (mode === "quiz" ? "✓ Line complete — nice work!" : "✓ Line complete."),
  playAgain: "Play again",
  nextOpening: "Next opening →",
  replayingLine: "Replaying the line — watch and follow along.",
  notQuite: "Not quite — try again.",
  yourMove: (color) => `Your move (${color})…`,
  hintLabel: "Hint:",
  wrongAttempts: (n) => `${n} wrong attempt${n > 1 ? "s" : ""} — keep trying.`,
  movesHeading: "Moves",

  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",

  howToUse:
    "Pick a line on the left, then choose White or Black — you can drill the same opening from either side. A new line starts in Step by step, which teaches it three half-moves at a time. Practice makes you find each move first; Study shows where to move.",
  dismissGuide: "Dismiss",

  extendPrompt: "Want to go deeper into this line?",
  extendButton: "+5 more moves",

  finder: {
    title: "Find My Opening",
    trigger: "🧭 Find my opening",
    intro: "Answer a few quick questions and we'll point you to an opening that fits your style.",
    step: (current, total) => `Question ${current} of ${total}`,
    questions: {
      color: {
        title: "Which side do you want an opening for?",
        options: { white: "White", black: "Black", any: "Either — surprise me" },
      },
      firstMove: {
        title: "Which kind of positions pull you in?",
        options: {
          e4: "Open, e4-style fights",
          d4: "Closed, d4-style structures",
          flank: "Flexible flank systems",
          any: "No preference",
        },
      },
      risk: {
        title: "How much risk do you like to take?",
        options: { low: "Safe and solid", medium: "Balanced", high: "Sharp and aggressive", any: "No preference" },
      },
      approach: {
        title: "How do you like to fight for the center?",
        options: {
          classical: "Occupy it with pawns right away",
          hypermodern: "Control it from a distance, then strike",
          any: "No preference",
        },
      },
      theory: {
        title: "How should your opening work from game to game?",
        options: {
          low: "Same setup nearly every game",
          medium: "One main setup, a few variations",
          high: "A specific answer to whatever they play",
          any: "No preference",
        },
      },
    },
    back: "← Back",
    restart: "Start over",
    resultsSubtitle: "Based on your answers, these fit best:",
    noMatch: "No strong match — try starting over with different answers.",
    studyThis: "Study this",
    close: "Close",
  },

  map: {
    navLabel: "Skill Map",
    trainerNavLabel: "Trainer",
    openingsNavLabel: "Openings",
    title: "Opening Skill Map",
    subtitle: "Every family is its own constellation. Complete a line to earn Bronze, then repeat it for Silver, Gold, and Diamond — the family's capstone tracks its weakest line.",
    howToUse:
      "Complete a line in Practice mode to earn its Bronze medal — repeating it keeps raising it through Silver, Gold, and Diamond. A family's capstone medal reflects its weakest line, so mastering every line in a family raises it too. Study mode doesn't count toward medals.",
    rankTitles: ["Novice", "Apprentice", "Skilled", "Master", "Grandmaster"],
    pointsLabel: (points, total) => `${points} / ${total} medal points`,
    medalNames: ["Not started", "Bronze", "Silver", "Gold", "Diamond"],
    capstoneLabel: (family, medal) => `${family} Master — ${medal}`,
    capstoneLockedHint: "Complete every line in this family to earn this medal",
    lineLockedHint: "Not trained yet — click to start",
    completionsLabel: (n) => (n === 1 ? "Completed once" : `Completed ${n} times`),
    nextMedalHint: (remaining, nextMedal) =>
      `${remaining} more completion${remaining > 1 ? "s" : ""} → ${nextMedal}`,
    maxMedalHint: "Top medal reached!",

    dueTitle: "Review due",
    dueSubtitle: (n) => (n === 1 ? "1 line is ready to review" : `${n} lines are ready to review`),
    dueDaysLabel: (daysOverdue) => {
      if (daysOverdue <= 0) return "Due today";
      return daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
    },
  },

  home: {
    navLabel: "Home",
    startTrainer: "Start Trainer",
    startTrainerHint: "Jump into your opening and drill it move by move.",
  },

  notifications: {
    enableLabel: "Turn on review reminders",
    disableLabel: "Turn off review reminders",
    deniedLabel: "Notifications are blocked — allow them in Settings",
    title: "Opening Trainer",
    body: "A line is ready for review — keep your streak going.",
  },

  steps: {
    title: "Step by step progress",
    stageLabel: (stage, total) => `Stage ${stage} of ${total}`,
    finishedLabel: "All stages done",
    rule: (runs) => `1 intro + ${runs} clean runs`,
    shownRunLabel: "This run shows moves and doesn't count",
    introStatus: "New moves are shown on the board. This run doesn't count.",
    hintStatus: "The move you missed is shown. This run doesn't count.",
    recallStatus: (streak, runs) => `No hints now — ${runs} clean runs in a row (${streak}/${runs}).`,
    mistakeStatus: "Mistake — streak reset. This run won't count.",
    cleanFlash: (streak, runs) => `Clean run — ${streak}/${runs}.`,
    uncountedFlash: "Done. The next run counts.",
    failedFlash: "That run had a mistake — the missed move will be shown.",
    stagePassedFlash: "Stage passed — the next moves are coming up.",
    learned: "Line learned — it's in your review queue, first review tomorrow.",
    refreshed: "Line refreshed. Your review schedule hasn't changed.",
    toPractice: "Go to Practice",
  },
};

const tr: Dictionary = {
  appTitle: "Açılış Antrenörü",
  appSubtitle: "Satranç açılışlarını otomatikleşene kadar çalış.",
  searchPlaceholder: "Açılış ara…",
  searchAriaLabel: "Açılış ara",
  noOpeningsMatch: (query) => `"${query}" ile eşleşen açılış yok.`,
  masteredTooltip: "Bu renkte tamamlandı",

  playAs: "Taraf",
  white: "Beyaz",
  black: "Siyah",
  mode: "Mod",
  quiz: "Pratik",
  study: "Çalışma",
  stepsMode: "Adım adım",
  restart: "Baştan başla",
  stepBack: "Önceki hamle",
  stepForward: "Sonraki hamle",
  hintButton: "İpucu",

  moveHintTitle: "Hamle İpucu",

  progressLabel: (current, total) => `Hamle: ${current} / ${total}`,
  lineComplete: (mode) => (mode === "quiz" ? "✓ Açılış tamamlandı — aferin!" : "✓ Açılış tamamlandı."),
  playAgain: "Tekrar oyna",
  nextOpening: "Sonraki açılış →",
  replayingLine: "Açılış tekrar oynanıyor — izle ve takip et.",
  notQuite: "Olmadı — tekrar dene.",
  yourMove: (color) => `Sıra sende (${color})…`,
  hintLabel: "İpucu:",
  wrongAttempts: (n) => `${n} yanlış deneme — denemeye devam et.`,
  movesHeading: "Hamleler",

  switchToLight: "Açık temaya geç",
  switchToDark: "Koyu temaya geç",

  howToUse:
    "Soldan bir açılış seç, sonra Beyaz ya da Siyah tarafı seç — aynı açılışı iki taraftan da çalışabilirsin. Yeni bir hat Adım adım modunda başlar ve üçer yarı hamle öğretilir. Pratik'te her hamleyi önce kendin bulursun; Çalışma'da nereye oynayacağın gösterilir.",
  dismissGuide: "Kapat",

  extendPrompt: "Bu açılışta biraz daha derine inmek ister misin?",
  extendButton: "+5 hamle daha",

  finder: {
    title: "Açılış Bul",
    trigger: "🧭 Bana açılış öner",
    intro: "Birkaç soruyu cevapla, tarzına uyan bir açılış önerelim.",
    step: (current, total) => `Soru ${current} / ${total}`,
    questions: {
      color: {
        title: "Hangi taraf için açılış arıyorsun?",
        options: { white: "Beyaz", black: "Siyah", any: "Farketmez, sen seç" },
      },
      firstMove: {
        title: "Hangi tarz pozisyonlar seni daha çok çekiyor?",
        options: {
          e4: "1.e4 tarzı açık mücadeleler",
          d4: "1.d4 tarzı kapalı yapılar",
          flank: "Esnek kanat açılışları",
          any: "Farketmez",
        },
      },
      risk: {
        title: "Ne kadar risk almayı seversin?",
        options: { low: "Güvenli ve sağlam", medium: "Dengeli", high: "Keskin ve agresif", any: "Farketmez" },
      },
      approach: {
        title: "Merkez için nasıl mücadele etmeyi seversin?",
        options: {
          classical: "Hemen piyonlarla işgal etmek",
          hypermodern: "Uzaktan kontrol edip sonra vurmak",
          any: "Farketmez",
        },
      },
      theory: {
        title: "Açılışın oyundan oyuna nasıl işlesin?",
        options: {
          low: "Neredeyse her oyunda aynı kuruluş",
          medium: "Tek ana kuruluş, birkaç varyasyon",
          high: "Rakip ne oynarsa ona özel cevap",
          any: "Farketmez",
        },
      },
    },
    back: "← Geri",
    restart: "Baştan başla",
    resultsSubtitle: "Cevaplarına göre en uygun olanlar:",
    noMatch: "Güçlü bir eşleşme yok — farklı cevaplarla baştan dene.",
    studyThis: "Bunu çalış",
    close: "Kapat",
  },

  map: {
    navLabel: "Yetenek Haritası",
    trainerNavLabel: "Antrenör",
    openingsNavLabel: "Açılışlar",
    title: "Açılış Yetenek Haritası",
    subtitle: "Her aile kendi takımyıldızı. Bir hattı tamamla, Bronz kazan; tekrar tekrar çalışarak Gümüş, Altın ve Elmas'a yüksel — ailenin kapanış madalyası en zayıf hattını yansıtır.",
    howToUse:
      "Bir hattı Pratik modunda tamamlayınca Bronz madalyayı kazanırsın — tekrar tekrar çalışarak Gümüş, Altın ve Elmas'a yükselirsin. Ailenin kapanış madalyası en zayıf hattını yansıtır, yani ailedeki tüm hatlarda ustalaşmak onu da yükseltir. Çalışma modu madalyaya saymaz.",
    rankTitles: ["Acemi", "Çırak", "Yetenekli", "Usta", "Büyük Üstat"],
    pointsLabel: (points, total) => `${points} / ${total} madalya puanı`,
    medalNames: ["Başlanmadı", "Bronz", "Gümüş", "Altın", "Elmas"],
    capstoneLabel: (family, medal) => `${family} Ustası — ${medal}`,
    capstoneLockedHint: "Bu madalyayı kazanmak için bu ailedeki tüm hatları tamamla",
    lineLockedHint: "Henüz çalışılmadı — başlamak için tıkla",
    completionsLabel: (n) => (n === 1 ? "Bir kez tamamlandı" : `${n} kez tamamlandı`),
    nextMedalHint: (remaining, nextMedal) => `${remaining} tekrar daha → ${nextMedal}`,
    maxMedalHint: "En üst madalyaya ulaşıldı!",

    dueTitle: "Tekrar zamanı",
    dueSubtitle: (n) => (n === 1 ? "1 hat tekrar için hazır" : `${n} hat tekrar için hazır`),
    dueDaysLabel: (daysOverdue) => {
      if (daysOverdue <= 0) return "Bugün";
      return daysOverdue === 1 ? "1 gün gecikti" : `${daysOverdue} gün gecikti`;
    },
  },

  home: {
    navLabel: "Ana Sayfa",
    startTrainer: "Antrenöre Başla",
    startTrainerHint: "Açılışına gir, hamle hamle çalış.",
  },

  notifications: {
    enableLabel: "Tekrar hatırlatıcılarını aç",
    disableLabel: "Tekrar hatırlatıcılarını kapat",
    deniedLabel: "Bildirimler engellenmiş — Ayarlar'dan izin ver",
    title: "Açılış Antrenörü",
    body: "Bir hat tekrar için hazır — serini sürdür.",
  },

  steps: {
    title: "Adım adım ilerleme",
    stageLabel: (stage, total) => `Aşama ${stage} / ${total}`,
    finishedLabel: "Tüm aşamalar tamam",
    rule: (runs) => `1 tanıtım + ${runs} temiz tur`,
    shownRunLabel: "Bu turda hamleler gösteriliyor, sayılmaz",
    introStatus: "Yeni hamleler tahtada gösteriliyor. Bu tur sayılmaz.",
    hintStatus: "Kaçırdığın hamle gösteriliyor. Bu tur sayılmaz.",
    recallStatus: (streak, runs) => `Artık ipucu yok — üst üste ${runs} temiz tur (${streak}/${runs}).`,
    mistakeStatus: "Hata — seri sıfırlandı, bu tur sayılmayacak.",
    cleanFlash: (streak, runs) => `Temiz tur — ${streak}/${runs}.`,
    uncountedFlash: "Tamam. Sıradaki tur sayılır.",
    failedFlash: "Bu turda hata vardı — kaçırdığın hamle gösterilecek.",
    stagePassedFlash: "Aşama geçildi — sıradaki hamleler geliyor.",
    learned: "Hat öğrenildi — tekrar kuyruğuna girdi, ilk tekrar yarın.",
    refreshed: "Hat tazelendi. Tekrar takvimin değişmedi.",
    toPractice: "Pratik'e geç",
  },
};

export const dictionaries: Record<Language, Dictionary> = { en, tr };
