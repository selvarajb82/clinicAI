// Imports from the decoupled API Service Layer
import { 
  createBooking, 
  cancelBooking, 
  getDashboardMetrics, 
  getLocalAppointments, 
  incrementConversationCount, 
  getConversationCount,
  syncOfflineQueue,
  saveAssessment,
  saveInsuranceCheck,
  saveBillingInvoice,
  saveConversationLog
} from './apiService.js';

// Chatbot session state variables
let chatState = 'idle';
let bookingData = {};

// Configurable Multi-Agent Metadata
const agentMetadata = {
  receptionist: {
    name: "Sunny",
    fullName: "Sunshine Receptionist",
    role: "Scheduling & General",
    avatar: "🤖",
    status: "🟢 Online",
    activity: "Greeting & Routing"
  },
  nurse: {
    name: "AI Nurse",
    fullName: "AI Nurse Intake",
    role: "Health Assessment",
    avatar: "👩‍⚕️",
    status: "🟢 Online",
    activity: "Ready for screening"
  },
  doctor: {
    name: "Doctor Copilot",
    fullName: "SOAP Assistant",
    role: "Clinical Summary",
    avatar: "🧑‍⚕️",
    status: "🟢 Ready",
    activity: "Idle"
  },
  insurance: {
    name: "Insurance Agent",
    fullName: "Coverage Coordinator",
    role: "Coverage & Benefits",
    avatar: "💳",
    status: "🟢 Online",
    activity: "Ready to check benefits"
  },
  billing: {
    name: "Billing Agent",
    fullName: "Payments Auditor",
    role: "Payments & Invoices",
    avatar: "💰",
    status: "🟢 Online",
    activity: "Ready for invoices"
  },
  lab: {
    name: "Lab Assistant",
    fullName: "Diagnostics Guide",
    role: "Lab Preparation",
    avatar: "🧪",
    status: "🟢 Online",
    activity: "Ready for lab instructions"
  },
  pharmacy: {
    name: "Pharmacy Agent",
    fullName: "Medication Guide",
    role: "Usage & Refills",
    avatar: "💊",
    status: "🟢 Online",
    activity: "Ready for pharmacy advice"
  }
};

let activeAgentId = 'receptionist';
const sessionMemory = {
  name: "",
  phone: "",
  email: "",
  symptoms: "",
  primaryConcern: "",
  severity: "",
  duration: "",
  medicalHistory: "",
  doctor: "",
  service: "",
  date: "",
  time: ""
};

// Activity Feed Log queue
let activityLog = [
  { time: "11:20 AM", text: "🤖 Platform initialized. Receptionist active." }
];

// Configurable metric values
const clinicMetricsData = {
  appointmentsToday: 38,
  doctorsAvailable: 4,
  averageWait: 12,
  satisfactionRate: 99
};

// Wait for DOM Content to load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initGSAP();
  initTestimonials();
  initBookingForm();
  initChatbot();
  loadAppointments();
  initSidebarMetrics();
  updateDynamicGreetings();
  initVoice();
  initSidebarTabs();
  initDashboardUpdates();
  if (window.initNurseWizard) window.initNurseWizard();

  // Initialize Multi-Agent platform UI
  renderAgentSelectors();
  updateAgentCollaborationUI();
  logActivityEvent("Platform initialized. Receptionist active.");
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

/* ==========================================================================
   1. Theme Toggle (Dark / Light Mode)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('theme-toggle-sun');
  const moonIcon = document.getElementById('theme-toggle-moon');

  if (
    localStorage.getItem('color-theme') === 'dark' ||
    (!('color-theme' in localStorage) &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
    if (sunIcon) sunIcon.classList.remove('hidden');
    if (moonIcon) moonIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    if (sunIcon) sunIcon.classList.add('hidden');
    if (moonIcon) moonIcon.classList.remove('hidden');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
      }
    });
  }
}

/* ==========================================================================
   2. Responsive Tab Landing Pages (Client-Side Router)
   ========================================================================== */
