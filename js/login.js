// Login page: checks the details and gives a specific message for each problem.

const form = document.getElementById("login-form");
const message = document.getElementById("form-message");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

// Remove every error message and red border from the form
function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  emailInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
  showMessage(message, "", null);
}

// Check that both boxes are filled in; returns true when they are
function validate() {
  let valid = true;

  if (emailInput.value.trim() === "") {
    emailError.textContent = "Email is required.";
    emailInput.classList.add("invalid");
    valid = false;
  }

  if (passwordInput.value === "") {
    passwordError.textContent = "Password is required.";
    passwordInput.classList.add("invalid");
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  if (!validate()) {
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  const users = getUsers();
  const user = users.find(registered => registered.email === email);

  if (!user) {
    showMessage(message, "No account found with that email.", "failure");
    return;
  }

  if (user.password !== password) {
    showMessage(message, "Incorrect password.", "failure");
    return;
  }

  setSession(user.email);
  showMessage(message, "Login successful. Redirecting...", "success");

  setTimeout(() => {
    window.location.href = "game.html";
  }, 800);
});
