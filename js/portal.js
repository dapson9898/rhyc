import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.example.js";
// import { firebaseConfig } from "./firebase-config.js";
// const response = await fetch('/api/config');
// const firebaseConfig = await response.json();


// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
// import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// let firebaseConfig;
// try {
//   const response = await fetch('/api/config');
//   if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
//   firebaseConfig = await response.json();
// } catch (error) {
//   console.error('Failed to load Firebase config:', error);
//   alert('Failed to initialize app. Please try again later.');
//   throw error;
// }

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showAlert(message) {
  alert(message);
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showAlert('Please enter your email and password.');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    showAlert(error.message || 'Unable to sign in. Please check your credentials.');
  }
}

function handleHowToJoin() {
  showAlert('For membership guidance, please contact RHYC support or complete the membership registration form.');
}

function handlePrintID() {
  showAlert('Please login and visit your dashboard to access a printable ID card.');
}

function handleResources() {
  showAlert('Redirecting to admin resources.');
  window.location.href = "admin-login.html";
}

function attachEvents() {
  const loginButton = document.getElementById("login-button");
  const howToJoinButton = document.getElementById("how-to-join-button");
  const printIdButton = document.getElementById("print-id-button");
  const resourcesButton = document.getElementById("resources-button");
  const registerButton = document.getElementById("register-button");

  if (loginButton) {
    loginButton.addEventListener("click", handleLogin);
  }
  if (registerButton) {
    registerButton.addEventListener("click", () => {
      window.location.href = "create.html";
    });
  }
  if (howToJoinButton) {
    howToJoinButton.addEventListener("click", handleHowToJoin);
  }
  if (printIdButton) {
    printIdButton.addEventListener("click", handlePrintID);
  }
  if (resourcesButton) {
    resourcesButton.addEventListener("click", handleResources);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });
});