function initTabs() {
  const tabLinks = document.querySelectorAll('.nav-tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    if (!tabId) tabId = 'home';
    tabId = tabId.replace('#', '');
    
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (!targetContent) return;

    tabContents.forEach(content => {
      content.classList.add('hidden');
    });

    targetContent.classList.remove('hidden');

    tabLinks.forEach(link => {
      const linkTab = (link.getAttribute('data-tab') || link.getAttribute('href') || '').replace('#', '');
      if (linkTab === tabId) {
        link.classList.add('text-primary', 'dark:text-accent', 'border-primary', 'dark:border-accent');
        link.classList.remove('text-slate-600', 'dark:text-slate-300', 'border-transparent');
        if (link.classList.contains('mobile-nav-link')) {
          link.classList.add('bg-sky-50', 'dark:bg-slate-800');
        }
      } else {
        link.classList.remove('text-primary', 'dark:text-accent', 'border-primary', 'dark:border-accent');
        link.classList.add('text-slate-600', 'dark:text-slate-300', 'border-transparent');
        if (link.classList.contains('mobile-nav-link')) {
          link.classList.remove('bg-sky-50', 'dark:bg-slate-800');
        }
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        window.location.hash = href;
        switchTab(href);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    switchTab(window.location.hash);
  });

  const initialHash = window.location.hash || '#home';
  switchTab(initialHash);
  
  window.switchToTab = function(tabId) {
    window.location.hash = `#${tabId}`;
    switchTab(tabId);
  };
}

/* ==========================================================================
   3. GSAP Animations & Counters
   ========================================================================== */
function initGSAP() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const tlHero = gsap.timeline();
  tlHero.from('nav', {
    y: -50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  });
  tlHero.from('.hero-content > *', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out'
  }, '-=0.4');
  tlHero.from('.hero-image-container', {
    scale: 0.95,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  }, '-=0.6');
  tlHero.from('.hero-stat-card', {
    y: 20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power3.out'
  }, '-=0.4');

  const stats = document.querySelectorAll('.stat-counter');
  stats.forEach(stat => {
    const target = parseInt(stat.getAttribute('data-target'), 10);
    const suffix = stat.getAttribute('data-suffix') || '';
    const obj = { val: 0 };
    
    gsap.to(obj, {
      val: target,
      duration: 2,
      scrollTrigger: {
        trigger: stat,
        start: 'top 85%',
        once: true
      },
      onUpdate: () => {
        stat.textContent = Math.floor(obj.val).toLocaleString() + suffix;
      }
    });
  });

  gsap.to('.animate-float-slow', {
    y: 15,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
  });

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.from('.service-card', {
      scrollTrigger: {
        trigger: '#services',
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    });

    gsap.from('.doctor-card', {
      scrollTrigger: {
        trigger: '#doctors',
        start: 'top 80%',
      },
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });

    gsap.from('.choose-card', {
      scrollTrigger: {
        trigger: '#why-choose-us',
        start: 'top 80%',
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out'
    });

    gsap.from('.insurance-logo', {
      scrollTrigger: {
        trigger: '#insurance',
        start: 'top 85%',
      },
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: 'back.out(1.7)'
    });

    gsap.from('.booking-container', {
      scrollTrigger: {
        trigger: '#appointments',
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  }
}

/* ==========================================================================
   4. Testimonials Carousel
   ========================================================================== */
const testimonialsData = [
  {
    name: "Emily Rodriguez",
    role: "Mother of 2",
    rating: 5,
    text: "The pediatrics care here is exceptional! Dr. Lin is incredibly patient and kind. My kids actually look forward to clinic visits.",
    specialty: "Pediatrics"
  },
  {
    name: "Robert Chen",
    role: "Local Business Owner",
    rating: 5,
    text: "I used the AI Receptionist to schedule a same-day lab work appointment. The process was seamless and I was in and out in 20 minutes.",
    specialty: "Laboratory Testing"
  },
  {
    name: "Sarah Thompson",
    role: "Teacher",
    rating: 5,
    text: "Dr. Vance is a wonderful physician who takes the time to listen. I've been coming here for annual physicals and the care is top-tier.",
    specialty: "General Medicine"
  },
  {
    name: "David Miller",
    role: "Retired Engineer",
    rating: 5,
    text: "Navigating health insurance is usually a nightmare, but the clinic staff helped coordinate my benefits perfectly. Highly recommend!",
    specialty: "Insurance Assistance"
  },
  {
    name: "Elena Rostova",
    role: "Fitness Coach",
    rating: 5,
    text: "Sunshine Wellness focuses on prevention, not just treatment. Their wellness plans have significantly improved my energy and lifestyle.",
    specialty: "Preventive Care"
  }
];

function initTestimonials() {
  const container = document.getElementById('testimonials-container');
  const dotsContainer = document.getElementById('testimonials-dots');
  const prevBtn = document.getElementById('testimonial-prev');
  const textBtn = document.getElementById('testimonial-next');
  
  if (!container || !dotsContainer) return;

  let currentIndex = 0;

  function renderSlides() {
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    testimonialsData.forEach((t, index) => {
      const slide = document.createElement('div');
      slide.className = `testimonial-slide w-full flex-shrink-0 px-4 md:px-8 transition-all duration-500 absolute inset-0 ${index === currentIndex ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-12 z-0 pointer-events-none'}`;
      
      const starsHTML = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
      
      slide.innerHTML = `
        <div class="glass-panel p-6 md:p-10 rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-amber-500 text-xl tracking-wider font-semibold">${starsHTML}</span>
              <span class="px-3 py-1 bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded-full">${t.specialty}</span>
            </div>
            <p class="text-slate-700 dark:text-slate-300 text-base md:text-lg italic mb-6 leading-relaxed">
              "${t.text}"
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow">
              ${t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white text-sm md:text-base">${t.name}</h4>
              <p class="text-slate-550 dark:text-slate-400 text-xs">${t.role}</p>
            </div>
          </div>
        </div>
      `;
      container.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = `carousel-dot h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-sky-400 transition-all duration-300 ${index === currentIndex ? 'active w-6 bg-sky-50' : ''}`;
      dot.setAttribute('aria-label', `Go to testimonial slide ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    renderSlides();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % testimonialsData.length;
    renderSlides();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + testimonialsData.length) % testimonialsData.length;
    renderSlides();
  }

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (textBtn) textBtn.addEventListener('click', nextSlide);

  let autoplay = setInterval(nextSlide, 6000);
  
  const carouselWrapper = document.getElementById('testimonials-wrapper');
  if (carouselWrapper) {
    carouselWrapper.addEventListener('mouseenter', () => clearInterval(autoplay));
    carouselWrapper.addEventListener('mouseleave', () => autoplay = setInterval(nextSlide, 6000));
  }

  renderSlides();
}

/* ==========================================================================
   5. Appointment Booking Form (Using Decoupled API)
   ========================================================================== */
function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('booking-name').value.trim();
    const email = document.getElementById('booking-email').value.trim();
    const phone = document.getElementById('booking-phone').value.trim();
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const doctor = document.getElementById('booking-doctor').value;
    const service = document.getElementById('booking-service').value;
    const insurance = document.getElementById('booking-insurance').value;
    const notes = document.getElementById('booking-notes').value.trim();

    if (!name || !email || !phone || !date || !time) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const dateTimeObj = new Date(`${date}T${time}`);
    const day = dateTimeObj.getDay(); 
    const hour = dateTimeObj.getHours();

    if (day === 0) {
      showToast('The clinic is closed on Sundays. Please select a Monday-Saturday date.', 'error');
      return;
    }
    if (day === 6 && (hour < 9 || hour >= 13)) {
      showToast('Saturday clinic hours are 9:00 AM – 1:00 PM. Please adjust your time.', 'error');
      return;
    }
    if (day >= 1 && day <= 5 && (hour < 9 || hour >= 19)) {
      showToast('Weekday clinic hours are 9:00 AM – 7:00 PM. Please adjust your time.', 'error');
      return;
    }

    const appointment = {
      name,
      email,
      phone,
      date,
      time,
      doctor,
      service,
      insurance,
      notes,
      source: "Web Form",
      
      // AI Nurse Pre-screening integration
      assessmentId: bookingData.assessmentId || "",
      primaryConcern: bookingData.primaryConcern || "",
      symptoms: bookingData.symptoms || "",
      duration: bookingData.duration || "",
      severity: bookingData.severity || "",
      medicalHistory: bookingData.medicalHistory || "",
      nurseSummary: bookingData.nurseSummary || "",
      recommendedDepartment: bookingData.recommendedDepartment || "",
      priorityLevel: bookingData.priorityLevel || ""
    };

    saveAppointment(appointment);
    showToast('Success! Your appointment has been scheduled successfully.', 'success');
    form.reset();

    setTimeout(() => {
      if (window.switchToTab) window.switchToTab('appointments');
    }, 800);
  });
}

function saveAppointment(appt) {
  // Call decoupled API service
  createBooking(appt);
  
  // Reload dashboard and dashboard widgets
  loadAppointments();
  refreshDashboardUI(true);
}

function loadAppointments() {
  const listContainer = document.getElementById('appointments-list');
  const appointmentsSection = document.getElementById('my-appointments-section');
  if (!listContainer || !appointmentsSection) return;

  const appts = getLocalAppointments();
  
  if (appts.length === 0) {
    appointmentsSection.classList.add('hidden');
    return;
  }

  appointmentsSection.classList.remove('hidden');
  listContainer.innerHTML = '';

  appts.slice().reverse().forEach(appt => {
    const dateFormatted = new Date(appt.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    
    // Check cancelled status
    const isCancelled = appt.status === 'Cancelled';

    const card = document.createElement('div');
    card.className = `glass-panel p-4 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 ${isCancelled ? 'opacity-60' : ''}`;
    card.innerHTML = `
      <div class="absolute left-0 top-0 bottom-0 w-1.5 ${isCancelled ? 'bg-slate-400' : 'bg-emerald-500'}"></div>
      <div class="pl-2">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-slate-800 dark:text-slate-200">${appt.name}</h4>
          <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isCancelled ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20'}">${appt.status || 'Confirmed'}</span>
        </div>
        <p class="text-xs text-slate-550 dark:text-slate-455 mt-0.5">${appt.service} with ${appt.doctor}</p>
        <div class="flex items-center gap-4 mt-2 text-xs text-sky-600 dark:text-sky-400 font-semibold">
          <span class="flex items-center gap-1">📅 ${dateFormatted}</span>
          <span class="flex items-center gap-1">⏰ ${appt.time}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${!isCancelled ? `
          <button onclick="cancelAppointment('${appt.id}')" class="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-550/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 transition font-medium">
            Cancel Appointment
          </button>
        ` : `<span class="text-xs text-slate-400 font-medium">No actions available</span>`}
      </div>
    `;
    listContainer.appendChild(card);
  });
}

window.cancelAppointment = function(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;
  
  // Call decoupled API service
  cancelBooking(id);
  
  loadAppointments();
  refreshDashboardUI(false);
  showToast('Appointment successfully cancelled.', 'info');
};

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 left-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center justify-between ${
    type === 'success' ? 'bg-emerald-600 border-emerald-700 text-white' :
    type === 'error' ? 'bg-rose-600 border-rose-700 text-white' :
    'bg-sky-500 border-sky-600 text-white'
  }`;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-3 text-white/80 hover:text-white font-bold">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* ==========================================================================
   6. Sidebar Metrics Animate & Greetings
   ========================================================================== */
function initSidebarMetrics() {
  const elements = document.querySelectorAll('.sidebar-metric-val');
  elements.forEach(el => {
    const key = el.getAttribute('data-metric-key');
    const target = clinicMetricsData[key] || parseInt(el.getAttribute('data-target') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const obj = { val: 0 };

    if (typeof gsap !== 'undefined') {
      gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.floor(obj.val).toLocaleString() + suffix;
        }
      });
    } else {
      let curr = 0;
      const steps = 40;
      const inc = target / steps;
      const interval = setInterval(() => {
        curr += inc;
        if (curr >= target) {
          el.textContent = target.toLocaleString() + suffix;
          clearInterval(interval);
        } else {
          el.textContent = Math.floor(curr).toLocaleString() + suffix;
        }
      }, 25);
    }
  });
}

function updateDynamicGreetings() {
  const greetingEl = document.getElementById('sidebar-greeting');
  if (!greetingEl) return;
  
  const hour = new Date().getHours();
  let text = "Hello! 👋";
  
  if (hour >= 5 && hour < 12) {
    text = "Good Morning ☀️";
  } else if (hour >= 12 && hour < 17) {
    text = "Good Afternoon 🌤️";
  } else {
    text = "Good Evening 🌙";
  }
  
  greetingEl.textContent = text;
}

/* ==========================================================================
   7. Persistent AI Receptionist Chatbot State Machine & NLP
   ========================================================================== */
function initChatbot() {
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotClose = document.getElementById('chatbot-close');
  
  const chatbotInputFloat = document.getElementById('chatbot-input');
  const chatbotSendFloat = document.getElementById('chatbot-send');
  
  const chatbotInputSide = document.getElementById('sidebar-chat-input');
  const chatbotSendSide = document.getElementById('sidebar-chat-send');

  if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener('click', () => {
      chatbotWindow.classList.toggle('hidden');
      chatbotWindow.classList.toggle('flex');
      if (!chatbotWindow.classList.contains('hidden')) {
        if (chatbotInputFloat) chatbotInputFloat.focus();
        const badge = chatbotToggle.querySelector('.chat-badge');
        if (badge) badge.classList.add('hidden');
      }
    });
  }

  if (chatbotClose && chatbotWindow) {
    chatbotClose.addEventListener('click', () => {
      chatbotWindow.classList.add('hidden');
      chatbotWindow.classList.remove('flex');
    });
  }

  document.querySelectorAll('.sidebar-action-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'book') {
        if (window.switchToTab) window.switchToTab('appointments');
        handleUserMessage("I want to schedule an appointment");
      } else if (action === 'reschedule') {
        handleUserMessage("I need to reschedule my appointment");
      } else if (action === 'cancel') {
        handleUserMessage("I want to cancel my appointment");
      } else if (action === 'find-doctor') {
        if (window.switchToTab) window.switchToTab('doctors');
        handleUserMessage("Who are your doctors?");
      } else if (action === 'nurse') {
        const isMobile = window.innerWidth < 1024;
        window.startNurseAssessment(isMobile ? 'mobile' : 'sidebar');
      } else if (action === 'insurance') {
        if (window.switchToTab) window.switchToTab('insurance');
        handleUserMessage("What insurance plans do you accept?");
      } else if (action === 'billing') {
        handleUserMessage("I have a billing question");
      } else if (action === 'contact') {
        if (window.switchToTab) window.switchToTab('contact');
        handleUserMessage("How can I contact the clinic reception?");
      }
    });
  });

  document.querySelectorAll('.suggested-chip, .quick-reply-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question') || chip.getAttribute('data-reply') || chip.textContent.trim();
      handleUserMessage(question);
    });
  });

  window.bookDoctor = function(doctorName) {
    const select = document.getElementById('booking-doctor');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.includes(doctorName)) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    if (window.switchToTab) {
      window.switchToTab('appointments');
      showToast(`Selected ${doctorName}. Complete the form details.`, 'info');
    }
  };

  if (chatbotSendFloat) {
    chatbotSendFloat.addEventListener('click', () => sendMessageFromInput(chatbotInputFloat));
  }
  if (chatbotInputFloat) {
    chatbotInputFloat.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessageFromInput(chatbotInputFloat);
    });
  }

  if (chatbotSendSide) {
    chatbotSendSide.addEventListener('click', () => sendMessageFromInput(chatbotInputSide));
  }
  if (chatbotInputSide) {
    chatbotInputSide.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessageFromInput(chatbotInputSide);
    });
  }

  function sendMessageFromInput(inputEl) {
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;
    if (chatbotInputFloat) chatbotInputFloat.value = '';
    if (chatbotInputSide) chatbotInputSide.value = '';
    handleUserMessage(text);
  }

  // Synchronized message appender
  function appendMessage(text, isUser = false) {
    const containers = [
      document.getElementById('sidebar-chat-messages'),
      document.getElementById('chatbot-messages')
    ];

    containers.forEach(container => {
      if (!container) return;
      
      const msgDiv = document.createElement('div');
      msgDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5 mb-3`;
      
      let avatarHTML = '';
      if (!isUser) {
        const agent = agentMetadata[activeAgentId];
        avatarHTML = `
          <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-xs select-none">
            ${agent.avatar}
          </div>
        `;
      }
      
      const innerDiv = document.createElement('div');
      innerDiv.className = `max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-sm ${
        isUser ? 'chat-bubble-user text-white bg-primary' : 'chat-bubble-agent bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
      }`;
      
      innerDiv.innerHTML = text.replace(/\n/g, '<br>');
      
      if (!isUser) {
        msgDiv.innerHTML = avatarHTML;
      }
      msgDiv.appendChild(innerDiv);
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    });
  }

  function appendTypingIndicator() {
    const containers = [
      document.getElementById('sidebar-chat-messages'),
      document.getElementById('chatbot-messages')
    ];

    containers.forEach(container => {
      if (!container) return;

      const indDiv = document.createElement('div');
      indDiv.className = 'typing-indicator-wrapper flex justify-start items-start gap-2.5 mb-3';
      
      const agent = agentMetadata[activeAgentId];
      indDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-xs select-none">
          ${agent.avatar}
        </div>
        <div class="chat-bubble-agent max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-xs flex items-center gap-1">
          <span class="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      `;
      container.appendChild(indDiv);
      container.scrollTop = container.scrollHeight;
    });
  }

  function removeTypingIndicator() {
    document.querySelectorAll('.typing-indicator-wrapper').forEach(el => el.remove());
  }

  // Expose chatbot helper functions globally for Multi-Agent takeover greetings
  window.appendMessage = appendMessage;
  window.appendTypingIndicator = appendTypingIndicator;
  window.removeTypingIndicator = removeTypingIndicator;

  async function handleUserMessage(text) {
    appendMessage(text, true);
    appendTypingIndicator();

    // Log patient message to conversation sheet
    saveConversationLog({
      patientName: sessionMemory.name || "Guest Patient",
      sender: "Patient",
      agentId: activeAgentId,
      message: text
    });

    const delay = 800 + Math.random() * 500;
    setTimeout(async () => {
      const response = await processNLP(text);
      removeTypingIndicator();
      appendMessage(response, false);
      speakText(response);

      // Log agent response to conversation sheet
      saveConversationLog({
        patientName: sessionMemory.name || "Guest Patient",
        sender: "Agent",
        agentId: activeAgentId,
        message: response.replace(/^[^\s]+\s\*\*[^:]+:\*\*\s/, '') // remove emoji prefix for sheet
      });
    }, delay);
  }

  // Append initial welcome greeting dynamically on load
  setTimeout(() => {
    const welcomeText = `👋 Welcome to Sunshine Wellness Clinic! I'm Sunny, your AI Receptionist. I can help schedule appointments, answer insurance questions, explain our services, and connect you with the right doctor. How can I assist you today?`;
    appendMessage(welcomeText, false);
  }, 100);
}

function extractDrugName(message) {
  const clean = message.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
  const words = clean.split(/\s+/);
  
  const stopwords = new Set([
    'what', 'is', 'the', 'usage', 'of', 'for', 'about', 'how', 'do', 'i', 'take', 
    'can', 'you', 'check', 'tell', 'me', 'a', 'an', 'need', 'rx', 'refill', 
    'refills', 'medicine', 'medication', 'pharmacy', 'please', 'give', 'info', 
    'information', 'on', 'with', 'dose', 'dosage', 'storage', 'directions', 
    'guidelines', 'help', 'and', 'or', 'in', 'to', 'should', 'why', 'who', 
    'when', 'where', 'clinic'
  ]);
  
  for (const word of words) {
    if (!stopwords.has(word) && word.length >= 3) {
      return word;
    }
  }
  return null;
}

