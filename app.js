/* =========================================================
   KAOS · Colación 2026
   Registro de invitados — lógica de la aplicación
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "kaos-colacion-v1";
  const MAX_GUESTS = 19;
  const STUDENT_NAME_MAX = 60;
  const GUEST_NAME_MAX = 70;
  const NOTE_MAX = 120;
  const RELATIONS = ["Familiar", "Amigo/a", "Pareja", "Docente", "Otro"];

  const state = {
    data: loadData(),
    lastAddedGuestId: null,
    celebratedFullFor: null,
    toastEl: null,
    toastTimer: null,
    storageOk: true
  };

  const els = {
    registerRoot: document.getElementById("register-root"),
    summaryRoot: document.getElementById("summary-root"),
    headerCtaLabel: document.querySelector("[data-header-cta-label]"),
    toastRegion: document.getElementById("toast-region"),
    liveStatus: document.getElementById("live-status"),
    editDialog: document.getElementById("edit-dialog"),
    editForm: document.getElementById("edit-form"),
    editError: document.getElementById("edit-error"),
    resetDialog: document.getElementById("reset-dialog"),
    resetDialogText: document.getElementById("reset-dialog-text"),
    confirmReset: document.getElementById("confirm-reset")
  };

  const icons = {
    user: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="6.5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M4.2 16c.5-2.7 2.7-4.2 5.8-4.2s5.3 1.5 5.8 4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.2" y="7" width="9.6" height="6.4" rx="1.6" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" stroke-width="1.2"/></svg>',
    arrow: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 3.5v11M3.5 9h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    edit: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3.2 14.8 3.6-.8L14.6 6.2a1.7 1.7 0 0 0 0-2.4l-.4-.4a1.7 1.7 0 0 0-2.4 0L4 11.2l-.8 3.6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="m10.8 4.8 2.4 2.4" stroke="currentColor" stroke-width="1.3"/></svg>',
    trash: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 5.2h11M7 5.2V3.8h4v1.4M4.8 5.2l.6 9.1h7.2l.6-9.1M7.5 8v3.8M10.5 8v3.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    switch: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 5.5h9l-2-2M13.5 10.5h-9l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    download: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 3v8M5.8 8.2 9 11.4l3.2-3.2M3.5 14.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reset: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.6 6.2A6.2 6.2 0 1 1 3 10.2M3.6 6.2V2.8M3.6 6.2H7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2.5c.55 7.7 5.8 12.95 13.5 13.5-7.7.55-12.95 5.8-13.5 13.5C15.45 21.8 10.2 16.55 2.5 16 10.2 15.45 15.45 10.2 16 2.5Z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.3 3 3 6-6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevron: '<svg class="summary-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* -------------------------------------------------------
     Utilidades
     ------------------------------------------------------- */

  function emptyData() {
    return { version: 1, activeStudentId: null, students: [] };
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return cleanText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[character];
    });
  }

  function safeId(value) {
    const id = String(value ?? "");
    return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : null;
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function generateCode(existing = []) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
      code = "KAOS-";
      for (let i = 0; i < 4; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    } while (existing.some((student) => student.code === code));
    return code;
  }

  function getInitials(name) {
    const words = cleanText(name).split(" ").filter(Boolean);
    if (!words.length) return "KA";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  function getFirstName(name) {
    return cleanText(name).split(" ")[0] || "alumno/a";
  }

  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function announce(message) {
    if (!els.liveStatus) return;
    els.liveStatus.textContent = "";
    window.setTimeout(() => {
      els.liveStatus.textContent = message;
    }, 30);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function dateStamp() {
    const now = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function normalizeGuest(raw) {
    if (!raw || typeof raw.name !== "string") return null;
    const name = cleanText(raw.name).slice(0, GUEST_NAME_MAX);
    if (!name) return null;
    return {
      id: safeId(raw.id) || uid(),
      name,
      relation: RELATIONS.includes(raw.relation) ? raw.relation : "Familiar",
      note: cleanText(raw.note).slice(0, NOTE_MAX),
      createdAt: Number.isNaN(new Date(raw.createdAt).getTime())
        ? new Date().toISOString()
        : new Date(raw.createdAt).toISOString()
    };
  }

  function normalizeStudent(raw) {
    if (!raw || typeof raw.name !== "string") return null;
    const name = cleanText(raw.name).slice(0, STUDENT_NAME_MAX);
    if (name.length < 2) return null;
    const guests = Array.isArray(raw.guests)
      ? raw.guests.slice(0, MAX_GUESTS).map(normalizeGuest).filter(Boolean)
      : [];
    return {
      id: safeId(raw.id) || uid(),
      name,
      code: /^KAOS-[A-Z0-9]{4}$/.test(String(raw.code)) ? raw.code : generateCode(),
      createdAt: Number.isNaN(new Date(raw.createdAt).getTime())
        ? new Date().toISOString()
        : new Date(raw.createdAt).toISOString(),
      guests
    };
  }

  function loadData() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyData();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.students)) return emptyData();
      const students = parsed.students.slice(0, 200).map(normalizeStudent).filter(Boolean);
      const activeStudentId = students.some((student) => student.id === parsed.activeStudentId)
        ? parsed.activeStudentId
        : null;
      return { version: 1, activeStudentId, students };
    } catch (error) {
      console.warn("No se pudo leer el registro guardado.", error);
      return emptyData();
    }
  }

  function saveData() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      state.storageOk = true;
      return true;
    } catch (error) {
      state.storageOk = false;
      console.warn("No se pudo guardar el registro.", error);
      showToast("No pudimos guardar en este navegador. Revisa el almacenamiento del sitio.", {
        type: "error",
        duration: 7000
      });
      return false;
    }
  }

  function getActiveStudent() {
    return state.data.students.find((student) => student.id === state.data.activeStudentId) || null;
  }

  function getSortedStudents() {
    return [...state.data.students].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }

  function countGuests() {
    return state.data.students.reduce((total, student) => total + student.guests.length, 0);
  }

  /* -------------------------------------------------------
     Render
     ------------------------------------------------------- */

  function renderRegister() {
    const student = getActiveStudent();
    els.registerRoot.innerHTML = student ? studentDeskMarkup(student) : identityMarkup();
  }

  function identityMarkup() {
    const students = getSortedStudents();
    const savedMarkup = students.length
      ? `
        <div class="saved-students">
          <div class="saved-head">
            <h4>Continúa donde quedaste</h4>
            <span>${pluralize(students.length, "pase guardado", "pases guardados")} en este dispositivo</span>
          </div>
          <div class="saved-grid">
            ${students
              .map(
                (student) => `
                  <button class="saved-chip" type="button" data-action="select-student" data-id="${escapeHTML(student.id)}">
                    <span class="avatar" aria-hidden="true">${escapeHTML(getInitials(student.name))}</span>
                    <span>
                      <strong>${escapeHTML(student.name)}</strong>
                      <small>${student.guests.length} / ${MAX_GUESTS} invitados</small>
                    </span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `
      : "";

    return `
      <div class="identity-card">
        <div class="identity-main">
          <p class="mini-label">Primer paso</p>
          <h3>¿Quién se gradúa?</h3>
          <p>Ingresa tu nombre para crear tu pase. Así tus invitados quedan asociados a ti y puedes volver a editar la lista cuando quieras.</p>

          <form id="identity-form" class="identity-form" novalidate>
            <div class="field-group">
              <label for="student-name">Nombre completo</label>
              <div class="input-wrap">
                ${icons.user}
                <input
                  id="student-name"
                  name="studentName"
                  type="text"
                  maxlength="${STUDENT_NAME_MAX}"
                  autocomplete="name"
                  autocapitalize="words"
                  spellcheck="false"
                  placeholder="Ej. Martina González"
                  aria-describedby="identity-error"
                  required
                >
              </div>
            </div>
            <p class="form-error" id="identity-error" role="alert" hidden></p>
            <button class="btn btn--primary btn--wide" type="submit">
              <span>Crear mi pase</span>
              ${icons.arrow}
            </button>
          </form>

          <p class="privacy-note">${icons.lock} Tus datos se guardan en este navegador.</p>
        </div>

        <div class="identity-side">
          <div class="medal">
            <span class="medal-number">19</span>
            <span class="medal-label">invitados<br>por alumno</span>
          </div>
          <ul class="perks">
            <li>Agrega y edita tu lista cuando quieras.</li>
            <li>Revisa cuántos cupos te quedan.</li>
            <li>Exporta el resumen del curso en CSV.</li>
          </ul>
        </div>
      </div>
      ${savedMarkup}
    `;
  }

  function studentDeskMarkup(student) {
    const count = student.guests.length;
    const remaining = MAX_GUESTS - count;
    const percent = Math.round((count / MAX_GUESTS) * 100);
    const progress = Math.round((count / MAX_GUESTS) * 360);
    const isFull = count >= MAX_GUESTS;
    const guestRows = student.guests
      .map((guest, index) => {
        const isNew = guest.id === state.lastAddedGuestId;
        return `
          <div class="guest-row${isNew ? " is-new" : ""}">
            <span class="guest-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
            <div class="guest-info">
              <strong title="${escapeHTML(guest.name)}">${escapeHTML(guest.name)}</strong>
              <div class="guest-meta">
                <span class="guest-tag">${escapeHTML(guest.relation)}</span>
                ${guest.note ? `<span class="guest-note" title="${escapeHTML(guest.note)}">${escapeHTML(guest.note)}</span>` : ""}
              </div>
            </div>
            <div class="guest-actions">
              <button
                class="icon-button"
                type="button"
                data-action="edit-guest"
                data-id="${escapeHTML(guest.id)}"
                aria-label="Editar a ${escapeHTML(guest.name)}"
                title="Editar"
              >${icons.edit}</button>
              <button
                class="icon-button icon-button--danger"
                type="button"
                data-action="remove-guest"
                data-id="${escapeHTML(guest.id)}"
                aria-label="Eliminar a ${escapeHTML(guest.name)}"
                title="Eliminar"
              >${icons.trash}</button>
            </div>
          </div>
        `;
      })
      .join("");

    const emptyMarkup = `
      <div class="empty-list">
        <div class="empty-icon" aria-hidden="true">✦</div>
        <p>Tu lista está esperando.</p>
        <span>Agrega a la primera persona y empieza a llenar la mesa. Tienes 19 lugares.</span>
      </div>
    `;

    const fullMarkup = `
      <div class="full-callout">
        <span class="full-icon" aria-hidden="true">${icons.check}</span>
        <div>
          <strong>Tu cupo está completo</strong>
          <p>Ya reservaste los 19 lugares. Si necesitas hacer cambios, edita o elimina a un invitado.</p>
        </div>
      </div>
    `;

    const formMarkup = isFull
      ? fullMarkup
      : `
        <form id="guest-form" class="guest-form" novalidate>
          <div class="form-grid">
            <div class="field-group field-group--full">
              <label for="guest-name">Nombre completo <span class="required">*</span></label>
              <input
                id="guest-name"
                name="guestName"
                type="text"
                maxlength="${GUEST_NAME_MAX}"
                autocomplete="off"
                autocapitalize="words"
                spellcheck="false"
                placeholder="Ej. Camila Pérez"
                aria-describedby="guest-error"
                required
              >
            </div>
            <div class="field-group">
              <label for="guest-relation">Vínculo</label>
              <div class="select-wrap">
                <select id="guest-relation" name="guestRelation">
                  ${RELATIONS.map((relation) => `<option value="${escapeHTML(relation)}">${escapeHTML(relation)}</option>`).join("")}
                </select>
                ${icons.chevron.replace("summary-chevron", "select-chevron")}
              </div>
            </div>
            <div class="field-group">
              <label for="guest-note">Alergias / menú <span class="optional">(opcional)</span></label>
              <input
                id="guest-note"
                name="guestNote"
                type="text"
                maxlength="${NOTE_MAX}"
                autocomplete="off"
                placeholder="Ej. vegetariano, sin gluten"
                aria-describedby="guest-error"
              >
            </div>
          </div>
          <p class="form-error" id="guest-error" role="alert" hidden></p>
          <div class="form-actions">
            <p class="form-hint">${remaining === 19 ? "Tienes" : "Quedan"} <strong>${remaining}</strong> ${remaining === 1 ? "cupo" : "cupos"} de ${MAX_GUESTS}.</p>
            <button class="btn btn--primary" type="submit">
              <span>Agregar invitado</span>
              ${icons.plus}
            </button>
          </div>
        </form>
      `;

    return `
      <div class="desk-grid">
        <aside class="pass-column">
          <div class="pass">
            <div class="pass-inner">
              <div class="pass-top">
                <span class="pass-brand">${icons.spark} KAOS</span>
                <span class="pass-code">${escapeHTML(student.code)}</span>
              </div>

              <div class="pass-person">
                <span class="pass-label">Alumno/a</span>
                <h3>${escapeHTML(student.name)}</h3>
                <p>Colación 2026 · Generación KAOS</p>
              </div>

              <div class="pass-count">
                <div class="ring${isFull ? " is-full" : ""}" style="--p:${progress}deg" role="img" aria-label="${count} de ${MAX_GUESTS} invitados registrados">
                  <div class="ring-content">
                    <strong>${String(count).padStart(2, "0")}</strong>
                    <span>/ ${MAX_GUESTS}</span>
                  </div>
                </div>
                <div class="pass-status${isFull ? " is-full" : ""}">
                  <span class="status-dot">${isFull ? "Cupo completo" : "En curso"}</span>
                  <strong>${isFull ? "Tu mesa está completa" : `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining}`}</strong>
                  <p>${isFull ? "19 de 19 invitados registrados." : `${remaining === 1 ? "lugar disponible" : "lugares disponibles"} en tu mesa.`}</p>
                </div>
              </div>

              <div class="pass-bar"><span style="width:${percent}%"></span></div>
              <div class="pass-foot">
                <span>Admit one · KAOS 2026</span>
                <span class="mini-bars" aria-hidden="true"></span>
              </div>
            </div>
          </div>

          <div class="pass-actions">
            <button class="btn-text" type="button" data-action="switch-student">${icons.switch} Cambiar de alumno</button>
            <a class="btn-text" href="#resumen">Ver resumen ${icons.arrow}</a>
          </div>
        </aside>

        <div class="guest-panel">
          <div class="guest-panel-head">
            <div>
              <p class="mini-label">Tu lista</p>
              <h3>Invita a tu gente</h3>
            </div>
            <span class="count-badge" aria-label="${count} de ${MAX_GUESTS} invitados">${String(count).padStart(2, "0")} <span>/ ${MAX_GUESTS}</span></span>
          </div>

          ${formMarkup}

          <div class="guest-list-head">
            <span>Invitados</span>
            <span>${count} de ${MAX_GUESTS}</span>
          </div>
          <div class="guest-list">
            ${count ? guestRows : emptyMarkup}
          </div>

          <div class="autosave">${state.storageOk ? "Guardado automáticamente en este dispositivo" : "Guardado solo en esta sesión"}</div>
        </div>
      </div>
    `;
  }

  function renderSummary() {
    const students = getSortedStudents();
    const totalGuests = countGuests();
    const capacity = students.length * MAX_GUESTS;
    const available = Math.max(capacity - totalGuests, 0);

    const statsMarkup = `
      <div class="stats-grid">
        <article class="stat">
          <span class="stat-label">Pases creados</span>
          <strong>${students.length}</strong>
          <small>${students.length === 1 ? "alumno registrado" : "alumnos registrados"}</small>
        </article>
        <article class="stat">
          <span class="stat-label">Invitados registrados</span>
          <strong>${totalGuests}</strong>
          <small>de ${capacity} ${capacity === 1 ? "cupo" : "cupos"} totales</small>
        </article>
        <article class="stat">
          <span class="stat-label">Cupos disponibles</span>
          <strong>${available}</strong>
          <small>para seguir sumando a la mesa</small>
        </article>
      </div>
    `;

    let contentMarkup;

    if (!students.length) {
      contentMarkup = `
        ${statsMarkup}
        <div class="summary-empty">
          <div class="empty-icon" aria-hidden="true">✦</div>
          <h3>Todavía no hay pases</h3>
          <p>Cuando alguien cree su pase, aquí aparecerá el resumen del curso con todos sus invitados.</p>
          <a class="btn btn--primary" href="#registro">Crear el primer pase ${icons.arrow}</a>
        </div>
      `;
    } else {
      const rows = students
        .map((student, index) => {
          const count = student.guests.length;
          const isFull = count >= MAX_GUESTS;
          const percent = Math.round((count / MAX_GUESTS) * 100);
          const guestsMarkup = count
            ? `
              <ol>
                ${student.guests
                  .map(
                    (guest) => `
                      <li>
                        <span>${escapeHTML(guest.name)}</span>
                        <span class="guest-tag">${escapeHTML(guest.relation)}</span>
                      </li>
                    `
                  )
                  .join("")}
              </ol>
            `
            : '<p>Sin invitados registrados todavía.</p>';

          return `
            <details class="summary-student">
              <summary>
                <span class="summary-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <span class="avatar" aria-hidden="true">${escapeHTML(getInitials(student.name))}</span>
                <span class="student-name">
                  <strong>${escapeHTML(student.name)}</strong>
                  <small>${escapeHTML(student.code)}</small>
                </span>
                <span class="student-progress" aria-label="${count} de ${MAX_GUESTS} invitados">
                  <span class="mini-bar"><i style="width:${percent}%"></i></span>
                  <small>${count}/${MAX_GUESTS}</small>
                </span>
                <span class="status-pill${isFull ? " status-pill--full" : ""}">${isFull ? "Completo" : `${MAX_GUESTS - count} libres`}</span>
                ${icons.chevron}
              </summary>
              <div class="summary-guests">
                ${guestsMarkup}
                <button class="summary-open" type="button" data-action="select-student" data-id="${escapeHTML(student.id)}">
                  Abrir este pase →
                </button>
              </div>
            </details>
          `;
        })
        .join("");

      contentMarkup = `
        ${statsMarkup}
        <div class="summary-toolbar">
          <div>
            <h3>Todos los pases</h3>
            <p>${pluralize(students.length, "alumno", "alumnos")} · ${pluralize(totalGuests, "invitado", "invitados")} · toca un pase para ver su lista.</p>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn--quiet btn--small" type="button" data-action="export-csv">
              ${icons.download} Exportar CSV
            </button>
            <button class="btn-icon-danger" type="button" data-action="open-reset" aria-label="Borrar todo el registro" title="Borrar todo el registro">
              ${icons.reset}
            </button>
          </div>
        </div>
        <div class="summary-list">${rows}</div>
      `;
    }

    els.summaryRoot.innerHTML = `
      <div class="summary-panel">
        ${contentMarkup}
        <p class="local-note">
          ${icons.lock}
          <span>Los registros se guardan en este navegador. Exporta el CSV para respaldar la lista o compartirla con la organización.</span>
        </p>
      </div>
    `;
  }

  function updateHeader() {
    const student = getActiveStudent();
    els.headerCtaLabel.textContent = student ? "Mi pase" : "Comenzar";
  }

  function refresh(options = {}) {
    renderRegister();
    renderSummary();
    updateHeader();

    if (options.focus === "guest") {
      window.requestAnimationFrame(() => {
        const input = document.getElementById("guest-name");
        if (input) input.focus();
      });
    }

    if (options.focus === "identity") {
      window.requestAnimationFrame(() => {
        const input = document.getElementById("student-name");
        if (input) input.focus();
      });
    }

    if (options.scrollToRegister) {
      window.setTimeout(() => {
        document.getElementById("registro")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 220);
    }

    if (state.lastAddedGuestId) {
      const addedId = state.lastAddedGuestId;
      window.setTimeout(() => {
        if (state.lastAddedGuestId === addedId) state.lastAddedGuestId = null;
        document.querySelector(".guest-row.is-new")?.classList.remove("is-new");
      }, 850);
    }
  }

  /* -------------------------------------------------------
     Acciones de alumnos e invitados
     ------------------------------------------------------- */

  function handleIdentitySubmit(form) {
    const input = form.querySelector("#student-name");
    const error = form.querySelector("#identity-error");
    const name = cleanText(input.value);

    clearFormError(error, input);

    if (name.length < 3) {
      showFormError(error, input, "Escribe tu nombre completo para crear el pase.");
      return;
    }

    if (name.length > STUDENT_NAME_MAX) {
      showFormError(error, input, `El nombre no puede superar los ${STUDENT_NAME_MAX} caracteres.`);
      return;
    }

    const key = normalizeKey(name);
    const existing = state.data.students.find((student) => normalizeKey(student.name) === key);

    if (existing) {
      state.data.activeStudentId = existing.id;
      saveData();
      refresh({ focus: "guest" });
      showToast(`¡Hola de nuevo, ${getFirstName(existing.name)}! Abrimos tu pase.`);
      return;
    }

    const student = {
      id: uid(),
      name,
      code: generateCode(state.data.students),
      createdAt: new Date().toISOString(),
      guests: []
    };

    state.data.students.push(student);
    state.data.activeStudentId = student.id;
    saveData();
    refresh({ focus: "guest" });
    showToast("¡Pase creado! Ahora invita a tu gente.");
  }

  function handleGuestSubmit(form) {
    const student = getActiveStudent();
    if (!student) return;

    if (student.guests.length >= MAX_GUESTS) {
      showToast("Este pase ya tiene sus 19 invitados.", { type: "error" });
      refresh();
      return;
    }

    const nameInput = form.querySelector("#guest-name");
    const relationInput = form.querySelector("#guest-relation");
    const noteInput = form.querySelector("#guest-note");
    const error = form.querySelector("#guest-error");
    const name = cleanText(nameInput.value);
    const note = cleanText(noteInput.value);

    clearFormError(error, nameInput);

    if (name.length < 2) {
      showFormError(error, nameInput, "Escribe el nombre del invitado.");
      return;
    }

    if (name.length > GUEST_NAME_MAX) {
      showFormError(error, nameInput, `El nombre no puede superar los ${GUEST_NAME_MAX} caracteres.`);
      return;
    }

    if (note.length > NOTE_MAX) {
      showFormError(error, noteInput, `La nota no puede superar los ${NOTE_MAX} caracteres.`);
      return;
    }

    if (student.guests.some((guest) => normalizeKey(guest.name) === normalizeKey(name))) {
      showFormError(error, nameInput, "Ya registraste a alguien con ese nombre en tu lista.");
      return;
    }

    const guest = {
      id: uid(),
      name,
      relation: RELATIONS.includes(relationInput.value) ? relationInput.value : "Familiar",
      note,
      createdAt: new Date().toISOString()
    };

    student.guests.push(guest);
    state.lastAddedGuestId = guest.id;
    saveData();
    state.celebratedFullFor = null;
    refresh({ focus: "guest" });
    announce(`${guest.name} se agregó a la lista. ${student.guests.length} de ${MAX_GUESTS} invitados.`);

    if (student.guests.length === MAX_GUESTS) {
      celebrateFull(student);
    }
  }

  function removeGuest(guestId) {
    const student = getActiveStudent();
    if (!student) return;

    const index = student.guests.findIndex((guest) => guest.id === guestId);
    if (index < 0) return;

    const [removed] = student.guests.splice(index, 1);
    state.celebratedFullFor = null;
    state.lastAddedGuestId = null;
    saveData();
    refresh({ focus: "guest" });
    showToast(`Eliminaste a ${removed.name}.`, {
      actionLabel: "Deshacer",
      duration: 6500,
      onAction: () => {
        const owner = state.data.students.find((item) => item.id === student.id);
        if (!owner) {
          showToast("Ese pase ya no existe.", { type: "error" });
          return;
        }
        if (owner.guests.length >= MAX_GUESTS) {
          showToast("No hay cupo disponible para deshacer.", { type: "error" });
          return;
        }
        owner.guests.splice(Math.min(index, owner.guests.length), 0, removed);
        saveData();
        refresh({ focus: "guest" });
        showToast("Invitado restaurado.");
      }
    });
  }

  function openEditDialog(guestId) {
    const student = getActiveStudent();
    if (!student) return;

    const guest = student.guests.find((item) => item.id === guestId);
    if (!guest) return;

    document.getElementById("edit-guest-id").value = guest.id;
    document.getElementById("edit-name").value = guest.name;
    document.getElementById("edit-relation").value = RELATIONS.includes(guest.relation)
      ? guest.relation
      : "Familiar";
    document.getElementById("edit-note").value = guest.note;
    els.editError.hidden = true;
    document.getElementById("edit-name").removeAttribute("aria-invalid");

    if (els.editDialog.open) els.editDialog.close();
    els.editDialog.showModal();

    window.setTimeout(() => {
      const input = document.getElementById("edit-name");
      input.focus();
      input.select();
    }, 60);
  }

  function handleEditSubmit(form) {
    const student = getActiveStudent();
    if (!student) {
      els.editDialog.close();
      return;
    }

    const guestId = document.getElementById("edit-guest-id").value;
    const guest = student.guests.find((item) => item.id === guestId);
    if (!guest) {
      els.editDialog.close();
      showToast("No encontramos a ese invitado.", { type: "error" });
      return;
    }

    const nameInput = document.getElementById("edit-name");
    const relationInput = document.getElementById("edit-relation");
    const noteInput = document.getElementById("edit-note");
    const name = cleanText(nameInput.value);
    const note = cleanText(noteInput.value);

    clearFormError(els.editError, nameInput);

    if (name.length < 2) {
      showFormError(els.editError, nameInput, "Escribe el nombre del invitado.");
      return;
    }

    if (name.length > GUEST_NAME_MAX) {
      showFormError(els.editError, nameInput, `El nombre no puede superar los ${GUEST_NAME_MAX} caracteres.`);
      return;
    }

    if (note.length > NOTE_MAX) {
      showFormError(els.editError, noteInput, `La nota no puede superar los ${NOTE_MAX} caracteres.`);
      return;
    }

    const duplicated = student.guests.some(
      (item) => item.id !== guest.id && normalizeKey(item.name) === normalizeKey(name)
    );
    if (duplicated) {
      showFormError(els.editError, nameInput, "Ya hay otro invitado con ese nombre en tu lista.");
      return;
    }

    guest.name = name;
    guest.relation = RELATIONS.includes(relationInput.value) ? relationInput.value : guest.relation;
    guest.note = note;
    saveData();
    refresh();
    els.editDialog.close();
    showToast("Cambios guardados.");
  }

  function selectStudent(studentId, options = {}) {
    const student = state.data.students.find((item) => item.id === studentId);
    if (!student) return;
    state.data.activeStudentId = student.id;
    saveData();
    refresh({ focus: options.focus === false ? undefined : "guest", scrollToRegister: options.scroll });
  }

  function switchStudent() {
    state.data.activeStudentId = null;
    state.lastAddedGuestId = null;
    state.celebratedFullFor = null;
    saveData();
    refresh({ focus: "identity" });
    showToast("Cerraste el pase. Tu lista sigue guardada.");
  }

  function celebrateFull(student) {
    if (state.celebratedFullFor === student.id) return;
    state.celebratedFullFor = student.id;
    showToast("¡Cupo completo! Ya tienes 19 invitados.", { duration: 6500 });
    launchConfetti();
  }

  function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#8b5cf6", "#6366f1", "#3b82f6", "#22d3ee", "#c4b5fd", "#e9d5ff"];
    const amount = 64;

    for (let i = 0; i < amount; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.setAttribute("aria-hidden", "true");
      piece.style.left = `${2 + Math.random() * 90}vw`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = `${4 + Math.random() * 5}px`;
      piece.style.height = `${7 + Math.random() * 7}px`;
      piece.style.setProperty("--duration", `${2.4 + Math.random() * 2}s`);
      piece.style.setProperty("--drift", `${Math.random() * 140 - 70}px`);
      piece.style.setProperty("--spin", `${Math.random() * 900 + 360}deg`);
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 5200);
    }
  }

  /* -------------------------------------------------------
     Formularios / errores
     ------------------------------------------------------- */

  function showFormError(errorElement, input, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
    if (input) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  }

  function clearFormError(errorElement, input) {
    if (errorElement) {
      errorElement.hidden = true;
      errorElement.textContent = "";
    }
    if (input) input.removeAttribute("aria-invalid");
  }

  /* -------------------------------------------------------
     Resumen / CSV / reset
     ------------------------------------------------------- */

  function exportCsv() {
    if (!state.data.students.length) {
      showToast("Todavía no hay invitados para exportar.", { type: "error" });
      return;
    }

    const rows = [["Alumno", "Código", "N°", "Invitado", "Vínculo", "Alergias / menú", "Registrado"]];
    const students = getSortedStudents();

    students.forEach((student) => {
      if (!student.guests.length) {
        rows.push([student.name, student.code, "", "", "", "", ""]);
        return;
      }
      student.guests.forEach((guest, index) => {
        rows.push([
          student.name,
          student.code,
          String(index + 1),
          guest.name,
          guest.relation,
          guest.note,
          formatDateTime(guest.createdAt)
        ]);
      });
    });

    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KAOS-colacion-${dateStamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast("CSV exportado. Ya puedes compartirlo con la organización.");
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function openResetDialog() {
    if (!state.data.students.length) {
      showToast("Todavía no hay registros para borrar.", { type: "error" });
      return;
    }

    const guests = countGuests();
    els.resetDialogText.textContent = `Se eliminarán ${pluralize(state.data.students.length, "pase", "pases")} y ${pluralize(guests, "invitado", "invitados")} guardados en este dispositivo. Esta acción no se puede deshacer.`;
    if (els.resetDialog.open) els.resetDialog.close();
    els.resetDialog.showModal();
  }

  function resetEverything() {
    state.data = emptyData();
    state.lastAddedGuestId = null;
    state.celebratedFullFor = null;
    saveData();
    els.resetDialog.close();
    refresh({ focus: "identity", scrollToRegister: true });
    showToast("Registro borrado. Puedes empezar de nuevo.");
  }

  /* -------------------------------------------------------
     Toasts
     ------------------------------------------------------- */

  function showToast(message, options = {}) {
    if (!els.toastRegion) return;

    if (state.toastEl) {
      window.clearTimeout(state.toastTimer);
      state.toastEl.remove();
      state.toastEl = null;
    }

    const toast = document.createElement("div");
    toast.className = `toast${options.type === "error" ? " toast--error" : ""}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${options.type === "error" ? "!" : "✓"}</span>
      <span class="toast-message">${escapeHTML(message)}</span>
      ${options.actionLabel ? `<button class="toast-action" type="button"></button>` : ""}
    `;

    if (options.actionLabel) {
      const actionButton = toast.querySelector(".toast-action");
      actionButton.textContent = options.actionLabel;
      actionButton.addEventListener("click", () => {
        dismissToast();
        if (typeof options.onAction === "function") options.onAction();
      });
    }

    els.toastRegion.appendChild(toast);
    state.toastEl = toast;

    const duration = Number(options.duration) || 4800;
    state.toastTimer = window.setTimeout(() => dismissToast(), duration);
  }

  function dismissToast() {
    if (!state.toastEl) return;
    const toast = state.toastEl;
    state.toastEl = null;
    window.clearTimeout(state.toastTimer);
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 240);
  }

  /* -------------------------------------------------------
     Eventos
     ------------------------------------------------------- */

  function bindEvents() {
    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      if (form.id === "identity-form") {
        event.preventDefault();
        handleIdentitySubmit(form);
      } else if (form.id === "guest-form") {
        event.preventDefault();
        handleGuestSubmit(form);
      } else if (form.id === "edit-form") {
        event.preventDefault();
        handleEditSubmit(form);
      }
    });

    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-close-dialog]");
      if (closeButton) {
        event.preventDefault();
        closeButton.closest("dialog")?.close();
        return;
      }

      const trigger = event.target.closest("[data-action]");
      if (!trigger) return;

      const action = trigger.dataset.action;
      const id = trigger.dataset.id;

      if (action === "select-student") {
        event.preventDefault();
        const fromSummary = Boolean(trigger.closest(".summary-panel"));
        if (fromSummary) {
          document.querySelectorAll(".summary-student[open]").forEach((item) => {
            if (!item.contains(trigger)) item.removeAttribute("open");
          });
        }
        selectStudent(id, { scroll: fromSummary });
      } else if (action === "switch-student") {
        event.preventDefault();
        switchStudent();
      } else if (action === "edit-guest") {
        event.preventDefault();
        openEditDialog(id);
      } else if (action === "remove-guest") {
        event.preventDefault();
        removeGuest(id);
      } else if (action === "export-csv") {
        event.preventDefault();
        exportCsv();
      } else if (action === "open-reset") {
        event.preventDefault();
        openResetDialog();
      }
    });

    document.addEventListener("input", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "text") return;
      input.removeAttribute("aria-invalid");
      const form = input.closest("form");
      const error = form?.querySelector(".form-error");
      if (error) {
        error.hidden = true;
        error.textContent = "";
      }
    });

    els.confirmReset.addEventListener("click", resetEverything);

    [els.editDialog, els.resetDialog].forEach((dialog) => {
      if (!dialog) return;
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      state.data = loadData();
      state.lastAddedGuestId = null;
      refresh();
      showToast("El registro se actualizó en otra pestaña.");
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.toastEl) dismissToast();
    });
  }

  /* -------------------------------------------------------
     Inicio
     ------------------------------------------------------- */

  function init() {
    bindEvents();
    refresh();
  }

  init();
})();
