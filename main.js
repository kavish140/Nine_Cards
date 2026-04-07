const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["C", "D", "H", "S"];
const RANK_ALIASES = {"2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10", "T": "10", "J": "J", "Q": "Q", "K": "K", "A": "A"};
const SUIT_ALIASES = {"C": "C", "D": "D", "H": "H", "S": "S"};
const SUIT_SYMBOLS = {"S": "♠", "H": "♥", "D": "♦", "C": "♣"};

function createCard(rank, suit) {
  return { rank, suit };
}

function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

function parseCard(raw) {
  const text = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (text.length < 2) {
    throw new Error("Input too short");
  }
  const suit = text.slice(-1);
  const rankText = text.slice(0, -1);
  const rank = RANK_ALIASES[rankText];
  if (!rank || !SUIT_ALIASES[suit]) {
    throw new Error("Invalid format");
  }
  return createCard(rank, suit);
}

function getCardProperties(card) {
  const rankMap = {"A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13};
  const val = rankMap[card.rank];
  const power = card.rank === "A" ? 14 : val;
  return { rank: card.rank, suit: card.suit, val, power };
}

function check(card1, card2, category) {
  const p1 = getCardProperties(card1);
  const p2 = getCardProperties(card2);
  const v1 = p1.val;
  const v2 = p2.val;
  if (category === "c") return p1.suit === p2.suit;
  if (category === "p") return p1.rank === p2.rank;
  if (category === "s") return Math.abs(v1 - v2) === 1 || Math.abs(v1 - v2) === 12;
  if (category === "j") {
    const diff = Math.abs(v1 - v2);
    if (diff === 2) return true;
    const isAQ = (p1.rank === "A" && p2.rank === "Q") || (p1.rank === "Q" && p2.rank === "A");
    if (isAQ) return true;
  }
  return false;
}

function findPairsForRemainder(cards, cats, history = []) {
  if (cats.length === 0) {
    return history;
  }

  const currentCat = cats[0];
  const remCats = cats.slice(1);

  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      if (check(cards[i], cards[j], currentCat)) {
        const others = cards.filter((_, index) => index !== i && index !== j);
        const catLabel = { c: "Color", s: "Sequence", j: "Jump", p: "Pair" }[currentCat];
        const res = findPairsForRemainder(others, remCats, [...history, `${catLabel.padEnd(10)} | ${cardToString(cards[i])} & ${cardToString(cards[j])}`]);
        if (res) {
          return res;
        }
      }
    }
  }

  return null;
}

function* permutations(items) {
  if (items.length <= 1) {
    yield items.slice();
    return;
  }

  for (let i = 0; i < items.length; i += 1) {
    const first = items[i];
    const remaining = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const perm of permutations(remaining)) {
      yield [first, ...perm];
    }
  }
}

const cardsInput = document.getElementById("cardsInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");
const statusBox = document.getElementById("statusBox");
const summaryCard = document.getElementById("summaryCard");
const resultsBody = document.getElementById("resultsBody");
const deckGrid = document.getElementById("deckGrid");
const selectedCardsBox = document.getElementById("selectedCards");

const categoryPermutations = [...permutations(["c", "s", "j", "p"])];
const selectedCards = [];

function setStatus(message, kind = "") {
  statusBox.className = `status-box ${kind}`.trim();
  statusBox.textContent = message;
}

function clearResults() {
  summaryCard.className = "summary-card empty-state";
  summaryCard.textContent = "Enter 9 cards and run the solver to see the result.";
  resultsBody.innerHTML = '<tr class="empty-row"><td colspan="2">No analysis yet.</td></tr>';
}

function syncInputFromSelection() {
  cardsInput.value = selectedCards.join(" ");
}

function getSuitClass(suit) {
  return suit === "H" || suit === "D" ? "red" : "black";
}

function cardTokenToParts(cardText) {
  return {
    rank: cardText.slice(0, -1),
    suit: cardText.slice(-1)
  };
}

function buildCardFaceHtml(cardText, sizeClass = "") {
  const { rank, suit } = cardTokenToParts(cardText);
  const colorClass = getSuitClass(suit);
  const suitSymbol = SUIT_SYMBOLS[suit];
  return `
    <span class="card-face ${sizeClass} ${colorClass}">
      <span class="card-face-corner">${rank}<b>${suitSymbol}</b></span>
      <span class="card-face-center">${suitSymbol}</span>
      <span class="card-face-corner invert">${rank}<b>${suitSymbol}</b></span>
    </span>
  `;
}

function renderSelectedCards() {
  if (selectedCards.length === 0) {
    selectedCardsBox.textContent = "No cards selected.";
    return;
  }
  selectedCardsBox.innerHTML = selectedCards
    .map((card) => `<span class="selected-pill">${buildCardFaceHtml(card, "mini")}</span>`)
    .join("");
}

function setCardButtonState(cardText, isSelected) {
  const button = deckGrid.querySelector(`[data-card="${cardText}"]`);
  if (!button) return;
  button.classList.toggle("is-selected", isSelected);
  button.setAttribute("aria-pressed", String(isSelected));
}

