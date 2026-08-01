# 🏥 Sunshine Wellness Clinic — Agentic AI Platform

[![Live Platform](https://img.shields.io/badge/Live-Demo-emerald.svg?style=for-the-badge&logo=github)](https://selvarajb82.github.io/clinicAI/)
[![Vite](https://img.shields.io/badge/build-Vite-blue.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Google Cloud](https://img.shields.io/badge/Sync-Google%20Sheets-blueviolet.svg?style=for-the-badge&logo=google-sheets)](https://workspace.google.com/)

A premium, state-of-the-art healthcare portal and **Agentic AI Multi-Agent Reception System** built for **Sunshine Wellness Clinic**. The platform provides 24/7 patient pre-screening, booking coordination, billing transparency, and medical information lookup through a coordinated team of specialized AI agents.

---

## 🔗 Live Deployments
* **Interactive Portal**: [https://selvarajb82.github.io/clinicAI/](https://selvarajb82.github.io/clinicAI/)
* **Google Sheet Database**: [Linked Spreadsheet](https://docs.google.com/spreadsheets/d/1mUNRwKPvQ578EwLlOGBLlzG_KYaRj3WDUqbebAINJ7I/)

---

## 🤖 Coordinated Agentic AI Team
The chatbot features a responsive **multi-agent state machine** containing **7 specialized neural agents**. Patients can switch between agents, or let the receptionist route requests automatically:

1. **👋 Sunny (AI Receptionist)**: Welcomes patients, handles appointment scheduling, clarifies general clinic operations, and links inquiries to human staff.
2. **👩‍⚕️ AI Nurse Intake (Health Assessment)**: Runs full pre-screening interviews, assesses symptom severity and durations, logs medical histories, and triage prioritizes cases.
3. **📋 SOAP Assistant (Clinical Notes)**: Automatically compiles pre-screening metrics and patient statements into professional clinical SOAP report drafts for physicians.
4. **🛡️ Coverage Coordinator (Benefits)**: Verifies policy details, copays, deductibles, and pre-authorization requirements.
5. **💳 Payments Auditor (Billing)**: Computes consultation fee quotes, issues billing invoices, and reports transaction statuses.
6. **🔬 Diagnostics Guide (Lab Prep)**: Directs preparation instructions (e.g., fasting checklists) for diagnostic tests and blood work.
7. **💊 Medication Guide (FDA Search)**: Integrates directly with the **public U.S. openFDA API** to lookup drug usages, dosages, generic names, and storage guidelines in real time.

---

## ⚡ Key Features

* **Real-Time Google Sheets Sync**: All patient bookings, nurse intakes, invoice records, and conversation logs are synchronized to a Google Spreadsheet Web App in real-time.
* **Offline-First Persistence**: Leverages an IndexedDB local cache queue. If the internet connection drops, actions are stored locally and automatically pushed once connectivity is restored.
* **Dual Chat Modes (Text & Audio)**: Switch between standard text chat and voice chat (unmuting SpeechSynthesis and activating Web Speech API Speech Recognition with dynamic waveforms).
* **Rich Glassmorphic Design**: Sleek dark and light mode UI featuring fluid CSS animations, dynamic grids, interactive duty charts, and clean, premium typography.
* **Zero Hardcoding Drug Guide**: Uses dynamic text extraction to identify pharmaceutical compounds and search the openFDA database on-the-fly.

---

## 🛠️ Technology Stack
* **Build Tool**: Vite
* **Frontend**: HTML5 (Semantic Structure) & Javascript (ES6 Modules)
* **Styling**: Vanilla CSS (CSS Grid, Flexbox, Custom Variables, Fluid Transitions, Lucide Icons)
* **Persistence & APIs**: Web Speech API, openFDA label search API, Google Apps Script CORS simple-fetch sync protocol, local storage queue.

---

## 🚀 Local Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/selvarajb82/clinicAI.git
   cd clinicAI
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 📊 Google Sheets Apps Script Integration
To link your own spreadsheet, paste this code inside your spreadsheet's **Extensions > Apps Script** editor, deploy it as a **Web App** (Execute as: *Me*, Who has access: *Anyone*), and paste the Web App URL in `src/js/apiService.js` on line 10:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "UPDATE_STATUS") {
      var bookSheet = ss.getSheetByName("Bookings");
      if (!bookSheet) throw new Error("Bookings sheet not found");
      var values = bookSheet.getDataRange().getValues();
      var header = values[0];
      var idCol = header.indexOf("Appointment ID");
      var statusCol = header.indexOf("Status");
      if (idCol === -1 || statusCol === -1) throw new Error("Bookings sheet is missing an Appointment ID or Status column");
      var updated = false;
      for (var i = 1; i < values.length; i++) {
        if (values[i][idCol] === payload.id) {
          bookSheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
          updated = true;
          break;
        }
      }
      if (!updated) throw new Error("No booking found with Appointment ID: " + payload.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: action })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetName = "";
    var colHeaders = [];
    var rowData = [];
    var timestamp = new Date();
    
    if (action === "CREATE") {
      sheetName = "Bookings";
      colHeaders = ["Timestamp", "Appointment ID", "Name", "Email", "Phone", "Date", "Time", "Doctor", "Service", "Insurance", "Notes", "Source", "Status"];
      rowData = [timestamp, payload.id, payload.name, payload.email, payload.phone, payload.date, payload.time, payload.doctor, payload.service, payload.insurance, payload.notes, payload.source, payload.status];
    } else if (action === "CREATE_ASSESSMENT") {
      sheetName = "Assessments";
      colHeaders = ["Timestamp", "Patient Name", "Primary Concern", "Symptoms", "Duration", "Severity", "Medical History", "Nurse Summary", "Recommended Department", "Priority Level"];
      rowData = [timestamp, payload.patientName, payload.primaryConcern, payload.symptoms, payload.duration, payload.severity, payload.medicalHistory, payload.nurseSummary, payload.recommendedDepartment, payload.priorityLevel];
    } else if (action === "CREATE_INSURANCE") {
      sheetName = "InsuranceChecks";
      colHeaders = ["Timestamp", "Patient Name", "Insurance Provider", "Coverage Details", "Copay Amount", "Status"];
      rowData = [timestamp, payload.patientName, payload.insuranceProvider, payload.coverageDetails, payload.copayAmount, payload.status];
    } else if (action === "CREATE_BILLING") {
      sheetName = "BillingInvoices";
      colHeaders = ["Timestamp", "Patient Name", "Service Type", "Fee Amount", "Payment Method", "Status"];
      rowData = [timestamp, payload.patientName, payload.serviceType, payload.feeAmount, payload.paymentMethod, payload.status];
    } else if (action === "LOG_CONVERSATION") {
      sheetName = "ConversationLogs";
      colHeaders = ["Timestamp", "Patient Name", "Sender", "Agent ID", "Message"];
      rowData = [timestamp, payload.patientName, payload.sender, payload.agentId, payload.message];
    }
    
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(colHeaders);
      sheet.getRange(1, 1, 1, colHeaders.length).setFontWeight("bold");
    }
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", action: action })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
