import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const welcomeMessage = document.getElementById("welcome-message");
const memberDetails = document.getElementById("member-details");
const viewIdCardButton = document.getElementById("view-id-card-btn");
const logoutButton = document.getElementById("logout-button");
const idCardModal = document.getElementById("idcard-modal");
const closeIdCardButton = document.getElementById("close-id-card-button");
const downloadIdCardButton = document.getElementById("download-id-card-button");
const idCardName = document.getElementById("idcard-name");
const idCardRole = document.getElementById("idcard-role");
const idCardMemberId = document.getElementById("idcard-member-id");
const idCardPhoto = document.getElementById("idcard-photo");
let currentMember = null;

function escapeText(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function renderIdCard(member) {
  currentMember = member;
  idCardName.textContent = `${member.firstName} ${member.lastName}`;
  idCardRole.textContent = `Role: ${member.role || 'member'}`;
  idCardMemberId.textContent = `ID: ${member.memberId || 'RHYC0000'}`;

  idCardPhoto.innerHTML = member.passportPhotoUrl
    ? `<img src="${member.passportPhotoUrl}" alt="Member photo" />`
    : `<span style="color:#64748b; font-weight:700;">Photo</span>`;
}

function openIdCard() {
  if (!currentMember) return;
  idCardModal.classList.add("open");
}

function closeIdCard() {
  idCardModal.classList.remove("open");
}

async function fetchImageDataUrl(url) {
  if (!url) return '';
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return '';
  }
}

function createIdCardSVG(member, photoDataUrl) {
  const fullName = `${escapeText(member.firstName)} ${escapeText(member.lastName)}`;
  const roleText = escapeText(member.role || 'member');
  const memberId = escapeText(member.memberId || 'RHYC0000');
  const photoBlock = photoDataUrl
    ? `<image x="52" y="162" width="196" height="236" href="${photoDataUrl}" preserveAspectRatio="xMidYMid slice" />`
    : `<text x="150" y="280" text-anchor="middle" fill="#64748b" font-family="Montserrat, sans-serif" font-size="16">PHOTO</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="640" viewBox="0 0 1100 640">
  <defs>
    <linearGradient id="frontBg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f4faf5"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="backBg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#fff9f4"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="540" height="580" x="30" y="30" rx="28" fill="url(#frontBg)" stroke="#1a6b3a" stroke-width="6" />
  <rect width="520" height="88" x="40" y="40" rx="22" fill="#1a6b3a" />
  <text x="70" y="92" fill="#fff" font-family="Montserrat, sans-serif" font-size="24" font-weight="800">Renewed Hope Youth Coalition</text>
  <text x="70" y="130" fill="#daf1d2" font-family="Montserrat, sans-serif" font-size="14" letter-spacing="0.2em">MEMBERSHIP CARD</text>
  <rect x="50" y="160" width="200" height="240" rx="20" fill="#e7edf3" />
  ${photoBlock}
  <text x="280" y="200" fill="#1f472e" font-family="Montserrat, sans-serif" font-size="22" font-weight="700">${fullName}</text>
  <text x="280" y="245" fill="#3b3b3b" font-family="Open Sans, sans-serif" font-size="18">${roleText}</text>
  <text x="280" y="290" fill="#3b3b3b" font-family="Open Sans, sans-serif" font-size="16">Member ID: ${memberId}</text>
  <text x="280" y="340" fill="#7b8b7b" font-family="Open Sans, sans-serif" font-size="14">National Coordinator</text>

  <rect width="520" height="580" x="560" y="30" rx="28" fill="url(#backBg)" stroke="#c0392b" stroke-width="6" />
  <text x="580" y="120" fill="#bb3f24" font-family="Montserrat, sans-serif" font-size="26" font-weight="700">PROPERTY NOTICE</text>
  <text x="580" y="170" fill="#3b3b3b" font-family="Open Sans, sans-serif" font-size="16">
    <tspan x="580" dy="1.6em">This membership ID card is a property of the renewed hope youth coalition.</tspan>
    <tspan x="580" dy="1.6em">Please protect this card and return it to RHYC if found.</tspan>
  </text>
  <text x="580" y="340" fill="#1f472e" font-family="Montserrat, sans-serif" font-size="18" font-weight="700">Bright Kenneth</text>
  <text x="580" y="370" fill="#475569" font-family="Open Sans, sans-serif" font-size="15">National coordinator</text>
</svg>`;
}

function svgToPng(svgText, width, height) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to convert SVG to PNG'));
        }
      }, 'image/png');
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}

async function downloadIdCard() {
  if (!currentMember) return;
  const photoDataUrl = currentMember.passportPhotoUrl ? await fetchImageDataUrl(currentMember.passportPhotoUrl) : '';
  const svg = createIdCardSVG(currentMember, photoDataUrl);
  const pngBlob = await svgToPng(svg, 1100, 640);
  const url = URL.createObjectURL(pngBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentMember.memberId || 'RHYC_ID_CARD'}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadMemberProfile(uid) {
  const snapshot = await getDoc(doc(db, 'members', uid));
  const member = snapshot.exists() ? snapshot.data() : null;
  if (!member) {
    welcomeMessage.textContent = 'Member record not found. Please log in again.';
    return;
  }
  currentMember = member;
  renderIdCard(member);
  welcomeMessage.textContent = `Welcome back, ${member.firstName || 'member'}!`;
  memberDetails.textContent = `Member ID: ${member.memberId || 'RHYC0000'} · ${member.isApcMemberBoolean ? 'APC member' : 'Non-APC member'} · ${member.stateOfResidence || 'Unknown location'}`;
}

function handleLogout() {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
}

function attachDashboardEvents() {
  if (viewIdCardButton) {
    viewIdCardButton.addEventListener('click', openIdCard);
  }
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  if (closeIdCardButton) {
    closeIdCardButton.addEventListener('click', closeIdCard);
  }
  if (downloadIdCardButton) {
    downloadIdCardButton.addEventListener('click', downloadIdCard);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachDashboardEvents();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    await loadMemberProfile(user.uid);
  });
});
