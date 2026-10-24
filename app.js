/* Studyflow — local-first student study tracker */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "studyflow-data-v1";
  const THEME_KEY = "studyflow-theme-v1";
  const COLORS = [
    {bg:"#efedff",color:"#7666e8",icon:"∑"},
    {bg:"#e5f7f0",color:"#35ae86",icon:"⌘"},
    {bg:"#fff0e4",color:"#e89950",icon:"⚗"},
    {bg:"#ffeaf3",color:"#d977aa",icon:"✎"},
    {bg:"#e8f2ff",color:"#5795d8",icon:"◎"},
    {bg:"#fcecf0",color:"#cf728a",icon:"✦"}
  ];
  const todayISO = () => localDateISO(new Date());
  function localDateISO(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function addDays(iso, n) { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+n); return localDateISO(d); }
  function prettyDate(iso, opts={month:"short",day:"numeric"}) { if(!iso)return "No date"; const d=new Date(`${iso}T12:00:00`); return Number.isNaN(d.getTime())?"Invalid date":d.toLocaleDateString(undefined,opts); }
  function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`; }
  const starter = () => {
    const today=todayISO();
    const subjects=[
      {id:"math",name:"Mathematics",goal:5,color:0,createdAt:Date.now()},
      {id:"science",name:"Physics",goal:4,color:1,createdAt:Date.now()},
      {id:"writing",name:"Literature",goal:3,color:2,createdAt:Date.now()}
    ];
    const tasks=[
      {id:uid(),title:"Complete calculus practice set",subjectId:"math",dueDate:addDays(today,1),priority:"high",estimate:45,notes:"Focus on integration by parts.",completed:false,createdAt:Date.now()-4000},
      {id:uid(),title:"Review Newton's laws",subjectId:"science",dueDate:addDays(today,2),priority:"medium",estimate:30,notes:"Summarize the three laws.",completed:false,createdAt:Date.now()-3000},
      {id:uid(),title:"Read assigned chapter",subjectId:"writing",dueDate:today,priority:"medium",estimate:25,notes:"Write down key themes.",completed:false,createdAt:Date.now()-2000},
      {id:uid(),title:"Submit lab report draft",subjectId:"science",dueDate:addDays(today,-1),priority:"high",estimate:60,notes:"Check formatting before submission.",completed:false,createdAt:Date.now()-1000},
      {id:uid(),title:"Organize lecture notes",subjectId:"math",dueDate:addDays(today,4),priority:"low",estimate:20,notes:"",completed:true,completedAt:today,createdAt:Date.now()-5000}
    ];
    const sessions=[
      {id:uid(),subjectId:"math",minutes:45,date:addDays(today,-1),notes:"Practice problems",createdAt:Date.now()-86400000},
      {id:uid(),subjectId:"science",minutes:35,date:today,notes:"Newton's laws revision",createdAt:Date.now()-1800000},
      {id:uid(),subjectId:"writing",minutes:25,date:addDays(today,-2),notes:"Chapter notes",createdAt:Date.now()-172800000}
    ];
    return {subjects,tasks,sessions,createdAt:Date.now(),version:1};
  };
  function validData(data) {
    if(!data||typeof data!=="object"||!Array.isArray(data.subjects)||!Array.isArray(data.tasks)||!Array.isArray(data.sessions)) return false;
    if(data.subjects.length>500||data.tasks.length>10000||data.sessions.length>20000) return false;
    const ids=new Set(data.subjects.map(s=>s.id));
    return data.subjects.every(s=>typeof s.id==="string"&&typeof s.name==="string"&&s.name.trim().length>0&&s.name.length<=80) &&
      data.tasks.every(t=>typeof t.id==="string"&&typeof t.title==="string"&&t.title.length<=120&&ids.has(t.subjectId)&&["low","medium","high"].includes(t.priority)&&typeof t.completed==="boolean") &&
      data.sessions.every(s=>typeof s.id==="string"&&ids.has(s.subjectId)&&Number.isFinite(Number(s.minutes))&&Number(s.minutes)>0&&Number(s.minutes)<=720);
  }
  function loadData() {
    try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){const parsed=JSON.parse(raw);if(validData(parsed))return parsed;throw new Error("The saved workspace data is invalid.");} }
    catch(e){console.error("Studyflow data load:",e);toast("Saved data couldn't be read. A fresh workspace was started.",true);}
    return starter();
  }
  let data=loadData(), currentView="overview", timerDuration=25*60, timerRemaining=25*60, timerInterval=null, timerRunning=false, timerMode="focus", sessionLogged=false;
  function save() { try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true;}catch(e){toast("Could not save data. Check browser storage space or privacy settings.",true);console.error(e);return false;} }
  function subjectFor(id) { return data.subjects.find(s=>s.id===id)||{id:"",name:"Unknown subject",color:0}; }
  function colorFor(subject) { return COLORS[(Number(subject.color)||0)%COLORS.length]; }
  function toast(message,error=false) { const el=document.createElement("div");el.className=`toast${error?" error":""}`;el.textContent=message;$("#toast-region").append(el);setTimeout(()=>el.remove(),3400); }
  function setTodayLabels() {
    const now=new Date();$("#today-label").textContent=now.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});$("#long-date").textContent=now.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});$("#session-date").value=todayISO();
  }
  function navTo(view) {
    if(!$("#view-"+view))return;
    currentView=view;$$(".view").forEach(el=>el.classList.toggle("active",el.id==="view-"+view));
    $$(".nav-link[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    const label=({overview:"Overview",tasks:"Assignments",sessions:"Study sessions",subjects:"Subjects",settings:"Settings & data"})[view];
    $("#crumb-current").textContent=label;$("#sidebar").classList.remove("open");
    if(view==="tasks")renderTasks();if(view==="sessions")renderSessions();if(view==="subjects")renderSubjects();if(view==="settings"){}
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function dueText(task) {
    if(task.completed)return "Completed";
    const diff=Math.round((new Date(`${task.dueDate}T12:00:00`)-new Date(`${todayISO()}T12:00:00`))/86400000);
    if(diff<0)return `${Math.abs(diff)}d overdue`;if(diff===0)return "Today";if(diff===1)return "Tomorrow";return prettyDate(task.dueDate);
  }
  function taskOrder(a,b) {
    const rank={high:0,medium:1,low:2};
    return Number(a.completed)-Number(b.completed)||a.dueDate.localeCompare(b.dueDate)||rank[a.priority]-rank[b.priority];
  }
  function renderOverview() {
    const today=todayISO(), weekStart=addDays(today,-((new Date(`${today}T12:00:00`).getDay()+6)%7)), weekEnd=addDays(weekStart,6);
    const sessions=data.sessions.filter(s=>s.date>=weekStart&&s.date<=weekEnd);
    const mins=sessions.reduce((sum,s)=>sum+Number(s.minutes),0);
    $("#week-hours").textContent=(mins/60).toFixed(mins%60===0?0:1);
    const completed=data.tasks.filter(t=>t.completed).length;
    $("#completed-count").textContent=completed;
    $("#completion-rate").textContent=`${data.tasks.length?Math.round(completed/data.tasks.length*100):0}%`;
    $("#completion-progress").style.width=`${data.tasks.length?completed/data.tasks.length*100:0}%`;
    $("#upcoming-count").textContent=data.tasks.filter(t=>!t.completed&&t.dueDate>=today&&t.dueDate<=addDays(today,7)).length;
    const activeDates=new Set(data.sessions.map(s=>s.date));
    let streak=0, cursor=today;
    if(!activeDates.has(cursor))cursor=addDays(cursor,-1);
    while(activeDates.has(cursor)&&streak<366){streak++;cursor=addDays(cursor,-1);}
    $("#streak-count").textContent=streak;
    $("#streak-dots").innerHTML=Array.from({length:7},(_,i)=>`<span class="${i>=7-Math.min(streak,7)?"on":""}"></span>`).join("");
    const daily=Array.from({length:7},(_,i)=>{const day=addDays(weekStart,i);return {day,mins:sessions.filter(s=>s.date===day).reduce((sum,s)=>sum+Number(s.minutes),0)};});
    $("#mini-bars").innerHTML=daily.map(d=>`<span title="${prettyDate(d.day)}: ${(d.mins/60).toFixed(1)}h" style="height:${Math.max(3,Math.min(21,d.mins/240*21))}px"></span>`).join("");
    $("#weekly-chart").innerHTML=daily.map(d=>`<div class="chart-bar-wrap" title="${prettyDate(d.day)}: ${(d.mins/60).toFixed(1)} hours"><span class="chart-bar ${d.day===today?"today":""}" style="height:${Math.max(3,Math.min(100,d.mins/240*100))}%"></span></div>`).join("");
    $("#chart-total").textContent=`${(mins/60).toFixed(1)}h total`;
    const priorities=data.tasks.filter(t=>!t.completed).sort(taskOrder).slice(0,4);
    $("#priority-list").innerHTML=priorities.map(t=>{const s=subjectFor(t.subjectId),c=colorFor(s);return `<div class="priority-item"><input class="task-check" type="checkbox" data-complete="${t.id}" aria-label="Mark ${escapeHTML(t.title)} complete"><div><div class="priority-title">${escapeHTML(t.title)}</div><div class="priority-meta"><span class="subject-tag">${escapeHTML(s.name)}</span><span class="priority-pill ${t.priority}">${capitalize(t.priority)} priority</span></div></div><span class="priority-due ${t.dueDate<=today?"urgent":""}">${escapeHTML(dueText(t))}</span></div>`;}).join("");
    $("#priority-empty").classList.toggle("hidden",priorities.length>0);$("#priority-list").classList.toggle("hidden",priorities.length===0);
    const subjects=data.subjects.slice(0,4);
    $("#subject-progress-list").innerHTML=subjects.map(s=>{const c=colorFor(s),target=Math.max(1,Number(s.goal)||1),hours=data.sessions.filter(x=>x.subjectId===s.id&&x.date>=weekStart&&x.date<=weekEnd).reduce((sum,x)=>sum+Number(x.minutes),0)/60,pct=Math.min(100,Math.round(hours/target*100));return `<div class="subject-progress-item"><div class="subject-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div><div><div class="subject-name">${escapeHTML(s.name)}</div><div class="subject-detail">${hours.toFixed(1)} of ${target}h weekly goal</div><div class="subject-bar"><span style="width:${pct}%;--subject-color:${c.color}"></span></div></div><div class="subject-percent">${pct}%</div></div>`;}).join("");
    $("#subject-empty").classList.toggle("hidden",subjects.length>0);$("#subject-progress-list").classList.toggle("hidden",subjects.length===0);
    $("#nav-task-count").textContent=data.tasks.filter(t=>!t.completed).length;
  }
  function renderTasks() {
    const query=$("#task-search").value.trim().toLowerCase(),filter=$("#task-filter").value,sort=$("#task-sort").value,today=todayISO();
    let tasks=data.tasks.filter(t=>`${t.title} ${t.notes||""} ${subjectFor(t.subjectId).name}`.toLowerCase().includes(query));
    tasks=tasks.filter(t=>filter==="all"?true:filter==="active"?!t.completed:filter==="completed"?t.completed:!t.completed&&t.dueDate<today);
    tasks.sort(sort==="priority"?(a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]||taskOrder(a,b)):sort==="created"?(a,b)=>b.createdAt-a.createdAt:taskOrder);
    $("#all-task-list").innerHTML=tasks.map(t=>{const s=subjectFor(t.subjectId),c=colorFor(s);return `<div class="task-row"><div class="task-row-title"><input class="task-check" type="checkbox" data-complete="${t.id}" ${t.completed?"checked":""} aria-label="Mark ${escapeHTML(t.title)} ${t.completed?"incomplete":"complete"}"><div><strong class="${t.completed?"done":""}">${escapeHTML(t.title)}</strong>${t.notes?`<small>${escapeHTML(t.notes)}</small>`:""}</div></div><div class="table-subject"><span class="subject-icon" style="background:${c.bg};color:${c.color}">${c.icon}</span>${escapeHTML(s.name)}</div><span class="due-label ${!t.completed&&t.dueDate<today?"overdue":""}">${escapeHTML(dueText(t))}</span><span class="priority-pill ${t.priority}">${capitalize(t.priority)}</span><span class="status-pill ${t.completed?"completed":"active"}">${t.completed?"Completed":"In progress"}</span><div class="row-actions"><div class="row-action-buttons"><button class="mini-action" data-edit="${t.id}" aria-label="Edit ${escapeHTML(t.title)}">Edit</button><button class="mini-action" data-delete="${t.id}" aria-label="Delete ${escapeHTML(t.title)}">×</button></div></div></div>`;}).join("");
    $("#tasks-empty").classList.toggle("hidden",tasks.length>0);$("#all-task-list").classList.toggle("hidden",tasks.length===0);
  }
  function renderSubjects() {
    $("#subject-cards").innerHTML=data.subjects.map(s=>{const c=colorFor(s),tasks=data.tasks.filter(t=>t.subjectId===s.id),done=tasks.filter(t=>t.completed).length,mins=data.sessions.filter(x=>x.subjectId===s.id).reduce((sum,x)=>sum+Number(x.minutes),0),goal=Math.max(1,Number(s.goal)||1),hours=mins/60,pct=Math.min(100,Math.round(hours/goal*100));return `<article class="subject-card"><div class="subject-card-top"><div class="subject-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div><div class="subject-card-actions"><button data-subject-edit="${s.id}" aria-label="Edit ${escapeHTML(s.name)}">Edit</button><button data-subject-delete="${s.id}" aria-label="Delete ${escapeHTML(s.name)}">Delete</button></div></div><h3>${escapeHTML(s.name)}</h3><p>${tasks.length} tasks · ${done} completed</p><div class="subject-bar"><span style="width:${pct}%;--subject-color:${c.color}"></span></div><div class="subject-card-bottom"><span>${hours.toFixed(1)} / ${goal}h this overall</span><strong>${pct}%</strong></div></article>`;}).join("");
    $("#subjects-empty").classList.toggle("hidden",data.subjects.length>0);$("#subject-cards").classList.toggle("hidden",data.subjects.length===0);
    const options=data.subjects.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("");
    $("#task-subject").innerHTML=options;$("#session-subject").innerHTML=options;
  }
  function renderSessions() {
    const recent=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,8);
    $("#recent-sessions").innerHTML=recent.map(s=>{const sub=subjectFor(s.subjectId),c=colorFor(sub);return `<div class="session-entry"><div class="subject-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div><div class="session-entry-main"><strong>${escapeHTML(sub.name)}</strong><small>${prettyDate(s.date,{month:"short",day:"numeric",year:"numeric"})}${s.notes?` · ${escapeHTML(s.notes)}`:""}</small></div><span class="session-minutes">${Number(s.minutes)}m</span></div>`;}).join("");
    $("#sessions-empty").classList.toggle("hidden",recent.length>0);$("#recent-sessions").classList.toggle("hidden",recent.length===0);
    if(!data.subjects.length)$("#session-subject").innerHTML='<option value="">Add a subject first</option>';
  }
  function renderAll(){renderSubjects();renderOverview();if(currentView==="tasks")renderTasks();if(currentView==="sessions")renderSessions();}
  function escapeHTML(value) { return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
  function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}
  function openTaskModal(task=null) {
    if(!data.subjects.length){toast("Add a subject before creating a task.",true);openSubjectPrompt();return;}
    $("#task-form").reset();$("#task-id").value=task?.id||"";$("#task-title").value=task?.title||"";$("#task-due").value=task?.dueDate||todayISO();$("#task-priority").value=task?.priority||"medium";$("#task-estimate").value=task?.estimate||45;$("#task-notes").value=task?.notes||"";
    $("#task-subject").innerHTML=data.subjects.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("");$("#task-subject").value=task?.subjectId||data.subjects[0].id;
    $("#modal-title").textContent=task?"Edit task":"Add a task";$("#task-save").textContent=task?"Save changes":"Save task";$("#modal-backdrop").classList.remove("hidden");setTimeout(()=>$("#task-title").focus(),30);
  }
  function closeModal(){$("#modal-backdrop").classList.add("hidden");}
  function completeTask(id,checked){const t=data.tasks.find(t=>t.id===id);if(!t)return;t.completed=checked;if(checked)t.completedAt=todayISO();else delete t.completedAt;save();renderAll();toast(checked?"Task completed. Nice work!":"Task moved back to in progress.");}
  function deleteTask(id){const t=data.tasks.find(t=>t.id===id);if(!t)return;if(!confirm(`Delete "${t.title}"? This can't be undone.`))return;data.tasks=data.tasks.filter(x=>x.id!==id);save();renderAll();toast("Task deleted.");}
  function openSubjectPrompt(existing=null) {
    const name=prompt(existing?"Rename subject:":"Subject name (e.g. Biology):",existing?.name||"");if(name===null)return;
    const clean=name.trim();if(!clean||clean.length>80){toast("Subject name must be between 1 and 80 characters.",true);return;}
    if(data.subjects.some(s=>s.name.toLowerCase()===clean.toLowerCase()&&s.id!==existing?.id)){toast("A subject with that name already exists.",true);return;}
    if(existing){existing.name=clean;}else{data.subjects.push({id:uid(),name:clean,goal:3,color:data.subjects.length%COLORS.length,createdAt:Date.now()});}
    save();renderAll();toast(existing?"Subject updated.":"Subject added.");
  }
  function deleteSubject(id) {
    const subject=subjectFor(id),taskCount=data.tasks.filter(t=>t.subjectId===id).length,sessionCount=data.sessions.filter(s=>s.subjectId===id).length;
    if(!confirm(`Delete "${subject.name}" and its ${taskCount} task(s) and ${sessionCount} study session(s)? This can't be undone.`))return;
    data.subjects=data.subjects.filter(s=>s.id!==id);data.tasks=data.tasks.filter(t=>t.subjectId!==id);data.sessions=data.sessions.filter(s=>s.subjectId!==id);save();renderAll();toast("Subject and its records deleted.");
  }
  function saveTask(event) {
    event.preventDefault();
    const id=$("#task-id").value,title=$("#task-title").value.trim(),subjectId=$("#task-subject").value,dueDate=$("#task-due").value,priority=$("#task-priority").value,estimate=Number($("#task-estimate").value),notes=$("#task-notes").value.trim();
    if(!title||title.length>120||!data.subjects.some(s=>s.id===subjectId)||!dueDate||!["low","medium","high"].includes(priority)||!Number.isFinite(estimate)||estimate<5||estimate>1440){toast("Please check the task details and try again.",true);return;}
    if(id){const task=data.tasks.find(t=>t.id===id);if(!task)return;Object.assign(task,{title,subjectId,dueDate,priority,estimate,notes});}
    else data.tasks.push({id:uid(),title,subjectId,dueDate,priority,estimate,notes,completed:false,createdAt:Date.now()});
    save();closeModal();renderAll();toast(id?"Task updated.":"Task added to your plan.");
  }
  function addSession({subjectId,minutes,date,notes=""}) {
    if(!data.subjects.some(s=>s.id===subjectId)||!Number.isInteger(Number(minutes))||Number(minutes)<1||Number(minutes)>720||!date||date>addDays(todayISO(),1)){toast("Check the subject, date, and duration (1–720 minutes).",true);return false;}
    data.sessions.push({id:uid(),subjectId,minutes:Number(minutes),date,notes:notes.trim().slice(0,160),createdAt:Date.now()});save();renderAll();return true;
  }
  function renderTimer(){const min=Math.floor(timerRemaining/60),sec=timerRemaining%60;$("#timer-display").textContent=`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;const progress=timerDuration?1-timerRemaining/timerDuration:0;$("#timer-ring").style.background=`conic-gradient(var(--purple) ${progress*360}deg,#ece9ff ${progress*360}deg)`;$("#timer-start").textContent=timerRunning?"Ⅱ Pause":timerRemaining===0?"↻ Start again":timerRemaining===timerDuration?"▶ Start focus":"▶ Resume";$("#timer-mode-title").textContent=timerMode==="focus"?"Time to focus":timerMode==="short"?"Take a breather":"Recharge & reset";$("#timer-subtitle").textContent=timerMode==="focus"?"One thing at a time. You've got this.":"Rest is part of the process, too.";$("#timer-mode-caption").textContent=timerMode==="focus"?"MINUTES LEFT":"BREAK TIME";}
  function setTimerMode(mode,minutes) {clearInterval(timerInterval);timerInterval=null;timerRunning=false;timerMode=mode;timerDuration=minutes*60;timerRemaining=timerDuration;sessionLogged=false;$$(".timer-mode").forEach(b=>b.classList.toggle("selected",b.dataset.mode===mode));renderTimer();}
  function startTimer() {
    if(timerRunning){clearInterval(timerInterval);timerInterval=null;timerRunning=false;renderTimer();return;}
    if(timerRemaining===0){timerRemaining=timerDuration;sessionLogged=false;}
    timerRunning=true;renderTimer();
    timerInterval=setInterval(()=>{timerRemaining--;if(timerRemaining<=0){timerRemaining=0;clearInterval(timerInterval);timerInterval=null;timerRunning=false;renderTimer();if(timerMode==="focus"&&!sessionLogged){sessionLogged=true;if(data.subjects.length){const subjectId=$("#session-subject").value||data.subjects[0].id;addSession({subjectId,minutes:Math.round(timerDuration/60),date:todayISO(),notes:"Focus timer session"});toast("Focus session complete — time logged!");}else toast("Focus session complete! Add a subject to log your time.");}else toast("Timer complete. Take a moment for yourself.");if("Notification"in window&&Notification.permission==="granted")new Notification("Studyflow timer",{body:"Your timer is complete."});}else renderTimer();},1000);
  }
  function exportData() {
    const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`studyflow-backup-${todayISO()}.json`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Backup exported.");
  }
  function importData(file) {
    if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!validData(parsed))throw new Error("This file doesn't look like a valid Studyflow backup.");if(!confirm("Import this backup and replace the data in this browser?"))return;data={subjects:parsed.subjects,tasks:parsed.tasks,sessions:parsed.sessions,createdAt:parsed.createdAt||Date.now(),version:1};save();renderAll();toast("Backup imported successfully.");}catch(e){toast(e.message||"Could not import this file.",true);}finally{$("#import-file").value="";}};reader.onerror=()=>toast("Could not read that file.",true);reader.readAsText(file);
  }
  function resetData(){if(!confirm("Reset all subjects, tasks, and study sessions? This cannot be undone. Export a backup first if you need one."))return;data={subjects:[],tasks:[],sessions:[],createdAt:Date.now(),version:1};save();renderAll();toast("Workspace reset.");}
  function init() {
    setTodayLabels();$("#daily-quote").textContent=["The secret of getting ahead is getting started.","It always seems impossible until it's done.","Great things are done by a series of small things brought together.","Success is the sum of small efforts, repeated day in and day out."][new Date().getDay()%4];
    if(localStorage.getItem(THEME_KEY)==="dark")document.body.classList.add("dark");
    $$("[data-view]").forEach(b=>b.addEventListener("click",()=>navTo(b.dataset.view)));
    $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>navTo(b.dataset.goto)));
    $("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
    $("#quick-add").addEventListener("click",()=>openTaskModal());$("#task-add").addEventListener("click",()=>openTaskModal());$("#empty-add").addEventListener("click",()=>openTaskModal());$("#tasks-empty-add").addEventListener("click",()=>openTaskModal());
    $("#modal-close").addEventListener("click",closeModal);$("#modal-cancel").addEventListener("click",closeModal);$("#modal-backdrop").addEventListener("click",e=>{if(e.target===$("#modal-backdrop"))closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
    $("#task-form").addEventListener("submit",saveTask);
    $("#task-search").addEventListener("input",renderTasks);$("#task-filter").addEventListener("change",renderTasks);$("#task-sort").addEventListener("change",renderTasks);
    document.addEventListener("change",e=>{if(e.target.matches("[data-complete]"))completeTask(e.target.dataset.complete,e.target.checked);});
    document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit){const t=data.tasks.find(t=>t.id===edit.dataset.edit);if(t)openTaskModal(t);return;}const del=e.target.closest("[data-delete]");if(del){deleteTask(del.dataset.delete);return;}const se=e.target.closest("[data-subject-edit]");if(se){openSubjectPrompt(data.subjects.find(s=>s.id===se.dataset.subjectEdit));return;}const sd=e.target.closest("[data-subject-delete]");if(sd)deleteSubject(sd.dataset.subjectDelete);});
    $("#subject-add").addEventListener("click",()=>openSubjectPrompt());$("#subjects-empty-add").addEventListener("click",()=>openSubjectPrompt());
    $("#session-form").addEventListener("submit",e=>{e.preventDefault();if(addSession({subjectId:$("#session-subject").value,minutes:Number($("#session-duration").value),date:$("#session-date").value,notes:$("#session-notes").value})){e.target.reset();$("#session-duration").value=45;$("#session-date").value=todayISO();toast("Study session logged. Every minute counts.");}});
    $$(".timer-mode").forEach(b=>b.addEventListener("click",()=>setTimerMode(b.dataset.mode,Number(b.dataset.minutes))));
    $("#timer-start").addEventListener("click",startTimer);$("#timer-reset").addEventListener("click",()=>setTimerMode(timerMode,Math.round(timerDuration/60)));
    $("#theme-toggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem(THEME_KEY,document.body.classList.contains("dark")?"dark":"light");});
    $("#export-data").addEventListener("click",exportData);$("#import-data").addEventListener("click",()=>$("#import-file").click());$("#import-file").addEventListener("change",e=>importData(e.target.files[0]));$("#reset-data").addEventListener("click",resetData);
    renderAll();renderTimer();
  }
  init();
})();