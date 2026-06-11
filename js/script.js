const USE_API  = false;
const API_BASE = '/api';

let employees = [], filteredEmployees = [];
let selectedId = null, senhaVisible = false;
let currentSenha = '', currentNome = '';
let barcodeFormat = 'CODE128';

function switchTab(tab, btn) {
document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
btn.classList.add('active');
document.getElementById('tab-' + tab).classList.add('active');
}

function setFormat(fmt, btn) {
barcodeFormat = fmt;
document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
if (currentNome) renderBarcodes(currentNome, currentSenha);
}

function renderBarcodes(nome, senha) {
const sanitize = str => barcodeFormat === 'CODE39'
    ? str.toUpperCase().replace(/[^A-Z0-9 \-\.$/+%]/g, '')
    : str;

const opts = { format: barcodeFormat, lineColor: '#000', background: '#fff', width: 1.2, height: 50, displayValue: true, fontSize: 10, margin: 4, font: 'Courier New' };

try {
    JsBarcode('#barcodesvg-nome', sanitize(nome), opts);
    document.getElementById('bc-label-nome').textContent = nome;
} catch {
    document.getElementById('barcodesvg-nome').innerHTML = '';
    document.getElementById('bc-label-nome').textContent = 'Formato incompatível';
}

try {
    JsBarcode('#barcodesvg-senha', sanitize(senha), opts);
    document.getElementById('bc-label-senha').textContent = '••••••••';
} catch {
    document.getElementById('barcodesvg-senha').innerHTML = '';
    document.getElementById('bc-label-senha').textContent = 'Formato incompatível';
}
}

function svgToCanvas(svgEl, titulo, subtitulo) {
return new Promise(resolve => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
    const pad = 16, headerH = 38, footerH = 24;
    const canvas = document.createElement('canvas');
    canvas.width  = img.width  + pad * 2;
    canvas.height = img.height + headerH + footerH + pad;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F5C842'; ctx.fillRect(0, 0, canvas.width, headerH);
    ctx.fillStyle = '#0D0F14'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
    ctx.fillText('WMS — ' + titulo, canvas.width / 2, 24);
    ctx.drawImage(img, pad, headerH);
    ctx.fillStyle = '#6B7280'; ctx.font = '11px Arial';
    ctx.fillText(subtitulo, canvas.width / 2, headerH + img.height + footerH);
    URL.revokeObjectURL(url);
    resolve(canvas);
    };
    img.src = url;
});
}

async function downloadBarcode(tipo) {
const emp = employees.find(e => e.id === selectedId); if (!emp) return;
const svgEl = document.getElementById(tipo === 'nome' ? 'barcodesvg-nome' : 'barcodesvg-senha');
const canvas = await svgToCanvas(svgEl, tipo === 'nome' ? 'USUÁRIO' : 'SENHA', tipo === 'nome' ? emp.nome : barcodeFormat);
const link = document.createElement('a');
link.download = `Barcode_${tipo === 'nome' ? emp.nome.replace(/\s+/g,'_') : 'senha'}_${barcodeFormat}.png`;
link.href = canvas.toDataURL('image/png'); link.click();
showToast('Código de barras baixado!');
}

async function downloadBarcodeAmbos() {
const emp = employees.find(e => e.id === selectedId); if (!emp) return;
const cN = await svgToCanvas(document.getElementById('barcodesvg-nome'),  'USUÁRIO', emp.nome);
const cS = await svgToCanvas(document.getElementById('barcodesvg-senha'), 'SENHA', barcodeFormat);
const gap = 20, final = document.createElement('canvas');
final.width = Math.max(cN.width, cS.width); final.height = cN.height + cS.height + gap;
const ctx = final.getContext('2d');
ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, final.width, final.height);
ctx.drawImage(cN, (final.width - cN.width) / 2, 0);
ctx.drawImage(cS, (final.width - cS.width) / 2, cN.height + gap);
const link = document.createElement('a');
link.download = `Barcode_completo_${emp.nome.replace(/\s+/g,'_')}.png`;
link.href = final.toDataURL('image/png'); link.click();
showToast('Arquivo completo baixado!');
}

