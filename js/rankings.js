// Rankings pag lists every players top score loaded from local storage and highest first

const tableBody = document.getElementById("rankings-body");
const tableWrap = document.querySelector(".table-wrap");
const message = document.getElementById("rankings-message");
const scores = [...getScores()].sort((first, second) => second.score - first.score);
const sessionEmail = getSession();

if (sessionEmail === null) {
  // it hides from guest table and ask them to log in
  tableWrap.hidden = true;
  message.textContent = "Log in to see the rankings.";
} else if (scores.length === 0) {
  message.textContent = "No scores yet. Be the first to play.";
}

scores.forEach((entry, index) => {
  const row = document.createElement("tr");
  if (entry.email === sessionEmail) {
    row.classList.add("own-score");
  }
  // textContent is used so a players name can never inject html
  [index + 1, entry.name, entry.score].forEach((value) => {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });
  tableBody.appendChild(row);
});