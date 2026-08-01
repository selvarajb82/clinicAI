/**
 * apiService.js
 * Decoupled data storage and synchronization layer for Sunshine Wellness Clinic.
 * Automatically saves appointments locally in a queue and posts to a Google Sheet Apps Script URL.
 * Designed to easily swap backends (e.g. Firestore, Supabase, MySQL) without affecting UI/Chatbot.
 */

// Configurable URL for Google Apps Script Web App
// Set this to your deployed Apps Script URL when ready.
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzrqbvCyQRaxoy2jeP-hbxoEjkNfJZlhzgoFEE4vDZ7Y8uDOxLSc_fG2HfrkKag1B-How/exec";

// A queue item that keeps failing (bad payload, permanently misconfigured
// script URL, etc.) is dropped after this many attempts instead of retrying
// forever and growing localStorage without bound.
const MAX_SYNC_RETRIES = 8;

// Global Connection state
let isOnline = true;
let isSyncing = false;

/**
 * Generate a unique Appointment ID matching SWC-[YYYYMMDD]-[RANDOM-4-DIGIT]
 */
export function generateAppointmentId() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SWC-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Retrieve all appointments from local storage datastore
 */
export function getLocalAppointments() {
  return JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
}

/**
 * Save all appointments back to local storage datastore
 */
function saveLocalAppointments(appts) {
  localStorage.setItem('clinic_appointments', JSON.stringify(appts));
}

/**
 * Retrieve the pending synchronization queue
 */
function getSyncQueue() {
  return JSON.parse(localStorage.getItem('sheets_sync_queue') || '[]');
}

/**
 * Save the synchronization queue
 */
function saveSyncQueue(queue) {
  localStorage.setItem('sheets_sync_queue', JSON.stringify(queue));
}

/**
 * Add a transaction action to the sync queue
 */
function enqueueSyncAction(action, data) {
  const queue = getSyncQueue();
  queue.push({ id: 'act_' + Date.now() + '_' + Math.random(), action, data });
  saveSyncQueue(queue);
  
  // Trigger background sync
  syncOfflineQueue();
}

/**
 * Central API Hook: Create a new appointment booking
 */
