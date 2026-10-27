// Shared by every page: navigation bar state, log out, sound button and form messages.
// Show Login/Register for visitors, or the avatar and Log out button for a signed-in user
function updateNav() {
  const sessionEmail = getSession();
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navUser = document.getElementById("nav-user");
  const avatar = document.getElementById("nav-avatar");

  if (sessionEmail === null) {
    if (navLogin) navLogin.hidden = false;
    if (navRegister) navRegister.hidden = false;
    if (navUser) navUser.hidden = true;
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email === sessionEmail);

  if (navLogin) navLogin.hidden = true;
  if (navRegister) navRegister.hidden = true;
  if (navUser) navUser.hidden = false;

  if (avatar && user) {
    avatar.textContent = user.fullName.charAt(0).toUpperCase();
    avatar.title = user.fullName;
  }
}

// Log out button forget the session and go back to the home page
function setupLogout() {
  const button = document.getElementById("logout-btn");
  if (!button) return;

  button.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}
// Round sound button remembers the choice, which the game reads when it starts and while it runs
function setupSoundToggle() {
  const button = document.getElementById("sound-toggle");
  if (!button) return;

  button.classList.toggle("off", isMuted());
  button.addEventListener("click", () => {
    setMuted(!isMuted());
    button.classList.toggle("off", isMuted());
  });
}

// Show a success or failure message in an element
function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.classList.remove("success", "failure");
  if (type) {
    element.classList.add(type);
  }
}

// Every page that loads this file gets the navigation bar, log out button and sound button
updateNav();
setupLogout();
setupSoundToggle();
document.body.classList.add("ready");
