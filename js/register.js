import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, collection, doc, query, orderBy, limit, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";
// import { firebaseConfig } from "./firebase-config.example.js";
// import { firebaseConfig } from "./firebase-config.js";
const response = await fetch('./firebase-config.example.js');
const firebaseConfig = await response.json();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const signupForm = document.getElementById("signup-form");
const messageBox = document.getElementById("message");

function showMessage(text, type = "success") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.style.display = "block";
}

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateMemberId() {
  const membersRef = collection(db, "members");
  const latestMemberQuery = query(membersRef, orderBy("memberId", "desc"), limit(1));
  const snapshot = await getDocs(latestMemberQuery);
  if (snapshot.empty) {
    return "RHYC0001";
  }
  const lastMemberId = snapshot.docs[0].data().memberId || "RHYC0000";
  const match = lastMemberId.match(/RHYC0*([0-9]+)/i);
  const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
  return `RHYC${String(nextNumber).padStart(4, "0")}`;
}

async function uploadPassportPhoto(uid, file) {
  const filename = `${uid}_${Date.now()}_${file.name}`;
  const photoRef = storageRef(storage, `passport_photos/${filename}`);
  await uploadBytes(photoRef, file);
  return await getDownloadURL(photoRef);
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("Creating account...", "success");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const otherNames = document.getElementById("otherNames").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const stateOfResidence = document.getElementById("stateOfResidence").value.trim();
  const stateOfOrigin = document.getElementById("stateOfOrigin").value.trim();
  const localGovernment = document.getElementById("localGovernment").value.trim();
  const ninNationalIDNumber = document.getElementById("ninNationalIDNumber").value.trim();
  const isApcMemberBoolean = document.getElementById("isApcMemberBoolean").value === "true";
  const passportPhotoFileupload = document.getElementById("passportPhotoFileupload").files[0];

  if (!email || !password || !firstName || !lastName || !phoneNumber || !stateOfResidence || !stateOfOrigin || !localGovernment || !ninNationalIDNumber || !document.getElementById("isApcMemberBoolean").value) {
    showMessage("Please fill in all required fields before continuing.", "error");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const memberId = await generateMemberId();
    const passwordHash = await hashPassword(password);
    let passportPhotoUrl = "";

    if (passportPhotoFileupload) {
      passportPhotoUrl = "./rhyc.png";
    }

    await setDoc(doc(db, "members", uid), {
      email,
      firstName,
      lastName,
      otherNames,
      phoneNumber,
      nationality,
      stateOfResidence,
      stateOfOrigin,
      localGovernment,
      ninNationalIDNumber,
      isApcMemberBoolean,
      passportPhotoUrl,
      passwordHash,
      memberId,
      role: "member",
      isActive: true,
      dateJoined: serverTimestamp()
    });

    showMessage(`Registration successful! Your member ID is ${memberId}. Redirecting to login...`, "success");
    signupForm.reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2200);
  } catch (error) {
    showMessage(error.message || "Unable to create account.", "error");
  }
});
