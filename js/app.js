// =============================
// VARIABILI GLOBALI
// =============================
let todos = [];
let nextId = 1;
let filtroTermine = "";

const STORAGE_KEY = "todo_lista";

// Riferimenti agli elementi HTML (se esistono)
const input       = document.getElementById("todo-input");
const addButton   = document.getElementById("add-btn");
const todoList    = document.getElementById("todo-list");
const filterInput = document.getElementById("filter-input");
const filterBtn   = document.getElementById("filter-btn");

// (Opzionali) Download/Upload se presenti in pagina
const downloadBtn = document.getElementById("download-list");
const uploadBtn   = document.getElementById("upload-list");
const uploadInput = document.getElementById("upload-input");

// =============================
// SALVATAGGIO SU LOCAL STORAGE
// =============================
function salvaDati() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ todos, nextId })
  );
}

function caricaDati() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    todos = [];
    nextId = 1;
    return;
  }

  try {
    const parsed = JSON.parse(data);
    todos = Array.isArray(parsed.todos) ? parsed.todos : [];
    // Calcola il prossimo ID in modo robusto
    if (typeof parsed.nextId === "number" && parsed.nextId > 0) {
      nextId = parsed.nextId;
    } else {
      const maxId = todos.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
      nextId = maxId + 1;
    }
  } catch (err) {
    console.error("Errore nel caricamento dei dati dal localStorage:", err);
    todos = [];
    nextId = 1;
  }
}

// =============================
// FUNZIONI BASE
// =============================
function creaTodo(nome) {
  return {
    id: nextId++,   // ID crescente
    nome: nome,     // Testo attività
    stato: false    // false = non completata, true = completata
  };
}

function aggiungiTodo() {
  if (!input) return;
  const nome = input.value.trim();
  if (nome === "") {
    alert("Scrivi qualcosa prima di aggiungere un'attività!");
    return;
  }

  const nuovo = creaTodo(nome);
  todos.push(nuovo);

  input.value = "";
  salvaDati();
  mostraLista();
}

function eliminaTodo(id) {
  todos = todos.filter(t => t.id !== id);
  salvaDati();
  mostraLista();
}

function toggleStato(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.stato = !todo.stato;
    salvaDati();
    mostraLista();
  }
}

// =============================
// RENDER LISTA + FILTRO
// =============================
function mostraLista() {
  if (!todoList) return;
  todoList.innerHTML = "";

  // Caso 1: non esistono attività salvate
  if (todos.length === 0) {
    todoList.innerHTML = `
      <li class="list-group-item text-center text-muted">
        Nessuna attività salvata, aggiungila o carica il file JSON
      </li>`;
    return;
  }

  // Applica il filtro testuale (case-insensitive)
  const termine = (filtroTermine || "").toLowerCase();
  const visibili = todos.filter(t =>
    termine === "" ? true : String(t.nome).toLowerCase().includes(termine)
  );

  // Caso 2: ci sono attività, ma nessuna corrisponde al filtro
  if (visibili.length === 0) {
    todoList.innerHTML = `
      <li class="list-group-item text-center text-muted">
        Nessuna attività trovata
      </li>`;
    return;
  }

  // Rendering elementi filtrati
  visibili.forEach(todo => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center justify-content-between";

    const icona = todo.stato
      ? `<i class="fa-solid fa-check text-success"></i>` // spunta verde
      : `<i class="fa-solid fa-xmark text-danger"></i>`; // X rossa

    li.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-light btn-sm" title="Cambia stato" data-action="toggle" data-id="${todo.id}">
          ${icona}
        </button>
        <div class="text-body ${todo.stato ? 'text-decoration-line-through text-muted' : ''}">
          ${escapeHTML(String(todo.nome))}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" title="Elimina" data-action="delete" data-id="${todo.id}">
        <i class="fa-solid fa-trash me-1"></i> Elimina
      </button>
    `;

    todoList.appendChild(li);
  });
}

// Delegazione eventi sulla lista per toggle/elimina
if (todoList) {
  todoList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.getAttribute("data-id"));
    const action = btn.getAttribute("data-action");
    if (action === "toggle") toggleStato(id);
    if (action === "delete") eliminaTodo(id);
  });
}

// =============================
// FILTRO TESTUALE
// =============================
function applicaFiltro() {
  if (!filterInput) return;
  filtroTermine = filterInput.value.trim();
  mostraLista();
}

// =============================
// UTIL
// =============================
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// =============================
// EVENTI
// =============================
document.addEventListener("DOMContentLoaded", () => {
  caricaDati();   // Carica dal localStorage
  mostraLista();  // Mostra subito lo stato iniziale
});

if (addButton) {
  addButton.addEventListener("click", aggiungiTodo);
}
if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") aggiungiTodo();
  });
}

if (filterBtn && filterInput) {
  filterBtn.addEventListener("click", applicaFiltro);
  filterInput.addEventListener("input", applicaFiltro);
  filterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applicaFiltro();
    if (e.key === "Escape") {
      filterInput.value = "";
      filtroTermine = "";
      mostraLista();
    }
  });
}

// =============================
// (Opzionale) DOWNLOAD / UPLOAD
// =============================
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const data = JSON.stringify({ todos, nextId }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todo-list.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (uploadBtn && uploadInput) {
  uploadBtn.addEventListener("click", () => uploadInput.click());

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported.todos)) {
          todos  = imported.todos.map(t => ({
            id: Number(t.id),
            nome: String(t.nome ?? ""),
            stato: Boolean(t.stato)
          }));
          // Ripristina nextId in modo sicuro
          const maxId = todos.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
          nextId = typeof imported.nextId === "number" && imported.nextId > maxId
            ? imported.nextId
            : maxId + 1;

          salvaDati();
          mostraLista();
        } else if (Array.isArray(imported)) {
          // compatibilità: file con array diretto di todo
          todos = imported.map(t => ({
            id: Number(t.id),
            nome: String(t.nome ?? ""),
            stato: Boolean(t.stato)
          }));
          const maxId = todos.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
          nextId = maxId + 1;
          salvaDati();
          mostraLista();
        } else {
          alert("File JSON non valido.");
        }
      } catch (err) {
        console.error(err);
        alert("Errore nella lettura del file JSON.");
      } finally {
        // reset input per poter ricaricare lo stesso file
        uploadInput.value = "";
      }
    };
    reader.readAsText(file);
  });
}
// =============================
// DOWNLOAD / UPLOAD LISTA
// =============================
/**
 * Scarica la lista come file JSON
 */
function downloadLista() {
  if (todos.length === 0) {
    alert("Non ci sono attività da scaricare!");
    return;
  }

  const data = JSON.stringify({ todos, nextId }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "todo-list.json";
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Carica una lista da file JSON
 */
function uploadLista(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      // Accetta sia oggetti {todos, nextId} sia array puro
      if (Array.isArray(imported)) {
        todos = imported;
        nextId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1;
      } else if (Array.isArray(imported.todos)) {
        todos = imported.todos;
        nextId = imported.nextId || (todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1);
      } else {
        alert("Il file JSON non è valido!");
        return;
      }

      salvaDati();
      mostraLista();
      alert("Lista caricata correttamente!");
    } catch (err) {
      console.error(err);
      alert("Errore durante il caricamento del file JSON.");
    }
  };

  reader.readAsText(file);
}

// =============================
// EVENTI DOWNLOAD / UPLOAD
// =============================
if (downloadBtn) {
  downloadBtn.addEventListener("click", downloadLista);
}

if (uploadBtn && uploadInput) {
  uploadBtn.addEventListener("click", () => uploadInput.click());
  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) uploadLista(file);
  });
}