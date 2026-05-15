// API base URL for backend (Spring Boot)
// Adjust host/port if your backend runs elsewhere
const API_BASE_URL = 'http://localhost:5000';

// Global variables
let events = [];
let currentEvent = null;
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let homeDashboardCalDate = new Date();

// DOM Elements - will be initialized after DOM loads
let eventGrid, eventModal, bookingModal, cartModal, bookingForm;
let tabButtons, categoryCards, closeModalButtons;
let signInBtn, signUpBtn, signInModal, signUpModal, signInForm, signUpForm;
let switchToSignUp, switchToSignIn;
let adminSignInModal, adminSignUpModal, adminSignInForm, adminSignUpForm;
let addEventModal, addEventForm;

// Initialize DOM elements
function initializeDOMElements() {
    eventGrid = document.getElementById('event-grid');
    eventModal = document.getElementById('event-modal');
    bookingModal = document.getElementById('booking-modal');
    cartModal = document.getElementById('cart-modal');
    bookingForm = document.getElementById('booking-form');
    tabButtons = document.querySelectorAll('.tab-btn');
    categoryCards = document.querySelectorAll('.category-card');
    closeModalButtons = document.querySelectorAll('.close-modal');
    signInBtn = document.querySelector('.sign-in-btn');
    signUpBtn = document.querySelector('.sign-up-btn');
    signInModal = document.getElementById('signin-modal');
    signUpModal = document.getElementById('signup-modal');
    signInForm = document.getElementById('signin-form');
    signUpForm = document.getElementById('signup-form');
    switchToSignUp = document.getElementById('switch-to-signup');
    switchToSignIn = document.getElementById('switch-to-signin');
    adminSignInModal = document.getElementById('admin-signin-modal');
    adminSignUpModal = document.getElementById('admin-signup-modal');
    adminSignInForm = document.getElementById('admin-signin-form');
    adminSignUpForm = document.getElementById('admin-signup-form');
    addEventModal = document.getElementById('add-event-modal');
    addEventForm = document.getElementById('add-event-form');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    bindHomeDashboard();
    loadEvents();
    setupEventListeners();
    updateAuthButtons();
});

// Load events from API
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        const data = await response.json();
        events = Array.isArray(data) ? data : [];
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        // Load sample events if API fails
        loadSampleEvents();
    }
    renderHomeDashboard();
}

