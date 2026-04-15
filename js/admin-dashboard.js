import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmailText = document.getElementById("admin-email-text");
const membersTableBody = document.getElementById("members-table-body");
const refreshButton = document.getElementById("refresh-members");
const logoutButton = document.getElementById("logout-btn");
const editModal = document.getElementById("edit-modal");
const closeModalButton = document.getElementById("close-modal");
const editMessage = document.getElementById("edit-message");
const passwordMessage = document.getElementById("password-message");
const passwordForm = document.getElementById("password-form");
const searchInput = document.getElementById("member-search");
const pageSizeSelect = document.getElementById("page-size");
const paginationInfo = document.getElementById("pagination-info");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");

const editFields = {
  email: document.getElementById("edit-email"),
  memberId: document.getElementById("edit-memberId"),
  firstName: document.getElementById("edit-firstName"),
  lastName: document.getElementById("edit-lastName"),
  otherNames: document.getElementById("edit-otherNames"),
  phoneNumber: document.getElementById("edit-phoneNumber"),
  nationality: document.getElementById("edit-nationality"),
  stateOfResidence: document.getElementById("edit-stateOfResidence"),
  stateOfOrigin: document.getElementById("edit-stateOfOrigin"),
  localGovernment: document.getElementById("edit-localGovernment"),
  ninNationalIDNumber: document.getElementById("edit-ninNationalIDNumber"),
  isApcMemberBoolean: document.getElementById("edit-isApcMemberBoolean"),
  role: document.getElementById("edit-role"),
  isActive: document.getElementById("edit-isActive"),
  passportPhotoUrl: document.getElementById("edit-passportPhotoUrl"),
  dateJoined: document.getElementById("edit-dateJoined")
};

let memberRecords = {};
let filteredMemberIds = [];
let currentEditUid = null;
let currentPage = 1;
let pageSize = Number(pageSizeSelect.value) || 10;

function showPasswordMessage(text, isError = false) {
  passwordMessage.textContent = text;
  passwordMessage.className = isError ? 'error' : 'message';
}

function showEditMessage(text, isError = false) {
  editMessage.textContent = text;
  editMessage.className = isError ? 'error' : 'message';
}

async function loadMembers() {
  membersTableBody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading members...</td></tr>';
  const snapshot = await getDocs(collection(db, "members"));
  memberRecords = {};
  snapshot.forEach((docItem) => {
    memberRecords[docItem.id] = docItem.data();
  });
  applyFilters();
  renderMembers();
}

function applyFilters() {
  const searchText = searchInput.value.trim().toLowerCase();
  const entries = Object.entries(memberRecords);
  filteredMemberIds = entries
    .filter(([uid, member]) => {
      if (!searchText) return true;
      const values = [
        member.firstName,
        member.lastName,
        member.otherNames,
        member.email,
        member.memberId,
        member.role,
        member.stateOfResidence,
        member.stateOfOrigin,
        member.localGovernment,
        member.ninNationalIDNumber
      ].filter(Boolean).join(' ').toLowerCase();
      return values.includes(searchText);
    })
    .map(([uid]) => uid);
  currentPage = 1;
}

