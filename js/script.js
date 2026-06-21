const USE_API  = false;
const API_BASE = '/api';

let employees = [], filteredEmployees = [];
let selectedId = null, senhaVisible = false;
let currentSenha = '', currentNome = '', currentUsuario = '';
let barcodeFormat = 'CODE128';
let turnoAtivo = 'TODOS';

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

function setTurno(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  turnoAtivo = btn.dataset.t;
  renderTable(document.getElementById('searchInput').value);
}

function setFormat(fmt, btn) {
  barcodeFormat = fmt;
  document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (currentNome) renderBarcodes(currentUsuario || currentNome, currentSenha);
}

function renderBarcodes(usuario, senha) {
  const sanitize = str => barcodeFormat === 'CODE39'
    ? str.toUpperCase().replace(/[^A-Z0-9 \-\.$/+%]/g, '')
    : str;
  const opts = { format: barcodeFormat, lineColor: '#000', background: '#fff', width: 1.2, height: 50, displayValue: true, fontSize: 10, margin: 4, font: 'Courier New' };
  try {
    JsBarcode('#barcodesvg-nome', sanitize(usuario), opts);
    document.getElementById('bc-label-nome').textContent = usuario;
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
  const label = tipo === 'nome' ? (emp.usuario || emp.nome) : barcodeFormat;
  const canvas = await svgToCanvas(svgEl, tipo === 'nome' ? 'USUÁRIO' : 'SENHA', label);
  const link = document.createElement('a');
  link.download = `Barcode_${tipo === 'nome' ? (emp.usuario || emp.nome).replace(/\s+/g,'_') : 'senha'}_${barcodeFormat}.png`;
  link.href = canvas.toDataURL('image/png'); link.click();
  showToast('Código de barras baixado!');
}

async function downloadBarcodeAmbos() {
  const emp = employees.find(e => e.id === selectedId); if (!emp) return;
  const cN = await svgToCanvas(document.getElementById('barcodesvg-nome'), 'USUÁRIO', emp.usuario || emp.nome);
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
  if (!emp) { showToast('Selecione um colaborador primeiro.', true); return; }
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
  ctx.fillStyle = '#0d0f14'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(emp.nome.substring(0,22), 140, 278);
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
  document.getElementById('qrEmpty').style.display = 'none';
  document.getElementById('qrDisplay').classList.add('visible');
  document.getElementById('qrName').textContent = emp.nome;
  document.getElementById('bcName').textContent = emp.nome;
  const usuario = emp.usuario || emp.nome;
  document.getElementById('qrInfoNome').textContent = usuario;
  currentNome = emp.nome; currentSenha = emp.senha; currentUsuario = usuario;
  senhaVisible = false;
  document.getElementById('qrInfoSenha').textContent = emp.senha ? '••••••••' : '(sem senha)';
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, { text: `USUARIO:${usuario}\nSENHA:${emp.senha}`, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
  if (emp.senha) renderBarcodes(usuario, emp.senha);
  else {
    document.getElementById('barcodesvg-nome').innerHTML = '';
    document.getElementById('barcodesvg-senha').innerHTML = '';
    document.getElementById('bc-label-nome').textContent = usuario;
    document.getElementById('bc-label-senha').textContent = 'sem senha cadastrada';
    JsBarcode('#barcodesvg-nome', usuario, { format: barcodeFormat, lineColor: '#000', background: '#fff', width: 1.2, height: 50, displayValue: true, fontSize: 10, margin: 4, font: 'Courier New' });
  }
}

function toggleSenha() {
  senhaVisible = !senhaVisible;
  document.getElementById('qrInfoSenha').textContent = senhaVisible ? (currentSenha || '(sem senha)') : (currentSenha ? '••••••••' : '(sem senha)');
}

function toggleRowSenha(el, senha) {
  if (!senha) return;
  if (el.textContent === '••••••••') { el.textContent = senha; el.style.color = 'var(--accent)'; }
  else { el.textContent = '••••••••'; el.style.color = ''; }
}

async function addEmployee() {
  const turno   = document.getElementById('newTurno').value;
  const nome    = document.getElementById('newNome').value.trim().toUpperCase();
  const usuario = document.getElementById('newUsuario').value.trim();
  const senha   = document.getElementById('newSenha').value.trim();
  if (!nome) { showToast('Preencha o nome.', true); return; }
  const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
  const newEmp = { id: newId, turno, nome, usuario, senha };
  employees.push(newEmp); saveToStorage(employees);
  document.getElementById('newNome').value = '';
  document.getElementById('newUsuario').value = '';
  document.getElementById('newSenha').value = '';
  renderTable(document.getElementById('searchInput').value); updateStats();
  showToast(`${nome} adicionado!`); selectEmployee(newEmp.id);
}

function openEdit(id) {
  const emp = employees.find(e => e.id === id); if (!emp) return;
  document.getElementById('editId').value      = id;
  document.getElementById('editTurno').value   = emp.turno || 'T1';
  document.getElementById('editNome').value    = emp.nome;
  document.getElementById('editUsuario').value = emp.usuario || '';
  document.getElementById('editSenha').value   = emp.senha || '';
  document.getElementById('editModal').classList.add('open');
}

async function saveEdit() {
  const id      = parseInt(document.getElementById('editId').value);
  const turno   = document.getElementById('editTurno').value;
  const nome    = document.getElementById('editNome').value.trim().toUpperCase();
  const usuario = document.getElementById('editUsuario').value.trim();
  const senha   = document.getElementById('editSenha').value.trim();
  if (!nome) { showToast('Preencha o nome.', true); return; }
  const idx = employees.findIndex(e => e.id === id);
  employees[idx] = { ...employees[idx], turno, nome, usuario, senha };
  saveToStorage(employees);
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
  employees = employees.filter(e => e.id !== id);
  saveToStorage(employees);
  if (selectedId === id) { selectedId = null; document.getElementById('qrEmpty').style.display = ''; document.getElementById('qrDisplay').classList.remove('visible'); }
  renderTable(document.getElementById('searchInput').value); updateStats(); showToast('Colaborador excluído.');
}

const STORAGE_KEY = 'wms_employees_v2';
function loadFromStorage() { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
function saveToStorage(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const INITIAL_DATA = [
  {id:1,turno:"T1",nome:"BEATRIZ NERI NOGUEIRA",usuario:"beatriz.nogueira",senha:"N0gu3ir4_b26+"},
  {id:2,turno:"T1",nome:"CAILANE ESTEFANE DOS ANJOS SANTOS",usuario:"cailane.santos",senha:"C4il@n3#prof+"},
  {id:3,turno:"T1",nome:"EDIJANE DOS SANTOS DE JESUS",usuario:"edijane.santos",senha:"Ed!j4n3@prof*"},
  {id:4,turno:"T1",nome:"FABIANA FERREIRA LIMA DA CONCEICAO",usuario:"fabiana.lima",senha:"Fab!lim4@Prof#"},
  {id:5,turno:"T1",nome:"GILIANE DIAS BARBOSA",usuario:"giliane.dias",senha:"G!li4neB#prof*"},
  {id:6,turno:"T1",nome:"GIOVANA VITORIA DAS MERCES MORAIS",usuario:"giovana.morais",senha:"G!0v4n@prof*"},
  {id:7,turno:"T1",nome:"GUSTAVO JACKSON ARAUJO ALVES",usuario:"gustavo.alves",senha:"Gu$t4v0@prof*"},
  {id:8,turno:"T1",nome:"JADSON SOUZA CARDOSO",usuario:"jadson.cardoso",senha:"C4rd0so_Jad/"},
  {id:9,turno:"T1",nome:"JOSE EDUARDO VITORINO DA SILVA",usuario:"jose.vitorino",senha:"&du4rd0#prof24"},
  {id:10,turno:"T1",nome:"LAIANE BEATRIZ MARQUES DOS SANTOS",usuario:"laiane.santos",senha:"S1$d6f=CHn+"},
  {id:11,turno:"T1",nome:"LANA CAROLINE DE BRITO FERNANDES",usuario:"lana.caroline",senha:"L4n@prof2726*"},
  {id:12,turno:"T1",nome:"MARCIA NEVES LIMA",usuario:"marcia.lima",senha:"14042018Mc@"},
  {id:13,turno:"T1",nome:"MARIA ARAUJO MAIA",usuario:"maria.maia",senha:"M4r!@prof26*"},
  {id:14,turno:"T1",nome:"PATRICIA FERNANDES PINTO",usuario:"patricia.fernandes",senha:"f3Rn4nde$prof"},
  {id:15,turno:"T1",nome:"QUEILAINE JURITI DA SILVA",usuario:"queilaine.silva",senha:"Qu3!l@ne#prof"},
  {id:16,turno:"T1",nome:"RAILANE DA SILVA CONRADO",usuario:"railane.conrado",senha:"R4!l@n3%prof+"},
  {id:17,turno:"T1",nome:"RAYANE SOUZA BARBOSA",usuario:"rayane.souza",senha:"S0uz4R@y_prof/"},
  {id:18,turno:"T1",nome:"RODRIGO BRITO RODRIGUES",usuario:"rodrigo.brito",senha:"R0digU3$#prof/"},
  {id:19,turno:"T1",nome:"SHIRLEI OLIVEIRA PEREIRA",usuario:"shirlei.pereira",senha:"Sp3re!r4#prof"},
  {id:20,turno:"T1",nome:"THALES GABRIEL RODRIGUES TEIXEIRA",usuario:"thales.teixeira",senha:"Th4les*prof@"},
  {id:21,turno:"T1",nome:"VIVIANE OTAVIANO DOS SANTOS SILVA",usuario:"viviane.silva",senha:"V!vi4n3@prof*"},
  {id:22,turno:"T1",nome:"VIVIANE SANTOS DE OLIVEIRA",usuario:"viviane.oliveira",senha:"Ol!v1ra@Viv26"},
  {id:23,turno:"T1",nome:"WENDELL MACEDO PEREIRA",usuario:"wendell.pereira",senha:"Wm4c3d0@prof*"},
  {id:24,turno:"T2",nome:"ADRISSON PEREIRA DOS SANTOS",usuario:"adrisson.santos",senha:"J@c4r34i20*26"},
  {id:25,turno:"T2",nome:"ALESSANDRA LOPES TEIXEIRA",usuario:"alessandra.teixeira",senha:"4le$sandra#26"},
  {id:26,turno:"T2",nome:"ANA CLEIDE DE JESUS SANTOS",usuario:"ana.cleide",senha:"4n@J#prof26*"},
  {id:27,turno:"T2",nome:"ANA PALOMA SOARES SOUZA",usuario:"ana.soares",senha:""},
  {id:28,turno:"T2",nome:"ANDREIA DE CASTRO DIOGO",usuario:"andreia.castro",senha:""},
  {id:29,turno:"T2",nome:"BEATRIZ DE SOUSA DA SILVA",usuario:"beatriz.sousa",senha:""},
  {id:30,turno:"T2",nome:"BIANCA HELLEN DE OLIVEIRA DOS SANTOS",usuario:"bianca.santos",senha:"B!anc4@prof26*"},
  {id:31,turno:"T2",nome:"BRUNA SOUZA DA CRUZ",usuario:"bruna.cruz",senha:""},
  {id:32,turno:"T2",nome:"CARLA DIAS DO NASCIMENTO PEREIRA",usuario:"carla.pereira",senha:""},
  {id:157,turno:"T2",nome:"CLEIDE DA SILVA XAVIER SANTOS",usuario:"cleide.xavier",senha:"Cx@prof2026*"},
  {id:33,turno:"T2",nome:"CREUSA OLIVEIRA DA SILVA",usuario:"creuza.silva",senha:""},
  {id:34,turno:"T2",nome:"CRISPINA MATOS DO ESPIRITO SANTO",usuario:"crispina.matos",senha:"Cm@prof2026*"},
  {id:35,turno:"T2",nome:"DAMIAO JESUS DE SANTANA",usuario:"damiao.santana",senha:""},
  {id:36,turno:"T2",nome:"DANIELA GOES PINHEIRO",usuario:"daniela.pinheiro",senha:""},
  {id:37,turno:"T2",nome:"DAVI BORGES DOS SANTOS",usuario:"davi.santos",senha:""},
  {id:38,turno:"T2",nome:"DIANA BIANCA OLIVEIRA FARIA",usuario:"diana.faria",senha:"Df@prof2026*"},
  {id:39,turno:"T2",nome:"EDSON MENESES DE OLIVEIRA",usuario:"edson.oliveira",senha:""},
  {id:40,turno:"T2",nome:"ELISANGELA PEREIRA DA NATIVIDADE",usuario:"elisangela.pereira",senha:"Ep@prof2026*"},
  {id:41,turno:"T2",nome:"ELISSANDRA DE JESUS DOS SANTOS",usuario:"elissandra.santos",senha:"Es@prof2026*"},
  {id:42,turno:"T2",nome:"ELIZEU OLIVEIRA DA CONCEICAO SANTOS",usuario:"elizeu.santos",senha:"El@36166260*"},
  {id:43,turno:"T2",nome:"ERICK KAUAN DOS REIS OLIVEIRA",usuario:"erick.reis",senha:""},
  {id:44,turno:"T2",nome:"FRANCISLENE ALVES DOS SANTOS",usuario:"francislene.santos",senha:""},
  {id:45,turno:"T2",nome:"GEISIANE REGIS DA CRUZ",usuario:"geisiane.cruz",senha:""},
  {id:162,turno:"T2",nome:"GISELE DOS SANTOS CARNEIRO",usuario:"gisele.santos",senha:"Gs@prof2026*"},
  {id:46,turno:"T2",nome:"GRACE KELLY SILVA CARDOSO",usuario:"grace.cardoso",senha:""},
  {id:47,turno:"T2",nome:"HERLON SILVIO MATOS FARIAS FILHO",usuario:"herlon.farias",senha:""},
  {id:48,turno:"T2",nome:"IANILY FERREIRA DOS SANTOS",usuario:"ianily.santos",senha:""},
  {id:49,turno:"T2",nome:"INGRYD LARISSE SILVA SANTOS",usuario:"ingryd.santos",senha:""},
  {id:50,turno:"T2",nome:"ISLANDIA SANTANA PINHEIRO",usuario:"islandia.pinheiro",senha:"I$l@nD1#Prof26*"},
  {id:51,turno:"T2",nome:"IUMARA HERMENEGILDO DOS SANTOS",usuario:"iumara.santos",senha:""},
  {id:52,turno:"T2",nome:"JANE MARCIA DOS REIS TRINDADE",usuario:"jane.trindade",senha:"Ja@prof2026*"},
  {id:53,turno:"T2",nome:"JANIELE SANTOS DE JESUS",usuario:"janiele.jesus",senha:"Jj@prof2026*"},
  {id:54,turno:"T2",nome:"JAQUELINE DA CONCEICAO SANTOS",usuario:"jaqueline.conceicao",senha:""},
  {id:55,turno:"T2",nome:"JOAO FELIPE COSTA DOS SANTOS",usuario:"joao.costa",senha:"J@4o@prof2026*"},
  {id:56,turno:"T2",nome:"JOAO PEDRO BASTOS PASSOS",usuario:"joao.passos",senha:"Jº@0P@33o$2026*"},
  {id:57,turno:"T2",nome:"JOAO VICTOR FREITAS SIMOES",usuario:"joao.simoes",senha:"Jp@profarma26*"},
  {id:58,turno:"T2",nome:"JOIVANE SANTOS DO ESPIRITO SANTO",usuario:"joivane.santos",senha:""},
  {id:59,turno:"T2",nome:"JOSELMA CERQUEIRA BORGES",usuario:"joselma.borges",senha:"Jb@prof2026*"},
  {id:60,turno:"T2",nome:"JOYCILENE TEIXEIRA COUTINHO",usuario:"joycilene.coutinho",senha:"Jc@prof2026*"},
  {id:61,turno:"T2",nome:"JUCILENE NUNES DOS SANTOS",usuario:"jucilene.santos",senha:"Js@prof2026*"},
  {id:62,turno:"T2",nome:"JULIANA SANTOS DA ASSUNCAO",usuario:"juliana.assuncao",senha:"Ja@profarma26*"},
  {id:63,turno:"T2",nome:"LAIANA BARBOSA PIAGE",usuario:"laiana.piage",senha:""},
  {id:64,turno:"T2",nome:"LAIS DIAS RIBEIRO",usuario:"lais.ribeiro",senha:""},
  {id:65,turno:"T2",nome:"LEIDE GOMES DE BRITO",usuario:"leide.brito",senha:""},
  {id:66,turno:"T2",nome:"LIDIANE SOUZA DOS SANTOS",usuario:"lidiane.santos",senha:"Ls@prof2026*"},
  {id:163,turno:"T2",nome:"LORRANIA FERREIRA DA CONCEIÇÃO",usuario:"lorrania.ferreira",senha:""},
  {id:67,turno:"T2",nome:"LUIS FILIPE PIRES DE JESUS LIMA",usuario:"luis.lima",senha:""},
  {id:68,turno:"T2",nome:"MARCOS SANDRO DA SILVA DE ARAUJO",usuario:"marcos.araujo",senha:""},
  {id:69,turno:"T2",nome:"NAIARA BORGES SANTOS",usuario:"naiara.santos",senha:"N4i@ra#prof26*"},
  {id:70,turno:"T2",nome:"NATALIA SANTOS DE OLIVEIRA",usuario:"natalia.oliveira",senha:""},
  {id:71,turno:"T2",nome:"NILSON ARAUJO MOREIRA",usuario:"nilson.moreira",senha:""},
  {id:72,turno:"T2",nome:"PABLO VINICIUS DOS REIS CRUZ",usuario:"pablo.cruz",senha:""},
  {id:159,turno:"T2",nome:"PATRICIA TEIXEIRA DOS SANTOS",usuario:"patricia.santos",senha:"Ps@prof2026*"},
  {id:73,turno:"T2",nome:"PRISCILA AMORIM DOS SANTOS",usuario:"priscila.amorin",senha:"Pr!4m0rim@26"},
  {id:74,turno:"T2",nome:"PRISCILA FERREIRA DIAS",usuario:"priscila.dias",senha:""},
  {id:75,turno:"T2",nome:"RENATA SILVA FERREIRA",usuario:"renata.silva",senha:""},
  {id:76,turno:"T2",nome:"RENATA VIEIRA QUEIROZ",usuario:"renata.queiroz",senha:""},
  {id:77,turno:"T2",nome:"ROZENILZA CARLOS DOS SANTOS",usuario:"rozenilza.santos",senha:"R0z3@prof2026*"},
  {id:78,turno:"T2",nome:"RUTH HELLEN DE ANDRADE MAURICIO",usuario:"ruth.hellen",senha:"Ru7h@ndr43#*"},
  {id:79,turno:"T2",nome:"SARA SANTOS DE OLIVEIRA",usuario:"sara.santos",senha:""},
  {id:80,turno:"T2",nome:"SIMONE BARBOSA SA",usuario:"simone.sa",senha:"Ss@prof2026*"},
  {id:81,turno:"T2",nome:"TANEIDE OLIVEIRA BRITO",usuario:"taneide.brito",senha:"Tb@prof2026*"},
  {id:82,turno:"T2",nome:"TAUAN VITOR DIAS SANTOS",usuario:"tauan.santos",senha:""},
  {id:83,turno:"T2",nome:"VANESSA DA SILVA SANTOS",usuario:"vanessa.santos",senha:"V@n@profarma26*"},
  {id:84,turno:"T2",nome:"VIVIANE CONCEICAO DOS SANTOS",usuario:"viviane.santos",senha:"C0nc3ica0@26*"},
  {id:158,turno:"T2",nome:"YASMIM THAINE ARAUJO DOS SANTOS",usuario:"yasmim.araujo",senha:"Ya@prof2026*"},
  {id:85,turno:"T3",nome:"ADAILTON GONCALVES",usuario:"adailton.goncalves",senha:""},
  {id:86,turno:"T3",nome:"AGNALDO NASCIMENTO FERREIRA",usuario:"agnaldo.ferreira",senha:""},
  {id:87,turno:"T3",nome:"ALEXANDRE ROGER SILVA DOS SANTOS",usuario:"alexandre.santos",senha:""},
  {id:88,turno:"T3",nome:"AMELIA RIBEIRO DOS SANTOS",usuario:"amelia.santos",senha:""},
  {id:89,turno:"T3",nome:"ANA BEATRIZ BISPO SANTANA",usuario:"ana.santana",senha:""},
  {id:90,turno:"T3",nome:"ANA CRISTINA SANTOS BORGES",usuario:"ana.cborges",senha:""},
  {id:91,turno:"T3",nome:"ANA LUISA OLIVEIRA DOS SANTOS",usuario:"ana.santos",senha:""},
  {id:92,turno:"T3",nome:"ANA LUISA PAIXAO DOS SANTOS",usuario:"ana.paixao",senha:""},
  {id:93,turno:"T3",nome:"ANA PAULA SAMPAIO MACEDO",usuario:"ana.macedo",senha:""},
  {id:94,turno:"T3",nome:"ANA PAULA SOARES BORGES DA COSTA",usuario:"ana.costa",senha:"Ac@prof2026*"},
  {id:95,turno:"T3",nome:"ANDREIA FREITAS DOS SANTOS",usuario:"andreia.santos",senha:""},
  {id:96,turno:"T3",nome:"ANDRESSA KELLY SANTANA REGIS",usuario:"andressa.regis",senha:""},
  {id:97,turno:"T3",nome:"ANTONIO LUIDE MACHADO DO ROSARIO",usuario:"antonio.rosario",senha:"Ant!@r0s4r1o"},
  {id:98,turno:"T3",nome:"ARIANE SOUZA DE SANTOS",usuario:"ariane.santos",senha:""},
  {id:99,turno:"T3",nome:"BEATRIZ FEITOSA DE JESUS",usuario:"beatriz.feitosa",senha:""},
  {id:100,turno:"T3",nome:"CAIO HENRIQUE DE JESUS DOS SANTOS",usuario:"caio.santos",senha:""},
  {id:101,turno:"T3",nome:"CARLA MONIQUE LIMA DOS SANTOS",usuario:"carla.monique",senha:""},
  {id:102,turno:"T3",nome:"CATIUCIA MENEZES DE MACEDO",usuario:"catiucia.macedo",senha:""},
  {id:103,turno:"T3",nome:"CLEILTON CLIMACO BARRETO",usuario:"cleiton.barreto",senha:""},
  {id:104,turno:"T3",nome:"CRISTIANE DE SOUZA MENEZES",usuario:"cristiane.menezes",senha:""},
  {id:105,turno:"T3",nome:"DAISLANE DA SILVA RAMOS",usuario:"----> CD PARAIBA",senha:""},
  {id:106,turno:"T3",nome:"DAVID FERREIRA DOS SANTOS",usuario:"david.ferreira",senha:""},
  {id:107,turno:"T3",nome:"DEBORA FERREIRA DOS SANTOS",usuario:"debora.santos",senha:""},
  {id:108,turno:"T3",nome:"DEIVIDE SANTOS DA SILVA",usuario:"deivide.silva",senha:""},
  {id:109,turno:"T3",nome:"EDNAMARA DOS SANTOS SILVA",usuario:"ednamara.silva",senha:""},
  {id:110,turno:"T3",nome:"EDNOLIA COSTA DOS SANTOS",usuario:"ednolia.santos",senha:""},
  {id:111,turno:"T3",nome:"ELIANE PEREIRA SANTOS",usuario:"eliane.santos",senha:""},
  {id:112,turno:"T3",nome:"EMILLY SANTOS SENA DE SOUZA",usuario:"emilly.souza",senha:""},
  {id:113,turno:"T3",nome:"ERIC PLINIO OLIVEIRA DA SILVA",usuario:"eric.silva",senha:""},
  {id:114,turno:"T3",nome:"ERICA DO CARMOS FERREIRA",usuario:"erica.ferreira",senha:"Ef@prof2026*"},
  {id:115,turno:"T3",nome:"ERICA NASCIMENTO SANTOS JESUINO SILVA",usuario:"erica.silva",senha:""},
  {id:116,turno:"T3",nome:"ERICLES SOARES BARBOSA",usuario:"ericles.barbosa",senha:""},
  {id:117,turno:"T3",nome:"FELIPE AUGUSTO OLIVEIRA DA CONCEICAO",usuario:"felipe.augusto",senha:""},
  {id:118,turno:"T3",nome:"FELIPE SANTOS NUNES",usuario:"felipe.nunes",senha:""},
  {id:119,turno:"T3",nome:"FERNANDA ALVES DO NASCIMENTO",usuario:"fernanda.nascimento",senha:""},
  {id:120,turno:"T3",nome:"GABRIEL SANTANA SANTOS",usuario:"gabriel.santana",senha:""},
  {id:121,turno:"T3",nome:"GERLANDIA DOS SANTOS FORTUNATO",usuario:"gerlandia.fortunato",senha:""},
  {id:122,turno:"T3",nome:"GILSON ALVES DE BRITO",usuario:"gilson.brito",senha:""},
  {id:123,turno:"T3",nome:"HIAGO FREITAS DOS SANTOS",usuario:"hiago.santos",senha:""},
  {id:124,turno:"T3",nome:"INAIANA LARA DA SILVA FERREIRA",usuario:"inaiana.ferreira",senha:""},
  {id:125,turno:"T3",nome:"JAMILI PALMEIRA DA SILVA",usuario:"jamili.silva",senha:""},
  {id:126,turno:"T3",nome:"JANAINA DA SILVA BARBOSA",usuario:"janaina.barbosa",senha:""},
  {id:127,turno:"T3",nome:"JEANDERSON DA ROCHA SANTOS",usuario:"jeanderson.santos",senha:""},
  {id:128,turno:"T3",nome:"JESSICA CRISTINA ROCHA DOS SANTOS",usuario:"jessica.rocha",senha:"Jr@prof2026*"},
  {id:129,turno:"T3",nome:"JOHN CARLOS SANTANA DOS SANTOS",usuario:"john.santos",senha:""},
  {id:130,turno:"T3",nome:"JOILMA CERQUEIRA DOS SANTOS",usuario:"joilma.santos",senha:"J0!lm4@1972*"},
  {id:131,turno:"T3",nome:"JOILSON BARROS DOS SANTOS",usuario:"joilson.santos",senha:""},
  {id:132,turno:"T3",nome:"JOYCILENE DOS SANTOS PIRES",usuario:"joycilene.pires",senha:""},
  {id:133,turno:"T3",nome:"LEONARDO GIOVANNI PITA CAMARDELLI",usuario:"leonardo.camardelli",senha:""},
  {id:161,turno:"T3",nome:"LUANA BARBOSA DOS SANTOS",usuario:"luana.barbosa",senha:"Lb@prof2026*"},
  {id:134,turno:"T3",nome:"LUIS CARLOS XAVIER DA SILVA",usuario:"luis.carlos",senha:""},
  {id:135,turno:"T3",nome:"MARCIO LUIS SILVA",usuario:"marcio.luis",senha:"M4rc1o!@Silv4"},
  {id:136,turno:"T3",nome:"MARCOS VINICIUS DA SILVA CERQUEIRA",usuario:"marcos.cerqueira",senha:""},
  {id:137,turno:"T3",nome:"MARCUS VINICIUS MOREIRA SANTOS",usuario:"marcus.moreira",senha:""},
  {id:138,turno:"T3",nome:"MERCIA ROCHA DOS SANTOS",usuario:"mercia.rocha",senha:""},
  {id:139,turno:"T3",nome:"MISLAINE RIBEIRO DE LIMA",usuario:"mislaine.lima",senha:""},
  {id:140,turno:"T3",nome:"NAIARA DA SILVA BICALHO",usuario:"naiara.bicalho",senha:""},
  {id:141,turno:"T3",nome:"PATRICIA SILVA FERREIRA",usuario:"patricia.silvaf",senha:"Ps@prof2026*"},
  {id:142,turno:"T3",nome:"PATRICK DE OLIVEIRA",usuario:"patrick.oliveira",senha:""},
  {id:143,turno:"T3",nome:"RAFAELA SANTOS DA SILVA PIRES",usuario:"rafaela.pires",senha:""},
  {id:144,turno:"T3",nome:"REBECA DO ESPIRITO SANTO SILVA",usuario:"rebeca.silva",senha:""},
  {id:145,turno:"T3",nome:"RENATA DE MEDEIROS GOMES",usuario:"renata.gomes",senha:""},
  {id:146,turno:"T3",nome:"RENATA VALQUIRIA SANTOS",usuario:"renata.valquiria",senha:""},
  {id:147,turno:"T3",nome:"RICHARD GABRIEL SILVA DE OLIVEIRA",usuario:"richard.oliveira",senha:""},
  {id:148,turno:"T3",nome:"SAMUEL SANTOS SILVA",usuario:"samuel.santos",senha:""},
  {id:149,turno:"T3",nome:"SAMYRA BARROS NEVES",usuario:"samyra.neves",senha:""},
  {id:150,turno:"T3",nome:"SARA CRISTINA DOS SANTOS BARBOSA",usuario:"sara.barbosa",senha:""},
  {id:151,turno:"T3",nome:"TAIANA ELLEN DOS SANTOS COSTA",usuario:"taiana.costa",senha:"Tc@prof2026*"},
  {id:152,turno:"T3",nome:"THAUANY MARTINS GOMES",usuario:"thauany.gomes",senha:""},
  {id:153,turno:"T3",nome:"THAYNA DE JESUS DA SILVA",usuario:"thayna.silva",senha:""},
  {id:154,turno:"T3",nome:"VITOR DE JESUS DOS SANTOS",usuario:"vitor.jesus",senha:""},
  {id:155,turno:"T3",nome:"VITORIA SOUZA MOURA NASCIMENTO",usuario:"vitoria.moura",senha:""},
  {id:156,turno:"T3",nome:"WILMA SANTANA SOARES",usuario:"wilma.soares",senha:""}
];

const TURNO_COLORS = { T1: '#6366f1', T2: '#22c55e', T3: '#f59e0b' };

async function init() {
  employees = loadFromStorage() || INITIAL_DATA;
  if (!loadFromStorage()) saveToStorage(employees);
  renderTable(); updateStats();
}

function renderTable(query = '') {
  const tbody = document.getElementById('tableBody');
  let filtered = [...employees];
  if (turnoAtivo !== 'TODOS') filtered = filtered.filter(e => e.turno === turnoAtivo);
  if (query) filtered = filtered.filter(e =>
    e.nome.toLowerCase().includes(query.toLowerCase()) ||
    (e.usuario || '').toLowerCase().includes(query.toLowerCase())
  );
  filteredEmployees = filtered;
  if (filteredEmployees.length === 0) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="5" style="color:var(--muted)">Nenhum colaborador encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = filteredEmployees.map((e, i) => {
    const tColor = TURNO_COLORS[e.turno] || 'var(--muted)';
    const usuario = e.usuario || e.nome;
    const temSenha = e.senha && e.senha.trim();
    const senhaCell = temSenha
      ? `<span class="senha-mask" onclick="event.stopPropagation();toggleRowSenha(this,'${e.senha.replace(/'/g,"\\'")}')" >••••••••</span>`
      : `<span style="color:var(--muted);font-size:11px;font-style:italic">sem senha</span>`;
    return `
    <tr onclick="selectEmployee(${e.id})" class="${e.id === selectedId ? 'active' : ''}" data-id="${e.id}">
      <td class="td-turno"><span class="turno-badge" style="background:${tColor}22;color:${tColor}">${e.turno || '—'}</span></td>
      <td class="td-nome">${e.nome}</td>
      <td class="td-usuario"><span style="font-family:\'Space Mono\',monospace;font-size:12px">${usuario}</span></td>
      <td class="td-senha">${senhaCell}</td>
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
    </tr>`;
  }).join('');
}

function updateStats() {
  document.getElementById('stat-total').textContent = employees.length;
  document.getElementById('stat-t1').textContent    = employees.filter(e => e.turno === 'T1').length;
  document.getElementById('stat-t2').textContent    = employees.filter(e => e.turno === 'T2').length;
  document.getElementById('stat-t3').textContent    = employees.filter(e => e.turno === 'T3').length;
}

document.getElementById('searchInput').addEventListener('input', e => renderTable(e.target.value));
['newNome','newUsuario','newSenha'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addEmployee(); }));
document.getElementById('editNome').addEventListener('keydown',  e => { if (e.key === 'Enter') saveEdit(); });
document.getElementById('editSenha').addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 2800);
}

init();