async function processNLP(text) {
  const msg = text.toLowerCase();

  // 1. Session Memory name extraction
  const nameMatch = text.match(/(?:my name is|i am|i'm|this is)\s+([A-Za-z]{2,15})/i);
  if (nameMatch && nameMatch[1]) {
    sessionMemory.name = nameMatch[1];
    bookingData.name = sessionMemory.name; // sync with booking state
    logActivityEvent(`Shared Memory: Patient name set to "${sessionMemory.name}"`);
  }

  // Direct AI Nurse Intake Triggers
  if (msg.includes('start ai health assessment') || msg.includes('ai nurse intake')) {
    setTimeout(() => {
      const isMobile = window.innerWidth < 1024;
      window.startNurseAssessment(isMobile ? 'mobile' : 'sidebar');
    }, 500);
    return "Excellent! Launching the Sunshine AI Nurse Pre-Screening Assistant now...";
  }

  // Emergency intercept checks (Continuous safety guardrails)
  const urgentKeywords = [
    'chest pain', 'difficulty breathing', 'shortness of breath', 'stroke', 'paralysis', 
    'uncontrolled bleeding', 'unconscious', 'heart attack', 'emergency', 'dying', 'suicidal'
  ];
  if (urgentKeywords.some(keyword => msg.includes(keyword))) {
    chatState = 'idle';
    return "⚠️ EMERGENCY: If you are experiencing chest pain, severe breathing issues, stroke symptoms, or severe bleeding, please call 911 or go to the nearest emergency room immediately. We cannot treat life-threatening emergencies at our clinic.";
  }

  // Determine if we should switch agents based on keywords
  let targetAgentId = activeAgentId;
  const explicitSwitch = msg.includes('connect to') || msg.includes('switch to') || msg.includes('talk to') || msg.includes('change to') || msg.includes('select') || msg.includes('route to');
  
  // Don't auto-route if the chatbot is in a strict state (like 'booking_confirm') or if the Nurse Wizard is open
  if (chatState !== 'booking_confirm' && (!window.nurseWizardStep || window.nurseWizardStep === 0)) {
    if (activeAgentId === 'receptionist' || explicitSwitch) {
      if (msg.includes('insurance') || msg.includes('anthem') || msg.includes('cigna') || msg.includes('unitedhealthcare') || msg.includes('copay') || msg.includes('coverage') || msg.includes('deductible') || msg.includes('policy')) {
        targetAgentId = 'insurance';
      } else if (msg.includes('billing') || msg.includes('invoice') || msg.includes('receipt') || msg.includes('price') || msg.includes('fee') || msg.includes('cost') || msg.includes('consultation fee') || msg.includes('payment') || msg.includes('pay')) {
        targetAgentId = 'billing';
      } else if (msg.includes('lab') || msg.includes('blood') || msg.includes('urine') || msg.includes('fasting') || msg.includes('test results') || msg.includes('bloodwork') || msg.includes('diagnostic')) {
        targetAgentId = 'lab';
      } else if (msg.includes('pharmacy') || msg.includes('medication') || msg.includes('medicine') || msg.includes('prescription') || msg.includes('refill') || msg.includes('pill') || msg.includes('dosage') || msg.includes('insulin') || msg.includes('usage') || msg.includes('directions')) {
        targetAgentId = 'pharmacy';
      } else if (msg.includes('fever') || msg.includes('cough') || msg.includes('headache') || msg.includes('stomach') || msg.includes('pain') || msg.includes('rash') || msg.includes('assess') || msg.includes('screening') || msg.includes('nurse intake')) {
        targetAgentId = 'nurse';
      } else if (msg.includes('summary') || msg.includes('soap') || msg.includes('intake report') || msg.includes('doctor summary') || msg.includes('clinician summary')) {
        targetAgentId = 'doctor';
      } else if (msg.includes('book') || msg.includes('schedule') || msg.includes('cancel') || msg.includes('reschedule') || msg.includes('hours') || msg.includes('open') || msg.includes('receptionist') || msg.includes('sunny')) {
        targetAgentId = 'receptionist';
      }
    }
  }

  // If the target agent is different, switch agent with handoff animation
  if (targetAgentId !== activeAgentId) {
    const nextAgent = agentMetadata[targetAgentId];
    const prevAgentName = agentMetadata[activeAgentId].name;
    logActivityEvent(`Handoff routing: ${prevAgentName} -> ${nextAgent.name}.`);
    
    // Trigger the switch agent UI/state
    switchAgent(targetAgentId, `Connecting to ${nextAgent.fullName}...`);
    
    // Return a transitional routing message
    return `I'll connect you with our **${nextAgent.fullName}** to assist you with that request. One moment, please...`;
  }

  // ==========================================================================
  // Active Agent Processing Logic (Domain Containment)
  // ==========================================================================

  // A. RECEPTIONIST AGENT
  if (activeAgentId === 'receptionist') {
    const symptomKeywords = ['fever', 'cough', 'headache', 'stomach', 'pain', 'rash', 'sick', 'ill', 'symptom', 'assess', 'screening'];
    
    if (chatState === 'recommend_nurse') {
      const yesTerms = ['yes', 'yep', 'ok', 'okay', 'sure', 'start', 'proceed'];
      if (yesTerms.some(t => msg.includes(t))) {
        chatState = 'idle';
        setTimeout(() => {
          const isMobile = window.innerWidth < 1024;
          window.startNurseAssessment(isMobile ? 'mobile' : 'sidebar');
        }, 500);
        return "Excellent! Launching the Sunshine AI Nurse Pre-Screening Assistant now...";
      } else {
        chatState = 'idle';
      }
    }

    if (chatState === 'idle' && symptomKeywords.some(keyword => msg.includes(keyword))) {
      chatState = 'recommend_nurse';
      return `I notice you are describing or asking about symptoms. I highly recommend conducting a brief, 2-minute pre-visit health assessment with our AI Nurse to help select the correct clinic department and service.

Would you like to start the assessment now? (Type "Yes" or click the button below)
<br><button onclick="const isMobile = window.innerWidth < 1024; window.startNurseAssessment(isMobile ? 'mobile' : 'sidebar')" class="mt-2.5 px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:scale-103 transition text-[10px]">🩺 Start AI Assessment</button>`;
    }

    if (chatState === 'booking_name') {
      bookingData.name = text.trim();
      sessionMemory.name = bookingData.name;
      chatState = 'booking_service';
      return `Thank you, ${bookingData.name}. What service are you scheduling today? (We offer General Medicine, Pediatrics, Physical Exams, Immunizations, or Lab Work).`;
    }

    if (chatState === 'booking_service') {
      bookingData.service = text.trim();
      sessionMemory.service = bookingData.service;
      chatState = 'booking_doctor';
      return `Got it, ${bookingData.service}. Which physician would you prefer: Dr. Sarah Lin (Pediatrics), Dr. Marcus Vance (General Medicine), Dr. Elena Rostova (Preventive Care), Dr. Jonathan Patel (Cardiology & Internal Medicine), or does any doctor work?`;
    }

    if (chatState === 'booking_doctor') {
      bookingData.doctor = text.trim();
      sessionMemory.doctor = bookingData.doctor;
      chatState = 'booking_datetime';
      return `Perfect. What day and time works best for you? Our hours are Monday–Friday 9AM–7PM, and Saturday 9AM–1PM.`;
    }

    if (chatState === 'booking_datetime') {
      bookingData.datetime = text.trim();
      const parts = bookingData.datetime.split(' ');
      sessionMemory.date = parts[0] || 'Today';
      sessionMemory.time = parts[1] || '11:00 AM';
      chatState = 'booking_confirm';
      return `Thank you. I have scheduled ${bookingData.service} with ${bookingData.doctor} for ${bookingData.name} on ${bookingData.datetime}. Does that look correct to you? (Please type "Yes" to confirm or "No" to cancel).`;
    }

    if (chatState === 'booking_confirm') {
      const confirmTerms = ['yes', 'yep', 'correct', 'confirm', 'sure', 'right', 'ok', 'okay'];
      if (confirmTerms.some(t => msg.includes(t))) {
        chatState = 'idle';
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const appt = {
          name: bookingData.name || sessionMemory.name,
          email: `${(bookingData.name || 'patient').toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: '(555) 123-4567',
          date: dateStr,
          time: '11:00 AM',
          doctor: bookingData.doctor,
          service: bookingData.service,
          insurance: 'Self-Pay / Insurance Verified',
          notes: bookingData.notes || 'Booked via AI Assistant Receptionist',
          source: "AI Receptionist",
          
          assessmentId: bookingData.assessmentId || "",
          primaryConcern: bookingData.primaryConcern || "",
          symptoms: bookingData.symptoms || "",
          duration: bookingData.duration || "",
          severity: bookingData.severity || "",
          medicalHistory: bookingData.medicalHistory || "",
          nurseSummary: bookingData.nurseSummary || "",
          recommendedDepartment: bookingData.recommendedDepartment || "",
          priorityLevel: bookingData.priorityLevel || ""
        };

        const created = createBooking(appt);
        logActivityEvent("Receptionist booked appointment.");
        updateCollaborationTimeline('booked', 'Completed');

        setTimeout(() => {
          loadAppointments();
          refreshDashboardUI(true);
          if (window.switchToTab) {
            window.switchToTab('appointments');
            showToast('New appointment added!', 'info');
          }
        }, 1500);

        return `✅ Your appointment has been successfully scheduled.

**Appointment Details**
* **Patient:** ${created.name}
* **Doctor:** ${created.doctor}
* **Date:** ${created.date}
* **Time:** ${created.time}
* **Service:** ${created.service}`;
      } else {
        chatState = 'idle';
        return "No problem, I've cancelled the draft booking. Let me know if you would like to schedule another time, or if I can answer other questions!";
      }
    }

    if (msg.includes('hour') || msg.includes('open') || msg.includes('close') || msg.includes('saturday') || msg.includes('sunday') || msg.includes('weekend')) {
      return "Sunshine Wellness Clinic is open Monday–Friday from 9:00 AM to 7:00 PM, and Saturday from 9:00 AM to 1:00 PM. We are closed on Sundays.";
    }

    if (msg.includes('book') || msg.includes('schedule') || msg.includes('appointment') || msg.includes('appointment') || msg.includes('reserve') || msg.includes('make a date') || msg.includes('see a doctor')) {
      chatState = 'booking_name';
      bookingData = { name: sessionMemory.name || '', service: '', doctor: '', datetime: '', notes: 'Booked via AI Assistant' };
      return "I would be happy to help you schedule an appointment today! To get started, what is your full name?";
    }

    if (msg.includes('doctor') || msg.includes('physician') || msg.includes('staff') || msg.includes('pediatrician') || msg.includes('lin') || msg.includes('vance') || msg.includes('rostova') || msg.includes('patel')) {
      return "Our clinical team includes Dr. Sarah Lin (Pediatrics), Dr. Marcus Vance (General Medicine), Dr. Elena Rostova (Preventive Care), and Dr. Jonathan Patel (Cardiology & Internal Medicine). They are all accepting new patients!";
    }

    if (msg.includes('service') || msg.includes('vaccin') || msg.includes('immuniz') || msg.includes('physical')) {
      return "We offer General Medicine, Pediatrics, Annual Physical Exams, Vaccinations & Immunizations, Laboratory Testing, and Preventive Care. Let me know if you would like details on any of these.";
    }

    if (msg.includes('contact') || msg.includes('phone') || msg.includes('email') || msg.includes('address') || msg.includes('location') || msg.includes('where')) {
      return "We are located at Sunshine Wellness Clinic. You can call us at (555) 867-5309 or email info@sunshinewellness.com. How else can I assist you?";
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings') || msg.includes('morning') || msg.includes('afternoon')) {
      return `Hello! Thank you for reaching out to Sunshine Wellness Clinic. How can I help you today?`;
    }

    return "I want to make sure I assist you correctly. I can help you schedule appointments, provide clinic hours, list accepted insurance, or share doctor details. What can I do for you today?";
  }

  // B. NURSE INTAKE AGENT
  if (activeAgentId === 'nurse') {
    if (msg.includes('fever') || msg.includes('cough') || msg.includes('headache') || msg.includes('stomach') || msg.includes('pain') || msg.includes('rash') || msg.includes('sick') || msg.includes('assess') || msg.includes('screening')) {
      updateCollaborationTimeline('nurse', 'In Progress');
      return `I notice you want to describe symptoms. To conduct a thorough pre-screening, please click the **"AI Nurse Intake"** button at the top of the Quick Tasks panel or click the button below to launch the step-by-step screening tool. 
      <br><button onclick="const isMobile = window.innerWidth < 1024; window.startNurseAssessment(isMobile ? 'mobile' : 'sidebar')" class="mt-2.5 px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:scale-103 transition text-[10px]">🩺 Start AI Assessment Wizard</button>`;
    }
    return `I specialize only in pre-screening health assessments and symptom checkups. If you have questions about insurance coverages, consultation fees, or booking, please click on the correct agent in the team dock above or ask me to "connect to insurance" or "switch to receptionist".`;
  }

  // C. DOCTOR ASSISTANT
  if (activeAgentId === 'doctor') {
    if (msg.includes('summary') || msg.includes('soap') || msg.includes('report') || msg.includes('intake') || msg.includes('clinical') || msg.includes('generate')) {
      updateCollaborationTimeline('doctor', 'In Progress');
      
      const concern = bookingData.primaryConcern || sessionMemory.primaryConcern || "Not Specified";
      const duration = bookingData.duration || sessionMemory.duration || "Not Specified";
      const severity = bookingData.severity || sessionMemory.severity || "Not Specified";
      const history = bookingData.medicalHistory || sessionMemory.medicalHistory || "None";
      const nurseSummary = bookingData.nurseSummary || "No active screening completed yet.";
      const dept = bookingData.recommendedDepartment || "General Medicine";

      const soapDraft = `
**[CLINICIAN SOAP REPORT DRAFT]**
* **S (Subjective):** Patient describes primary concern as "${concern}". Duration is reported as "${duration}". History includes: ${history}.
* **O (Objective):** Severity level registered at ${severity}. Vital indicators and checklist elements completed via AI Nurse triage.
* **A (Assessment):** Routing suggestiveness indicates alignment to ${dept}. Priority level: Routine pre-screening.
* **P (Plan):** Schedule clinical consultation. Recommend 15-20 min appointment slot.
`;
      
      logActivityEvent("Doctor summary generated.");
      updateCollaborationTimeline('doctor', 'Completed');

      saveAssessment({
        patientName: sessionMemory.name || "Guest Patient",
        primaryConcern: concern,
        symptoms: bookingData.symptoms || "None",
        duration: duration,
        severity: severity,
        medicalHistory: history,
        nurseSummary: nurseSummary,
        recommendedDepartment: dept,
        priorityLevel: "Routine"
      });

      return `Based on your screening details, I have drafted the following **Clinical SOAP Summary** for your clinician:

${soapDraft}

*⚠️ Disclaimer: This summary is generated as a clinical draft only. I do not diagnose illnesses or prescribe treatments.*`;
    }
    return `I specialize in compiling clinical SOAP summaries from completed nurse pre-screening assessments. If you need billing inquiries, please select the Payments Auditor card above.`;
  }

  // D. INSURANCE ASSISTANT
  if (activeAgentId === 'insurance') {
    if (msg.includes('insurance') || msg.includes('anthem') || msg.includes('cigna') || msg.includes('united') || msg.includes('blue cross') || msg.includes('aetna') || msg.includes('copay') || msg.includes('coverage') || msg.includes('deductible') || msg.includes('policy')) {
      updateCollaborationTimeline('insurance', 'In Progress');
      
      let answer = "";
      if (msg.includes('anthem') || msg.includes('cigna') || msg.includes('united') || msg.includes('blue cross') || msg.includes('aetna')) {
        answer = "Yes! Sunshine Wellness Clinic accepts **Anthem, Cigna, UnitedHealthcare, Aetna, and Blue Cross Blue Shield** standard plans. Under our current clinic agreements, standard preventive consultations have a **$25.00 copay**.";
      } else {
        answer = "We accept most major insurance providers including Anthem, Cigna, and UnitedHealthcare. If your carrier is different, we can submit a prior authorization request. Standard copays range from **$20.00 to $45.00**.";
      }

      logActivityEvent("Insurance verified.");
      updateCollaborationTimeline('insurance', 'Completed');

      saveInsuranceCheck({
        patientName: sessionMemory.name || "Guest Patient",
        insuranceProvider: msg.includes('cigna') ? 'Cigna' : (msg.includes('anthem') ? 'Anthem' : 'Other Major'),
        coverageDetails: "Verified under standard clinic contracts",
        copayAmount: "$25.00",
        status: "Approved"
      });

      return `${answer} Let me know if you would like me to check standard prior authorization rules or copay details for other services!`;
    }
    return `I specialize in checking provider carrier benefits and standard copays. For diagnostics lab preparations or prescription usage guidelines, please select the Diagnostics Guide or Medication Guide above.`;
  }

  // E. BILLING ASSISTANT
  if (activeAgentId === 'billing') {
    if (msg.includes('billing') || msg.includes('invoice') || msg.includes('receipt') || msg.includes('price') || msg.includes('fee') || msg.includes('cost') || msg.includes('pay') || msg.includes('payment') || msg.includes('charge')) {
      let feeQuote = "";
      if (msg.includes('lab') || msg.includes('blood') || msg.includes('test')) {
        feeQuote = "Standard blood work panels cost between **$50.00 and $120.00**, depending on whether fasting panels or thyroid assessments are ordered.";
      } else {
        feeQuote = "Our standard **general medicine consultation is $150.00** (for self-pay patients). Specialist visits are priced at **$220.00**.";
      }

      saveBillingInvoice({
        patientName: sessionMemory.name || "Guest Patient",
        serviceType: msg.includes('lab') ? 'Lab Work' : 'General Consultation',
        feeAmount: msg.includes('lab') ? '$85.00' : '$150.00',
        paymentMethod: "Credit Card / FSA",
        status: "Pending"
      });

      logActivityEvent("Billing invoice created.");

      return `Here are the standard pricing details:
      
* **General Consultation:** $150.00 (Self-Pay)
* **Specialist Consultation:** $220.00
* ${feeQuote}

We accept credit cards, Visa, Mastercard, HSA/FSA cards, and bank drafts. Let me know if you need invoice status details!`;
    }
    return `I handle consultation billing quotes and invoice processing. If you have questions about symptom screening or medical histories, please select the AI Nurse Intake card above.`;
  }

  // F. LAB ASSISTANT
  if (activeAgentId === 'lab') {
    if (msg.includes('lab') || msg.includes('blood') || msg.includes('urine') || msg.includes('fast') || msg.includes('prep') || msg.includes('instruction') || msg.includes('prepare') || msg.includes('test')) {
      let instructions = "For standard lab tests, results are typically processed and posted to your secure patient portal within **24 to 48 hours**.";
      
      if (msg.includes('fast') || msg.includes('prep') || msg.includes('blood') || msg.includes('urine')) {
        instructions = "For fasting blood work (including cholesterol lipid panels and metabolic screenings), please **fast (no food or drinks except water) for 8 to 12 hours** before your appointment. Keep taking regular prescription medicines unless your doctor instructs otherwise.";
      }

      return `Here are your lab instructions:

* **Preparation:** ${instructions}
* **Result Timelines:** Standard results are uploaded to your portal in 1-2 business days.

Please contact our lab coordinator if you have questions about specific diagnostic test preparations!`;
    }
    return `I specialize in diagnostics and lab work preparation instructions. For scheduling checkups or cancellation requests, please choose the Receptionist above.`;
  }

  // G. PHARMACY ASSISTANT
  if (activeAgentId === 'pharmacy') {
    const drugName = extractDrugName(msg);
    if (drugName) {
      logActivityEvent(`Pharmacy Agent searching openFDA for drug: "${drugName}"`);
      try {
        const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drugName)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const brandName = result.openfda?.brand_name?.[0] || drugName.toUpperCase();
            const genericName = result.openfda?.generic_name?.[0] || "Not Specified";
            
            let usageText = result.indications_and_usage?.[0] || "No standard usage labeling found.";
            usageText = usageText.replace(/^\d+\s+INDICATIONS\s+&\s+USAGE\s*/i, '').trim();
            if (usageText.length > 350) {
              usageText = usageText.substring(0, 350) + "...";
            }
            
            let dosageText = result.dosage_and_administration?.[0] || "Follow clinician directions.";
            dosageText = dosageText.replace(/^\d+\s+DOSAGE\s+&\s+ADMINISTRATION\s*/i, '').trim();
            if (dosageText.length > 300) {
              dosageText = dosageText.substring(0, 300) + "...";
            }
            
            let storageText = result.storage_and_handling?.[0] || result.how_supplied?.[0] || "Store at room temperature away from direct light.";
            if (storageText.length > 200) {
              storageText = storageText.substring(0, 200) + "...";
            }
            
            // Log successful lookup activity
            logActivityEvent(`Successfully retrieved real-time FDA info for ${brandName}.`);
            
            return `Here is the real-time clinical FDA guidance for **${brandName}** (Generic: *${genericName}*):
            
* **Usage & Indications:** ${usageText}
* **Dosage & Administration:** ${dosageText}
* **Storage Instructions:** ${storageText}

*⚠️ Disclaimer: I provide general pharmacy guidelines fetched dynamically from openFDA. I do not prescribe, adjust, or offer personalized medication advice.*`;
          }
        }
      } catch (err) {
        logActivityEvent(`FDA search failed for "${drugName}". Falling back to generic.`);
      }
    }
    
    // Default fallback if no drug extracted or lookup failed
    return `I specialize in general medication usage directions and refill routing. I couldn't find specific details for that medication. Please ask about standard prescriptions like Advil, Metformin, or Lipitor, or click on the Coverage Coordinator for benefits.`;
  }

  return "I want to assist you correctly. Please let me know what questions you have about our services, billing, insurance, or scheduling.";
}

/* ==========================================================================
   8. Full Voice Interaction Module (STT / TTS / Interruption / Settings)
   ========================================================================== */
let voiceState = 'READY'; 
let isSpeakerEnabled = false; // Muted by default so voice chat doesn't start automatically
let currentLanguage = 'en-US';
let currentVoiceStyle = 'female';
let speechRate = 1.0;
let autoSendEnabled = true;

window.setChatMode = function(mode) {
  const textBtnSide = document.getElementById('sidebar-mode-text-btn');
  const audioBtnSide = document.getElementById('sidebar-mode-audio-btn');
  const textBtnMob = document.getElementById('mobile-mode-text-btn');
  const audioBtnMob = document.getElementById('mobile-mode-audio-btn');

  const activeClasses = ['bg-white', 'dark:bg-slate-900', 'text-primary', 'shadow-xs'];
  const inactiveClasses = ['text-slate-550', 'dark:text-slate-400', 'hover:text-primary'];

  if (mode === 'text') {
    isSpeakerEnabled = false;
    if (SpeechSynthesis) SpeechSynthesis.cancel();
    if (sttRecognition && voiceState === 'LISTENING') {
      try { sttRecognition.stop(); } catch(e){}
    }
    updateVoiceState('READY');

    // Update active styles
    [textBtnSide, textBtnMob].forEach(btn => {
      if (btn) {
        btn.classList.add(...activeClasses);
        btn.classList.remove(...inactiveClasses);
      }
    });
    [audioBtnSide, audioBtnMob].forEach(btn => {
      if (btn) {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
      }
    });

    logActivityEvent("User switched to Text Chat Mode.");
  } else {
    isSpeakerEnabled = true;
    
    // Update active styles
    [audioBtnSide, audioBtnMob].forEach(btn => {
      if (btn) {
        btn.classList.add(...activeClasses);
        btn.classList.remove(...inactiveClasses);
      }
    });
    [textBtnSide, textBtnMob].forEach(btn => {
      if (btn) {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
      }
    });

    // Start listening
    if (sttRecognition && voiceState !== 'LISTENING') {
      try { sttRecognition.start(); } catch(e){}
    }

    logActivityEvent("User switched to Audio Chat Mode.");
    showToast("Audio Chat Mode active. Speak now!", "info");
  }

  // Sync speaker toggle button icons
  const speakerButtons = [
    document.getElementById('sidebar-voice-speaker-btn'),
    document.getElementById('mobile-voice-speaker-btn')
  ];

  speakerButtons.forEach(btn => {
    if (!btn) return;
    const volOn = btn.querySelector('.vol-on-icon');
    const volOff = btn.querySelector('.vol-off-icon');
    if (isSpeakerEnabled) {
      if (volOn) volOn.classList.remove('hidden');
      if (volOff) volOff.classList.add('hidden');
      btn.classList.remove('text-rose-500');
    } else {
      if (volOn) volOn.classList.add('hidden');
      if (volOff) volOff.classList.remove('hidden');
      btn.classList.add('text-rose-500');
    }
  });
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;
let sttRecognition = null;
let activeUtterance = null;

function initVoice() {
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser.");
  } else {
    sttRecognition = new SpeechRecognition();
    sttRecognition.continuous = false;
    sttRecognition.interimResults = true;

    sttRecognition.onstart = () => {
      updateVoiceState('LISTENING');
    };

    sttRecognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const transcript = finalTranscript || interimTranscript;
      const floatInput = document.getElementById('chatbot-input');
      const sideInput = document.getElementById('sidebar-chat-input');
      if (floatInput) floatInput.value = transcript;
      if (sideInput) sideInput.value = transcript;
    };

    sttRecognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed') {
        updateVoiceState('PERMISSION_REQUIRED');
        showToast("Microphone permission required for voice interaction.", "error");
      } else {
        updateVoiceState('READY');
      }
    };

    sttRecognition.onend = () => {
      if (voiceState === 'LISTENING') {
        updateVoiceState('READY');
        const floatInput = document.getElementById('chatbot-input');
        const sideInput = document.getElementById('sidebar-chat-input');
        const finalVal = (floatInput ? floatInput.value : "") || (sideInput ? sideInput.value : "");

        if (finalVal.trim() && autoSendEnabled) {
          if (floatInput) floatInput.value = '';
          if (sideInput) sideInput.value = '';
          handleUserMessage(finalVal);
        }
      }
    };
  }

  bindVoiceControls();
  window.setChatMode('text');
}

function updateVoiceState(state) {
  voiceState = state;

  const states = {
    READY: { text: "Ready", dotColor: "bg-emerald-500", showWaveform: false },
    LISTENING: { text: "Listening", dotColor: "bg-rose-500 animate-ping", showWaveform: true },
    PROCESSING: { text: "Processing", dotColor: "bg-amber-500 animate-pulse", showWaveform: false },
    SPEAKING: { text: "Speaking", dotColor: "bg-emerald-500 animate-pulse", showWaveform: true },
    PERMISSION_REQUIRED: { text: "Mic Permission Required", dotColor: "bg-rose-600", showWaveform: false }
  };

  const current = states[state] || states.READY;

  const sideStatusText = document.getElementById('sidebar-voice-status-text');
  const sideStatusDot = document.getElementById('sidebar-voice-status-dot');
  const sideContainer = document.getElementById('sidebar-voice-status-container');
  const sideWaveform = document.getElementById('sidebar-voice-waveform');
  const sideInterruptHint = document.getElementById('sidebar-interrupt-hint');

  if (sideStatusText) sideStatusText.textContent = current.text;
  if (sideStatusDot) {
    sideStatusDot.className = `w-2.5 h-2.5 rounded-full ${current.dotColor}`;
  }
  if (sideContainer) {
    if (state === 'READY') {
      sideContainer.classList.add('hidden');
    } else {
      sideContainer.classList.remove('hidden');
    }
  }
  if (sideWaveform) {
    if (current.showWaveform) sideWaveform.classList.remove('opacity-0');
    else sideWaveform.classList.add('opacity-0');
  }
  if (sideInterruptHint) {
    sideInterruptHint.textContent = state === 'SPEAKING' ? "Tap to interrupt" : "";
  }

  const mobStatusText = document.getElementById('mobile-voice-status-text');
  const mobStatusDot = document.getElementById('mobile-voice-status-dot');
  const mobContainer = document.getElementById('mobile-voice-status-container');
  const mobWaveform = document.getElementById('mobile-voice-waveform');
  const mobInterruptHint = document.getElementById('mobile-interrupt-hint');

  if (mobStatusText) mobStatusText.textContent = current.text;
  if (mobStatusDot) {
    mobStatusDot.className = `w-2.5 h-2.5 rounded-full ${current.dotColor}`;
  }
  if (mobContainer) {
    if (state === 'READY') {
      mobContainer.classList.add('hidden');
    } else {
      mobContainer.classList.remove('hidden');
    }
  }
  if (mobWaveform) {
    if (current.showWaveform) mobWaveform.classList.remove('opacity-0');
    else mobWaveform.classList.add('opacity-0');
  }
  if (mobInterruptHint) {
    mobInterruptHint.textContent = state === 'SPEAKING' ? "Tap to interrupt" : "";
  }

  const toggleButtons = [
    document.getElementById('sidebar-voice-toggle-btn'),
    document.getElementById('mobile-voice-toggle-btn')
  ];
  toggleButtons.forEach(btn => {
    if (!btn) return;
    const micIcon = btn.querySelector('.mic-icon');
    const micOffIcon = btn.querySelector('.mic-off-icon');
    if (state === 'LISTENING') {
      btn.classList.add('bg-rose-50', 'text-rose-500', 'dark:bg-rose-955/20');
      if (micIcon) micIcon.classList.add('hidden');
      if (micOffIcon) micOffIcon.classList.remove('hidden');
    } else {
      btn.classList.remove('bg-rose-50', 'text-rose-500', 'dark:bg-rose-955/20');
      if (micIcon) micIcon.classList.remove('hidden');
      if (micOffIcon) micOffIcon.classList.add('hidden');
    }
  });

  const sideAvatar = document.getElementById('sidebar-avatar-container');
  const mobAvatar = document.getElementById('mobile-avatar-container');
  [sideAvatar, mobAvatar].forEach(avatar => {
    if (!avatar) return;
    avatar.className = avatar.className.replace(/\bavatar-voice-\S+/g, '');
    if (state === 'LISTENING') {
      avatar.classList.add('avatar-voice-listening');
    } else if (state === 'SPEAKING') {
      avatar.classList.add('avatar-voice-speaking');
    } else if (state === 'PROCESSING') {
      avatar.classList.add('avatar-voice-processing');
    }
  });
}

function startListening() {
  if (SpeechSynthesis) SpeechSynthesis.cancel();
  if (!sttRecognition) {
    showToast("Speech Recognition not supported in this browser.", "error");
    return;
  }
  try {
    sttRecognition.lang = currentLanguage;
    sttRecognition.start();
  } catch (e) {
    console.error("Listening trigger error:", e);
  }
}

function stopListening() {
  if (sttRecognition) {
    try { sttRecognition.stop(); } catch(e){}
  }
  updateVoiceState('READY');
}

function toggleVoice() {
  if (!isSpeakerEnabled) {
    // Switch to Audio Chat Mode if mic is clicked in text mode
    window.setChatMode('audio');
    return;
  }

  if (voiceState === 'SPEAKING') {
    if (SpeechSynthesis) SpeechSynthesis.cancel();
    startListening();
  } else if (voiceState === 'LISTENING') {
    stopListening();
  } else {
    startListening();
  }
}

function toggleSpeaker() {
  // Sync toggle action with full setChatMode styling updates
  window.setChatMode(isSpeakerEnabled ? 'text' : 'audio');
}

function getVoiceProfile(lang, style) {
  if (!SpeechSynthesis) return null;
  const voices = SpeechSynthesis.getVoices();
  
  let matchLang = voices.filter(v => v.lang.replace('_', '-').startsWith(lang.substring(0, 2)));
  if (matchLang.length === 0) {
    matchLang = voices.filter(v => v.lang.startsWith('en'));
  }

  if (style === 'female') {
    const femaleCues = ['female', 'zira', 'samantha', 'karen', 'moira', 'tessa', 'hazel', 'susan', 'heera', 'pallavi'];
    const voice = matchLang.find(v => femaleCues.some(cue => v.name.toLowerCase().includes(cue)));
    if (voice) return voice;
  } else {
    const maleCues = ['male', 'david', 'ravi', 'george', 'mark', 'hector', 'microsoft'];
    const voice = matchLang.find(v => maleCues.some(cue => v.name.toLowerCase().includes(cue)));
    if (voice) return voice;
  }
  return matchLang[0] || null;
}

function speakText(text) {
  if (!SpeechSynthesis || !isSpeakerEnabled) return;
  
  const mode = document.getElementById('sidebar-response-mode-select')?.value || 'both';
  if (mode === 'text') return;

  SpeechSynthesis.cancel();
  const clean = text.replace(/<\/?[^>]+(>|$)/g, "").replace(/⚠️/g, "").replace(/🟢/g, "").replace(/👋/g);

  activeUtterance = new SpeechSynthesisUtterance(clean);
  activeUtterance.lang = currentLanguage;
  activeUtterance.rate = speechRate;
  
  const voice = getVoiceProfile(currentLanguage, currentVoiceStyle);
  if (voice) activeUtterance.voice = voice;

  activeUtterance.onstart = () => {
    updateVoiceState('SPEAKING');
  };

  activeUtterance.onend = () => {
    if (voiceState === 'SPEAKING') updateVoiceState('READY');
  };

  activeUtterance.onerror = () => {
    if (voiceState === 'SPEAKING') updateVoiceState('READY');
  };

  SpeechSynthesis.speak(activeUtterance);
}

function bindVoiceControls() {
  const toggleBtnSide = document.getElementById('sidebar-voice-toggle-btn');
  const toggleBtnMob = document.getElementById('mobile-voice-toggle-btn');

  if (toggleBtnSide) toggleBtnSide.addEventListener('click', toggleVoice);
  if (toggleBtnMob) toggleBtnMob.addEventListener('click', toggleVoice);

  const sideContainer = document.getElementById('sidebar-voice-status-container');
  const mobContainer = document.getElementById('mobile-voice-status-container');
  if (sideContainer) sideContainer.addEventListener('click', () => { if (voiceState === 'SPEAKING') toggleVoice(); });
  if (mobContainer) mobContainer.addEventListener('click', () => { if (voiceState === 'SPEAKING') toggleVoice(); });

  const speakSide = document.getElementById('sidebar-voice-speaker-btn');
  const speakMob = document.getElementById('mobile-voice-speaker-btn');
  if (speakSide) speakSide.addEventListener('click', toggleSpeaker);
  if (speakMob) speakMob.addEventListener('click', toggleSpeaker);

  const settingsSide = document.getElementById('sidebar-voice-settings-btn');
  const drawerSide = document.getElementById('sidebar-voice-drawer');
  const closeSide = document.getElementById('sidebar-voice-drawer-close');

  if (settingsSide && drawerSide) {
    settingsSide.addEventListener('click', () => {
      drawerSide.classList.toggle('translate-y-full');
    });
  }
  if (closeSide && drawerSide) {
    closeSide.addEventListener('click', () => {
      drawerSide.classList.add('translate-y-full');
    });
  }

  const settingsMob = document.getElementById('mobile-voice-settings-btn');
  const drawerMob = document.getElementById('mobile-voice-drawer');
  const closeMob = document.getElementById('mobile-voice-drawer-close');

  if (settingsMob && drawerMob) {
    settingsMob.addEventListener('click', () => {
      drawerMob.classList.toggle('translate-y-full');
    });
  }
  if (closeMob && drawerMob) {
    closeMob.addEventListener('click', () => {
      drawerMob.classList.add('translate-y-full');
    });
  }

  const langSide = document.getElementById('sidebar-voice-lang-select');
  const langMob = document.getElementById('mobile-voice-lang-select');

  function syncLang(val) {
    currentLanguage = val;
    if (langSide) langSide.value = val;
    if (langMob) langMob.value = val;
    showToast(`Language changed to ${val === 'en-US' ? 'English' : val === 'ta-IN' ? 'Tamil' : 'Hindi'}`, 'info');
  }

  if (langSide) langSide.addEventListener('change', (e) => syncLang(e.target.value));
  if (langMob) langMob.addEventListener('change', (e) => syncLang(e.target.value));

  const styleSide = document.getElementById('sidebar-voice-style-select');
  const styleMob = document.getElementById('mobile-voice-style-select');

  function syncStyle(val) {
    currentVoiceStyle = val;
    if (styleSide) styleSide.value = val;
    if (styleMob) styleMob.value = val;
  }

  if (styleSide) styleSide.addEventListener('change', (e) => syncStyle(e.target.value));
  if (styleMob) styleMob.addEventListener('change', (e) => syncStyle(e.target.value));

  const speedSide = document.getElementById('sidebar-speed-slider');
  const speedMob = document.getElementById('mobile-speed-slider');
  const speedLblSide = document.getElementById('sidebar-speed-val');
  const speedLblMob = document.getElementById('mobile-speed-val');

  function syncSpeed(val) {
    speechRate = parseFloat(val);
    const speedTxt = `${speechRate.toFixed(1)}x ${speechRate === 1.0 ? '(Normal)' : speechRate < 1.0 ? '(Slow)' : '(Fast)'}`;
    
    if (speedSide) speedSide.value = val;
    if (speedMob) speedMob.value = val;
    if (speedLblSide) speedLblSide.textContent = speedTxt;
    if (speedLblMob) speedLblMob.textContent = speedTxt;
  }

  if (speedSide) speedSide.addEventListener('input', (e) => syncSpeed(e.target.value));
  if (speedMob) speedMob.addEventListener('input', (e) => syncSpeed(e.target.value));

  const autoSide = document.getElementById('sidebar-auto-send-toggle');
  const autoMob = document.getElementById('mobile-auto-send-toggle');

  function syncAutoSend(checked) {
    autoSendEnabled = checked;
    if (autoSide) autoSide.checked = checked;
    if (autoMob) autoMob.checked = checked;
  }

  if (autoSide) autoSide.addEventListener('change', (e) => syncAutoSend(e.target.checked));
  if (autoMob) autoMob.addEventListener('change', (e) => syncAutoSend(e.target.checked));

  if (SpeechSynthesis) {
    SpeechSynthesis.getVoices();
    if (SpeechSynthesis.onvoiceschanged !== undefined) {
      SpeechSynthesis.onvoiceschanged = () => SpeechSynthesis.getVoices();
    }
  }
}

/* ==========================================================================
   9. Sidebar View Tabs Switcher & Real-time Live Dashboard
   ========================================================================== */
function initSidebarTabs() {
  const tabChat = document.getElementById('sidebar-toggle-chat');
  const tabAnalytic = document.getElementById('sidebar-toggle-analytics');
  const panelChat = document.getElementById('sidebar-chat-panel');
  const panelAnalytic = document.getElementById('sidebar-analytics-panel');

  if (tabChat && tabAnalytic && panelChat && panelAnalytic) {
    tabChat.addEventListener('click', () => {
      panelChat.classList.remove('hidden');
      panelAnalytic.classList.add('hidden');
      
      tabChat.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-850', 'dark:text-white');
      tabChat.classList.remove('text-slate-500', 'dark:text-slate-400');
      
      tabAnalytic.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-850', 'dark:text-white');
      tabAnalytic.classList.add('text-slate-500', 'dark:text-slate-400');
    });

    tabAnalytic.addEventListener('click', () => {
      panelChat.classList.add('hidden');
      panelAnalytic.classList.remove('hidden');
      
      tabAnalytic.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-850', 'dark:text-white');
      tabAnalytic.classList.remove('text-slate-500', 'dark:text-slate-400');
      
      tabChat.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-850', 'dark:text-white');
      tabChat.classList.add('text-slate-500', 'dark:text-slate-400');

      refreshDashboardUI();
    });
  }
}

function initDashboardUpdates() {
  const manualBtn = document.getElementById('dash-manual-refresh');
  if (manualBtn) {
    manualBtn.addEventListener('click', () => {
      refreshDashboardUI();
      showToast("Metrics refreshed!", "info");
    });
  }

  // Trigger auto refresh sync queue and dashboard every 45 seconds
  setInterval(() => {
    refreshDashboardUI();
    syncOfflineQueue();
  }, 45000);

  // Initial dashboard load
  refreshDashboardUI();
}

/**
 * Dynamically updates all metrics cards and recent bookings logs in the dashboard view
 */
function refreshDashboardUI(animateNewBooking = false) {
  const metrics = getDashboardMetrics();
  
  // Update Appts Today
  const apptsCountEl = document.getElementById('dash-appt-count');
  if (apptsCountEl) {
    const oldVal = parseInt(apptsCountEl.textContent, 10) || 0;
    apptsCountEl.textContent = metrics.appointmentsToday;

    // Trigger green flash focus update
    const apptCard = document.getElementById('dash-card-appt');
    if (apptCard && animateNewBooking && oldVal !== metrics.appointmentsToday) {
      apptCard.classList.add('animate-green-flash');
      setTimeout(() => {
        apptCard.classList.remove('animate-green-flash');
      }, 1500);
    }
  }

  // Update Wait Time
  const waitTextEl = document.getElementById('dash-wait-text');
  const waitLevelEl = document.getElementById('dash-wait-level');
  if (waitTextEl) waitTextEl.textContent = `${metrics.waitMinutes} Minutes`;
  if (waitLevelEl) {
    waitLevelEl.textContent = metrics.waitLevel;
    waitLevelEl.className = `text-[8px] font-bold px-2 py-0.5 rounded-full ${
      metrics.waitLevel === 'Low' ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-950/20' :
      metrics.waitLevel === 'Medium' ? 'bg-amber-100/50 text-amber-600 dark:bg-amber-950/20' :
      'bg-rose-100/50 text-rose-600 dark:bg-rose-950/20'
    }`;
  }

  // Update Conversation count
  const convCountEl = document.getElementById('dash-conv-count');
  if (convCountEl) convCountEl.textContent = metrics.conversationsToday;

  // Load Recent Bookings
  const recentListEl = document.getElementById('dash-recent-list');
  if (recentListEl) {
    const appts = getLocalAppointments();
    const recent = appts.slice(-5).reverse(); // last 5 bookings

    if (recent.length === 0) {
      recentListEl.innerHTML = `
        <tr>
          <td colspan="3" class="p-3 text-center text-slate-400 italic">No appointments booked yet.</td>
        </tr>
      `;
    } else {
      recentListEl.innerHTML = '';
      recent.forEach(appt => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors";
        
        const isCancelled = appt.status === 'Cancelled';
        const docInitial = appt.doctor.replace('Dr. ', '').split(' ')[0];

        tr.innerHTML = `
          <td class="p-2 font-bold text-slate-800 dark:text-slate-200">
            ${appt.name}
            <span class="block text-[7px] text-slate-400 dark:text-slate-500 font-medium">${appt.id}</span>
          </td>
          <td class="p-2 text-slate-500 dark:text-slate-400">
            Dr. ${docInitial} • ${appt.service.substring(0, 10)}...
            <span class="block text-[7px] text-slate-400 dark:text-slate-500 font-medium">${appt.date} • ${appt.time}</span>
          </td>
          <td class="p-2 text-right">
            <span class="px-1.5 py-0.5 rounded text-[7px] font-bold ${
              isCancelled ? 'bg-slate-100 text-slate-550 dark:bg-slate-800' :
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20'
            }">${appt.status || 'Confirmed'}</span>
          </td>
        `;
        recentListEl.appendChild(tr);
      });
    }
  }

  // Trigger brief rotation of the refresh spinner icon
  const spinner = document.getElementById('dash-refresh-spinner');
  if (spinner) {
    spinner.classList.add('refresh-spinner');
    setTimeout(() => {
      spinner.classList.remove('refresh-spinner');
    }, 1000);
  }
}
export { refreshDashboardUI };

/* ==========================================================================
   9. AI Nurse Intake Pre-Screening Wizard Module
   ========================================================================== */
let nurseWizardStep = 1;
let isNurseActive = false;
let nurseActiveMode = 'sidebar'; // 'sidebar' or 'mobile'
let nurseData = {
  concern: '',
  duration: '',
  severity: 'Moderate',
  painScale: 5,
  symptoms: [],
  ageGroup: 'Adult',
  medications: '',
  allergies: '',
  chronic: [],
  pregnancy: 'No',
  docPref: '',
  datePref: '',
  timePref: '',
  visitType: 'In-person'
};

const emergencyKeywords = [
  'chest pain', 'chest discomfort', 'severe difficulty breathing', 'difficulty breathing', 
  'shortness of breath', 'stroke', 'paralysis', 'uncontrolled bleeding', 'unconscious', 
  'seizure', 'loss of consciousness', 'seizures'
];

function checkEmergency(text) {
  const clean = (text || '').toLowerCase();
  return emergencyKeywords.some(w => clean.includes(w));
}

window.startNurseAssessment = function(mode) {
  isNurseActive = true;
  nurseActiveMode = mode || 'sidebar';
  nurseWizardStep = 1;
  nurseData = {
    concern: '',
    duration: '',
    severity: 'Moderate',
    painScale: 5,
    symptoms: [],
    ageGroup: 'Adult',
    medications: '',
    allergies: '',
    chronic: [],
    pregnancy: 'No',
    docPref: '',
    datePref: '',
    timePref: '',
    visitType: 'In-person'
  };

  if (window.speechSynthesis) window.speechSynthesis.cancel();

  // Hide the chat log panels
  const chatView = document.getElementById(mode === 'sidebar' ? 'sidebar-chat-box-view' : 'mobile-chat-box-view');
  const wizardView = document.getElementById(mode === 'sidebar' ? 'sidebar-nurse-wizard-view' : 'mobile-nurse-wizard-view');

  if (chatView) chatView.classList.add('hidden');
  if (wizardView) {
    wizardView.classList.remove('hidden');
    wizardView.classList.add('flex');
  }

  renderNurseStep();
};

window.stopNurseAssessment = function() {
  isNurseActive = false;
  const chatView = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-chat-box-view' : 'mobile-chat-box-view');
  const wizardView = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-nurse-wizard-view' : 'mobile-nurse-wizard-view');

  if (wizardView) {
    wizardView.classList.add('hidden');
    wizardView.classList.remove('flex');
  }
  if (chatView) chatView.classList.remove('hidden');
};

window.setNurseConcern = function(concern) {
  nurseData.concern = concern;
  if (checkEmergency(concern)) {
    escalateEmergency();
    return;
  }
  renderNurseStep();
};

window.handleConcernTextInput = function(val) {
  nurseData.concern = val;
  if (checkEmergency(val)) {
    escalateEmergency();
  }
};

window.setNurseDuration = function(duration) {
  nurseData.duration = duration;
  renderNurseStep();
};

window.setNurseSeverity = function(severity) {
  nurseData.severity = severity;
  renderNurseStep();
};

window.setNursePain = function(val) {
  nurseData.painScale = parseInt(val);
  const valEl = document.getElementById('pain-val');
  if (valEl) valEl.textContent = `${val}/10`;
};

window.toggleNurseSymptom = function(symptom) {
  if (checkEmergency(symptom)) {
    escalateEmergency();
    return;
  }

  const idx = nurseData.symptoms.indexOf(symptom);
  if (idx > -1) {
    nurseData.symptoms.splice(idx, 1);
  } else {
    nurseData.symptoms.push(symptom);
  }
};

window.updateNurseField = function(field, val) {
  nurseData[field] = val;
};

window.toggleNurseChronic = function(cond) {
  if (checkEmergency(cond)) {
    escalateEmergency();
    return;
  }
  const idx = nurseData.chronic.indexOf(cond);
  if (idx > -1) {
    nurseData.chronic.splice(idx, 1);
  } else {
    nurseData.chronic.push(cond);
  }
};

function escalateEmergency() {
  nurseWizardStep = 99;
  renderNurseStep();
}

function getSuggestedService() {
  const concern = (nurseData.concern || '').toLowerCase();
  const chronic = nurseData.chronic.join(' ').toLowerCase();
  
  if (chronic.includes('heart') || concern.includes('heart') || concern.includes('chest')) {
    return 'Cardiology';
  }
  if (nurseData.ageGroup.includes('Child')) {
    return 'Pediatrics';
  }
  if (concern.includes('check-up') || concern.includes('physical') || concern.includes('routine')) {
    return 'Preventive Care';
  }
  return 'General Medicine';
}

function getSuggestedPriority() {
  const severity = nurseData.severity;
  const pain = nurseData.painScale;
  const duration = nurseData.duration;

  if (severity === 'Severe' || pain >= 7 || duration === 'Today') {
    return 'Same-Day Appointment Recommended';
  }
  return 'Routine Appointment Recommended';
}

function getNurseSummaryText() {
  return `Pre-Visit Intake Screening Summary
-----------------------------
Concern: ${nurseData.concern || 'Not Specified'}
Duration: ${nurseData.duration || 'Not Specified'}
Severity: ${nurseData.severity} (Pain Scale: ${nurseData.painScale}/10)
Additional Symptoms: ${nurseData.symptoms.length > 0 ? nurseData.symptoms.join(', ') : 'None'}
Medical Background:
  - Age Group: ${nurseData.ageGroup}
  - Medications: ${nurseData.medications || 'None'}
  - Allergies: ${nurseData.allergies || 'None'}
  - Chronic Conditions: ${nurseData.chronic.length > 0 ? nurseData.chronic.join(', ') : 'None'}
  - Pregnant: ${nurseData.pregnancy}
Clinician Diagnostics:
  - Recommended Department: ${getSuggestedService()}
  - Priority Level: ${getSuggestedPriority()}`;
}

window.downloadNurseSummary = function() {
  const text = getNurseSummaryText();
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SWC_Health_Intake_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Pre-screening summary downloaded successfully.", "success");
};

window.bookFromIntake = function() {
  const formName = document.getElementById('booking-name');
  const formService = document.getElementById('booking-service');
  const formDoctor = document.getElementById('booking-doctor');
  const formNotes = document.getElementById('booking-notes');

  const recommendedService = getSuggestedService();
  const summaryText = getNurseSummaryText();

  if (formService) {
    for (let i = 0; i < formService.options.length; i++) {
      if (formService.options[i].value.toLowerCase().includes(recommendedService.toLowerCase())) {
        formService.selectedIndex = i;
        break;
      }
    }
  }

  if (formNotes) {
    formNotes.value = summaryText;
  }

  if (window.switchToTab) {
    window.switchToTab('appointments');
  }

  chatState = 'booking_name';
  bookingData = {
    name: '',
    service: recommendedService,
    doctor: 'First Available Doctor',
    datetime: '',
    notes: summaryText,
    assessmentId: 'SWC-IN-' + Date.now().toString().slice(-6),
    primaryConcern: nurseData.concern,
    symptoms: nurseData.symptoms.join(', '),
    duration: nurseData.duration,
    severity: nurseData.severity + ` (Pain: ${nurseData.painScale}/10)`,
    medicalHistory: `Age: ${nurseData.ageGroup} | Meds: ${nurseData.medications || 'None'} | Allergies: ${nurseData.allergies || 'None'} | Chronic: ${nurseData.chronic.join(', ') || 'None'}`,
    nurseSummary: summaryText,
    recommendedDepartment: recommendedService,
    priorityLevel: getSuggestedPriority()
  };

  // Update Multi-Agent collaboration timeline and logs
  updateCollaborationTimeline('nurse', 'Completed');
  updateCollaborationTimeline('doctor', 'Completed');
  updateCollaborationTimeline('insurance', 'In Progress');
  logActivityEvent("Nurse completed assessment.");
  logActivityEvent("Doctor summary generated.");

  window.stopNurseAssessment();

  showToast(`Pre-screening intake applied. Complete booking details.`, 'success');
};

function renderNurseStep() {
  const containerId = nurseActiveMode === 'sidebar' ? 'sidebar-nurse-wizard-body' : 'mobile-nurse-wizard-body';
  const container = document.getElementById(containerId);
  if (!container) return;

  const stepLbl = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-nurse-step-lbl' : 'mobile-nurse-step-lbl');
  const progress = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-nurse-progress-bar' : 'mobile-nurse-progress-bar');
  
  if (stepLbl) stepLbl.textContent = `Step ${nurseWizardStep} of 6`;
  if (progress) progress.style.width = `${(nurseWizardStep / 6) * 100}%`;

  let html = '';

  if (nurseWizardStep === 1) {
    html += `
      <div class="p-2 bg-sky-500/10 border border-sky-200/50 text-sky-700 dark:text-sky-400 text-[10px] leading-relaxed mb-3 rounded-xl">
        👋 Hello! I'm the <strong>Sunshine AI Nurse</strong>. I will ask a few questions to better understand your concerns before helping you book the most appropriate appointment. This assessment is for informational purposes only and does NOT provide a medical diagnosis.
      </div>
    `;
  }

  if (nurseWizardStep === 1) {
    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-2">1. What is your primary concern or symptoms today?</p>
      <div class="grid grid-cols-1 gap-1.5 mb-2">
        ${['Fever', 'Cough & Cold', 'Headache', 'Stomach Pain', 'Back Pain', 'Routine Check-up', 'Vaccination', 'Medication Refill', 'Other (Describe below)']
          .map(opt => {
            const isSel = nurseData.concern === opt || (opt.startsWith('Other') && nurseData.concern && !['Fever', 'Cough & Cold', 'Headache', 'Stomach Pain', 'Back Pain', 'Routine Check-up', 'Vaccination', 'Medication Refill'].includes(nurseData.concern));
            return `
              <button onclick="window.setNurseConcern('${opt}')" class="px-3 py-2 rounded-xl text-left text-[10px] font-bold border transition ${
                isSel ? 'border-primary bg-primary/10 text-primary dark:text-accent font-black' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }">
                ${opt}
              </button>
            `;
          }).join('')}
      </div>
      <div class="space-y-1 mt-2">
        <label class="text-[9px] text-slate-400 font-bold uppercase">Or describe in detail:</label>
        <textarea id="nurse-concern-textarea" oninput="window.handleConcernTextInput(this.value)" placeholder="e.g. I have a dry cough and mild fever..." class="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary text-[10px] text-slate-800 dark:text-slate-100 h-16 resize-none" aria-label="Primary Concern Description">${
          !['Fever', 'Cough & Cold', 'Headache', 'Stomach Pain', 'Back Pain', 'Routine Check-up', 'Vaccination', 'Medication Refill'].includes(nurseData.concern) ? nurseData.concern : ''
        }</textarea>
      </div>
    `;
  } else if (nurseWizardStep === 2) {
    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-2">2. How long have you been experiencing this?</p>
      <div class="grid grid-cols-1 gap-2">
        ${['Today', '1–2 days', '3–7 days', 'More than a week', 'More than a month']
          .map(opt => {
            const isSel = nurseData.duration === opt;
            return `
              <button onclick="window.setNurseDuration('${opt}')" class="px-3 py-2.5 rounded-xl text-left text-[10px] font-bold border transition ${
                isSel ? 'border-primary bg-primary/10 text-primary dark:text-accent font-black' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }">
                ⏰ ${opt}
              </button>
            `;
          }).join('')}
      </div>
    `;
  } else if (nurseWizardStep === 3) {
    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-1.5">3. How severe are your symptoms?</p>
      <div class="grid grid-cols-3 gap-1.5 mb-4">
        ${['Mild', 'Moderate', 'Severe'].map(opt => {
          const isSel = nurseData.severity === opt;
          return `
            <button onclick="window.setNurseSeverity('${opt}')" class="px-2 py-2 rounded-xl text-center text-[10px] font-bold border transition ${
              isSel ? 'border-primary bg-primary/10 text-primary dark:text-accent font-black' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
            }">
              ${opt}
            </button>
          `;
        }).join('')}
      </div>

      <div class="space-y-1">
        <div class="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>Optional Pain Scale:</span>
          <span class="text-primary font-black bg-primary/15 px-2 py-0.5 rounded-full" id="pain-val">${nurseData.painScale}/10</span>
        </div>
        <input type="range" min="1" max="10" value="${nurseData.painScale}" oninput="window.setNursePain(this.value)" class="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary">
        <div class="flex justify-between text-[8px] text-slate-450 font-semibold px-1">
          <span>1 (Very Mild)</span>
          <span>5 (Moderate)</span>
          <span>10 (Worst Pain)</span>
        </div>
      </div>
    `;
  } else if (nurseWizardStep === 4) {
    let availableChips = ['Fever', 'Chills', 'Cough', 'Shortness of breath 🚨', 'Nausea', 'Vomiting', 'Diarrhea', 'Dizziness', 'Chest discomfort 🚨', 'Fatigue'];
    const concernLower = (nurseData.concern || '').toLowerCase();
    if (concernLower.includes('fever')) {
      availableChips = ['Chills', 'Cough', 'Shortness of breath 🚨', 'Fatigue', 'Sweating', 'Sore Throat', 'Muscle Aches'];
    } else if (concernLower.includes('cough')) {
      availableChips = ['Fever', 'Sore throat', 'Runny nose', 'Shortness of breath 🚨', 'Chest discomfort 🚨', 'Wheezing'];
    } else if (concernLower.includes('headache')) {
      availableChips = ['Nausea', 'Light sensitivity', 'Stiff neck 🚨', 'Dizziness', 'Vision changes', 'Fatigue'];
    } else if (concernLower.includes('stomach')) {
      availableChips = ['Nausea', 'Vomiting', 'Diarrhea', 'Bloating', 'Fever', 'Loss of appetite'];
    }

    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-2">4. Are you experiencing any of these additional symptoms? (Select all that apply)</p>
      <div class="flex flex-wrap gap-1.5">
        ${availableChips.map((symptom, idx) => {
          const isChecked = nurseData.symptoms.includes(symptom);
          return `
            <div class="relative">
              <input type="checkbox" id="sym-chip-${idx}" class="symptom-chip-checkbox hidden" ${isChecked ? 'checked' : ''} onchange="window.toggleNurseSymptom('${symptom}')">
              <label for="sym-chip-${idx}" class="symptom-chip-label inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer select-none transition border-slate-150">
                ${symptom}
              </label>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (nurseWizardStep === 5) {
    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-2.5">5. What is your medical background?</p>
      
      <div class="space-y-2.5">
        <div class="space-y-1">
          <label class="text-[9px] text-slate-400 font-bold uppercase">Age Group:</label>
          <select onchange="window.updateNurseField('ageGroup', this.value)" class="w-full p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-slate-100">
            ${['Adult', 'Child (0-12)', 'Teen (13-17)', 'Senior (65+)'].map(a => `<option value="${a}" ${nurseData.ageGroup === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>

        <div class="flex items-center justify-between font-semibold">
          <label class="text-[9px] text-slate-400 font-bold uppercase">Currently Pregnant:</label>
          <select onchange="window.updateNurseField('pregnancy', this.value)" class="p-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-lg text-[9px] focus:outline-none text-slate-800 dark:text-slate-100">
            <option value="No" ${nurseData.pregnancy === 'No' ? 'selected' : ''}>No</option>
            <option value="Yes" ${nurseData.pregnancy === 'Yes' ? 'selected' : ''}>Yes</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-[9px] text-slate-400 font-bold uppercase">Current Medications (optional):</label>
          <input type="text" placeholder="e.g. None, Aspirin daily" value="${nurseData.medications}" oninput="window.updateNurseField('medications', this.value)" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-primary text-[10px] text-slate-800 dark:text-slate-100">
        </div>

        <div class="space-y-1">
          <label class="text-[9px] text-slate-400 font-bold uppercase">Drug Allergies (optional):</label>
          <input type="text" placeholder="e.g. Penicillin, None" value="${nurseData.allergies}" oninput="window.updateNurseField('allergies', this.value)" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-primary text-[10px] text-slate-800 dark:text-slate-100">
        </div>

        <div class="space-y-1">
          <label class="text-[9px] text-slate-400 font-bold uppercase">Chronic Conditions:</label>
          <div class="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-400">
            ${['Diabetes', 'Asthma', 'Hypertension', 'Heart Disease 🚨'].map((cond, idx) => {
              const isChecked = nurseData.chronic.includes(cond);
              return `
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" class="accent-primary" ${isChecked ? 'checked' : ''} onchange="window.toggleNurseChronic('${cond}')">
                  <span>${cond}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (nurseWizardStep === 6) {
    const suggestedService = getSuggestedService();
    const priority = getSuggestedPriority();

    html += `
      <p class="font-bold text-slate-800 dark:text-white mb-2">📋 Clinical Pre-Visit Intake Summary</p>
      
      <div class="p-3 bg-slate-55 dark:bg-slate-955 border border-slate-150 dark:border-slate-805 rounded-2xl text-[9px] space-y-1.5 select-text leading-relaxed">
        <div class="border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between items-center">
          <span class="font-black text-primary">Pre-Visit Assessment Summary</span>
          <span class="text-[7px] bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full font-bold">HIPAA Secure</span>
        </div>
        
        <div><strong>Patient Concern:</strong> ${nurseData.concern || 'Not Specified'}</div>
        <div><strong>Duration:</strong> ${nurseData.duration || 'Not Specified'}</div>
        <div><strong>Severity:</strong> ${nurseData.severity} (Pain: ${nurseData.painScale}/10)</div>
        <div><strong>Associated Symptoms:</strong> ${nurseData.symptoms.length > 0 ? nurseData.symptoms.join(', ') : 'None Reported'}</div>
        <div class="text-[8px] text-slate-500"><strong>History:</strong> Age: ${nurseData.ageGroup} | Preg: ${nurseData.pregnancy} | Meds: ${nurseData.medications || 'None'} | Allergies: ${nurseData.allergies || 'None'} | Chronic: ${nurseData.chronic.length > 0 ? nurseData.chronic.join(', ') : 'None'}</div>
        
        <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
          <div>🏥 <strong>Suggested Service:</strong> <span class="text-primary font-bold">${suggestedService}</span></div>
          <div>⚠️ <strong>Priority Level:</strong> <span class="${priority.includes('Same-Day') ? 'text-amber-500 font-bold' : 'text-slate-500 font-bold'}">${priority}</span></div>
        <div class="mt-2 text-[7px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-1 leading-normal italic">
          ⚖️ <strong>Safety Disclaimer:</strong> This pre-screening is for informational purposes only. It does not provide a diagnosis or prescribe treatments. Please discuss all screening results with a qualified clinician during your visit.
        </div>
      </div>

      <div class="flex flex-col gap-1.5 pt-2">
        <button onclick="window.bookFromIntake()" class="w-full py-2 rounded-xl bg-gradient-to-r from-primary to-[#4CAFEB] hover:scale-101 active:scale-99 transition text-white font-black text-[10px] shadow flex items-center justify-center gap-1">
          📅 Book Intake Appointment
        </button>
        <div class="grid grid-cols-2 gap-1">
          <button onclick="window.downloadNurseSummary()" class="py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-[8px] font-bold text-slate-600 dark:text-slate-400 transition">
            📥 Download Summary
          </button>
          <button onclick="window.startNurseAssessment('${nurseActiveMode}')" class="py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-[8px] font-bold text-slate-600 dark:text-slate-400 transition">
            🔄 Restart
          </button>
        </div>
      </div>
    `;
  } else if (nurseWizardStep === 99) {
    html += `
      <div class="flex flex-col items-center justify-center text-center p-3 py-6 space-y-4">
        <div class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-955/20 flex items-center justify-center text-rose-500 border border-rose-200 dark:border-rose-900/50 animate-pulse text-2xl">
          🚨
        </div>
        <h5 class="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Immediate Medical Triage Required</h5>
        
        <p class="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 font-bold">
          Your symptoms may require immediate emergency medical attention. Please call 911 or go to the nearest emergency department immediately. The AI Nurse cannot assess emergency conditions.
        </p>

        <button onclick="window.stopNurseAssessment()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black rounded-xl hover:bg-slate-200 transition text-slate-700 dark:text-slate-300 shadow-xs">
          ← Back to Receptionist
        </button>
      </div>
    `;
  }

  container.innerHTML = html;

  // Manage visibility of Back/Next buttons
  const btnBack = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-nurse-btn-back' : 'mobile-nurse-btn-back');
  const btnNext = document.getElementById(nurseActiveMode === 'sidebar' ? 'sidebar-nurse-btn-next' : 'mobile-nurse-btn-next');

  if (btnBack && btnNext) {
    if (nurseWizardStep === 99) {
      btnBack.parentElement.classList.add('hidden');
    } else {
      btnBack.parentElement.classList.remove('hidden');
      btnBack.disabled = nurseWizardStep === 1;
      btnBack.classList.toggle('opacity-50', nurseWizardStep === 1);
      btnNext.textContent = nurseWizardStep === 6 ? 'Close ✕' : 'Next →';
    }
  }
}

window.initNurseWizard = function() {
  const btnBackSide = document.getElementById('sidebar-nurse-btn-back');
  const btnNextSide = document.getElementById('sidebar-nurse-btn-next');
  const btnBackMob = document.getElementById('mobile-nurse-btn-back');
  const btnNextMob = document.getElementById('mobile-nurse-btn-next');

  function goBack() {
    if (nurseWizardStep > 1 && nurseWizardStep !== 99) {
      nurseWizardStep--;
      renderNurseStep();
    }
  }

  function goNext() {
    if (nurseWizardStep < 6) {
      if (nurseWizardStep === 1 && !nurseData.concern) {
        showToast("Please describe your primary concern before proceeding.", "info");
        return;
      }
      if (nurseWizardStep === 2 && !nurseData.duration) {
        showToast("Please choose symptom duration before proceeding.", "info");
        return;
      }
      nurseWizardStep++;
      renderNurseStep();
    } else {
      window.stopNurseAssessment();
    }
  }

  if (btnBackSide) btnBackSide.addEventListener('click', goBack);
  if (btnNextSide) btnNextSide.addEventListener('click', goNext);
  if (btnBackMob) btnBackMob.addEventListener('click', goBack);
  if (btnNextMob) btnNextMob.addEventListener('click', goNext);
};

/* ==========================================================================
   Multi-Agent Platform Helpers
   ========================================================================== */
function renderAgentSelectors() {
  const sidebarList = document.getElementById('sidebar-agent-team-list');
  const mobileList = document.getElementById('mobile-agent-team-list');
  
  if (!sidebarList && !mobileList) return;

  const htmlContent = Object.keys(agentMetadata).map(id => {
    const agent = agentMetadata[id];
    const isActive = id === activeAgentId;
    return `
      <div onclick="window.manuallySelectAgent('${id}')" class="relative group cursor-pointer transition-all duration-300 transform hover:scale-110 flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative ${
          isActive 
            ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(14,165,233,0.35)] scale-105' 
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-350 dark:hover:border-slate-700'
        }">
          <span class="text-sm">${agent.avatar}</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-slate-900 bg-emerald-500"></span>
        </div>
        <span class="absolute bottom-9 bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-200 text-[8px] px-1.5 py-0.5 rounded-md border border-slate-700/50 opacity-0 group-hover:opacity-100 transition duration-250 pointer-events-none whitespace-nowrap z-50 shadow-md">
          ${agent.name}
        </span>
      </div>
    `;
  }).join('');

  if (sidebarList) sidebarList.innerHTML = htmlContent;
  if (mobileList) mobileList.innerHTML = htmlContent;

  updateAgentDetailBar();
}

function updateAgentDetailBar() {
  const sidebarBar = document.getElementById('active-agent-detail-bar');
  const mobileBar = document.getElementById('mobile-active-agent-detail-bar');
  
  if (!sidebarBar && !mobileBar) return;

  const current = agentMetadata[activeAgentId];
  const barHTML = `
    <span class="text-base flex-shrink-0 animate-bounce">${current.avatar}</span>
    <div class="flex-grow min-w-0 leading-tight">
      <div class="font-extrabold text-slate-850 dark:text-slate-200 text-[9px] truncate flex items-center gap-1">
        ${current.fullName}
        <span class="text-[7px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded-full uppercase">Active</span>
      </div>
      <p class="text-[7.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-semibold">
        ${current.role} | Task: ${current.activity}
      </p>
    </div>
  `;

  if (sidebarBar) sidebarBar.innerHTML = barHTML;
  if (mobileBar) mobileBar.innerHTML = barHTML;

  // Update dynamic chat box header titles and icons
  updateChatHeaderUI();
}

function updateChatHeaderUI() {
  const desktopTitle = document.getElementById('desktop-chat-header-title');
  const mobileTitle = document.getElementById('mobile-header-title');
  const mobileSubtitle = document.getElementById('mobile-header-subtitle');
  const mobileAvatar = document.getElementById('mobile-header-avatar');
  
  const current = agentMetadata[activeAgentId];
  if (!current) return;

  if (desktopTitle) {
    desktopTitle.innerHTML = `💬 AI ${current.fullName} Chat`;
  }
  if (mobileTitle) {
    mobileTitle.textContent = current.name;
  }
  if (mobileSubtitle) {
    mobileSubtitle.textContent = `${current.role} • Online`;
  }
  if (mobileAvatar) {
    mobileAvatar.textContent = current.avatar;
  }
}

window.manuallySelectAgent = function(id) {
  if (id === activeAgentId) return;
  
  // Clear the messages containers so the conversation starts fresh with this agent's greeting!
  const sidebarChatMessages = document.getElementById('sidebar-chat-messages');
  const chatbotMessages = document.getElementById('chatbot-messages');
  if (sidebarChatMessages) sidebarChatMessages.innerHTML = '';
  if (chatbotMessages) chatbotMessages.innerHTML = '';
  
  const desc = `Connecting to ${agentMetadata[id].fullName}...`;
  logActivityEvent(`Switched active agent to ${agentMetadata[id].name}.`);
  switchAgent(id, desc);
};

function switchAgent(newAgentId, description) {
  if (!agentMetadata[newAgentId]) return;
  activeAgentId = newAgentId;
  
  const sidebarOverlay = document.getElementById('sidebar-agent-handoff');
  const mobileOverlay = document.getElementById('mobile-agent-handoff');
  
  const sidebarHandoffTitle = document.getElementById('sidebar-handoff-title');
  const mobileHandoffTitle = document.getElementById('mobile-handoff-title');
  
  const sidebarHandoffAvatar = document.getElementById('sidebar-handoff-avatar');
  const mobileHandoffAvatar = document.getElementById('mobile-handoff-avatar');
  
  if (sidebarHandoffTitle) sidebarHandoffTitle.textContent = description || `Connecting to ${agentMetadata[newAgentId].fullName}...`;
  if (mobileHandoffTitle) mobileHandoffTitle.textContent = description || `Connecting to ${agentMetadata[newAgentId].fullName}...`;
  
  if (sidebarHandoffAvatar) sidebarHandoffAvatar.textContent = agentMetadata[newAgentId].avatar;
  if (mobileHandoffAvatar) mobileHandoffAvatar.textContent = agentMetadata[newAgentId].avatar;
  
  if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
  if (mobileOverlay) mobileOverlay.classList.remove('hidden');

  // Trigger loading animations
  const bars = document.querySelectorAll('.animate-handoff-bar');
  bars.forEach(bar => {
    bar.style.animation = 'none';
    bar.offsetHeight;
    bar.style.animation = null;
  });

  setTimeout(() => {
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
    if (mobileOverlay) mobileOverlay.classList.add('hidden');
    
    renderAgentSelectors();
    updateAgentCollaborationUI();
    
    const agent = agentMetadata[newAgentId];
    appendHandoffSystemMessage(agent);

    // AI Agent automatic takeover greeting
    setTimeout(() => {
      appendAgentTakeoverGreeting(newAgentId);
    }, 300);
  }, 750);
}

function appendHandoffSystemMessage(agent) {
  // No-op. Handoff announcements are disabled to preserve patient comfort.
}

function logActivityEvent(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  activityLog.push({ time, text });
  
  const feedList = document.getElementById('platform-activity-feed-list');
  if (feedList) {
    feedList.innerHTML = activityLog.map(item => `
      <div class="flex items-start gap-1 pb-1 border-b border-slate-50/50 dark:border-slate-800/30">
        <span class="text-slate-400 font-bold font-mono text-[7px]">${item.time}</span>
        <span class="text-slate-600 dark:text-slate-400 font-bold">${item.text}</span>
      </div>
    `).join('');
    feedList.scrollTop = feedList.scrollHeight;
  }
}

function updateAgentCollaborationUI() {
  const collabActiveAgent = document.getElementById('collab-active-agent');
  const collabWorkingOn = document.getElementById('collab-working-on');
  const collabNextAgent = document.getElementById('collab-next-agent');
  const collabStatus = document.getElementById('collab-status');
  
  if (!collabActiveAgent) return;

  const current = agentMetadata[activeAgentId];
  collabActiveAgent.innerHTML = `${current.name} ${current.avatar}`;
  
  let workingOn = current.activity;
  let nextAgent = "None Scheduled";
  let status = "🟢 Waiting for Patient";

  if (activeAgentId === 'receptionist') {
    workingOn = "Greeting & Routing Patients";
    nextAgent = "AI Nurse 👩‍⚕️";
    status = "🟢 Online";
  } else if (activeAgentId === 'nurse') {
    workingOn = "Conducting Health Assessment Wizard";
    nextAgent = "Doctor Assistant 🧑‍⚕️";
    status = "⚡ Screening Symptoms...";
  } else if (activeAgentId === 'doctor') {
    workingOn = "Drafting Clinical SOAP Intake report";
    nextAgent = "Insurance Assistant 💳";
    status = "🧪 Drafting Report";
  } else if (activeAgentId === 'insurance') {
    workingOn = "Checking coverage and provider verification";
    nextAgent = "Billing Assistant 💰";
    status = "🔍 Reviewing Policies";
  } else if (activeAgentId === 'billing') {
    workingOn = "Processing price quotes and consultation fees";
    nextAgent = "Receptionist 🤖";
    status = "💳 Ready to invoice";
  } else if (activeAgentId === 'lab') {
    workingOn = "Generating lab prep & fasting guides";
    nextAgent = "None Scheduled";
    status = "🧪 Ready";
  } else if (activeAgentId === 'pharmacy') {
    workingOn = "Consulting prescription refills database";
    nextAgent = "None Scheduled";
    status = "💊 Consult Ready";
  }

  collabWorkingOn.textContent = workingOn;
  collabNextAgent.textContent = nextAgent;
  collabStatus.textContent = status;
}

function updateCollaborationTimeline(stageId, statusText) {
  const dot = document.getElementById(`stage-dot-${stageId}`);
  const statusLbl = document.getElementById(`stage-status-${stageId}`);
  
  if (!dot || !statusLbl) return;

  if (statusText === 'Completed') {
    dot.className = "w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-500 shadow-sm flex-shrink-0 z-10 animate-status-pulse";
    statusLbl.textContent = "Completed";
    statusLbl.className = "text-[7.5px] text-emerald-500 font-bold uppercase tracking-wider";
  } else if (statusText === 'In Progress') {
    dot.className = "w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-500 shadow-sm flex-shrink-0 z-10 animate-pulse";
    statusLbl.textContent = "In Progress";
    statusLbl.className = "text-[7.5px] text-amber-500 font-bold uppercase tracking-wider animate-pulse";
  } else {
    dot.className = "w-2.5 h-2.5 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0 z-10";
    statusLbl.textContent = "Pending";
    statusLbl.className = "text-[7.5px] text-slate-400 font-bold uppercase tracking-wider";
  }
}

function appendAgentTakeoverGreeting(agentId) {
  let response = "";
  const nameSalute = sessionMemory.name ? `, ${sessionMemory.name}` : "";
  
  if (agentId === 'receptionist') {
    response = `👋 Welcome to Sunshine Wellness Clinic! I'm Sunny, your AI Receptionist${nameSalute}. I can help schedule appointments, answer insurance questions, explain our services, and connect you with the right doctor. How can I assist you today?`;
  } else if (agentId === 'nurse') {
    response = `👋 Hello${nameSalute}! I'm your AI Nurse Intake assistant. I can conduct a pre-screening health assessment, collect symptoms, and route you to the correct department. What is your primary concern today?`;
  } else if (agentId === 'doctor') {
    response = `👋 Hello${nameSalute}! I'm your SOAP Assistant. I compile pre-screening metrics into formatted clinical SOAP intake report drafts for clinic staff. Let me know if you would like me to compile your clinical summary now.`;
  } else if (agentId === 'insurance') {
    response = `👋 Hello${nameSalute}! I'm your Coverage Coordinator. I can verify standard copays and check accepted providers like Anthem, Cigna, or UnitedHealthcare. What insurance carrier are you checking today?`;
  } else if (agentId === 'billing') {
    response = `👋 Hello${nameSalute}! I'm your Payments Auditor. I can provide price quotes for clinic consultations or lab work, calculate invoices, and check billing statuses. What invoice details can I check for you?`;
  } else if (agentId === 'lab') {
    response = `👋 Hello${nameSalute}! I'm your Diagnostics Guide. I can explain diagnostic preparation, fasting instructions (e.g. for basic blood panels), and result timing. Which scheduled lab test are you preparing for?`;
  } else if (agentId === 'pharmacy') {
    response = `👋 Hello${nameSalute}! I'm your Medication Guide. I can guide you on general prescription usage, storage guidelines (e.g. insulin or antibiotics), and route electronic refill requests. Which medication can I check?`;
  }

  if (window.appendTypingIndicator) window.appendTypingIndicator();
  setTimeout(() => {
    if (window.removeTypingIndicator) window.removeTypingIndicator();
    if (window.appendMessage) window.appendMessage(response, false);
    speakText(response);
    
    saveConversationLog({
      patientName: sessionMemory.name || "Guest Patient",
      sender: "Agent",
      agentId: agentId,
      message: response.replace(/^[^\s]+\s\*\*[^:]+:\*\*\s/, '')
    });
  }, 400);
}

