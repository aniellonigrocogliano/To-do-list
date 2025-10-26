let todos = [];
let testoFiltro = "";
let statusFilter = "all";

const input = document.getElementById("todo-input");
const addButton = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const filterInput = document.getElementById("filter-input");
const filterBtn = document.getElementById("filter-btn");
const showAllBtn = document.getElementById("show-all");
const showDoneBtn = document.getElementById("show-done");
const showNotDoneBtn = document.getElementById("show-not-done");
const downloadBtn = document.getElementById("download-list");
const uploadBtn = document.getElementById("upload-list");
const uploadInput = document.getElementById("upload-input");

async function apiFetchTodos(){const r=await fetch('/api/todos');return r.ok?r.json():[];}
async function apiAddTodo(t){const r=await fetch('/api/todos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t})});return r.ok?r.json():null;}
async function apiToggleDone(i){const r=await fetch(`/api/todos/${i}/done`,{method:'PATCH'});return r.ok?r.json():null;}
async function apiDeleteTodo(i){const r=await fetch(`/api/todos/${i}`,{method:'DELETE'});return r.ok;}

// EXPORT / IMPORT
async function scaricaLista(){const r=await fetch('/api/export');if(!r.ok)return alert('Errore download');const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='todo-list.json';a.click();URL.revokeObjectURL(u);}
async function importaListaDaFile(f){const t=await f.text();const r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:t})});if(!r.ok){const e=await r.json().catch(()=>({}));return alert('Errore import: '+(e.error||'sconosciuto'));}const raw=await apiFetchTodos();todos=raw.map(t=>({id:t.id,nome:t.text,stato:t.done,createdAt:t.createdAt,completedAt:t.completedAt}));mostraLista();alert('Lista importata ✅');}

async function aggiungiTodo(){const n=input.value.trim();if(!n)return alert('Scrivi qualcosa!');const nu=await apiAddTodo(n);if(nu){todos.push({id:nu.id,nome:nu.text,stato:nu.done,createdAt:nu.createdAt,completedAt:nu.completedAt});input.value='';mostraLista();}}
async function eliminaTodo(i){const o=await apiDeleteTodo(i);if(o){todos=todos.filter(t=>t.id!==i);mostraLista();}}
async function toggleStato(i){const a=await apiToggleDone(i);if(!a)return;const x=todos.findIndex(t=>t.id===i);if(x!==-1){todos[x].stato=a.done;todos[x].completedAt=a.completedAt;mostraLista();}}

function mostraLista(){todoList.innerHTML='';let v=todos.filter(t=>t.nome.toLowerCase().includes(testoFiltro.toLowerCase()));if(statusFilter==='done')v=v.filter(t=>t.stato);if(statusFilter==='not-done')v=v.filter(t=>!t.stato);if(v.length===0)return todoList.innerHTML="<li class='list-group-item text-center text-muted'>Nessuna attività</li>";v.forEach(t=>{const l=document.createElement('li');l.className='list-group-item d-flex flex-column';l.innerHTML=`<div class='d-flex justify-content-between align-items-center'><div class='d-flex align-items-center gap-3'><button class='btn btn-light btn-sm' data-action='toggle' data-id='${t.id}'>${t.stato?"<i class='fa-solid fa-check text-success'></i>":"<i class='fa-solid fa-xmark text-danger'></i>"}</button><div class='${t.stato?"text-decoration-line-through text-muted":""}'>${escapeHTML(t.nome)}</div></div><button class='btn btn-danger btn-sm' data-action='delete' data-id='${t.id}'><i class='fa-solid fa-trash'></i> Elimina</button></div><div class='mt-2 small text-muted'><strong>Creata:</strong> ${formatDate(t.createdAt)} | <strong>Completata:</strong> ${t.completedAt?formatDate(t.completedAt):'—'}</div>`;todoList.appendChild(l);});}
function formatDate(i){if(!i)return'—';return new Date(i).toLocaleString('it-IT');}
function escapeHTML(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));}
function aggiornaFiltro(){testoFiltro=filterInput.value.trim();mostraLista();}
function setStatusFilter(f){statusFilter=f;mostraLista();}

todoList.addEventListener('click',async e=>{const b=e.target.closest('button[data-action]');if(!b)return;const i=Number(b.dataset.id);if(b.dataset.action==='toggle')await toggleStato(i);if(b.dataset.action==='delete')await eliminaTodo(i);});
addButton.addEventListener('click',aggiungiTodo);
input.addEventListener('keydown',e=>{if(e.key==='Enter')aggiungiTodo();});
filterBtn.addEventListener('click',aggiornaFiltro);
filterInput.addEventListener('input',aggiornaFiltro);
showAllBtn.addEventListener('click',()=>setStatusFilter('all'));
showDoneBtn.addEventListener('click',()=>setStatusFilter('done'));
showNotDoneBtn.addEventListener('click',()=>setStatusFilter('not-done'));
downloadBtn.addEventListener('click',scaricaLista);
uploadBtn.addEventListener('click',()=>uploadInput.click());
uploadInput.addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;await importaListaDaFile(f);uploadInput.value='';});
document.addEventListener('DOMContentLoaded',async()=>{const raw=await apiFetchTodos();todos=raw.map(t=>({id:t.id,nome:t.text,stato:t.done,createdAt:t.createdAt,completedAt:t.completedAt}));mostraLista();});
