// registration page validates every field then saves the new user as json

const form = document.getElementById("register-form");
const registerButton = document.getElementById("register-btn");
const message = document.getElementById("form-message");

const nameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");

const nameError = document.getElementById("fullName-error");
const emailError = document.getElementById("email-error");
const phoneError = document.getElementById("phone-error");
const passwordError = document.getElementById("password-error");
const confirmError = document.getElementById("confirmPassword-error");

// remove every error message and red border from the form
function clearErrors() {
  nameError.textContent = "";
  emailError.textContent = "";
  phoneError.textContent = "";
  passwordError.textContent = "";
  confirmError.textContent = "";

  nameInput.classList.remove("invalid");
  emailInput.classList.remove("invalid");
  phoneInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
  confirmInput.classList.remove("invalid");

  showMessage(message, "", null);
}

// true when the text looks like an email address
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// accepts only UAE mobile numbers that starts with+971 or 05
function isValidPhone(value) {
  const digits = value.replace(/[\s-]/g, "");
  return /^(\+971|00971|05[024569])\d{7}$/.test(digits);
}

// true when the password has at least 8 characters, an uppercase letter, a lowercase letter and a number
function isValidPassword(value) {
  return value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value);
}

// it checks every field and shows a message under each one that is wrong returns true when all are valid
function validate() {
  let valid = true;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (name === "") {
    nameError.textContent = "Name is required.";
    nameInput.classList.add("invalid");
    valid = false;
  }

  if (email === "") {
    emailError.textContent = "Email is required.";
    emailInput.classList.add("invalid");
    valid = false;
  } else if (!isValidEmail(email)) {
    emailError.textContent = "Enter a valid email address.";
    emailInput.classList.add("invalid");
    valid = false;
  }

  if (phone === "") {
    phoneError.textContent = "Phone is required.";
    phoneInput.classList.add("invalid");
    valid = false;
  } else if (!isValidPhone(phone)) {
    phoneError.textContent = "Enter a UAE mobile number";
    phoneInput.classList.add("invalid");
    valid = false;
  }

  if (password === "") {
    passwordError.textContent = "Password is required.";
    passwordInput.classList.add("invalid");
    valid = false;
  } else if (!isValidPassword(password)) {
    passwordError.textContent =
      "Password must have at least 8 characters, an uppercase letter, a lowercase letter, and a number.";
    passwordInput.classList.add("invalid");
    valid = false;
  }

  if (confirm === "") {
    confirmError.textContent = "Please confirm your password.";
    confirmInput.classList.add("invalid");
    valid = false;
  } else if (confirm !== password) {
    confirmError.textContent = "Passwords do not match.";
    confirmInput.classList.add("invalid");
    valid = false;
  }

  return valid;
}
// runs these checks when join is clicked
registerButton.addEventListener("click", (event) => {
  event.preventDefault();
  clearErrors();

  if (!validate()) {
    return;
  }

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  const users = getUsers();

   // it doesn't allow two accounts to use the same email
  if (users.some(user => user.email === email)) {
    emailError.textContent = "An account with that email already exists.";
    emailInput.classList.add("invalid");
    showMessage(message, "Please use a different email address.", "failure");
    return;
  }

  users.push({
    fullName: fullName,
    email: email,
    phone: phone,
    password: password
  });

  saveUsers(users);

  showMessage(message, "Account created. Redirecting to login...", "success");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
});

registerButton.addEventListener("click", handleRegister);

// Pressing Enter in an input also runs the same checks.
form.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleRegister();
  }
});
