// Storage helpers: everything is saved in the browser's local storage as JSON.
const USERS_KEY = "mbc_users";
const SCORES_KEY = "mbc_scores";
const SESSION_KEY = "mbc_session";
const MUTED_KEY = "mbc_muted";


// Read a JSON value from local storage, or return the fallback if it is missing or damaged
function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

// Save a value in local storage as JSON
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Get the list of registered users
function getUsers() {
  return readJSON(USERS_KEY, []);
}

// Save the list of registered users
function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

// Get the list of top scores, one per player
function getScores() {
  return readJSON(SCORES_KEY, []);
}

// Save the list of top scores
function saveScores(scores) {
  writeJSON(SCORES_KEY, scores);
}

// Get the email of the logged-in user, or null when nobody is logged in
function getSession() {
  return readJSON(SESSION_KEY, null);
}

// Remember which user is logged in
function setSession(email) {
  writeJSON(SESSION_KEY, email);
}

// Log the user out
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Whether the player switched the game sound off with the round button in the navigation bar
function isMuted() {
  return readJSON(MUTED_KEY, false);
}

// Remember whether the sound is switched off
function setMuted(muted) {
  writeJSON(MUTED_KEY, muted);
}