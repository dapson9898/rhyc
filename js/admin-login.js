import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.example.js";
// import { firebaseConfig } from "./firebase-config.js";
// const response = await fetch('/api/config');
// const firebaseConfig = await response.json();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("admin-login-form");
const messageBox = document.getElementById("admin-message");

function showMessage(text, isError = true) {
  messageBox.textContent = text;
  messageBox.style.color = isError ? "#c0392b" : "#1f7a3a";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("Signing in...", false);

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snapshot = await getDoc(doc(db, "members", credential.user.uid));
    if (!snapshot.exists() || snapshot.data().role !== "admin") {
      await signOut(auth);
      showMessage("Access denied. Admin role required.");
      return;
    }
    window.location.href = "admin-dashboard.html";
  } catch (error) {
    showMessage(error.message || "Unable to login. Please try again.");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snapshot = await getDoc(doc(db, "members", user.uid));
  if (snapshot.exists() && snapshot.data().role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    await signOut(auth);
  }
});