function sampleDateDaysAhead(days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Load sample events for demonstration (dates relative to today so the dashboard shows them)
function loadSampleEvents() {
    events = [
        {
            _id: '1',
            title: 'AI & Machine Learning Workshop',
            description: 'Learn the fundamentals of AI and machine learning with hands-on projects.',
            category: 'workshop',
            date: sampleDateDaysAhead(5),
            time: '10:00:00',
            venue: 'Computer Lab 101',
            capacity: 50,
            ticketsAvailable: 50,
            price: 25,
            image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
            organizer: 'Computer Science Department',
            contactEmail: 'cs@badyauni.edu'
        },
        {
            _id: '2',
            title: 'Basketball Championship Finals',
            description: 'Watch the exciting finals between Engineering vs Business teams.',
            category: 'sports',
            date: sampleDateDaysAhead(11),
            time: '15:00:00',
            venue: 'University Sports Complex',
            capacity: 200,
            ticketsAvailable: 200,
            price: 10,
            image: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4',
            organizer: 'Sports Department',
            contactEmail: 'sports@badyauni.edu'
        },
        {
            _id: '3',
            title: 'Cultural Diversity Festival',
            description: 'Celebrate cultures from around the world with food, music, and performances.',
            category: 'cultural',
            date: sampleDateDaysAhead(18),
            time: '18:00:00',
            venue: 'Main Auditorium',
            capacity: 300,
            ticketsAvailable: 300,
            price: 15,
            image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
            organizer: 'Student Affairs',
            contactEmail: 'culture@badyauni.edu'
        },
        {
            _id: '4',
            title: 'Entrepreneurship Seminar',
            description: 'Learn from successful entrepreneurs about starting and growing businesses.',
            category: 'seminar',
            date: sampleDateDaysAhead(25),
            time: '14:00:00',
            venue: 'Business Lecture Hall',
            capacity: 100,
            ticketsAvailable: 100,
            price: 20,
            image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
            organizer: 'Business Department',
            contactEmail: 'business@badyauni.edu'
        }
    ];
    displayEvents(events);
}

function eventIdOf(ev) {
    return ev && (ev.id != null ? ev.id : ev._id);
}

function eventPrice(ev) {
    if (!ev) return 0;
    const p = ev.price;
    if (p == null || p === '') return 0;
    const n = typeof p === 'number' ? p : parseFloat(String(p), 10);
    return Number.isFinite(n) ? n : 0;
}

function isPaidEvent(ev) {
    return eventPrice(ev) > 0;
}

function ticketsLeftForEvent(ev) {
    if (!ev) return 0;
    if (ev.ticketsAvailable != null && ev.ticketsAvailable !== '') {
        const n = Number(ev.ticketsAvailable);
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    const cap = Number(ev.capacity) || 0;
    const id = eventIdOf(ev);
    const localSold = bookings.reduce((sum, b) => {
        const bid = b.eventId || (b.event && (b.event._id || b.event.id));
        if (String(bid) !== String(id)) return sum;
        return sum + (Number(b.tickets) || 0);
    }, 0);
    return Math.max(0, cap - localSold);
}

function visaDigitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
}

function luhnCheck(digits) {
    if (!digits || digits.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (Number.isNaN(n)) return false;
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

function validateVisaForm() {
    const name = (document.getElementById('visa-card-name')?.value || '').trim();
    const num = visaDigitsOnly(document.getElementById('visa-card-number')?.value);
    const expRaw = (document.getElementById('visa-card-expiry')?.value || '').replace(/\s/g, '');
    const cvc = visaDigitsOnly(document.getElementById('visa-card-cvc')?.value);

    if (!name) return 'Enter the name on the Visa card.';
    if (num.length < 13 || num.length > 19) return 'Enter a valid Visa card number.';
    if (!num.startsWith('4')) return 'Visa card numbers start with 4.';
    if (!luhnCheck(num)) return 'Card number is not valid.';
    let mm;
    let yy;
    if (expRaw.includes('/')) {
        const p = expRaw.split('/');
        mm = parseInt(p[0], 10);
        yy = parseInt(p[1], 10);
    } else if (expRaw.length === 4) {
        mm = parseInt(expRaw.slice(0, 2), 10);
        yy = parseInt(expRaw.slice(2), 10);
    } else {
        return 'Enter expiry as MM/YY.';
    }
    if (Number.isNaN(mm) || Number.isNaN(yy) || mm < 1 || mm > 12) return 'Invalid expiry date.';
    const expEnd = new Date(2000 + yy, mm, 0);
    expEnd.setHours(23, 59, 59, 999);
    if (expEnd < new Date()) return 'This card has expired.';
    if (cvc.length < 3 || cvc.length > 4) return 'Enter a valid CVC (3 or 4 digits).';
    return null;
}

function clearVisaForm() {
    ['visa-card-name', 'visa-card-number', 'visa-card-expiry', 'visa-card-cvc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const block = document.getElementById('visa-payment-details');
    if (block) block.hidden = true;
}

function parseEventDay(ev) {
    if (!ev || !ev.date) return null;
    const raw = ev.date;
    let d = null;
    if (typeof raw === 'string') {
        const part = raw.split('T')[0];
        const parts = part.split('-').map(Number);
        if (parts.length >= 3 && parts.every(n => !Number.isNaN(n))) {
            d = new Date(parts[0], parts[1] - 1, parts[2]);
        }
    } else if (Array.isArray(raw) && raw.length >= 3) {
        d = new Date(raw[0], raw[1] - 1, raw[2]);
    }
    if (!d || Number.isNaN(d.getTime())) {
        const fallback = new Date(raw);
        if (Number.isNaN(fallback.getTime())) return null;
        d = new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
    }
    d.setHours(0, 0, 0, 0);
    return d;
}

function escapeHtmlDash(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function eventsOnCalendarDay(y, m, dayIndex) {
    const target = new Date(y, m, dayIndex);
    target.setHours(0, 0, 0, 0);
    return events.filter(ev => {
        const d = parseEventDay(ev);
        return d && d.getTime() === target.getTime();
    });
}

function renderHomeDashboard() {
    const listEl = document.getElementById('dashboard-date-list');
    const emptyEl = document.getElementById('dashboard-date-empty');
    const grid = document.getElementById('home-dash-cal-grid');
    if (!listEl || !grid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withDates = events
        .map(ev => ({ ev, day: parseEventDay(ev) }))
        .filter(x => x.day && x.day.getTime() >= today.getTime())
        .sort((a, b) => a.day - b.day);

    if (withDates.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
    } else {
        if (emptyEl) emptyEl.hidden = true;
        listEl.innerHTML = withDates
            .map(({ ev, day }) => {
                const id = eventIdOf(ev);
                const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dateLabel = day.toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                const timeLabel = formatTime(ev.time);
                return `<li class="dashboard-date-row">
                    <time class="dashboard-date-primary" datetime="${iso}">${escapeHtmlDash(dateLabel)}</time>
                    <span class="dashboard-time">${escapeHtmlDash(timeLabel)}</span>
                    <span class="dashboard-event-title">${escapeHtmlDash(ev.title || '')}</span>
                    <button type="button" class="book-btn view-details-btn dashboard-date-btn" data-event-id="${id}">Details</button>
                </li>`;
            })
            .join('');
    }

    const y = homeDashboardCalDate.getFullYear();
    const m = homeDashboardCalDate.getMonth();
    const monthLbl = document.getElementById('home-dash-cal-month-lbl');
    const prevLbl = document.getElementById('home-dash-cal-prev-lbl');
    const nextLbl = document.getElementById('home-dash-cal-next-lbl');
    if (monthLbl) {
        monthLbl.textContent = homeDashboardCalDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    const prevD = new Date(y, m - 1, 1);
    const nextD = new Date(y, m + 1, 1);
    if (prevLbl) prevLbl.textContent = '← ' + prevD.toLocaleDateString(undefined, { month: 'long' });
    if (nextLbl) nextLbl.textContent = nextD.toLocaleDateString(undefined, { month: 'long' }) + ' →';

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const leading = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

    let html = '';
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - leading + 1;
        let cy = y;
        let cm = m;
        let cd = dayNum;
        let cellClass = 'home-dash-cal-cell';
        let isOther = false;

        if (dayNum < 1) {
            isOther = true;
            const prevLast = new Date(y, m, 0).getDate();
            cd = prevLast + dayNum;
            cm = m === 0 ? 11 : m - 1;
            cy = m === 0 ? y - 1 : y;
            cellClass += ' is-other-month';
        } else if (dayNum > daysInMonth) {
            isOther = true;
            cd = dayNum - daysInMonth;
            cm = m === 11 ? 0 : m + 1;
            cy = m === 11 ? y + 1 : y;
            cellClass += ' is-other-month';
        }

        const cellDate = new Date(cy, cm, cd);
        cellDate.setHours(0, 0, 0, 0);

        const dayEvents =
            !isOther && dayNum >= 1 && dayNum <= daysInMonth
                ? eventsOnCalendarDay(y, m, dayNum)
                : isOther
                  ? eventsOnCalendarDay(cy, cm, cd)
                  : [];

        if (cellDate.getTime() === today.getTime()) cellClass += ' is-today';
        if (dayEvents.length) cellClass += ' has-events';

        const preview = dayEvents
            .slice(0, 2)
            .map(e => {
                const raw = (e.title || 'Event').slice(0, 12);
                const ell = (e.title || '').length > 12 ? '…' : '';
                return `<span class="home-dash-cal-chip"><span class="home-dash-cal-dot"></span>${escapeHtmlDash(raw)}${ell}</span>`;
            })
            .join('');

        const id0 = dayEvents[0] ? eventIdOf(dayEvents[0]) : '';
        html += `<div class="${cellClass}" data-event-id="${id0}" role="gridcell">
            <span class="home-dash-cal-num">${cd > 0 ? cd : ''}</span>
            <div class="home-dash-cal-chips">${preview}</div>
        </div>`;
    }
    grid.innerHTML = html;
}

function bindHomeDashboard() {
    document.getElementById('home-dash-cal-prev')?.addEventListener('click', () => {
        homeDashboardCalDate = new Date(
            homeDashboardCalDate.getFullYear(),
            homeDashboardCalDate.getMonth() - 1,
            1
        );
        renderHomeDashboard();
    });
    document.getElementById('home-dash-cal-next')?.addEventListener('click', () => {
        homeDashboardCalDate = new Date(
            homeDashboardCalDate.getFullYear(),
            homeDashboardCalDate.getMonth() + 1,
            1
        );
        renderHomeDashboard();
    });
    document.getElementById('home-dash-cal-grid')?.addEventListener('click', e => {
        const cell = e.target.closest('.home-dash-cal-cell');
        if (!cell || !cell.classList.contains('has-events')) return;
        const id = cell.getAttribute('data-event-id');
        if (id) openEventModal(id);
    });
}

// Display events in the grid
function displayEvents(eventsToDisplay) {
    if (!eventGrid) return;
    
    eventGrid.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = currentUser && currentUser.role === 'admin';

    eventsToDisplay.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.dataset.category = event.category;
        const eventId = event._id || event.id;
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <div style="margin-top: 10px;">
                    <button class="book-btn delete-event-btn" data-event-id="${eventId}" style="background: #e74c3c; margin-right: 5px;">Delete</button>
                </div>
            `;
        }
        
        const left = ticketsLeftForEvent(event);
        const ticketsLine =
            left <= 0
                ? `<p class="event-tickets-left sold-out"><i class="fas fa-ban"></i> Sold out</p>`
                : `<p class="event-tickets-left"><i class="fas fa-ticket-alt"></i> ${left} ticket${left === 1 ? '' : 's'} left</p>`;

        const mediaHtml = event.image && (event.image.endsWith('.mp4') || event.image.endsWith('.webm') || event.image.endsWith('.ogg'))
            ? `<video src="${event.image}" class="event-image" autoplay muted loop playsinline style="width:100%; height:200px; object-fit:cover;"></video>`
            : `<img src="${event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2e87c'}" alt="${event.title}" class="event-image">`;

        eventCard.innerHTML = `
            ${mediaHtml}
            <div class="event-info">
                <h3>${event.title}</h3>
                <p class="event-date"><i class="fas fa-calendar"></i> ${formatDate(event.date)} at ${formatTime(event.time)}</p>
                <p class="event-venue"><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                ${ticketsLine}
                <button class="book-btn view-details-btn" data-event-id="${eventId}">View Details</button>
                ${adminControls}
            </div>
        `;
        eventGrid.appendChild(eventCard);
    });
}

// Format time for display
function formatTime(timeString) {
    if (!timeString) return '';
    // Handle both LocalTime format (HH:mm:ss) and simple time format
    const time = timeString.split(':');
    if (time.length >= 2) {
        const hours = parseInt(time[0]);
        const minutes = time[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeString;
}

// Delete event (Admin only) - make globally accessible
window.deleteEvent = async function(eventId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Event deleted successfully!');
            loadEvents(); // Reload events
        } else {
            showNotification('Failed to delete event.', 'error');
        }
    } catch (error) {
        console.error('Delete event error:', error);
        showNotification('Failed to delete event.', 'error');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category tabs
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;

                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter events
                if (category === 'all') {
                    displayEvents(events);
                } else {
                    const filteredEvents = events.filter(event => event.category === category);
                    displayEvents(filteredEvents);
                }
            });
        });
    }

    // Category cards
    if (categoryCards && categoryCards.length > 0) {
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                const tabButton = document.querySelector(`[data-category="${category}"]`);
                if (tabButton) {
                    tabButton.click();
                    const eventsSection = document.getElementById('events');
                    if (eventsSection) {
                        eventsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // Modal close buttons
    if (closeModalButtons && closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (eventModal) eventModal.style.display = 'none';
                if (bookingModal) bookingModal.style.display = 'none';
                if (cartModal) cartModal.style.display = 'none';
                if (signInModal) signInModal.style.display = 'none';
                if (signUpModal) signUpModal.style.display = 'none';
                if (adminSignInModal) adminSignInModal.style.display = 'none';
                if (adminSignUpModal) adminSignUpModal.style.display = 'none';
                if (addEventModal) addEventModal.style.display = 'none';
            });
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (eventModal && e.target === eventModal) {
            eventModal.style.display = 'none';
        }
        if (bookingModal && e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
        if (signInModal && e.target === signInModal) {
            signInModal.style.display = 'none';
        }
        if (signUpModal && e.target === signUpModal) {
            signUpModal.style.display = 'none';
        }
        if (cartModal && e.target === cartModal) {
            cartModal.style.display = 'none';
        }
        if (adminSignInModal && e.target === adminSignInModal) {
            adminSignInModal.style.display = 'none';
        }
        if (adminSignUpModal && e.target === adminSignUpModal) {
            adminSignUpModal.style.display = 'none';
        }
        if (addEventModal && e.target === addEventModal) {
            addEventModal.style.display = 'none';
        }
    });

    // Booking form
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
        bookingForm.addEventListener('change', e => {
            if (e.target && e.target.name === 'payment-method') {
                const visaDetails = document.getElementById('visa-payment-details');
                if (visaDetails) visaDetails.hidden = e.target.value !== 'VISA';
            }
        });
    }

    // Event delegation for all dynamically created buttons
    document.addEventListener('click', (e) => {
        // Auth buttons
        if (e.target.classList.contains('sign-in-btn')) {
            e.preventDefault();
            if (signInModal) {
                signInModal.style.display = 'block';
            }
        }
        if (e.target.classList.contains('sign-up-btn')) {
            e.preventDefault();
            if (signUpModal) {
                signUpModal.style.display = 'block';
            }
        }
        if (e.target.classList.contains('admin-signin-btn') && e.target.tagName !== 'A') {
            e.preventDefault();
            if (adminSignInModal) {
                adminSignInModal.style.display = 'block';
            }
        }
        if (e.target.classList.contains('sign-out-btn')) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            updateAuthButtons();
            showNotification('Signed out successfully!');
            loadEvents();
        }
        
        // Event card buttons - handle clicks on buttons inside event cards
        if (e.target.classList.contains('view-details-btn') || e.target.closest('.view-details-btn')) {
            const button = e.target.classList.contains('view-details-btn') ? e.target : e.target.closest('.view-details-btn');
            const eventId = button.getAttribute('data-event-id');
            if (eventId) {
                e.preventDefault();
                openEventModal(eventId);
            }
        }
        
        // Delete event button (admin only)
        if (e.target.classList.contains('delete-event-btn') || e.target.closest('.delete-event-btn')) {
            const button = e.target.classList.contains('delete-event-btn') ? e.target : e.target.closest('.delete-event-btn');
            const eventId = button.getAttribute('data-event-id');
            if (eventId) {
                e.preventDefault();
                deleteEvent(eventId);
            }
        }
        
        // Book now button
        if (e.target.classList.contains('book-now-btn') || e.target.closest('.book-now-btn')) {
            const button = e.target.classList.contains('book-now-btn') ? e.target : e.target.closest('.book-now-btn');
            if (button.classList.contains('edit-event-btn')) {
                // Edit event button (admin)
                const eventId = button.getAttribute('data-event-id');
                if (eventId) {
                    e.preventDefault();
                    editEvent(eventId);
                }
            } else {
                // Regular book now button
                e.preventDefault();
                openBookingModal();
            }
        }
        
        // CTA button
        if (e.target.classList.contains('cta-button')) {
            e.preventDefault();
            const eventsSection = document.getElementById('events');
            if (eventsSection) {
                eventsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Also attach to existing buttons if they exist
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            if (signInModal) signInModal.style.display = 'block';
        });
    }
    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            if (signUpModal) signUpModal.style.display = 'block';
        });
    }

    // Auth forms - add null checks
    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    }
    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }
    
    // Admin auth forms
    if (adminSignInForm) {
        adminSignInForm.addEventListener('submit', handleAdminSignIn);
    }
    if (adminSignUpForm) {
        adminSignUpForm.addEventListener('submit', handleAdminSignUp);
    }
    
    // Add event form
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }

    // Switch between modals - add null checks
    if (switchToSignUp) {
        switchToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            if (signInModal) signInModal.style.display = 'none';
            if (signUpModal) signUpModal.style.display = 'block';
        });
    }
    if (switchToSignIn) {
        switchToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            if (signUpModal) signUpModal.style.display = 'none';
            if (signInModal) signInModal.style.display = 'block';
        });
    }

    // Update auth buttons on load
    updateAuthButtons();

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Message sent successfully!');
            contactForm.reset();
        });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Open event details modal (make it globally accessible)
window.openEventModal = function(eventId) {
    currentEvent = events.find(
        event => String(event._id) === String(eventId) || String(event.id) === String(eventId)
    );
    if (!currentEvent) {
        console.error('Event not found:', eventId);
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    let adminControls = '';
    if (isAdmin) {
            adminControls = `
            <button class="book-now-btn edit-event-btn" data-event-id="${currentEvent._id || currentEvent.id}" style="background: #3498db; margin-left: 10px;">Edit Event</button>
        `;
    }

    const ticketsLeft = ticketsLeftForEvent(currentEvent);
    const soldOut = ticketsLeft <= 0;
    const paid = isPaidEvent(currentEvent);
    const priceLabel = paid
        ? `<p class="event-price-large">$${eventPrice(currentEvent)} per ticket</p>`
        : `<p class="event-price-large">Free event</p>`;
    const ticketsMeta = soldOut
        ? `<p><i class="fas fa-ticket-alt"></i> <strong>Sold out</strong> (capacity ${currentEvent.capacity})</p>`
        : `<p><i class="fas fa-ticket-alt"></i> ${ticketsLeft} ticket${ticketsLeft === 1 ? '' : 's'} left of ${currentEvent.capacity}</p>`;
    const bookBtn = soldOut
        ? `<button type="button" class="book-now-btn" disabled style="opacity:0.55;cursor:not-allowed;">Sold out</button>`
        : `<button type="button" class="book-now-btn" data-action="open-booking">Book Now</button>`;

    const eventDetails = document.getElementById('event-details');
    const mediaHtml = currentEvent.image && (currentEvent.image.endsWith('.mp4') || currentEvent.image.endsWith('.webm') || currentEvent.image.endsWith('.ogg'))
        ? `<video src="${currentEvent.image}" style="width:100%; max-height:400px; border-radius:10px; margin-bottom:20px;" controls autoplay muted loop></video>`
        : `<img src="${currentEvent.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2e87c'}" alt="${currentEvent.title}" style="width:100%; max-height:400px; border-radius:10px; object-fit:cover; margin-bottom:20px;">`;

    eventDetails.innerHTML = `
        <div class="event-detail-header">
            ${mediaHtml}
            <div class="event-detail-info">
                <h2>${currentEvent.title}</h2>
                <p class="event-category">${currentEvent.category ? currentEvent.category.charAt(0).toUpperCase() + currentEvent.category.slice(1) : ''}</p>
                <div class="event-meta">
                    <p><i class="fas fa-calendar"></i> ${formatDate(currentEvent.date)} at ${formatTime(currentEvent.time)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${currentEvent.venue}</p>
                    ${ticketsMeta}
                    <p><i class="fas fa-user-tie"></i> Organized by: ${currentEvent.organizer}</p>
                </div>
                ${priceLabel}
                ${bookBtn}
                ${adminControls}
            </div>
        </div>
        <div class="event-description">
            <h3>Description</h3>
            <p>${currentEvent.description}</p>
        </div>
        <div class="event-contact">
            <h3>Contact</h3>
            <p><i class="fas fa-envelope"></i> ${currentEvent.contactEmail}</p>
        </div>
    `;

    if (eventModal) {
        eventModal.style.display = 'block';
    } else {
        console.error('Event modal not found');
    }
};

// Also keep local reference for internal use
const openEventModal = window.openEventModal;

// Edit event (Admin only) - placeholder for future implementation
window.editEvent = function(eventId) {
    showNotification('Edit event feature coming soon!', 'error');
    // TODO: Implement edit event functionality
};

// Open booking modal - make globally accessible
window.openBookingModal = function() {
    if (!currentEvent) return;
    const left = ticketsLeftForEvent(currentEvent);
    if (left <= 0) {
        showNotification('This event is sold out. No tickets remaining.', 'error');
        return;
    }

    const paySection = document.getElementById('booking-payment-section');
    if (paySection) {
        const paid = isPaidEvent(currentEvent);
        paySection.hidden = !paid;
        paySection.querySelectorAll('input[name="payment-method"]').forEach(r => {
            r.checked = false;
        });
    }
    clearVisaForm();

    const tq = document.getElementById('ticket-quantity');
    if (tq) {
        tq.max = String(Math.min(1, left));
        tq.value = '1';
    }

    if (eventModal) eventModal.style.display = 'none';
    if (bookingModal) {
        bookingModal.style.display = 'block';
    } else {
        console.error('Booking modal not found');
    }
};

// Handle booking submission
async function handleBooking(e) {
    e.preventDefault();

    const ticketQuantity = parseInt(document.getElementById('ticket-quantity').value);
    
    // Enforce maximum of 1 ticket per booking
    if (ticketQuantity > 1) {
        showNotification('Maximum 1 ticket allowed per booking.', 'error');
        document.getElementById('ticket-quantity').value = 1;
        return;
    }
    
    if (ticketQuantity < 1) {
        showNotification('Please select at least 1 ticket.', 'error');
        return;
    }

    if (ticketsLeftForEvent(currentEvent) < ticketQuantity) {
        showNotification('Not enough tickets left for this event.', 'error');
        return;
    }

    let paymentMethod = null;
    if (isPaidEvent(currentEvent)) {
        const sel = document.querySelector('#booking-form input[name="payment-method"]:checked');
        if (!sel) {
            showNotification('Please choose Visa or Cash as your payment method.', 'error');
            return;
        }
        paymentMethod = sel.value;
    }

    const formData = {
        studentName: document.getElementById('student-name').value,
        studentId: document.getElementById('student-id').value,
        studentEmail: document.getElementById('student-email').value,
        tickets: ticketQuantity,
        paymentMethod
    };

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // Use admin endpoint if admin, regular endpoint otherwise
    const eventId = currentEvent._id || currentEvent.id;
    
    // Check if user has already booked this event
    const existingBooking = bookings.find(b => {
        const bookingEventId = b.eventId || (b.event && (b.event._id || b.event.id));
        return bookingEventId === eventId && 
               (b.studentEmail === formData.studentEmail || b.studentId === formData.studentId);
    });
    
    if (existingBooking) {
        showNotification('You have already booked a ticket for this event. Maximum 1 ticket per user per event.', 'error');
        bookingModal.style.display = 'none';
        return;
    }
    
    const endpoint = isAdmin 
        ? `${API_BASE_URL}/api/admin/events/${eventId}/book`
        : `${API_BASE_URL}/api/events/${eventId}/book`;

    const submitBtn = document.getElementById('booking-submit-btn');
    const chargeAmount = eventPrice(currentEvent) * ticketQuantity;

    if (paymentMethod === 'VISA') {
        const visaErr = validateVisaForm();
        if (visaErr) {
            showNotification(visaErr, 'error');
            return;
        }
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
        if (paymentMethod === 'VISA') {
            if (submitBtn) {
                submitBtn.textContent = `Withdrawing $${chargeAmount.toFixed(2)} from Visa…`;
            }
            await new Promise(r => setTimeout(r, 1600));
            if (submitBtn) submitBtn.textContent = 'Completing booking…';
        } else if (submitBtn && isPaidEvent(currentEvent)) {
            submitBtn.textContent = 'Completing booking…';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const booking = await response.json();

            bookings.push({
                ...booking,
                event: currentEvent
            });
            saveBookings();

            const paidNote =
                paymentMethod === 'VISA'
                    ? ` Visa payment of $${chargeAmount.toFixed(2)} processed.`
                    : '';
            showNotification(`Successfully booked 1 ticket for ${currentEvent.title}!${paidNote}`);
            bookingForm.reset();
            clearVisaForm();
            bookingModal.style.display = 'none';
            await loadEvents();
            const refreshed = events.find(
                ev => String(eventIdOf(ev)) === String(eventId)
            );
            if (refreshed) currentEvent = refreshed;
            displayEvents(events);
        } else {
            let msg = 'Booking failed.';
            try {
                const err = await response.json();
                msg = err.message || msg;
            } catch {
                /* ignore */
            }
            showNotification(msg, 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        const left = ticketsLeftForEvent(currentEvent);
        if (left < ticketQuantity) {
            showNotification('Not enough tickets left for this event.', 'error');
            return;
        }
        if (isPaidEvent(currentEvent) && !formData.paymentMethod) {
            showNotification('Please choose Visa or Cash as your payment method.', 'error');
            return;
        }
        const unit = eventPrice(currentEvent);
        const booking = {
            id: Date.now(),
            eventId: eventId,
            studentName: formData.studentName,
            studentId: formData.studentId,
            studentEmail: formData.studentEmail,
            tickets: formData.tickets,
            paymentMethod: formData.paymentMethod,
            totalAmount: formData.tickets * unit,
            bookingDate: new Date(),
            event: currentEvent
        };

        bookings.push(booking);
        saveBookings();
        if (currentEvent.ticketsAvailable != null) {
            currentEvent.ticketsAvailable = Math.max(0, Number(currentEvent.ticketsAvailable) - ticketQuantity);
            const evInList = events.find(ev => String(eventIdOf(ev)) === String(eventId));
            if (evInList) evInList.ticketsAvailable = currentEvent.ticketsAvailable;
        }
        const offNote =
            formData.paymentMethod === 'VISA'
                ? ` Visa demo charge $${chargeAmount.toFixed(2)} recorded locally.`
                : '';
        showNotification(
            `Successfully booked 1 ticket for ${currentEvent.title}! (offline — sync when API is available)${offNote}`
        );
        bookingForm.reset();
        clearVisaForm();
        bookingModal.style.display = 'none';
        displayEvents(events);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Booking';
        }
    }
}

// Save bookings to localStorage
function saveBookings() {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(user));
            showNotification('Signed in successfully!');
            signInModal.style.display = 'none';
            signInForm.reset();
            updateAuthButtons();
        } else {
            showNotification('Invalid email or password.', 'error');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            showNotification('Signed in successfully!');
            signInModal.style.display = 'none';
            signInForm.reset();
            updateAuthButtons();
        } else {
            showNotification('Invalid email or password.', 'error');
        }
    }
}

// Handle sign up
async function handleSignUp(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const phone = document.getElementById('signup-phone').value;
    const faculty = document.getElementById('signup-faculty').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, phone, faculty })
        });

        if (response.ok) {
            const newUser = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            showNotification('Signed up successfully!');
            signUpModal.style.display = 'none';
            signUpForm.reset();
            updateAuthButtons();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Sign up failed.', 'error');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(u => u.email === email)) {
            showNotification('Email already exists.', 'error');
            return;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        showNotification('Signed up successfully!');
        signUpModal.style.display = 'none';
        signUpForm.reset();
        updateAuthButtons();
    }
}

// Handle admin sign in
async function handleAdminSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('admin-signin-email').value;
    const password = document.getElementById('admin-signin-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const admin = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(admin));
            showNotification('Admin signed in successfully!');
            adminSignInModal.style.display = 'none';
            adminSignInForm.reset();
            updateAuthButtons();
            loadEvents(); // Reload events to show admin controls
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || 'Invalid email or password.';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Admin sign in error:', error);
        showNotification('Admin sign in failed.', 'error');
    }
}

// Handle admin sign up
async function handleAdminSignUp(e) {
    e.preventDefault();
    const name = document.getElementById('admin-signup-name').value.trim();
    const email = document.getElementById('admin-signup-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-signup-password').value;



    try {
        const response = await fetch(`${API_BASE_URL}/api/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            const newAdmin = await response.json();
            const adminData = {
                id: newAdmin.id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: 'admin'
            };
            localStorage.setItem('currentUser', JSON.stringify(adminData));
            showNotification('Admin account created successfully!');
            adminSignUpModal.style.display = 'none';
            adminSignUpForm.reset();
            updateAuthButtons();
        } else {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = 'Admin sign up failed.';
            
            if (errorData.errors) {
                // Handle validation errors
                const errorMessages = Object.values(errorData.errors).join(', ');
                errorMessage = errorMessages || errorMessage;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
            
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Admin sign up error:', error);
        showNotification('Cannot connect to backend at http://localhost:5000. Start backend first.', 'error');
    }
}

// Handle add event (Admin only)
async function handleAddEvent(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('event-file-upload');
    let imageUrl = '';

    // Step 1: Upload file if selected
    if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        showNotification('Uploading media...', 'info');
        try {
            const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.url;
            } else {
                showNotification('Media upload failed. Using default image.', 'error');
            }
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            showNotification('Media upload failed. Using default image.', 'error');
        }
    }

    const selectedFaculties = Array.from(document.querySelectorAll('.target-faculty:checked'))
        .map(cb => cb.value)
        .join(',');

    const eventData = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        category: document.getElementById('event-category').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        venue: document.getElementById('event-venue').value,
        capacity: parseInt(document.getElementById('event-capacity').value),
        price: parseFloat(document.getElementById('event-price').value),
        image: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2e87c',
        organizer: document.getElementById('event-organizer').value,
        contactEmail: document.getElementById('event-contact-email').value,
        targetFaculties: selectedFaculties || 'All'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            const newEvent = await response.json();
            showNotification('Event created successfully!');
            addEventModal.style.display = 'none';
            addEventForm.reset();
            loadEvents(); // Reload events to show the new one
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to create event.', 'error');
        }
    } catch (error) {
        console.error('Add event error:', error);
        showNotification('Failed to create event.', 'error');
    }
}

// Update auth buttons and nav links based on login status
function updateAuthButtons() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authButtons = document.querySelector('.auth-buttons');
    const navLinks = document.querySelector('.nav-links');
    if (!authButtons || !navLinks) return;

    // Clear existing nav links
    navLinks.innerHTML = '';

    // Add common nav links
    const commonLinks = [
        { href: '#home', text: 'Home' },
        { href: '#dashboard', text: 'Dashboard' },
        { href: 'admin.html', text: 'Admin' },
        { href: '#events', text: 'Events' },
        { href: '#categories', text: 'Categories' },
        { href: '#about', text: 'About' },
        { href: '#contact', text: 'Contact' }
    ];

    commonLinks.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link.href}">${link.text}</a>`;
        navLinks.appendChild(li);
    });

    if (currentUser) {
        // Add Profile link for logged in users
        const profileLi = document.createElement('li');
        profileLi.innerHTML = `<a href="profile.html">Profile</a>`;
        navLinks.appendChild(profileLi);

        // Add Admin Dashboard link if admin
        if (currentUser.role === 'admin') {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = `<a href="admin.html">Admin panel</a>`;
            navLinks.appendChild(adminLi);
        }

        authButtons.innerHTML = `
            <span class="user-name">${currentUser.name}${currentUser.role === 'admin' ? ' (Admin)' : ''}</span>
            <button class="sign-out-btn">Sign Out</button>
        `;
        document.querySelector('.sign-out-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            updateAuthButtons();
            showNotification('Signed out successfully!');
            loadEvents(); // Reload to remove admin controls
        });
    } else {
        authButtons.innerHTML = `
            <button class="sign-in-btn">Sign In</button>
            <button class="sign-up-btn">Sign Up</button>
            <a href="admin.html" class="admin-signin-btn">Admin</a>
        `;
        // Event listeners are handled by event delegation (see setupEventListeners), no need to reattach
    }
}

