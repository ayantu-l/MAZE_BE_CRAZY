// everything is saved in the browsers local storage as json 
const USERS_KEY = "mbc_users";
const SCORES_KEY = "mbc_scores";
const SESSION_KEY = "mbc_session";
const MUTED_KEY = "mbc_muted";


// it reads a json value from local storage or return the fallback if it is missing or damaged
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

// saves a value in local storage as json
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// it gets the list of registered users
function getUsers() {
  return readJSON(USERS_KEY, []);
}

// it saves the list of registered users
function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

// get the list of top scores one per player
function getScores() {
  return readJSON(SCORES_KEY, []);
}

// save the list of top scores
function saveScores(scores) {
  writeJSON(SCORES_KEY, scores);
}

// get the email of the logged in user or null when nobody is logged in
function getSession() {
  return readJSON(SESSION_KEY, null);
}

// remember which user is logged in
function setSession(email) {
  writeJSON(SESSION_KEY, email);
}

// log the user out
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// whether the player switched the game sound off with the round button in the navigation bar
function isMuted() {
  return readJSON(MUTED_KEY, false);
}

// remember whether the sound is switched off
function setMuted(muted) {
  writeJSON(MUTED_KEY, muted);
}