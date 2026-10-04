/* NMMUN'27 landing page script. No libraries.
   Three small jobs: 1) the placard and countdown in the hero,
   2) the committee matcher, 3) the register button. */

// ---- Settings: change these when the official details are announced ----
const EVENT_DATE = new Date("2027-01-16T09:00:00+05:30");
const REGISTER_URL = ""; // paste the registration form link here when it is live

const COUNTRIES = ["India", "Brazil", "Japan", "France", "Kenya", "Germany", "Egypt", "Mexico", "South Africa",
  "United Kingdom", "Indonesia", "Argentina", "Nigeria", "Australia", "Canada", "Türkiye", "Norway", "Vietnam"];

// Agendas are indicative. Committee mix follows recent NMMUN editions.
const COMMITTEES = {
  unhrc: { name: "UNHRC", full: "United Nations Human Rights Council", level: "Good for first-timers",
    agenda: "Protecting privacy and digital rights in the age of AI surveillance",
    suits: "You care about people first and like building agreement.",
    why: "It follows standard procedure at a steady pace, so you can learn the rules while you speak." },
  disec: { name: "DISEC", full: "Disarmament and International Security Committee", level: "Some experience helps",
    agenda: "Regulating autonomous weapons and the military use of AI",
    suits: "You follow world conflicts and enjoy arguing about security.",
    why: "A large committee with clear blocs. Strong research and steady lobbying win here." },
  unodc: { name: "UNODC", full: "United Nations Office on Drugs and Crime", level: "Some experience helps",
    agenda: "Curbing cyber-enabled financial crime and crypto laundering",
    suits: "You like following the money and finding loopholes.",
    why: "Technical and detail-heavy. Delegates who read the fine print lead the room." },
  hcc: { name: "HCC", full: "Historic Crisis Committee", level: "For experienced delegates",
    agenda: "The Cuban Missile Crisis, October 1962",
    suits: "You think fast and enjoy it when the plan changes.",
    why: "Crisis updates arrive without warning and history can be rewritten. No two sessions are alike." },
  loksabha: { name: "Lok Sabha", full: "House of the People, Parliament of India", level: "Some experience helps",
    agenda: "Regulating online platforms and protecting citizens' data",
    suits: "You follow Indian politics and love a loud, sharp debate.",
    why: "You speak as a real MP, in Hindi or English, with party lines to hold and cross." },
  uefa: { name: "UEFA", full: "UEFA Executive Committee", level: "Good for first-timers",
    agenda: "Club finances and the future of the football calendar",
    suits: "You know your football and want a debate that feels different.",
    why: "A boardroom, not a council. Easy to enter, and your match knowledge counts as research." },
  press: { name: "International Press", full: "Reporters, photographers and caricaturists", level: "Open to everyone",
    agenda: "Covering every committee across both days",
    suits: "You would rather write, shoot or sketch than give speeches.",
    why: "You move between committees, question delegates and publish the conference's story." }
};

// Each answer adds points to one or more committees. Highest total wins.
const QUESTIONS = [
  { q: "Which headline would you click first?", options: [
    ["A border standoff pushes two armies to the edge", { disec: 2, unhrc: 1 }],
    ["Parliament erupts over a new bill", { loksabha: 2 }],
    ["Leaked files expose a billion-rupee scam in sport", { unodc: 2, uefa: 2 }],
    ["The decision that almost started a world war", { hcc: 2, press: 1 }] ] },
  { q: "In a debate, you are usually", options: [
    ["The one who gets everyone to agree", { unhrc: 2, disec: 1 }],
    ["The loudest voice in the room", { loksabha: 2, uefa: 1 }],
    ["The one who stays calm when things go wrong", { hcc: 2, unodc: 1 }],
    ["The one watching and taking notes", { press: 3 }] ] },
  { q: "How many MUNs have you attended?", options: [
    ["None. This would be my first", { unhrc: 2, uefa: 1, press: 1 }],
    ["One to three", { unodc: 2, disec: 1, loksabha: 1 }],
    ["Four or more", { hcc: 2, disec: 1, loksabha: 1 }] ] }
];

const $ = (id) => document.getElementById(id);
const store = {
  get(key) { try { return localStorage.getItem(key) || ""; } catch (e) { return ""; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ } }
};