function printBarcodes() {
const emp = employees.find(e => e.id === selectedId);
if (!emp) { showToast('Selecione um funcionário primeiro.', true); return; }
const sN = document.getElementById('barcodesvg-nome');
const sS = document.getElementById('barcodesvg-senha');
const pN = document.getElementById('print-svg-nome');
const pS = document.getElementById('print-svg-senha');
pN.innerHTML = sN.innerHTML; pS.innerHTML = sS.innerHTML;
['viewBox','width','height'].forEach(a => {
    if (sN.getAttribute(a)) pN.setAttribute(a, sN.getAttribute(a));
    if (sS.getAttribute(a)) pS.setAttribute(a, sS.getAttribute(a));
});
document.getElementById('print-emp-name').textContent = emp.nome;
document.getElementById('print-area').style.display = 'block';
window.print();
setTimeout(() => { document.getElementById('print-area').style.display = 'none'; }, 600);
}

function downloadQR() {
const emp = employees.find(e => e.id === selectedId); if (!emp) return;
const canvas = document.querySelector('#qrcode canvas'); if (!canvas) return;
const w = document.createElement('canvas'); w.width = 280; w.height = 320;
const ctx = w.getContext('2d');
ctx.fillStyle = '#fff'; ctx.fillRect(0,0,280,320);
ctx.fillStyle = '#f5c842'; ctx.fillRect(0,0,280,40);
ctx.fillStyle = '#0d0f14'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
ctx.fillText('WMS — CREDENCIAIS', 140, 26);
ctx.drawImage(canvas, 40, 50, 200, 200);
ctx.fillStyle = '#0d0f14'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(emp.nome, 140, 278);
ctx.fillStyle = '#6b7280'; ctx.font = '12px sans-serif'; ctx.fillText('Usuário do Sistema', 140, 298);
const link = document.createElement('a');
link.download = `QR_${emp.nome.replace(/\s+/g,'_')}.png`;
link.href = w.toDataURL('image/png'); link.click();
showToast('QR Code baixado!');
}

function selectEmployee(id) {
selectedId = id;
const emp = employees.find(e => e.id === id); if (!emp) return;
document.querySelectorAll('tbody tr').forEach(r => r.classList.toggle('active', parseInt(r.dataset.id) === id));
document.querySelectorAll('.btn-icon').forEach(b => b.classList.remove('active-btn'));
document.getElementById('qrEmpty').style.display = 'none';
document.getElementById('qrDisplay').classList.add('visible');
document.getElementById('qrName').textContent     = emp.nome;
document.getElementById('bcName').textContent     = emp.nome;
document.getElementById('qrInfoNome').textContent = emp.nome;
currentNome = emp.nome; currentSenha = emp.senha; senhaVisible = false;
document.getElementById('qrInfoSenha').textContent = '••••••••';
const qrContainer = document.getElementById('qrcode');
qrContainer.innerHTML = '';
new QRCode(qrContainer, { text: `USUARIO:${emp.nome}\nSENHA:${emp.senha}`, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
renderBarcodes(emp.nome, emp.senha);
}

function toggleSenha() {
senhaVisible = !senhaVisible;
document.getElementById('qrInfoSenha').textContent = senhaVisible ? currentSenha : '••••••••';
}

function toggleRowSenha(el, senha) {
if (el.textContent === '••••••••') { el.textContent = senha; el.style.color = 'var(--accent)'; }
else { el.textContent = '••••••••'; el.style.color = ''; }
}

async function addEmployee() {
const nome = document.getElementById('newNome').value.trim();
const senha = document.getElementById('newSenha').value.trim();
if (!nome || !senha) { showToast('Preencha nome e senha.', true); return; }
const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
const newEmp = { id: newId, nome, senha };
if (USE_API) {
    try { const res = await fetch(`${API_BASE}/save`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nome,senha}) }); const saved = await res.json(); employees.push(saved); }
    catch { showToast('Erro ao salvar.', true); return; }
} else { employees.push(newEmp); saveToStorage(employees); }
document.getElementById('newNome').value = ''; document.getElementById('newSenha').value = '';
renderTable(document.getElementById('searchInput').value); updateStats();
showToast(`${nome} adicionado!`); selectEmployee(newEmp.id);
}

