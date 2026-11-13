const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0,10);
const seedTools = [
  {id:1,code:'ALT-001',name:'Multimeter Digital',category:'Alat Ukur',total:8},
  {id:2,code:'ALT-002',name:'Tang Crimping',category:'Perkakas',total:10},
  {id:3,code:'ALT-003',name:'Laptop Praktik',category:'Komputer',total:12},
  {id:4,code:'ALT-004',name:'Kabel LAN Tester',category:'Jaringan',total:6}
];
let tools = JSON.parse(localStorage.getItem('bengkel_tools') || 'null') || seedTools;
let loans = JSON.parse(localStorage.getItem('bengkel_loans') || '[]');
let history = JSON.parse(localStorage.getItem('bengkel_history') || '[]');
function save(){localStorage.setItem('bengkel_tools',JSON.stringify(tools));localStorage.setItem('bengkel_loans',JSON.stringify(loans));localStorage.setItem('bengkel_history',JSON.stringify(history));}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function available(t){return t.total-loans.filter(l=>l.toolId===t.id).reduce((n,l)=>n+l.qty,0);}
function toolName(id){return tools.find(t=>t.id===id)?.name||'Alat dihapus';}
function isLate(l){return l.due<today;}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2600);}
function emptyRow(cols,msg){return `<tr><td colspan="${cols}" class="empty">${msg}</td></tr>`;}
function render(){
  $('statTools').textContent=tools.length;
  $('statAvailable').textContent=tools.reduce((n,t)=>n+available(t),0);
  $('statBorrowed').textContent=loans.reduce((n,l)=>n+l.qty,0);
  $('statLate').textContent=loans.filter(isLate).length;
  $('dashboardLoans').innerHTML=loans.length?loans.map(l=>`<tr><td><b>${esc(l.borrower)}</b></td><td>${esc(toolName(l.toolId))}</td><td>${l.qty}</td><td>${l.date}</td><td>${l.due}</td><td>${status(l)}</td></tr>`).join(''):emptyRow(6,'Belum ada peminjaman aktif.');
  const q=$('toolSearch').value.toLowerCase(),cat=$('toolCategory').value;
  const filtered=tools.filter(t=>(t.name.toLowerCase().includes(q)||t.code.toLowerCase().includes(q))&&(!cat||t.category===cat));
  $('toolsTable').innerHTML=filtered.length?filtered.map(t=>`<tr><td>${esc(t.code)}</td><td><b>${esc(t.name)}</b></td><td>${esc(t.category)}</td><td>${t.total}</td><td>${t.total-available(t)}</td><td><span class="badge ${available(t)>0?'available':'late'}">${available(t)}</span></td><td><button class="btn secondary small-btn" onclick="editTool(${t.id})">Ubah</button> <button class="btn danger small-btn" onclick="deleteTool(${t.id})">Hapus</button></td></tr>`).join(''):emptyRow(7,'Data alat tidak ditemukan.');
  $('loanTool').innerHTML='<option value="">Pilih alat...</option>'+tools.map(t=>`<option value="${t.id}" ${available(t)===0?'disabled':''}>${esc(t.name)} — tersedia ${available(t)}</option>`).join('');
  $('loansTable').innerHTML=loans.length?loans.map(l=>`<tr><td><b>${esc(l.borrower)}</b></td><td>${esc(l.unit)}</td><td>${esc(toolName(l.toolId))}</td><td>${l.qty}</td><td>${l.date}</td><td>${l.due}</td><td>${status(l)}</td><td><button class="btn primary small-btn" onclick="returnLoan(${l.id})">Kembalikan</button></td></tr>`).join(''):emptyRow(8,'Belum ada alat yang dipinjam.');
  const hq=$('historySearch').value.toLowerCase();
  const rows=history.filter(h=>h.borrower.toLowerCase().includes(hq)||h.tool.toLowerCase().includes(hq));
  $('historyTable').innerHTML=rows.length?rows.slice().reverse().map(h=>`<tr><td><b>${esc(h.borrower)}</b></td><td>${esc(h.tool)}</td><td>${h.qty}</td><td>${h.date}</td><td>${h.returnDate}</td><td><span class="badge returned">Dikembalikan</span></td></tr>`).join(''):emptyRow(6,'Belum ada riwayat pengembalian.');
}
function status(l){return isLate(l)?'<span class="badge late">Terlambat</span>':'<span class="badge borrowed">Dipinjam</span>';}
function showPage(page){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(page+'Page').classList.add('active');document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.page===page));$('pageTitle').textContent={dashboard:'Dashboard',alat:'Data Alat',peminjaman:'Peminjaman',riwayat:'Riwayat'}[page];}
document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showPage(a.dataset.page);}));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
$('toolSearch').addEventListener('input',render);$('toolCategory').addEventListener('change',render);$('historySearch').addEventListener('input',render);
$('loanDate').value=today;let due=new Date();due.setDate(due.getDate()+7);$('dueDate').value=due.toISOString().slice(0,10);
$('loanForm').addEventListener('submit',e=>{e.preventDefault();const id=Number($('loanTool').value),qty=Number($('loanQty').value),t=tools.find(x=>x.id===id);if(!t)return toast('Silakan pilih alat.');if(qty<1||qty>available(t))return toast('Jumlah melebihi stok yang tersedia.');if($('dueDate').value<$('loanDate').value)return toast('Batas pengembalian tidak boleh sebelum tanggal pinjam.');loans.push({id:Date.now(),borrower:$('borrower').value.trim(),unit:$('unit').value.trim(),toolId:id,qty,date:$('loanDate').value,due:$('dueDate').value,purpose:$('purpose').value});save();e.target.reset();$('loanDate').value=today;$('dueDate').value=due.toISOString().slice(0,10);render();toast('Peminjaman berhasil dicatat.');});
window.returnLoan=id=>{const i=loans.findIndex(l=>l.id===id);if(i<0)return;const l=loans.splice(i,1)[0];history.push({borrower:l.borrower,tool:toolName(l.toolId),qty:l.qty,date:l.date,returnDate:today});save();render();toast('Pengembalian berhasil dicatat.');};
const dialog=$('toolDialog');
function openTool(t){$('toolForm').reset();$('editToolId').value=t?.id||'';$('dialogTitle').textContent=t?'Ubah Data Alat':'Tambah Alat';$('toolCode').value=t?.code||'';$('toolName').value=t?.name||'';$('toolCat').value=t?.category||'Alat Ukur';$('toolTotal').value=t?.total||1;dialog.showModal();}
$('addToolBtn').addEventListener('click',()=>openTool());$('closeDialog').addEventListener('click',()=>dialog.close());$('cancelDialog').addEventListener('click',()=>dialog.close());
$('toolForm').addEventListener('submit',e=>{e.preventDefault();const id=Number($('editToolId').value),total=Number($('toolTotal').value),borrowed=id?tools.find(t=>t.id===id).total-available(tools.find(t=>t.id===id)):0;if(total<1||total<borrowed)return toast('Total alat tidak boleh kurang dari jumlah yang sedang dipinjam.');const data={code:$('toolCode').value.trim(),name:$('toolName').value.trim(),category:$('toolCat').value,total};if(id)Object.assign(tools.find(t=>t.id===id),data);else tools.push({id:Date.now(),...data});save();dialog.close();render();toast('Data alat berhasil disimpan.');});
window.editTool=id=>openTool(tools.find(t=>t.id===id));
window.deleteTool=id=>{if(loans.some(l=>l.toolId===id))return toast('Alat sedang dipinjam, tidak dapat dihapus.');if(!confirm('Hapus data alat ini?'))return;tools=tools.filter(t=>t.id!==id);save();render();toast('Data alat dihapus.');};
render();