export function createBooking(data) {
  const newAppt = {
    id: data.id || generateAppointmentId(),
    createdAt: data.createdAt || new Date().toISOString(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    date: data.date,
    time: data.time,
    doctor: data.doctor || "First Available Doctor",
    service: data.service || "General Medicine",
    insurance: data.insurance || "Self-Pay (No Insurance)",
    notes: data.notes || "Booked via AI Assistant",
    source: data.source || "AI Receptionist",
    status: data.status || "Confirmed",
    
    // AI Nurse Pre-Screening Intake Fields
    assessmentId: data.assessmentId || "",
    primaryConcern: data.primaryConcern || "",
    symptoms: data.symptoms || "",
    duration: data.duration || "",
    severity: data.severity || "",
    medicalHistory: data.medicalHistory || "",
    nurseSummary: data.nurseSummary || "",
    recommendedDepartment: data.recommendedDepartment || "",
    priorityLevel: data.priorityLevel || ""
  };

  // 1. Save to local storage appointment database
  const appts = getLocalAppointments();
  appts.push(newAppt);
  saveLocalAppointments(appts);

  // 2. Queue for Google Sheets persistence
  enqueueSyncAction('CREATE', newAppt);

  // 3. Increment chatbot conversations counter
  incrementConversationCount();

  return newAppt;
}

/**
 * Save an AI Nurse Pre-Screening Assessment to the Assessment database/sheet
 */
export function saveAssessment(data) {
  const newAssessment = {
    id: data.id || 'ASN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    patientName: data.patientName || "Guest Patient",
    primaryConcern: data.primaryConcern,
    symptoms: data.symptoms,
    duration: data.duration,
    severity: data.severity,
    medicalHistory: data.medicalHistory,
    nurseSummary: data.nurseSummary,
    recommendedDepartment: data.recommendedDepartment,
    priorityLevel: data.priorityLevel,
    status: data.status || "Completed"
  };

  enqueueSyncAction('CREATE_ASSESSMENT', newAssessment);
  return newAssessment;
}

/**
 * Save an Insurance Verification transaction
 */
export function saveInsuranceCheck(data) {
  const newCheck = {
    id: 'INS_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    patientName: data.patientName || "Guest Patient",
    insuranceProvider: data.insuranceProvider,
    coverageDetails: data.coverageDetails || "Verified",
    copayAmount: data.copayAmount || "$25.00",
    status: data.status || "Approved"
  };

  enqueueSyncAction('CREATE_INSURANCE', newCheck);
  return newCheck;
}

/**
 * Save a Billing invoice or fee calculation transaction
 */
export function saveBillingInvoice(data) {
  const newInvoice = {
    id: 'INV_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    patientName: data.patientName || "Guest Patient",
    serviceType: data.serviceType || "Consultation",
    feeAmount: data.feeAmount || "$95.00",
    paymentMethod: data.paymentMethod || "Pending Card Selection",
    status: data.status || "Pending"
  };

  enqueueSyncAction('CREATE_BILLING', newInvoice);
  return newInvoice;
}

/**
 * Log a conversation history message entry
 */
export function saveConversationLog(data) {
  const logEntry = {
    id: 'LOG_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    patientName: data.patientName || "Guest Patient",
    sender: data.sender || "Patient",
    agentId: data.agentId || "receptionist",
    message: data.message || ""
  };

  enqueueSyncAction('LOG_CONVERSATION', logEntry);
  return logEntry;
}

/**
 * Central API Hook: Cancel an existing booking
 */
export function cancelBooking(id) {
  const appts = getLocalAppointments();
  const updated = appts.map(appt => {
    if (appt.id === id) {
      const changed = { ...appt, status: "Cancelled" };
      // Queue cancellation status update
      enqueueSyncAction('UPDATE_STATUS', { id, status: "Cancelled" });
      return changed;
    }
    return appt;
  });
  saveLocalAppointments(updated);
  return true;
}

/**
 * Increment and save today's conversation count
 */
export function incrementConversationCount() {
  let count = parseInt(localStorage.getItem('today_conversations_count') || '0', 10);
  count++;
  localStorage.setItem('today_conversations_count', count.toString());
}

/**
 * Retrieve conversations count
 */
export function getConversationCount() {
  const count = localStorage.getItem('today_conversations_count');
  if (!count) {
    // Seed default value
    localStorage.setItem('today_conversations_count', '156');
    return 156;
  }
  return parseInt(count, 10);
}

/**
 * Get dynamic, aggregated live metrics for the dashboard
 */
export function getDashboardMetrics() {
  const appts = getLocalAppointments();
  
  // Calculate appointments booked for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = appts.filter(a => a.date === todayStr && a.status !== 'Cancelled').length;

  // Estimated wait time logic (5 minutes per booked appointment today, capped at 45)
  const currentWaitMinutes = Math.min(12 + todaysBookings * 3, 45);
  let waitLevel = "Low";
  if (currentWaitMinutes > 30) waitLevel = "High";
  else if (currentWaitMinutes > 15) waitLevel = "Medium";

  return {
    aiStatus: "Online",
    responseTimeSec: 2.3,
    appointmentsToday: 18 + todaysBookings,
    waitMinutes: currentWaitMinutes,
    waitLevel: waitLevel,
    doctorsAvailable: 4,
    conversationsToday: getConversationCount(),
    satisfactionRate: 99,
    connectionState: isOnline ? "online" : "offline"
  };
}

/**
 * Background worker trying to flush offline queue items to the Google Sheets Apps Script Web App
 */
export async function syncOfflineQueue() {
  if (isSyncing) return; // a run is already in flight (interval + online event + enqueue can all call this)
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  try {
    // If no script URL is specified, run mock sheets sync in console
    if (!GOOGLE_SHEETS_URL) {
      console.log(`[Google Sheets Mock] Successfully synced ${queue.length} pending actions to Google Sheet database.`);
      saveSyncQueue([]);
      isOnline = true;
      updateNetworkStatusUI(true);
      return;
    }

    isOnline = true;
    const failedToSync = [];

    for (const item of queue) {
      try {
        // text/plain keeps this a simple request (no CORS preflight). The response is
        // no longer opaque, so a rejected/errored sync surfaces here instead of being
        // silently dropped from the queue.
        const res = await fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: item.action,
            data: item.data
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const out = await res.json();
        if (out.status !== "success") throw new Error(out.message || "apps script rejected payload");
      } catch (e) {
        console.warn(`[Google Sheets Connection Error] Sync action ${item.id} failed. Postponed.`, e);
        isOnline = false;
        const retries = (item.retries || 0) + 1;
        if (retries >= MAX_SYNC_RETRIES) {
          console.error(`[Google Sheets Sync] Dropping action ${item.id} (${item.action}) after ${retries} failed attempts.`, item.data);
        } else {
          failedToSync.push({ ...item, retries });
        }
      }
    }

    saveSyncQueue(failedToSync);
    updateNetworkStatusUI(isOnline);
  } finally {
    isSyncing = false;
  }
}

/**
 * Check connectivity and update the UI network connection status
 */
function updateNetworkStatusUI(online) {
  const warningBadges = [
    document.getElementById('sidebar-sheets-warning'),
    document.getElementById('mobile-sheets-warning')
  ];

  warningBadges.forEach(badge => {
    if (!badge) return;
    if (online) {
      badge.classList.add('hidden');
    } else {
      badge.classList.remove('hidden');
    }
  });
}

// Automatically poll for connection retries every 30 seconds
setInterval(syncOfflineQueue, 30000);

// React immediately to real connectivity changes instead of waiting for the
// next 30s poll.
window.addEventListener('online', () => {
  isOnline = true;
  updateNetworkStatusUI(true);
  syncOfflineQueue();
});
window.addEventListener('offline', () => {
  isOnline = false;
  updateNetworkStatusUI(false);
});
updateNetworkStatusUI(navigator.onLine);

// Queue-depth introspection for the automated demo recorder — only exposed
// in dev or on the GitHub Pages deployment, never in a real production origin.
if (import.meta.env.DEV || location.hostname.includes('github.io')) {
  window.__demoQueueLength = () => getSyncQueue().length;
}
