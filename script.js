/**
 * ==============================================================================
 * EduTrack - Student Management System (Full-Stack Edition)
 * Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3
 * Backend: Python Django + Django REST Framework (DRF)
 * Database: SQLite
 * Features:
 *   - REST API Integration (GET, POST, PUT, DELETE /api/students/)
 *   - Real-time Server & Client Form Validation
 *   - Duplicate ID & Duplicate Email Validation
 *   - Live Search & Multi-criteria Filtering
 *   - Custom Accessible Modals & Toast Alerts
 *   - CSV Export & Resilient Offline Caching
 * ==============================================================================
 */

// Determine API Base URL dynamically (supports local file, live server, or Django server)
const API_BASE_URL = window.location.protocol.startsWith('http') && !window.location.port.includes('5500') && !window.location.port.includes('3000')
  ? `${window.location.origin}/api/students/`
  : 'http://127.0.0.1:8000/api/students/';

const STORAGE_KEY = 'sms_students_data_backup';

// Fallback seed data in case backend is started fresh
const DEFAULT_STUDENTS = [
  {
    student_id: 'STU1001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    phone: '9876543210',
    department: 'Computer Science',
    year: '3rd Year',
    gender: 'Male'
  },
  {
    student_id: 'STU1002',
    name: 'Ananya Patel',
    email: 'ananya.p@college.edu',
    phone: '9812345678',
    department: 'Information Technology',
    year: '2nd Year',
    gender: 'Female'
  },
  {
    student_id: 'STU1003',
    name: 'Rohan Verma',
    email: 'rohan.v@college.edu',
    phone: '9765432109',
    department: 'Electronics & Communication',
    year: '4th Year',
    gender: 'Male'
  },
  {
    student_id: 'STU1004',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@college.edu',
    phone: '9654321098',
    department: 'Computer Science',
    year: '1st Year',
    gender: 'Female'
  },
  {
    student_id: 'STU1005',
    name: 'Vikram Singh',
    email: 'vikram.singh@college.edu',
    phone: '9543210987',
    department: 'Mechanical Engineering',
    year: '3rd Year',
    gender: 'Male'
  },
  {
    student_id: 'STU1006',
    name: 'Neha Roy',
    email: 'neha.roy@college.edu',
    phone: '9432109876',
    department: 'Civil Engineering',
    year: '2nd Year',
    gender: 'Female'
  }
];

// Application State
let students = [];
let pendingDeleteId = null;
let isBackendConnected = false;

// ==============================================================================
// DOM Element References
// ==============================================================================
const statTotalCount = document.getElementById('stat-total-count');
const statDeptCount = document.getElementById('stat-dept-count');
const statMaleCount = document.getElementById('stat-male-count');
const statFemaleCount = document.getElementById('stat-female-count');

const studentTableBody = document.getElementById('student-table-body');
const emptyState = document.getElementById('empty-state');
const emptyStateText = document.getElementById('empty-state-text');
const filteredCount = document.getElementById('filtered-count');

// Search and Filter controls
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const filterDepartment = document.getElementById('filter-department');
const filterYear = document.getElementById('filter-year');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Modal Elements - Add/Edit
const studentModal = document.getElementById('student-modal');
const studentForm = document.getElementById('student-form');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalIcon = document.getElementById('modal-icon');
const submitBtnText = document.getElementById('submit-btn-text');
const btnOpenAddModal = document.getElementById('btn-open-add-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnEmptyAction = document.getElementById('btn-empty-action');

// Form Input Elements
const editModeFlag = document.getElementById('edit-mode-flag');
const originalStudentId = document.getElementById('original-student-id');
const inputStudentId = document.getElementById('student-id');
const inputStudentName = document.getElementById('student-name');
const inputStudentEmail = document.getElementById('student-email');
const inputStudentPhone = document.getElementById('student-phone');
const inputStudentDept = document.getElementById('student-department');
const inputStudentYear = document.getElementById('student-year');

// Modal Elements - Delete Confirmation
const deleteModal = document.getElementById('delete-modal');
const deleteStudentName = document.getElementById('delete-student-name');
const deleteStudentId = document.getElementById('delete-student-id');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Footer status elements
const apiStatusDot = document.getElementById('api-status-dot');
const apiStatusText = document.getElementById('api-status-text');
const btnSeedData = document.getElementById('btn-seed-data');
const btnExportCsv = document.getElementById('btn-export-csv');
const toastContainer = document.getElementById('toast-container');

// ==============================================================================
// Initialization & Backend Synchronization
// ==============================================================================

/**
 * Initialize application: load students from Django REST API with offline fallback
 */
async function initApp() {
  setupEventListeners();
  await loadStudents();
}

/**
 * Update system status indicator in the UI footer
 */
function updateApiStatus(connected, message = '') {
  isBackendConnected = connected;
  if (!apiStatusDot || !apiStatusText) return;

  if (connected) {
    apiStatusDot.style.backgroundColor = '#10b981'; // Green
    apiStatusDot.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.25)';
    apiStatusText.textContent = message || 'Django REST API Connected (SQLite)';
  } else {
    apiStatusDot.style.backgroundColor = '#f59e0b'; // Amber/Orange
    apiStatusDot.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.25)';
    apiStatusText.textContent = message || 'Offline Fallback (LocalStorage)';
  }
}