function renderMembers() {
  pageSize = Number(pageSizeSelect.value) || 10;
  const total = filteredMemberIds.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > pageCount) currentPage = pageCount;
  const start = (currentPage - 1) * pageSize;
  const currentIds = filteredMemberIds.slice(start, start + pageSize);

  if (!currentIds.length) {
    membersTableBody.innerHTML = '<tr><td colspan="6" class="table-empty">No registered members found.</td></tr>';
  } else {
    membersTableBody.innerHTML = currentIds.map((uid) => {
      const member = memberRecords[uid];
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed Member';
      const roleClass = member.role === 'admin' ? 'admin' : 'member';
      return `
        <tr>
          <td>${fullName}</td>
          <td>${member.email || ''}</td>
          <td>${member.memberId || ''}</td>
          <td><span class="pill ${roleClass}">${member.role || 'member'}</span></td>
          <td><span class="pill ${member.isActive ? 'active' : 'inactive'}">${member.isActive ? 'Enabled' : 'Disabled'}</span></td>
          <td>
            <div class="member-actions">
              <button class="btn-secondary view-btn" data-uid="${uid}">View</button>
              <button class="btn-secondary edit-btn" data-uid="${uid}">Edit</button>
              <button class="btn-primary toggle-btn" data-uid="${uid}" data-active="${member.isActive}">${member.isActive ? 'Disable' : 'Enable'}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  paginationInfo.textContent = `Page ${currentPage} of ${pageCount} | ${total} member${total === 1 ? '' : 's'}`;
  prevPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pageCount;
}

function formatDateJoined(value) {
  if (!value) return '';
  if (value.toDate) {
    return value.toDate().toLocaleString();
  }
  return new Date(value).toLocaleString();
}

function openEditModal(uid) {
  const member = memberRecords[uid];
  if (!member) return;
  currentEditUid = uid;
  document.getElementById("edit-member-email").textContent = member.email || 'Member email not available';
  editFields.email.value = member.email || '';
  editFields.memberId.value = member.memberId || '';
  editFields.firstName.value = member.firstName || '';
  editFields.lastName.value = member.lastName || '';
  editFields.otherNames.value = member.otherNames || '';
  editFields.phoneNumber.value = member.phoneNumber || '';
  editFields.nationality.value = member.nationality || '';
  editFields.stateOfResidence.value = member.stateOfResidence || '';
  editFields.stateOfOrigin.value = member.stateOfOrigin || '';
  editFields.localGovernment.value = member.localGovernment || '';
  editFields.ninNationalIDNumber.value = member.ninNationalIDNumber || '';
  editFields.isApcMemberBoolean.value = String(member.isApcMemberBoolean || false);
  editFields.role.value = member.role || 'member';
  editFields.isActive.value = String(member.isActive ?? true);
  editFields.passportPhotoUrl.value = member.passportPhotoUrl || '';
  editFields.dateJoined.value = formatDateJoined(member.dateJoined);
  showEditMessage('');
  editModal.classList.add('open');
}

async function saveMemberChanges(event) {
  event.preventDefault();
  if (!currentEditUid) return;
  showEditMessage('Saving changes...', false);

  const updates = {
    email: editFields.email.value.trim(),
    memberId: editFields.memberId.value.trim(),
    firstName: editFields.firstName.value.trim(),
    lastName: editFields.lastName.value.trim(),
    otherNames: editFields.otherNames.value.trim(),
    phoneNumber: editFields.phoneNumber.value.trim(),
    nationality: editFields.nationality.value.trim(),
    stateOfResidence: editFields.stateOfResidence.value.trim(),
    stateOfOrigin: editFields.stateOfOrigin.value.trim(),
    localGovernment: editFields.localGovernment.value.trim(),
    ninNationalIDNumber: editFields.ninNationalIDNumber.value.trim(),
    isApcMemberBoolean: editFields.isApcMemberBoolean.value === 'true',
    role: editFields.role.value,
    isActive: editFields.isActive.value === 'true',
    passportPhotoUrl: editFields.passportPhotoUrl.value.trim()
  };

  try {
    await updateDoc(doc(db, "members", currentEditUid), updates);
    memberRecords[currentEditUid] = { ...memberRecords[currentEditUid], ...updates };
    applyFilters();
    renderMembers();
    showEditMessage('Member profile updated successfully.', false);
  } catch (error) {
    showEditMessage(error.message || 'Unable to update member.', true);
  }
}

async function toggleActive(uid, currentState) {
  try {
    await updateDoc(doc(db, "members", uid), { isActive: !currentState });
    memberRecords[uid].isActive = !currentState;
    renderMembers();
  } catch (error) {
    alert(error.message || 'Unable to change status.');
  }
}

function attachTableEvents() {
  membersTableBody.addEventListener('click', (event) => {
    const viewButton = event.target.closest('.view-btn');
    const editButton = event.target.closest('.edit-btn');
    const toggleButton = event.target.closest('.toggle-btn');
    if (viewButton) {
      openViewModal(viewButton.dataset.uid);
    }
    if (editButton) {
      openEditModal(editButton.dataset.uid);
    }
    if (toggleButton) {
      toggleActive(toggleButton.dataset.uid, toggleButton.dataset.active === 'true');
    }
  });
}

function openViewModal(uid) {
  const member = memberRecords[uid];
  if (!member) return;
  document.getElementById('view-member-email').textContent = member.email || 'Member details from the database.';
  document.getElementById('view-passport-photo').src = member.passportPhotoUrl || 'https://via.placeholder.com/320x320?text=No+Photo';
  document.getElementById('view-name').textContent = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed Member';
  document.getElementById('view-email').textContent = member.email || '';
  document.getElementById('view-memberId').textContent = member.memberId || '';
  document.getElementById('view-role').textContent = member.role || 'member';
  document.getElementById('view-status').textContent = member.isActive ? 'Enabled' : 'Disabled';
  document.getElementById('view-phone').textContent = member.phoneNumber || '';
  document.getElementById('view-nationality').textContent = member.nationality || '';
  document.getElementById('view-stateOfResidence').textContent = member.stateOfResidence || '';
  document.getElementById('view-stateOfOrigin').textContent = member.stateOfOrigin || '';
  document.getElementById('view-localGovernment').textContent = member.localGovernment || '';
  document.getElementById('view-ninNationalIDNumber').textContent = member.ninNationalIDNumber || '';
  document.getElementById('view-isApcMemberBoolean').textContent = member.isApcMemberBoolean ? 'Yes' : 'No';
  document.getElementById('view-dateJoined').textContent = formatDateJoined(member.dateJoined);
  document.getElementById('view-modal').classList.add('open');
}

function attachPageEvents() {
  if (refreshButton) {
    refreshButton.addEventListener('click', loadMembers);
  }
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'admin-login.html';
    });
  }
  if (closeModalButton) {
    closeModalButton.addEventListener('click', () => editModal.classList.remove('open'));
  }
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
      renderMembers();
    });
  }
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', () => {
      currentPage = 1;
      renderMembers();
    });
  }
  if (prevPageButton) {
    prevPageButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderMembers();
      }
    });
  }
  if (nextPageButton) {
    nextPageButton.addEventListener('click', () => {
      const total = filteredMemberIds.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage < pageCount) {
        currentPage += 1;
        renderMembers();
      }
    });
  }
  document.getElementById('close-view-modal').addEventListener('click', () => {
    document.getElementById('view-modal').classList.remove('open');
  });
  document.getElementById('save-member').addEventListener('click', saveMemberChanges);
}

document.addEventListener('DOMContentLoaded', () => {
  attachPageEvents();
  attachTableEvents();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'admin-login.html';
      return;
    }

    const snapshot = await getDoc(doc(db, 'members', user.uid));
    if (!snapshot.exists() || snapshot.data().role !== 'admin') {
      await signOut(auth);
      window.location.href = 'admin-login.html';
      return;
    }

    adminEmailText.textContent = `Logged in as ${user.email}`;
    await loadMembers();
  });
});
