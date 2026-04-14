(function () {
    const SESSION_KEY = 'badyaAdminSession';

    function apiBase() {
        return (window.ADMIN_CONFIG && window.ADMIN_CONFIG.API_BASE_URL) || 'http://localhost:5000';
    }

    function siteBase() {
        const configured = window.ADMIN_CONFIG && window.ADMIN_CONFIG.SITE_BASE_URL;
        if (configured && String(configured).trim()) return String(configured).replace(/\/+$/, '');
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            return window.location.origin;
        }
        return '';
    }

    function profileUrlForUserId(userId) {
        const base = siteBase();
        if (!base) return `profile.html?userId=${encodeURIComponent(userId)}`;
        return `${base}/profile.html?userId=${encodeURIComponent(userId)}`;
    }

    function qrImgUrlForText(text, size = 180) {
        const qs = new URLSearchParams({
            data: text,
            size: `${size}x${size}`,
            margin: '10'
        });
        return `https://api.qrserver.com/v1/create-qr-code/?${qs.toString()}`;
    }

    function getSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setSession(data) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    function el(id) {
        return document.getElementById(id);
    }

    function toast(msg, type = 'success') {
        const t = document.createElement('div');
        t.className = `admin-toast ${type}`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function eventId(ev) {
        return ev._id != null ? ev._id : ev.id;
    }

    function normalizeTimeForApi(t) {
        if (!t) return '10:00:00';
        const s = String(t);
        return s.length === 5 ? `${s}:00` : s;
    }

    function timeInputValue(t) {
        if (!t) return '';
        const s = String(t);
        return s.length >= 5 ? s.slice(0, 5) : s;
    }

    function dateInputValue(d) {
        if (d == null) return '';
        if (Array.isArray(d) && d.length >= 3) {
            return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
        }
        return String(d).split('T')[0];
    }

    function fmtDate(d) {
        if (d == null || d === '') return '—';
        const iso = dateInputValue(d);
        const parts = iso.split('-').map(Number);
        if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
            const x = new Date(parts[0], parts[1] - 1, parts[2]);
            return escapeHtml(x.toLocaleDateString(undefined, { dateStyle: 'medium' }));
        }
        return escapeHtml(String(d));
    }

    function fmtDateTime(iso) {
        if (!iso) return '—';
        const x = new Date(iso);
        if (Number.isNaN(x.getTime())) return escapeHtml(String(iso));
        return escapeHtml(x.toLocaleString());
    }

    function showLogin() {
        el('login-screen').hidden = false;
        el('admin-app').hidden = true;
    }

    function showApp(session) {
        el('login-screen').hidden = true;
        el('admin-app').hidden = false;
        el('admin-welcome').textContent = `${session.name} · ${session.email}`;
    }

    function requireSession() {
        const s = getSession();
        if (!s || s.role !== 'admin') {
            showLogin();
            return null;
        }
        return s;
    }

    async function loginRequest(email, password) {
        const res = await fetch(`${apiBase()}/api/admin/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Sign in failed');
        return data;
    }

    async function loadEvents() {
        if (!requireSession()) return;
        try {
            const res = await fetch(`${apiBase()}/api/events`);
            const data = await res.json();
            window.__adminEvents = Array.isArray(data) ? data : [];
            renderEvents();
        } catch {
            toast('Failed to load events', 'error');
        }
    }

    function renderEvents() {
        const tbody = el('events-table-body');
        const list = window.__adminEvents || [];
        tbody.innerHTML = '';
        el('events-empty').hidden = list.length > 0;
        list.forEach(ev => {
            const id = eventId(ev);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(ev.title)}</td>
                <td>${fmtDate(ev.date)}</td>
                <td>${escapeHtml(ev.venue)}</td>
                <td>${escapeHtml(ev.category)}</td>
                <td>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-primary" data-action="edit-event" data-id="${id}">Edit</button>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="delete-event" data-id="${id}">Remove</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function deleteEventById(id) {
        if (!requireSession()) return;
        if (!confirm('Delete this event? Related bookings will be removed.')) return;
        try {
            const res = await fetch(`${apiBase()}/api/admin/events/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast('Event removed');
            await loadEvents();
        } catch {
            toast('Could not delete event', 'error');
        }
    }

    function openEventModal(isEdit, ev) {
        el('event-modal').classList.add('open');
        el('event-modal-title').textContent = isEdit ? 'Edit event' : 'Add event';
        el('ev-id').value = isEdit && ev ? String(eventId(ev)) : '';
        el('ev-title').value = ev?.title || '';
        el('ev-description').value = ev?.description || '';
        el('ev-category').value = ev?.category || '';
        el('ev-date').value = ev ? dateInputValue(ev.date) : '';
        el('ev-time').value = ev ? timeInputValue(ev.time) : '';
        el('ev-venue').value = ev?.venue || '';
        el('ev-capacity').value = ev?.capacity != null ? ev.capacity : '';
        el('ev-price').value = ev?.price != null ? ev.price : '';
        el('ev-image').value = ev?.image || '';
        el('ev-organizer').value = ev?.organizer || '';
        el('ev-contact-email').value = ev?.contactEmail || '';
    }

    function closeEventModal() {
        el('event-modal').classList.remove('open');
    }

    async function saveEvent(e) {
        e.preventDefault();
        if (!requireSession()) return;
        const id = el('ev-id').value.trim();
        const body = {
            title: el('ev-title').value.trim(),
            description: el('ev-description').value.trim(),
            category: el('ev-category').value,
            date: el('ev-date').value,
            time: normalizeTimeForApi(el('ev-time').value),
            venue: el('ev-venue').value.trim(),
            capacity: parseInt(el('ev-capacity').value, 10),
            price: parseFloat(el('ev-price').value),
            image:
                el('ev-image').value.trim() ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2e87c',
            organizer: el('ev-organizer').value.trim(),
            contactEmail: el('ev-contact-email').value.trim()
        };
        const url = id ? `${apiBase()}/api/admin/events/${id}` : `${apiBase()}/api/admin/events`;
        const method = id ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Save failed');
            }
            toast(id ? 'Event updated' : 'Event created');
            closeEventModal();
            await loadEvents();
        } catch (err) {
            toast(err.message || 'Could not save event', 'error');
        }
    }

    async function loadUsers() {
        if (!requireSession()) return;
        try {
            const res = await fetch(`${apiBase()}/api/users`);
            const data = await res.json();
            window.__adminUsers = Array.isArray(data) ? data : [];
            renderUsers();
        } catch {
            toast('Failed to load users', 'error');
        }
    }

    function renderUsers() {
        const tbody = el('users-table-body');
        const list = window.__adminUsers || [];
        tbody.innerHTML = '';
        el('users-empty').hidden = list.length > 0;
        list.forEach(u => {
            const tr = document.createElement('tr');
            const profileUrl = profileUrlForUserId(u.id);
            const qrImg = qrImgUrlForText(profileUrl, 180);
            tr.innerHTML = `
                <td>${escapeHtml(u.id)}</td>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td class="admin-qr-cell">
                    <img class="admin-qr-img" alt="QR code for ${escapeHtml(u.name)} profile" src="${qrImg}">
                    <div class="admin-qr-actions">
                        <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener">Open</a>
                        <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" data-action="copy-profile-link" data-id="${u.id}">Copy link</button>
                    </div>
                </td>
                <td>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-primary" data-action="edit-user" data-id="${u.id}">Edit</button>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="delete-user" data-id="${u.id}">Remove</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function openUserModal(u) {
        el('user-modal').classList.add('open');
        el('usr-id').value = String(u.id);
        el('usr-name').value = u.name || '';
        el('usr-email').value = u.email || '';
        el('usr-password').value = '';
    }

    function closeUserModal() {
        el('user-modal').classList.remove('open');
    }

    async function saveUser(e) {
        e.preventDefault();
        if (!requireSession()) return;
        const id = el('usr-id').value;
        const name = el('usr-name').value.trim();
        const email = el('usr-email').value.trim();
        const password = el('usr-password').value;
        const body = { name, email };
        if (password) body.password = password;
        try {
            const res = await fetch(`${apiBase()}/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Update failed');
            }
            toast('User updated');
            closeUserModal();
            await loadUsers();
        } catch (err) {
            toast(err.message || 'Could not update user', 'error');
        }
    }

    async function deleteUserById(id) {
        if (!requireSession()) return;
        if (!confirm('Remove this user? They will no longer be able to sign in.')) return;
        try {
            const res = await fetch(`${apiBase()}/api/admin/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast('User removed');
            await loadUsers();
        } catch {
            toast('Could not remove user (they may have bookings or attendance records).', 'error');
        }
    }

    async function loadBookings() {
        if (!requireSession()) return;
        try {
            const res = await fetch(`${apiBase()}/api/admin/bookings`);
            const data = await res.json();
            window.__adminBookings = Array.isArray(data) ? data : [];
            renderBookings();
        } catch {
            toast('Failed to load bookings', 'error');
        }
    }

    function renderBookings() {
        const tbody = el('bookings-table-body');
        const list = window.__adminBookings || [];
        tbody.innerHTML = '';
        el('bookings-empty').hidden = list.length > 0;
        list.forEach(b => {
            const title = b.event && b.event.title ? b.event.title : `Event #${b.eventId}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(title)}</td>
                <td>${escapeHtml(b.studentName)}</td>
                <td>${escapeHtml(b.studentEmail)}</td>
                <td>${escapeHtml(b.tickets)}</td>
                <td>${escapeHtml(b.totalAmount)}</td>
                <td>${fmtDateTime(b.bookingDate)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function refreshAll() {
        if (!requireSession()) return;
        await Promise.all([loadEvents(), loadUsers(), loadBookings()]);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const session = getSession();
        if (session && session.role === 'admin') {
            showApp(session);
            refreshAll();
        } else {
            showLogin();
        }

        el('admin-login-form').addEventListener('submit', async e => {
            e.preventDefault();
            el('login-error').textContent = '';
            const email = el('admin-email').value.trim();
            const password = el('admin-password').value;
            try {
                const data = await loginRequest(email, password);
                setSession({ ...data, role: 'admin' });
                showApp(data);
                el('admin-password').value = '';
                await refreshAll();
                toast('Signed in');
            } catch (err) {
                el('login-error').textContent = err.message || 'Sign in failed';
            }
        });

        el('admin-logout').addEventListener('click', () => {
            clearSession();
            showLogin();
            toast('Signed out');
        });

        document.querySelectorAll('.admin-tabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.admin-tabs button').forEach(b => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                document.querySelectorAll('.admin-tab-panel').forEach(p => {
                    p.hidden = p.id !== `tab-${tab}`;
                });
            });
        });

        el('btn-add-event').addEventListener('click', () => openEventModal(false));
        el('btn-refresh-users').addEventListener('click', loadUsers);
        el('btn-refresh-bookings').addEventListener('click', loadBookings);

        el('event-form').addEventListener('submit', saveEvent);

        document.querySelectorAll('[data-close-modal]').forEach(b => {
            b.addEventListener('click', closeEventModal);
        });
        el('event-modal').addEventListener('click', e => {
            if (e.target === el('event-modal')) closeEventModal();
        });

        document.querySelectorAll('[data-close-user-modal]').forEach(b => {
            b.addEventListener('click', closeUserModal);
        });
        el('user-modal').addEventListener('click', e => {
            if (e.target === el('user-modal')) closeUserModal();
        });

        el('user-form').addEventListener('submit', saveUser);

        el('events-table-body').addEventListener('click', e => {
            const editBtn = e.target.closest('[data-action="edit-event"]');
            const delBtn = e.target.closest('[data-action="delete-event"]');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const ev = (window.__adminEvents || []).find(x => String(eventId(x)) === String(id));
                if (ev) openEventModal(true, ev);
            }
            if (delBtn) deleteEventById(delBtn.getAttribute('data-id'));
        });

        el('users-table-body').addEventListener('click', e => {
            const editBtn = e.target.closest('[data-action="edit-user"]');
            const delBtn = e.target.closest('[data-action="delete-user"]');
            const copyBtn = e.target.closest('[data-action="copy-profile-link"]');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const u = (window.__adminUsers || []).find(x => String(x.id) === String(id));
                if (u) openUserModal(u);
            }
            if (delBtn) deleteUserById(delBtn.getAttribute('data-id'));
            if (copyBtn) {
                const id = copyBtn.getAttribute('data-id');
                const url = profileUrlForUserId(id);
                navigator.clipboard
                    ?.writeText(url)
                    .then(() => toast('Profile link copied'))
                    .catch(() => toast('Could not copy link (browser blocked)', 'error'));
            }
        });
    });
})();