function toggleCardSelection(cardText) {
  const currentIndex = selectedCards.indexOf(cardText);
  if (currentIndex >= 0) {
    selectedCards.splice(currentIndex, 1);
    setCardButtonState(cardText, false);
  } else {
    if (selectedCards.length >= 9) {
      setStatus("You can select at most 9 cards.", "error");
      return;
    }
    selectedCards.push(cardText);
    setCardButtonState(cardText, true);
  }

  renderSelectedCards();
  syncInputFromSelection();
}

function initDeckPicker() {
  const suitOrder = ["S", "H", "D", "C"];
  deckGrid.innerHTML = "";

  for (const suit of suitOrder) {
    for (const rank of RANKS) {
      const cardText = `${rank}${suit}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card-chip";
      button.innerHTML = buildCardFaceHtml(cardText);
      button.dataset.card = cardText;
      button.title = cardText;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleCardSelection(cardText));
      deckGrid.appendChild(button);
    }
  }

  renderSelectedCards();
}

function renderResults({ validSolutions, winnerCard, steps, candidates }) {
  summaryCard.className = "summary-card";
  summaryCard.innerHTML = `
    <div class="summary-grid">
      <div><strong>Valid leftover ranks:</strong> ${candidates.join(", ")}</div>
      <div><strong>Winner:</strong> <span class="winner-pill">${cardToString(winnerCard)} (WINNER!)</span></div>
    </div>
  `;

  resultsBody.innerHTML = "";
  for (const step of steps) {
    const [label, pair] = step.split("|");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${label.trim()}</td>
      <td>${pair.trim()}</td>
    `;
    resultsBody.appendChild(row);
  }

  const finalRow = document.createElement("tr");
  finalRow.innerHTML = `
    <td>LEFTOVER</td>
    <td>${cardToString(winnerCard)} (WINNER!)</td>
  `;
  resultsBody.appendChild(finalRow);

  void validSolutions;
}

function analyzeHand() {
  const startTime = performance.now();
  const tokens = cardsInput.value.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const userCards = [];
  const skipped = [];

  for (const token of tokens) {
    if (userCards.length >= 9) {
      break;
    }
    try {
      userCards.push(parseCard(token));
    } catch (error) {
      skipped.push(token);
    }
  }

  if (skipped.length > 0) {
    setStatus(`Skipping invalid token${skipped.length > 1 ? "s" : ""}: ${skipped.join(", ")}`, "error");
  } else {
    setStatus("Analyzing all 216 combinations (9 winners x 24 category orders)...", "");
  }

  if (userCards.length < 9) {
    setStatus(`Need 9 valid cards. Currently parsed ${userCards.length}.`, "error");
    clearResults();
    return;
  }

  const validSolutions = [];
  for (const winner of userCards) {
    const poolBase = userCards.slice();
    const winnerIndex = poolBase.findIndex((card) => card.rank === winner.rank && card.suit === winner.suit);
    if (winnerIndex >= 0) {
      poolBase.splice(winnerIndex, 1);
    }

    for (const order of categoryPermutations) {
      const steps = findPairsForRemainder(poolBase, order.slice());
      if (steps) {
        validSolutions.push([winner, steps]);
        break;
      }
    }
  }

  if (validSolutions.length === 0) {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(4);
    summaryCard.className = "summary-card";
    summaryCard.textContent = "No valid combinations found.";
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="2">No valid combinations found.</td></tr>';
    setStatus(`No valid combinations found. Analysis complete in ${elapsed} seconds.`, "error");
    return;
  }

  const rankPriority = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const priorityIndex = Object.fromEntries(rankPriority.map((rank, index) => [rank, index]));
  const candidates = [...new Set(validSolutions.map((solution) => solution[0].rank))].sort((a, b) => priorityIndex[a] - priorityIndex[b]);
  const bestSol = validSolutions.reduce((best, current) => {
    if (!best) return current;
    return priorityIndex[current[0].rank] < priorityIndex[best[0].rank] ? current : best;
  }, null);

  const [winnerCard, steps] = bestSol;
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(4);
  setStatus(`Found ${validSolutions.length} valid leftover${validSolutions.length > 1 ? "s" : ""}. Analysis complete in ${elapsed} seconds.`, "success");
  renderResults({ validSolutions, winnerCard, steps, candidates });
}

function resetForm() {
  selectedCards.splice(0, selectedCards.length);
  for (const chip of deckGrid.querySelectorAll(".card-chip")) {
    chip.classList.remove("is-selected");
    chip.setAttribute("aria-pressed", "false");
  }

  cardsInput.value = "";
  setStatus("", "");
  clearResults();
  renderSelectedCards();
  cardsInput.focus();
}

analyzeBtn.addEventListener("click", analyzeHand);
resetBtn.addEventListener("click", resetForm);
cardsInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    analyzeHand();
  }
});

initDeckPicker();
clearResults();