/**
 * Fetch students list from Django REST API: GET /api/students/
 */
async function loadStudents() {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    students = normalizeStudentRecords(data);
    
    // Cache in localStorage for offline resilience
    saveToLocalStorageBackup(students);
    updateApiStatus(true, 'Django REST API Connected (SQLite)');

  } catch (error) {
    console.warn('Backend API unavailable. Falling back to local storage cache:', error.message);
    updateApiStatus(false, 'Server Offline (Using LocalStorage)');
    loadFromLocalStorageBackup();
    showToast(
      'Server Notice',
      'Django backend not detected. Run "python manage.py runserver" to connect API.',
      'info'
    );
  }

  updateDashboard();
  renderStudentTable();
}

/**
 * Standardize student objects (handle both backend field names and local fields)
 */
function normalizeStudentRecords(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    id: item.student_id || item.id,
    student_id: item.student_id || item.id,
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    department: item.department || '',
    year: item.year || '',
    gender: item.gender || 'Other'
  }));
}

/**
 * Save to LocalStorage Backup
 */
function saveToLocalStorageBackup(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage backup error:', e);
  }
}

/**
 * Load from LocalStorage Backup if backend is offline
 */
function loadFromLocalStorageBackup() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      students = normalizeStudentRecords(JSON.parse(cached));
    } catch (e) {
      students = normalizeStudentRecords(DEFAULT_STUDENTS);
    }
  } else {
    students = normalizeStudentRecords(DEFAULT_STUDENTS);
    saveToLocalStorageBackup(students);
  }
}

// ==============================================================================
// Dashboard Statistics Calculator
// ==============================================================================
function updateDashboard() {
  const total = students.length;
  statTotalCount.textContent = total;

  // Distinct departments count with enrolled students
  const activeDepartments = new Set(students.map(s => s.department).filter(Boolean));
  statDeptCount.textContent = activeDepartments.size;

  // Gender counts
  const maleCount = students.filter(s => (s.gender || '').toLowerCase() === 'male').length;
  const femaleCount = students.filter(s => (s.gender || '').toLowerCase() === 'female').length;

  statMaleCount.textContent = maleCount;
  statFemaleCount.textContent = femaleCount;
}

// ==============================================================================
// Helper Functions (Badges, Initials, Formatting)
// ==============================================================================

function getDeptBadgeClass(dept) {
  switch (dept) {
    case 'Computer Science':
      return 'dept-cs';
    case 'Information Technology':
      return 'dept-it';
    case 'Electronics & Communication':
      return 'dept-ece';
    case 'Mechanical Engineering':
      return 'dept-me';
    case 'Civil Engineering':
      return 'dept-ce';
    default:
      return 'badge-light';
  }
}

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==============================================================================
// Render Table & Filter Logic
// ==============================================================================

function getFilteredStudents() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const selectedDept = filterDepartment.value;
  const selectedYear = filterYear.value;

  return students.filter(student => {
    const sId = (student.student_id || student.id || '').toLowerCase();
    const sName = (student.name || '').toLowerCase();
    const sEmail = (student.email || '').toLowerCase();
    const sPhone = (student.phone || '').toLowerCase();

    // Search query match (ID, Name, Email, or Phone)
    const matchesSearch = 
      !searchQuery ||
      sId.includes(searchQuery) ||
      sName.includes(searchQuery) ||
      sEmail.includes(searchQuery) ||
      sPhone.includes(searchQuery);

    // Department match
    const matchesDept = selectedDept === 'ALL' || student.department === selectedDept;

    // Year match
    const matchesYear = selectedYear === 'ALL' || student.year === selectedYear;

    return matchesSearch && matchesDept && matchesYear;
  });
}