/* ---------- 1. Hero: placard and countdown ---------- */
function setupPlacard() {
  const nameInput = $("delegateName"), countrySelect = $("delegateCountry");
  const placard = document.querySelector(".placard");

  countrySelect.add(new Option("Choose a country", ""));
  COUNTRIES.forEach((c) => countrySelect.add(new Option(c, c)));
  nameInput.value = store.get("nmmun-name");
  countrySelect.value = store.get("nmmun-country");

  function render(animate) {
    $("placardName").textContent = nameInput.value.trim() || "Your name here";
    $("placardCountry").textContent = countrySelect.value || "Your country";
    store.set("nmmun-name", nameInput.value.trim());
    store.set("nmmun-country", countrySelect.value);
    if (animate) { // replay the small "stand the card up" movement
      placard.classList.remove("is-set");
      void placard.offsetWidth;
      placard.classList.add("is-set");
    }
  }
  nameInput.addEventListener("input", () => render(false));
  countrySelect.addEventListener("change", () => render(true));
  $("placardForm").addEventListener("submit", (e) => e.preventDefault());
  render(false);
}

function setupCountdown() {
  const days = Math.ceil((EVENT_DATE - new Date()) / 86400000);
  $("rollcall").textContent = days > 1 ? `Roll call in ${days} days` : days === 1 ? "Roll call is tomorrow" : days === 0 ? "Roll call is today" : "";
}

/* ---------- 2. Committee matcher ---------- */
function buildFiles() {
  const wrap = $("files");
  Object.entries(COMMITTEES).forEach(([key, c]) => {
    const file = document.createElement("details");
    file.className = "file";
    file.id = "file-" + key;
    file.innerHTML = `
      <summary data-level="${c.level}"><span class="file__name">${c.name}</span><span class="file__open">Open file</span></summary>
      <dl class="file__body">
        <div><dt>Committee</dt><dd>${c.full}</dd></div>
        <div><dt>Agenda</dt><dd>${c.agenda}</dd></div>
        <div><dt>Suits you if</dt><dd>${c.suits}</dd></div>
      </dl>`;
    wrap.appendChild(file);
  });
}

function setupQuiz() {
  let step = 0, scores = {};

  function showQuestion(moveFocus) {
    const item = QUESTIONS[step];
    $("quizResult").hidden = true;
    $("quizOptions").hidden = false;
    $("quizStep").textContent = `Question ${step + 1} of ${QUESTIONS.length}`;
    $("quizQuestion").textContent = item.q;
    $("quizOptions").replaceChildren(...item.options.map(([label, points]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", () => answer(points));
      return btn;
    }));
    if (moveFocus) $("quizQuestion").focus();
  }

  function answer(points) {
    for (const key in points) scores[key] = (scores[key] || 0) + points[key];
    step += 1;
    step < QUESTIONS.length ? showQuestion(true) : showResult();
  }

  function showResult() {
    // highest score wins; on a tie the committee listed first in COMMITTEES wins
    const winner = Object.keys(COMMITTEES).reduce((best, key) => (scores[key] || 0) > (scores[best] || 0) ? key : best);
    const c = COMMITTEES[winner];
    $("quizStep").textContent = "Your match";
    $("quizQuestion").textContent = "";
    $("quizOptions").hidden = true;
    $("quizCommittee").textContent = c.name;
    $("quizWhy").textContent = `${c.suits} ${c.why}`;
    $("quizResult").hidden = false;
    store.set("nmmun-committee", c.name);

    document.querySelectorAll(".file").forEach((f) => { f.classList.remove("is-match"); f.open = false; });
    const file = $("file-" + winner);
    file.classList.add("is-match");
    file.open = true;
    $("quizCommittee").setAttribute("tabindex", "-1");
    $("quizCommittee").focus();
  }

  $("quizRestart").addEventListener("click", () => { step = 0; scores = {}; showQuestion(true); });
  showQuestion(false);
}

/* ---------- 3. Register button ---------- */
function setupRegister() {
  const dialog = $("seatDialog");
  [$("registerBtn"), $("registerBtn2"), $("registerBtn3")].forEach((btn) => {
    if (REGISTER_URL) { btn.href = REGISTER_URL; return; } // live link: just go there
    btn.addEventListener("click", (e) => {
      if (!dialog.showModal) return; // very old browser: fall back to the footer note
      e.preventDefault();
      const name = store.get("nmmun-name"), country = store.get("nmmun-country"), committee = store.get("nmmun-committee");
      const who = name || "Delegate";
      const where = [country && `representing ${country}`, committee && `in ${committee}`].filter(Boolean).join(" ");
      $("seatText").textContent = where ? `${who}, ${where}.` : `${who}, pick a country on the placard and find your committee to complete your seat.`;
      dialog.showModal();
    });
  });
}

setupPlacard();
setupCountdown();
buildFiles();
setupQuiz();
setupRegister();
