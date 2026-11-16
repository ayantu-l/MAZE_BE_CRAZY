// checks the logindetails and gives a specific message for each problem

const form = document.getElementById("login-form");
const loginButton = document.getElementById("login-btn");
const message = document.getElementById("form-message");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

// removs every error message and red border from the form
function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  emailInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
  showMessage(message, "", null);
}

// check that both boxes are filled in and returns true when they are
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
// run these checks when login is clicked
loginButton.addEventListener("click", (event) => {
  event.preventDefault();
  clearErrors();

  if (!validate()) {
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

   //it find the account with the entered email
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

loginButton.addEventListener("click", handleLogin);

// Pressing Enter in an input also runs the same checks.
form.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleLogin();
  }
});