// Show admin dashboard
function showAdminDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }

    // Create or show admin dashboard modal
    let adminDashboard = document.getElementById('admin-dashboard-modal');
    if (!adminDashboard) {
        adminDashboard = document.createElement('div');
        adminDashboard.id = 'admin-dashboard-modal';
        adminDashboard.className = 'modal';
        adminDashboard.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal">&times;</span>
                <h2>Admin Dashboard</h2>
                <div style="margin: 20px 0;">
                    <button id="add-event-btn" class="book-btn" style="margin-right: 10px;">Add New Event</button>
                    <button id="view-all-bookings-btn" class="book-btn">View All Bookings</button>
                </div>
                <div id="admin-dashboard-content">
                    <p>Welcome, ${currentUser.name}! Use the buttons above to manage events and bookings.</p>
                </div>
            </div>
        `;
        document.body.appendChild(adminDashboard);
        
        // Add event listeners
        document.getElementById('add-event-btn').addEventListener('click', () => {
            adminDashboard.style.display = 'none';
            if (addEventModal) {
                addEventModal.style.display = 'block';
            } else {
                showNotification('Add event form not found. Please refresh the page.', 'error');
            }
        });
        
        document.getElementById('view-all-bookings-btn').addEventListener('click', async () => {
            await loadAllBookings();
        });
        
        adminDashboard.querySelector('.close-modal').addEventListener('click', () => {
            adminDashboard.style.display = 'none';
        });
    }
    
    adminDashboard.style.display = 'block';
}

// Load all bookings (Admin view)
async function loadAllBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/bookings`);
        if (response.ok) {
            const bookings = await response.json();
            const content = document.getElementById('admin-dashboard-content');
            if (content) {
                if (bookings.length === 0) {
                    content.innerHTML = '<p>No bookings found.</p>';
                } else {
                    content.innerHTML = '<h3>All Bookings</h3>' + bookings.map(booking => `
                        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
                            <h4>${booking.event ? booking.event.title : 'Event #' + booking.eventId}</h4>
                            <p><strong>Student:</strong> ${booking.studentName} (${booking.studentEmail})</p>
                            <p><strong>Student ID:</strong> ${booking.studentId}</p>
                            <p><strong>Tickets:</strong> ${booking.tickets}</p>
                            <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
                            ${booking.paymentMethod ? `<p><strong>Payment:</strong> ${booking.paymentMethod === 'VISA' ? 'Visa' : booking.paymentMethod === 'CASH' ? 'Cash' : booking.paymentMethod}</p>` : ''}
                            <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleString()}</p>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Failed to load bookings.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor =
        type === 'error' ? '#e74c3c' : type === 'info' ? '#2980b9' : '#27ae60';
    notification.style.color = 'white';
    notification.style.padding = '0.5rem 1rem';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.5s ease-out';
    notification.style.fontSize = '0.9rem';
    notification.style.maxWidth = '300px';

    // Add keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        style.textContent += `
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 500);
    }, 3000);
}

// Scroll reveal animation
window.addEventListener('scroll', () => {
    const elements = document.querySelectorAll('.event-card, .category-card, .about-content, #contact');

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
});

// Initialize scroll reveal styles
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.event-card, .category-card, .about-content, #contact');

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    });
});
