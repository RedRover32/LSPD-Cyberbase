let database = JSON.parse(localStorage.getItem("lspdDB")) || [];
let blacklist = JSON.parse(localStorage.getItem("lspdBL")) || [];

const tabs = document.querySelectorAll("#tabs .tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.getAttribute("data-tab");
    switchTab(target);
  });
});

function switchTab(tabId) {
  tabs.forEach(tab => tab.classList.toggle("active", tab.getAttribute("data-tab") === tabId));
  contents.forEach(section => section.classList.toggle("active", section.id === tabId));
  if (tabId === "blacklist") renderBlacklist();
  if (tabId === "freigaben") renderClearances();
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const id = document.getElementById("passportInput").value.trim();
  searchPerson(id);
});

function searchPerson(id) {
  const resultDiv = document.getElementById("searchResult");
  if (!id) {
    resultDiv.innerHTML = `<p>Bitte eine Reisepassnummer eingeben.</p>`;
    return;
  }

  const person = database.find(p => p.passport === id);
  const blackEntry = blacklist.find(b => b.id === id && !isBlacklistExpired(b));

  let html = "";

  if (person) {
    html += `<h3>${person.name}</h3>`;
    html += `<p>ID: ${person.passport}</p>`;
    html += `<p>Freigaben: ${person.clearances.length > 0 ? person.clearances.join(", ") : "Keine"}</p>`;
  } else {
    html += `<p>Keine Person mit dieser ID gefunden.</p>`;
  }

  if (blackEntry) {
    html += `<hr><strong style="color:#ff6060">BLACKLISTED</strong><br>`;
    html += `Rang: ${blackEntry.rank}<br>`;
    html += `Grund: ${blackEntry.reason}<br>`;
    html += `Blacklist endet in ${daysLeft(blackEntry.expiry)} Tag(en)`;
  }

  resultDiv.innerHTML = html;
}

function daysLeft(expiry) {
  const now = new Date();
  const expDate = new Date(expiry);
  const diffTime = expDate - now;
  return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
}

function isBlacklistExpired(entry) {
  const now = new Date();
  const expiryDate = new Date(entry.expiry);
  return expiryDate < now;
}

document.getElementById("clearanceForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("clearanceName").value.trim();
  const id = document.getElementById("clearanceId").value.trim();
  const clearance = document.getElementById("clearanceType").value;
  const officer = document.getElementById("officerName").value.trim();

  if (!name || !id || !clearance || !officer) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  let person = database.find(p => p.passport === id);
  if (!person) {
    person = { passport: id, name: name, clearances: [] };
    database.push(person);
  }

  if (!person.clearances.includes(clearance)) {
    person.clearances.push(clearance);
    saveData();
    alert(`Freigabe "${clearance}" für ${name} eingetragen.`);
  } else {
    alert("Freigabe bereits vorhanden.");
  }

  renderClearances();
  e.target.reset();
});

function renderClearances() {
  const container = document.getElementById("clearanceList");
  container.innerHTML = "";

  database.forEach(person => {
    if (person.clearances.length > 0) {
      let html = `<div><strong>${person.name}</strong> (ID: ${person.passport})<ul>`;
      person.clearances.forEach((c, i) => {
        html += `<li>${c} <button onclick="removeClearance('${person.passport}', ${i})">Entfernen</button></li>`;
      });
      html += `</ul></div><hr>`;
      container.innerHTML += html;
    }
  });
}

function removeClearance(passport, index) {
  const person = database.find(p => p.passport === passport);
  if (person) {
    person.clearances.splice(index, 1);
    saveData();
    renderClearances();
  }
}

document.getElementById("blacklistForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("blName").value.trim();
  const id = document.getElementById("blId").value.trim();
  const rank = document.getElementById("blRank").value.trim();
  const reason = document.getElementById("blReason").value.trim();
  const duration = parseInt(document.getElementById("blDuration").value);

  if (!name || !id || !rank || !reason || !duration) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + duration);

  blacklist.push({
    name: name,
    id: id,
    rank: rank,
    reason: reason,
    expiry: expiryDate.toISOString()
  });

  saveData();
  renderBlacklist();
  e.target.reset();
});

function renderBlacklist() {
  const container = document.getElementById("blacklistEntries");
  container.innerHTML = "";

  blacklist = blacklist.filter(entry => !isBlacklistExpired(entry));

  if (blacklist.length === 0) {
    container.innerHTML = "<p>Keine Blacklist-Einträge vorhanden.</p>";
    return;
  }

  blacklist.forEach((entry, index) => {
    container.innerHTML += `
      <div class="blacklist-entry">
        <strong>${entry.name}</strong> (ID: ${entry.id})<br>
        Rang: ${entry.rank}<br>
        Grund: ${entry.reason}<br>
        Ablauf in: ${daysLeft(entry.expiry)} Tag(e)<br>
        <button onclick="removeBlacklist(${index})">Entfernen</button>
      </div>
    `;
  });
}

function removeBlacklist(index) {
  blacklist.splice(index, 1);
  saveData();
  renderBlacklist();
}

function saveData() {
  localStorage.setItem("lspdDB", JSON.stringify(database));
  localStorage.setItem("lspdBL", JSON.stringify(blacklist));
}