function renderStudentTable() {
  const filtered = getFilteredStudents();

  // Update filtered counter badge
  filteredCount.textContent = `Showing ${filtered.length} of ${students.length} students`;

  // Toggle clear search button
  searchClearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';

  // Empty state check
  if (filtered.length === 0) {
    studentTableBody.innerHTML = '';
    emptyState.style.display = 'block';

    if (students.length === 0) {
      emptyStateText.textContent = 'No students registered in the database yet. Click below to add your first student!';
    } else {
      emptyStateText.textContent = 'No student records match your active search or filter criteria.';
    }
    return;
  }

  emptyState.style.display = 'none';

  // Render rows
  studentTableBody.innerHTML = filtered.map(student => {
    const sId = student.student_id || student.id;
    const initials = getInitials(student.name);
    const deptClass = getDeptBadgeClass(student.department);

    const genderIcon = 
      student.gender === 'Male' 
        ? '<i class="fa-solid fa-person" style="color: #0284c7;"></i>' 
        : student.gender === 'Female' 
        ? '<i class="fa-solid fa-person-dress" style="color: #db2777;"></i>' 
        : '<i class="fa-solid fa-genderless" style="color: #64748b;"></i>';

    return `
      <tr>
        <td>
          <span class="student-id-badge">${escapeHtml(sId)}</span>
        </td>
        <td>
          <div class="student-user-cell">
            <div class="user-avatar">${initials}</div>
            <div class="user-name-title">${escapeHtml(student.name)}</div>
          </div>
        </td>
        <td>${escapeHtml(student.email)}</td>
        <td>${escapeHtml(student.phone)}</td>
        <td>
          <span class="department-badge ${deptClass}">
            <i class="fa-solid fa-circle" style="font-size: 6px;"></i>
            ${escapeHtml(student.department)}
          </span>
        </td>
        <td>
          <span class="year-badge">${escapeHtml(student.year)}</span>
        </td>
        <td>
          <span class="gender-indicator">
            ${genderIcon}
            ${escapeHtml(student.gender)}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button 
              class="btn-action btn-action-edit" 
              onclick="openEditStudentModal('${escapeHtml(sId)}')" 
              title="Edit Student"
              aria-label="Edit student ${escapeHtml(student.name)}"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button 
              class="btn-action btn-action-delete" 
              onclick="openDeleteConfirmation('${escapeHtml(sId)}')" 
              title="Delete Student"
              aria-label="Delete student ${escapeHtml(student.name)}"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// Form Validation Logic (Client-Side & Server Error Mapping)
// ==============================================================================

function clearValidationErrors() {
  const errorElements = document.querySelectorAll('.error-text');
  errorElements.forEach(el => el.textContent = '');

  const inputWrappers = document.querySelectorAll('.input-with-icon');
  inputWrappers.forEach(wrap => wrap.classList.remove('has-error'));
}

function setFieldError(fieldId, errorMsg) {
  const errorEl = document.getElementById(`error-${fieldId}`);
  const inputEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = errorMsg;
  }
  if (inputEl && inputEl.closest('.input-with-icon')) {
    inputEl.closest('.input-with-icon').classList.add('has-error');
  }
}

/**
 * Maps Django REST Framework validation errors directly to form inputs
 */
function displayServerValidationErrors(errors) {
  clearValidationErrors();
  let firstErrorMessage = 'Please resolve the highlighted errors.';

  // Mapping from backend model fields to HTML form IDs
  const fieldMapping = {
    student_id: 'student-id',
    name: 'student-name',
    email: 'student-email',
    phone: 'student-phone',
    department: 'student-department',
    year: 'student-year',
    gender: 'student-gender',
    non_field_errors: null
  };

  for (const [field, messages] of Object.entries(errors)) {
    const errorText = Array.isArray(messages) ? messages[0] : String(messages);
    const formFieldId = fieldMapping[field];

    if (formFieldId) {
      setFieldError(formFieldId, errorText);
    }
    firstErrorMessage = errorText;
  }

  showToast('Validation Error', firstErrorMessage, 'error');
}

/**
 * Client-Side Pre-validation
 */
function validateStudentForm() {
  clearValidationErrors();
  let isValid = true;

  const idVal = inputStudentId.value.trim();
  const nameVal = inputStudentName.value.trim();
  const emailVal = inputStudentEmail.value.trim();
  const phoneVal = inputStudentPhone.value.trim();
  const deptVal = inputStudentDept.value;
  const yearVal = inputStudentYear.value;
  const isEditMode = editModeFlag.value === 'true';
  const originalId = originalStudentId.value;

  // 1. Student ID
  if (!idVal) {
    setFieldError('student-id', 'Student ID is required');
    isValid = false;
  } else if (!/^[a-zA-Z0-9_-]{3,20}$/.test(idVal)) {
    setFieldError('student-id', '3-20 alphanumeric characters (hyphens allowed)');
    isValid = false;
  } else {
    // Client-side unique check against loaded students
    const idExists = students.some(s => (s.student_id || s.id).toLowerCase() === idVal.toLowerCase());
    if (isEditMode) {
      if (idVal.toLowerCase() !== originalId.toLowerCase() && idExists) {
        setFieldError('student-id', 'A student with this Student ID already exists');
        isValid = false;
      }
    } else if (idExists) {
      setFieldError('student-id', 'Student ID already registered');
      isValid = false;
    }
  }

  // 2. Student Name (Contains only student's name)
  if (!nameVal) {
    setFieldError('student-name', 'Student Name is required');
    isValid = false;
  } else if (nameVal.length < 2) {
    setFieldError('student-name', 'Name must be at least 2 characters');
    isValid = false;
  } else if (!/^[a-zA-Z\s.'-]+$/.test(nameVal)) {
    setFieldError('student-name', 'Name should contain only letters and spaces');
    isValid = false;
  }

  // 3. Email Address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailVal) {
    setFieldError('student-email', 'Email address is required');
    isValid = false;
  } else if (!emailRegex.test(emailVal)) {
    setFieldError('student-email', 'Please enter a valid email address');
    isValid = false;
  } else {
    // Client-side unique email check
    const emailExists = students.some(s => 
      s.email.toLowerCase() === emailVal.toLowerCase() && 
      (isEditMode ? (s.student_id || s.id).toLowerCase() !== originalId.toLowerCase() : true)
    );
    if (emailExists) {
      setFieldError('student-email', 'A student with this Email already exists');
      isValid = false;
    }
  }

  // 4. Phone Number (10 to 14 digits)
  const cleanPhone = phoneVal.replace(/[\s\-()]/g, '');
  if (!phoneVal) {
    setFieldError('student-phone', 'Phone number is required');
    isValid = false;
  } else if (!/^\d{10,14}$/.test(cleanPhone)) {
    setFieldError('student-phone', 'Please enter a valid 10-14 digit phone number');
    isValid = false;
  }

  // 5. Department
  if (!deptVal) {
    setFieldError('student-department', 'Please select a department');
    isValid = false;
  }

  // 6. Academic Year
  if (!yearVal) {
    setFieldError('student-year', 'Please select an academic year');
    isValid = false;
  }

  return isValid;
}

// ==============================================================================
// Modal Controllers (Add / Edit / Delete)
// ==============================================================================

function openAddStudentModal() {
  studentForm.reset();
  clearValidationErrors();

  editModeFlag.value = 'false';
  originalStudentId.value = '';
  inputStudentId.disabled = false;

  modalTitle.textContent = 'Add New Student';
  modalSubtitle.textContent = 'Fill in student details to add to SQLite database';
  modalIcon.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
  submitBtnText.textContent = 'Save Student';

  const maleRadio = document.querySelector('input[name="student-gender"][value="Male"]');
  if (maleRadio) maleRadio.checked = true;

  studentModal.classList.add('active');
  studentModal.setAttribute('aria-hidden', 'false');
  inputStudentId.focus();
}

window.openEditStudentModal = function(studentId) {
  const student = students.find(s => (s.student_id || s.id) === studentId);
  if (!student) {
    showToast('Error', 'Student record not found.', 'error');
    return;
  }

  studentForm.reset();
  clearValidationErrors();

  editModeFlag.value = 'true';
  originalStudentId.value = student.student_id || student.id;

  inputStudentId.value = student.student_id || student.id;
  inputStudentName.value = student.name;
  inputStudentEmail.value = student.email;
  inputStudentPhone.value = student.phone;
  inputStudentDept.value = student.department;
  inputStudentYear.value = student.year;

  const genderRadio = document.querySelector(`input[name="student-gender"][value="${student.gender}"]`);
  if (genderRadio) {
    genderRadio.checked = true;
  }

  modalTitle.textContent = 'Edit Student Details';
  modalSubtitle.textContent = `Updating record for ${student.student_id || student.id}`;
  modalIcon.innerHTML = '<i class="fa-solid fa-user-pen"></i>';
  submitBtnText.textContent = 'Update Student';

  studentModal.classList.add('active');
  studentModal.setAttribute('aria-hidden', 'false');
  inputStudentName.focus();
};

function closeStudentModal() {
  studentModal.classList.remove('active');
  studentModal.setAttribute('aria-hidden', 'true');
  studentForm.reset();
  clearValidationErrors();
}

window.openDeleteConfirmation = function(studentId) {
  const student = students.find(s => (s.student_id || s.id) === studentId);
  if (!student) {
    showToast('Error', 'Student record not found.', 'error');
    return;
  }

  pendingDeleteId = student.student_id || student.id;
  deleteStudentName.textContent = student.name;
  deleteStudentId.textContent = pendingDeleteId;

  deleteModal.classList.add('active');
  deleteModal.setAttribute('aria-hidden', 'false');
};

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  deleteModal.setAttribute('aria-hidden', 'true');
  pendingDeleteId = null;
}

// ==============================================================================
// CRUD Operations (Connected to Django REST API)
// ==============================================================================

/**
 * Handle Form Submission (Create or Update)
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // 1. Run client-side validation
  if (!validateStudentForm()) {
    showToast('Validation Error', 'Please check highlighted fields before submitting.', 'error');
    return;
  }

  const isEditMode = editModeFlag.value === 'true';
  const selectedGender = document.querySelector('input[name="student-gender"]:checked')?.value || 'Other';

  const payload = {
    student_id: inputStudentId.value.trim(),
    name: inputStudentName.value.trim(),
    email: inputStudentEmail.value.trim(),
    phone: inputStudentPhone.value.trim(),
    department: inputStudentDept.value,
    year: inputStudentYear.value,
    gender: selectedGender
  };

  // Disable submit button during request
  const submitBtn = document.getElementById('btn-submit-form');
  const originalText = submitBtnText.textContent;
  submitBtn.disabled = true;
  submitBtnText.textContent = isEditMode ? 'Updating...' : 'Saving...';

  try {
    if (isEditMode) {
      // PUT /api/students/{id}/
      const origId = originalStudentId.value;
      const targetUrl = `${API_BASE_URL}${encodeURIComponent(origId)}/`;

      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errors = await response.json();
          displayServerValidationErrors(errors);
          return;
        }
        throw new Error(`Server error (${response.status})`);
      }

      await loadStudents();
      closeStudentModal();
      showToast('Updated Successfully', `Student ${payload.name} updated in database.`, 'success');

    } else {
      // POST /api/students/
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errors = await response.json();
          displayServerValidationErrors(errors);
          return;
        }
        throw new Error(`Server error (${response.status})`);
      }

      await loadStudents();
      closeStudentModal();
      showToast('Student Added', `${payload.name} saved to database successfully!`, 'success');
    }

  } catch (error) {
    console.error('API operation failed:', error);
    
    // Fallback to local storage if offline
    if (!isBackendConnected) {
      handleOfflineCrud(isEditMode, payload);
    } else {
      showToast('API Error', `Operation failed: ${error.message}`, 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtnText.textContent = originalText;
  }
}

/**
 * Fallback handler when Django server is not actively running
 */
function handleOfflineCrud(isEditMode, payload) {
  if (isEditMode) {
    const origId = originalStudentId.value;
    const idx = students.findIndex(s => (s.student_id || s.id) === origId);
    if (idx !== -1) {
      students[idx] = { ...payload, id: payload.student_id };
      saveToLocalStorageBackup(students);
      updateDashboard();
      renderStudentTable();
      closeStudentModal();
      showToast('Updated (Offline)', `${payload.name} updated in local cache.`, 'success');
    }
  } else {
    students.unshift({ ...payload, id: payload.student_id });
    saveToLocalStorageBackup(students);
    updateDashboard();
    renderStudentTable();
    closeStudentModal();
    showToast('Added (Offline)', `${payload.name} saved in local cache.`, 'success');
  }
}

/**
 * Handle Student Deletion: DELETE /api/students/{id}/
 */
async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const targetStudent = students.find(s => (s.student_id || s.id) === pendingDeleteId);
  const studentName = targetStudent ? targetStudent.name : pendingDeleteId;

  btnConfirmDelete.disabled = true;
  btnConfirmDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

  try {
    const targetUrl = `${API_BASE_URL}${encodeURIComponent(pendingDeleteId)}/`;
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok && response.status !== 204 && response.status !== 200) {
      throw new Error(`Delete failed with status ${response.status}`);
    }

    await loadStudents();
    closeDeleteModal();
    showToast('Deleted', `Student "${studentName}" removed from database.`, 'info');

  } catch (error) {
    console.warn('API delete failed, checking offline fallback:', error);
    if (!isBackendConnected) {
      students = students.filter(s => (s.student_id || s.id) !== pendingDeleteId);
      saveToLocalStorageBackup(students);
      updateDashboard();
      renderStudentTable();
      closeDeleteModal();
      showToast('Deleted (Offline)', `Student "${studentName}" removed from local cache.`, 'info');
    } else {
      showToast('Delete Error', `Could not delete student: ${error.message}`, 'error');
    }
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete Permanently';
  }
}

// ==============================================================================
// Toast Notification Engine
// ==============================================================================
function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = 
    type === 'success' ? 'fa-circle-check' :
    type === 'error' ? 'fa-circle-exclamation' :
    type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" title="Dismiss">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 250);
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 250);
    }
  }, 3500);
}

// ==============================================================================
// Export to CSV Function
// ==============================================================================
function exportStudentsToCSV() {
  if (students.length === 0) {
    showToast('Notice', 'No student records to export.', 'info');
    return;
  }

  const headers = ['Student ID', 'Student Name', 'Email Address', 'Phone Number', 'Department', 'Academic Year', 'Gender'];
  const rows = students.map(s => [
    `"${(s.student_id || s.id).replace(/"/g, '""')}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.email.replace(/"/g, '""')}"`,
    `"${s.phone.replace(/"/g, '""')}"`,
    `"${s.department.replace(/"/g, '""')}"`,
    `"${s.year.replace(/"/g, '""')}"`,
    `"${s.gender.replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Student_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Exported', 'Student directory downloaded as CSV successfully.', 'success');
}

// ==============================================================================
// Event Listeners Setup
// ==============================================================================
function setupEventListeners() {
  // Modal Toggles
  btnOpenAddModal.addEventListener('click', openAddStudentModal);
  btnCloseModal.addEventListener('click', closeStudentModal);
  btnCancelModal.addEventListener('click', closeStudentModal);
  btnEmptyAction.addEventListener('click', openAddStudentModal);

  // Form Submission
  studentForm.addEventListener('submit', handleFormSubmit);

  // Delete Modal Buttons
  btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  btnCancelDelete.addEventListener('click', closeDeleteModal);
  btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // Background overlay click
  studentModal.addEventListener('click', (e) => {
    if (e.target === studentModal) closeStudentModal();
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // ESC key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (studentModal.classList.contains('active')) closeStudentModal();
      if (deleteModal.classList.contains('active')) closeDeleteModal();
    }
  });

  // Live Search
  searchInput.addEventListener('input', () => {
    renderStudentTable();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderStudentTable();
    searchInput.focus();
  });

  // Filters
  filterDepartment.addEventListener('change', renderStudentTable);
  filterYear.addEventListener('change', renderStudentTable);

  // Reset Filters Button
  btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterDepartment.value = 'ALL';
    filterYear.value = 'ALL';
    renderStudentTable();
    showToast('Filters Cleared', 'Displaying all enrolled students.', 'info');
  });

  // Reload / Refresh Data
  btnSeedData.addEventListener('click', async () => {
    await loadStudents();
    showToast('Refreshed', 'Synced student data with database.', 'success');
  });

  btnExportCsv.addEventListener('click', exportStudentsToCSV);

  // Real-time input error clearing on typing
  [inputStudentId, inputStudentName, inputStudentEmail, inputStudentPhone, inputStudentDept, inputStudentYear].forEach(input => {
    input.addEventListener('input', () => {
      const parentWrap = input.closest('.input-with-icon');
      if (parentWrap) parentWrap.classList.remove('has-error');
      const errorSmall = document.getElementById(`error-${input.id}`);
      if (errorSmall) errorSmall.textContent = '';
    });
    input.addEventListener('change', () => {
      const parentWrap = input.closest('.input-with-icon');
      if (parentWrap) parentWrap.classList.remove('has-error');
      const errorSmall = document.getElementById(`error-${input.id}`);
      if (errorSmall) errorSmall.textContent = '';
    });
  });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
