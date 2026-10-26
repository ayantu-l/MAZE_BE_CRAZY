
function updateNav() {
  const email = getSession();
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navUser = document.getElementById("nav-user");
  const avatar = document.getElementById("nav-avatar");

  if (navLogin) navLogin.hidden = email !== null;
  if (navRegister) navRegister.hidden = email !== null;
  if (navUser) navUser.hidden = email === null;

  if (email && avatar) {
    const user = getUsers().find(item => item.email === email);

    if (user) {
      avatar.textContent = user.fullName.charAt(0).toUpperCase();
      avatar.title = user.fullName;
    }
  }
}

function setupLogout() {
  const button = document.getElementById("logout-btn");

  if (button) {
    button.addEventListener("click", () => {
      clearSession();
      window.location.href = "index.html";
    });
  }
}

function showMessage(element, text, type) {
  if (!element) return;

  element.textContent = text;
  element.classList.remove("success", "failure");

  if (type) {
    element.classList.add(type);
  }
}

// Run on every page.
updateNav();
setupLogout();