function openEdit(id) {
const emp = employees.find(e => e.id === id); if (!emp) return;
document.getElementById('editId').value = id; document.getElementById('editNome').value = emp.nome; document.getElementById('editSenha').value = emp.senha;
document.getElementById('editModal').classList.add('open');
}

async function saveEdit() {
const id = parseInt(document.getElementById('editId').value);
const nome = document.getElementById('editNome').value.trim();
const senha = document.getElementById('editSenha').value.trim();
if (!nome || !senha) { showToast('Preencha todos os campos.', true); return; }
if (USE_API) {
    try { await fetch(`${API_BASE}/save?id=${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nome,senha}) }); }
    catch { showToast('Erro ao salvar.', true); return; }
}
const idx = employees.findIndex(e => e.id === id);
employees[idx] = { ...employees[idx], nome, senha };
if (!USE_API) saveToStorage(employees);
closeModal(); renderTable(document.getElementById('searchInput').value);
if (selectedId === id) selectEmployee(id); showToast('Atualizado!');
}

function closeModal(e) {
if (e && e.target !== document.getElementById('editModal')) return;
document.getElementById('editModal').classList.remove('open');
}

async function deleteEmployee(id) {
const emp = employees.find(e => e.id === id);
if (!confirm(`Excluir ${emp?.nome}?`)) return;
if (USE_API) {
    try { await fetch(`${API_BASE}/save?id=${id}`, { method: 'DELETE' }); }
    catch { showToast('Erro ao excluir.', true); return; }
}
employees = employees.filter(e => e.id !== id);
if (!USE_API) saveToStorage(employees);
if (selectedId === id) { selectedId = null; document.getElementById('qrEmpty').style.display = ''; document.getElementById('qrDisplay').classList.remove('visible'); }
renderTable(document.getElementById('searchInput').value); updateStats(); showToast('Funcionário excluído.');
}

const STORAGE_KEY = 'wms_employees';
function loadFromStorage() { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
function saveToStorage(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const INITIAL_DATA = [
{id:1,nome:"Adrisson Santos",senha:"J@c4r34i20*26"},{id:2,nome:"Alessandra T",senha:"4le$sandra#26"},
{id:3,nome:"Ana Santos",senha:"4n@J#prof26*"},{id:4,nome:"Antonio Rosário (Luide)",senha:"Ant!@r0s4r1o"},
{id:5,nome:"Beatriz Nogueira",senha:"N0gu3ir4_b26+"},{id:6,nome:"Bianca Oliveira",senha:"B!anc4@prof26*"},
{id:7,nome:"Cailane Anjos",senha:"C4il@n3#prof*"},{id:8,nome:"Damila Lima",senha:"L!m4kSia@prof*"},
{id:9,nome:"Edijane Santos",senha:"Ed!j4n3@prof*"},{id:10,nome:"Elizeu Santos",senha:"El@36166260*"},
{id:11,nome:"Fabiana Lima",senha:"Fab!lim4@Prof#ok"},{id:12,nome:"Giliane Barbosa",senha:"G!li4neB#prof*"},
{id:13,nome:"Giovana Morais",senha:"G!0v4n@prof*"},{id:14,nome:"Gustavo Alves",senha:"Gu$t4v0@prof*"},
{id:15,nome:"Jadson Cardoso",senha:"C4rd0so_Jad/"},{id:16,nome:"Joao Costa",senha:"J@4o@prof2026*"},
{id:17,nome:"Joilma Santos",senha:"J0!lm4@1972*"},{id:18,nome:"Jose Vitorino",senha:"&du4rd0#prof26"},
{id:19,nome:"Laiane Beatriz",senha:"S1$d6f=CHn+"},{id:20,nome:"Lana Caroline",senha:"L4n@prof2726*"},
{id:21,nome:"Larissa Carvalho",senha:"L4r!s$a#prof*"},{id:22,nome:"Lucas Henrique",senha:"LHES#prof2026"},
{id:23,nome:"Marcia Neves",senha:"14042018Mc@"},{id:24,nome:"Marcio Silva",senha:"M4rc1o!@Silv4"},
{id:25,nome:"Maria Maia",senha:"M4r!@prof26*"},{id:26,nome:"Naiara Santos",senha:"N4i@ra#prof26*"},
{id:27,nome:"Patricia Fernandes",senha:"f3Rn4nde$prof"},{id:28,nome:"Priscila Santos",senha:"Pr!4m0rim@26"},
{id:29,nome:"Queilane Silva",senha:"Qu3!l@ne#prof"},{id:30,nome:"Railane Conrado",senha:"R4!l@n3%prof+"},
{id:31,nome:"Rayane Souza",senha:"S0uz4R@y_prof/"},{id:32,nome:"Rodrigo Rodrigues",senha:"R0digU3$#prof/"},
{id:33,nome:"Shirlei Pereira",senha:"Sp3re!r4#prof"},{id:34,nome:"Thales Teixeira",senha:"Th4les*prof@"},
{id:35,nome:"Viviane Conceição",senha:"C0nc3ica0@26*"},{id:36,nome:"Viviane Oliveira",senha:"Ol!v1ra@Viv26"},
{id:37,nome:"Viviane Otaviano",senha:"V!vi4n3@prof*"},{id:38,nome:"Wendell Pereira",senha:"Wm4c3d0@prof*"}
];

async function init() {
if (USE_API) {
    try { const res = await fetch(`${API_BASE}/employees`); employees = await res.json(); }
    catch { showToast('Erro ao conectar à API. Usando dados locais.', true); employees = loadFromStorage() || INITIAL_DATA; }
} else {
    employees = loadFromStorage() || INITIAL_DATA;
    if (!loadFromStorage()) saveToStorage(employees);
}
renderTable(); updateStats();
}

function renderTable(query = '') {
const tbody = document.getElementById('tableBody');
filteredEmployees = query ? employees.filter(e => e.nome.toLowerCase().includes(query.toLowerCase())) : [...employees];
if (filteredEmployees.length === 0) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="4" style="color:var(--muted)">Nenhum funcionário encontrado.</td></tr>`;
    document.getElementById('stat-filtered').textContent = 0; return;
}
tbody.innerHTML = filteredEmployees.map((e, i) => `
    <tr onclick="selectEmployee(${e.id})" class="${e.id === selectedId ? 'active' : ''}" data-id="${e.id}">
    <td class="td-num">${String(i+1).padStart(2,'0')}</td>
    <td class="td-nome">${e.nome}</td>
    <td class="td-senha"><span class="senha-mask" onclick="event.stopPropagation();toggleRowSenha(this,'${e.senha.replace(/'/g,"\\'")}')">••••••••</span></td>
    <td><div class="td-actions">
        <button class="btn-icon ${e.id === selectedId ? 'active-btn' : ''}" onclick="event.stopPropagation();selectEmployee(${e.id})" title="Gerar códigos">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M14 17h3M17 14v3"/></svg> QR
        </button>
        <button class="btn-icon" onclick="event.stopPropagation();openEdit(${e.id})" title="Editar">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon danger" onclick="event.stopPropagation();deleteEmployee(${e.id})" title="Excluir">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        </button>
    </div></td>
    </tr>`).join('');
document.getElementById('stat-filtered').textContent = filteredEmployees.length;
}

function updateStats() {
document.getElementById('stat-total').textContent    = employees.length;
document.getElementById('stat-filtered').textContent = filteredEmployees.length || employees.length;
}

document.getElementById('searchInput').addEventListener('input', e => renderTable(e.target.value));
['newNome','newSenha'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addEmployee(); }));
document.getElementById('editNome').addEventListener('keydown',  e => { if (e.key === 'Enter') saveEdit(); });
document.getElementById('editSenha').addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });

function showToast(msg, isError = false) {
const t = document.getElementById('toast');
t.textContent = msg; t.className = 'toast show' + (isError ? ' error' : '');
setTimeout(() => { t.className = 'toast'; }, 2800);
}

init();