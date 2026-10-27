// Rankings pag lists every player's top score, loaded from local storage, highest first.

const tableBody = document.getElementById("rankings-body");
const message = document.getElementById("rankings-message");
const scores = [...getScores()].sort((first, second) => second.score - first.score);

if (scores.length === 0) {
  message.textContent = "No scores yet. Be the first to play.";
}

scores.forEach((entry, index) => {
  const row = document.createElement("tr");
  // textContent is used so a player's name can never inject HTML
  [index + 1, entry.name, entry.score].forEach((value) => {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });
  tableBody.appendChild(row);
});