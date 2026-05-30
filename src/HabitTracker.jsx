import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useHabitData } from './useFirestore.js';
import { useTheme } from './ThemeContext.jsx';

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const WEEKDAYS_HEADER = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const HABIT_ICONS = ["☀️","💪","📖","💧","🧘","⚡","🏃","🎯","✍️","🧠","💤","🥗","🚭","💊","📱","🎵","🧹","📋","🌱","🔥","❤️","💰","📈","🎨","🏋️","🚀","⏰","🍎","🧪","📌"];

const CATEGORIES = [
  { id:"carreira", name:"Carreira", icon:"💼", color:"var(--cat-carreira)" },
  { id:"financas", name:"Finanças", icon:"💰", color:"var(--cat-financas)" },
  { id:"saude", name:"Saúde e Bem-Estar", icon:"❤️", color:"var(--cat-saude)" },
  { id:"crescimento", name:"Crescimento Pessoal", icon:"📈", color:"var(--cat-crescimento)" },
  { id:"relacionamentos", name:"Relacionamentos", icon:"👥", color:"var(--cat-relacionamentos)" },
];
const STATUS_OPTIONS = [
  { id:"not_started", label:"Não iniciado", icon:"○", color:"var(--text-tertiary)" },
  { id:"in_progress", label:"Em progresso", icon:"◐", color:"var(--accent)" },
  { id:"done", label:"Concluída", icon:"●", color:"var(--success)" },
];

function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function getWeeksInMonth(y,m){return Math.ceil((getDaysInMonth(y,m)+new Date(y,m,1).getDay())/7)}
function getWeekOfMonth(date){const d=new Date(date);return Math.ceil((d.getDate()+new Date(d.getFullYear(),d.getMonth(),1).getDay())/7)}
function getCurrentWeekNumber(y,m){const t=new Date();return(t.getFullYear()===y&&t.getMonth()===m)?getWeekOfMonth(t):1}

// Is this date in the future?
function isFutureDate(y, m, d) {
  const today = new Date();
  const check = new Date(y, m, d);
  today.setHours(0,0,0,0);
  check.setHours(0,0,0,0);
  return check > today;
}
function isFutureMonth(y, m) {
  const today = new Date();
  return y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth());
}

function getDefaultData() {
  const n = new Date();
  return {
    currentYear: n.getFullYear(), currentMonth: n.getMonth(),
    dailyHabits: [
      { id:"1", name:"Acordar cedo", icon:"☀️", target:25 },
      { id:"2", name:"Treinar", icon:"💪", target:20 },
      { id:"3", name:"Ler 30 min", icon:"📖", target:25 },
      { id:"4", name:"Beber 2L água", icon:"💧", target:30 },
      { id:"5", name:"Meditar", icon:"🧘", target:8 },
    ],
    weeklyHabits: [
      { id:"w1", name:"Revisão semanal", icon:"📋" },
      { id:"w2", name:"Planejamento", icon:"🎯" },
    ],
    monthlyHabits: [
      { id:"mh1", name:"Revisão mensal de metas", icon:"📊" },
      { id:"mh2", name:"Organizar finanças", icon:"💰" },
    ],
    goals: [
      { id:"g1", title:"Promoção Analista Pleno", category:"carreira", reward:"Escritório reformado", status:"in_progress", deadline:"2025-06-30",
        actions:[{id:"a1",text:"Foco no essencial",done:false},{id:"a2",text:"Soft Skills e Liderança",done:false},{id:"a3",text:"Comunicação e Storytelling",done:false}] },
    ],
    dailyChecks: {}, weeklyChecks: {}, monthlyChecks: {},
    dailyNotes: {}, // key: "YYYY-M-D" → { title, text }
    notes: "",
  };
}

// Ensure all required fields exist — never crash on missing data
function sanitizeData(raw) {
  const now = new Date();
  const d = raw && typeof raw === 'object' ? {...raw} : {};
  d.currentYear = d.currentYear || now.getFullYear();
  d.currentMonth = d.currentMonth ?? now.getMonth();
  d.dailyHabits = Array.isArray(d.dailyHabits) ? d.dailyHabits.map(h=>({target:getDaysInMonth(d.currentYear,d.currentMonth),...h})) : [];
  d.weeklyHabits = Array.isArray(d.weeklyHabits) ? d.weeklyHabits : [];
  d.monthlyHabits = Array.isArray(d.monthlyHabits) ? d.monthlyHabits : [];
  d.goals = Array.isArray(d.goals) ? d.goals.map(g=>({...g, actions: Array.isArray(g.actions)?g.actions:[]})) : [];
  d.dailyChecks = d.dailyChecks && typeof d.dailyChecks === 'object' ? d.dailyChecks : {};
  d.weeklyChecks = d.weeklyChecks && typeof d.weeklyChecks === 'object' ? d.weeklyChecks : {};
  d.monthlyChecks = d.monthlyChecks && typeof d.monthlyChecks === 'object' ? d.monthlyChecks : {};
  d.dailyNotes = d.dailyNotes && typeof d.dailyNotes === 'object' ? d.dailyNotes : {};
  d.notes = d.notes || "";
  return d;
}

// ─── SVG Icons ───
const Chev=({d})=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{d==="l"?<polyline points="15 18 9 12 15 6"/>:<polyline points="9 18 15 12 9 6"/>}</svg>;
const Plus=({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const Trash=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const FireIc=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/></svg>;
const Edit2=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DlIc=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const SunIc=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIc=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

function IconPicker({cur,onSelect,onClose}){
  return <div className="icon-picker">
    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{HABIT_ICONS.map(ic=><button key={ic} onClick={()=>{onSelect(ic);onClose();}} className={`icon-picker-btn ${ic===cur?'icon-picker-btn--active':''}`}>{ic}</button>)}</div>
  </div>;
}

function Ring({progress,size=80,sw=5,color="var(--accent)"}){
  const r=(size-sw)/2,c=r*2*Math.PI,o=c-(Math.min(progress,100)/100)*c;
  return <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease"}}/></svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:size*0.26,fontWeight:700,color:"var(--text-primary)"}}>{Math.round(progress)}%</span></div>
  </div>;
}
function MiniBar({pct,color="var(--accent)",h=4}){
  return <div className="progress-bar-track" style={{height:h}}><div className="progress-bar-fill" style={{width:`${Math.min(pct,100)}%`,background:color,borderRadius:h/2}}/></div>;
}
function calcStreak(hId,checks,y,m){let s=0,d=new Date();if(d.getFullYear()!==y||d.getMonth()!==m)return 0;while(d.getMonth()===m&&d.getDate()>=1){if(checks[`${y}-${m}-${d.getDate()}-${hId}`]){s++;d.setDate(d.getDate()-1)}else break}return s}

// Checkbox component
function CB({checked,onClick,disabled,size=22,activeColor="var(--accent)",isToday}){
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState(false);
  const handleClick=()=>{
    if(disabled||!onClick)return;
    if(!checked){
      setAnimating(true);
      setParticles(true);
      setTimeout(()=>setAnimating(false),600);
      setTimeout(()=>setParticles(false),800);
    }
    onClick();
  };
  return <div style={{position:"relative",width:size,height:size}}>
    {/* Particles burst */}
    {particles&&<>
      {[0,45,90,135,180,225,270,315].map((angle,i)=>{
        const rad=angle*Math.PI/180;
        const tx=Math.cos(rad)*18;
        const ty=Math.sin(rad)*18;
        return <div key={i} style={{
          position:"absolute",top:"50%",left:"50%",width:3,height:3,borderRadius:"50%",
          marginLeft:-1.5,marginTop:-1.5,
          background:i%2===0?activeColor:"var(--success)",
          animation:`cb-particle-move 0.55s ease-out ${i*0.02}s forwards`,
          ["--tx"]:`${tx}px`,["--ty"]:`${ty}px`,
          zIndex:10,pointerEvents:"none",
        }}/>;
      })}
    </>}
    {/* Glow ring */}
    {animating&&<div style={{
      position:"absolute",inset:-4,borderRadius:8,
      animation:"cb-glow 0.5s ease-out forwards",
      background:`radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)`,
      pointerEvents:"none",zIndex:0,
    }}/>}
    {/* Checkbox */}
    <div onClick={handleClick} style={{
      width:size,height:size,borderRadius:4,
      border:checked?"none":`1.5px solid ${disabled?"var(--border)":"var(--checkbox-border)"}`,
      background:checked?activeColor:"transparent",
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"var(--checkbox-check)",opacity:disabled?0.2:1,
      cursor:disabled?"default":"pointer",
      position:"relative",zIndex:1,
      transition:"background 0.2s ease, border-color 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      transform:animating?"scale(1.25)":"scale(1)",
      boxShadow:animating?`0 0 12px var(--accent-glow)`:isToday&&!checked&&!disabled?`0 0 0 2px var(--accent-subtle)`:"none",
    }}>
      {checked&&<svg width={size-8} height={size-8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        style={{animation:animating?"cb-draw 0.35s ease-out forwards":"none"}}>
        <polyline points="20 6 9 17 4 12" style={{
          strokeDasharray:30,strokeDashoffset:animating?30:0,
          animation:animating?"cb-draw 0.35s 0.1s ease-out forwards":"none",
        }}/>
      </svg>}
    </div>
  </div>;
}

// ═══════════════════════════════════════
export default function HabitTracker({ user, onLogout }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { data: fsData, loading: fsLoading, error: fsError, isNewUser, save: fsSave } = useHabitData(user?.uid);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("habits");
  const [habitSub, setHabitSub] = useState("daily");
  const [editMode, setEditMode] = useState(false);
  const [overviewView, setOverviewView] = useState("monthly");
  const [showIconPicker, setShowIconPicker] = useState(null);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("⚡");
  const [newTarget, setNewTarget] = useState(20);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({title:"",category:"carreira",reward:"",deadline:"",actions:[]});
  const [selectedNoteDay, setSelectedNoteDay] = useState(null);
  const [showReflectionTip, setShowReflectionTip] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  const scrollRef = useRef(null);

  const today = new Date();

  useEffect(()=>{
    if(fsLoading)return;

    // ERROR: show what we have or show error screen — NEVER create defaults
    if(fsError){
      setLoading(false);
      return;
    }

    // Real data from Firestore — sanitize and use it
    if(fsData && typeof fsData === 'object' && Object.keys(fsData).length > 0){
      setData(sanitizeData(fsData));
      setLoading(false);
      return;
    }

    // ONLY create defaults if getDoc CONFIRMED the document doesn't exist
    if(isNewUser && !data){
      const d=sanitizeData(getDefaultData());
      setData(d);
      fsSave(d);
    }
    setLoading(false);
  },[fsData,fsLoading,fsError,isNewUser]);

  const save=useCallback(async(nd)=>{setData(nd);fsSave(nd)},[fsSave]);

  const toggleEdit=()=>{
    if(editMode){setEditingGoalId(null);setEditingTarget(null);setShowAdd(false);setShowAddGoal(false);setShowIconPicker(null)}
    setEditMode(!editMode);
  };

  const isCur=data&&data.currentYear===today.getFullYear()&&data.currentMonth===today.getMonth();
  const todayD=isCur?today.getDate():null;
  const daysInMonth=data?getDaysInMonth(data.currentYear,data.currentMonth):31;
  const weeksInMonth=data?getWeeksInMonth(data.currentYear,data.currentMonth):5;
  const curWeek=data?getCurrentWeekNumber(data.currentYear,data.currentMonth):1;
  const monthIsFuture=data?isFutureMonth(data.currentYear,data.currentMonth):false;

  const nav=(dir)=>{if(!data)return;let m=data.currentMonth+dir,y=data.currentYear;if(m<0){m=11;y--}else if(m>11){m=0;y++}save({...data,currentMonth:m,currentYear:y})};

  // Toggles with future check
  const togDaily=(d,hId)=>{
    if(isFutureDate(data.currentYear,data.currentMonth,d))return;
    const k=`${data.currentYear}-${data.currentMonth}-${d}-${hId}`;
    const c={...data.dailyChecks};c[k]?delete c[k]:(c[k]=true);save({...data,dailyChecks:c});
  };
  const togWeekly=(w,hId)=>{
    if(monthIsFuture)return;
    const k=`${data.currentYear}-${data.currentMonth}-w${w}-${hId}`;
    const c={...data.weeklyChecks};c[k]?delete c[k]:(c[k]=true);save({...data,weeklyChecks:c});
  };
  const togMonthly=(hId)=>{
    if(monthIsFuture)return;
    const k=`${data.currentYear}-${data.currentMonth}-${hId}`;
    const c={...data.monthlyChecks};c[k]?delete c[k]:(c[k]=true);save({...data,monthlyChecks:c});
  };

  // CRUD helpers
  const addHabit=(type)=>{
    if(!newName.trim())return;
    const id=type[0]+Date.now();
    const habit={id,name:newName.trim(),icon:newIcon,...(type==="daily"?{target:newTarget}:{})};
    const key=type==="daily"?"dailyHabits":type==="weekly"?"weeklyHabits":"monthlyHabits";
    save({...data,[key]:[...data[key],habit]});
    setNewName("");setNewIcon("⚡");setNewTarget(20);setShowAdd(false);
  };
  const removeHabit=(type,id)=>{
    const key=type==="daily"?"dailyHabits":type==="weekly"?"weeklyHabits":"monthlyHabits";
    save({...data,[key]:data[key].filter(h=>h.id!==id)});
  };
  const updateIcon=(type,id,icon)=>{
    const key=type==="daily"?"dailyHabits":type==="weekly"?"weeklyHabits":"monthlyHabits";
    save({...data,[key]:data[key].map(h=>h.id===id?{...h,icon}:h)});
  };

  // Goal CRUD
  const addGoal=()=>{if(!newGoal.title.trim())return;save({...data,goals:[...data.goals,{...newGoal,id:"g"+Date.now(),status:"not_started",actions:newGoal.actions.map((a,i)=>({...a,id:"a"+Date.now()+i}))}]});setNewGoal({title:"",category:"carreira",reward:"",deadline:"",actions:[]});setShowAddGoal(false)};
  const removeGoal=(id)=>{save({...data,goals:data.goals.filter(g=>g.id!==id)});if(editingGoalId===id)setEditingGoalId(null)};
  const updateGoal=(id,u)=>save({...data,goals:data.goals.map(g=>g.id===id?{...g,...u}:g)});
  const toggleAction=(gId,aId)=>save({...data,goals:data.goals.map(g=>g.id===gId?{...g,actions:g.actions.map(a=>a.id===aId?{...a,done:!a.done}:a)}:g)});
  const addAction=(gId,text)=>{if(!text.trim())return;save({...data,goals:data.goals.map(g=>g.id===gId?{...g,actions:[...g.actions,{id:"a"+Date.now(),text:text.trim(),done:false}]}:g)})};
  const removeAction=(gId,aId)=>save({...data,goals:data.goals.map(g=>g.id===gId?{...g,actions:g.actions.filter(a=>a.id!==aId)}:g)});

  // Notes
  const getNoteKey=(d)=>`${data.currentYear}-${data.currentMonth}-${d}`;
  const getNote=(d)=>data.dailyNotes[getNoteKey(d)]||{title:"",text:""};
  const saveNote=(d,updates)=>{
    const k=getNoteKey(d);
    const existing=data.dailyNotes[k]||{title:"",text:""};
    save({...data,dailyNotes:{...data.dailyNotes,[k]:{...existing,...updates}}});
  };
  const exportForAI=()=>{
    const maxD=isCur?todayD:daysInMonth;
    const lines=["# Relatório Mensal — Focus Mind Lab",`# ${MONTHS_PT[data.currentMonth]} ${data.currentYear}`,""];

    // Habit summary
    lines.push("## Resumo de Hábitos","");
    const scores=data.dailyHabits.map(h=>{
      let count=0;for(let d=1;d<=maxD;d++){if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])count++}
      return{name:h.name,icon:h.icon,count,target:h.target||daysInMonth,pct:Math.round((count/(h.target||daysInMonth))*100)};
    });
    scores.forEach(h=>lines.push(`- ${h.icon} ${h.name}: ${h.count}/${h.target} dias (${h.pct}%)`));
    lines.push("");

    // Daily check-in detail
    lines.push("## Check-in Diário","");
    for(let d=1;d<=maxD;d++){
      const dow=WEEKDAYS_HEADER[new Date(data.currentYear,data.currentMonth,d).getDay()];
      const done=[];const missed=[];
      data.dailyHabits.forEach(h=>{
        if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])done.push(h.name);
        else missed.push(h.name);
      });
      if(done.length>0||missed.length>0){
        lines.push(`**${dow} ${d}** — ${done.length}/${data.dailyHabits.length} concluídos`);
        if(done.length>0)lines.push(`  ✅ ${done.join(", ")}`);
        if(missed.length>0)lines.push(`  ❌ ${missed.join(", ")}`);
      }
    }
    lines.push("");

    // Notes
    let hasNotes=false;
    for(let d=1;d<=maxD;d++){
      const note=getNote(d);
      if(note.title||note.text){
        if(!hasNotes){lines.push("## Reflexões Diárias","");hasNotes=true}
        const dow=WEEKDAYS_HEADER[new Date(data.currentYear,data.currentMonth,d).getDay()];
        lines.push(`### ${dow}, ${d} de ${MONTHS_PT[data.currentMonth]}`);
        if(note.title)lines.push(`**${note.title}**`);
        if(note.text)lines.push(note.text);
        lines.push("");
      }
    }

    if(scores.every(h=>h.count===0)&&!hasNotes){alert("Nenhum dado registrado neste mês.");return}

    lines.push("---","","Analise meu relatório mensal acima (hábitos + reflexões). Identifique:","1. Padrões de consistência e inconsistência nos hábitos","2. Correlações entre dias produtivos e reflexões","3. Hábitos que devo priorizar vs. eliminar","4. Sentimentos e comportamentos recorrentes","5. Sugestões práticas e específicas para o próximo mês","","Seja direto, objetivo e acionável.");
    const blob=new Blob([lines.join("\n")],{type:"text/markdown"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`relatorio-${MONTHS_SHORT[data.currentMonth].toLowerCase()}-${data.currentYear}.md`;a.click();URL.revokeObjectURL(url);
  };

  // ─── STATS ───
  const stats=useMemo(()=>{
    if(!data)return{};
    const maxDay=isCur?todayD:daysInMonth;
    const habitScores=data.dailyHabits.map(h=>{
      let count=0;for(let d=1;d<=maxDay;d++){if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])count++}
      const target=h.target||daysInMonth;
      return{...h,count,target,pct:Math.round((count/target)*100),streak:calcStreak(h.id,data.dailyChecks,data.currentYear,data.currentMonth)};
    });
    const totalDone=habitScores.reduce((s,h)=>s+h.count,0);
    const totalTarget=habitScores.reduce((s,h)=>s+h.target,0);
    const dailyProgress=totalTarget>0?(totalDone/totalTarget)*100:0;
    let todayDone=0;
    if(isCur){for(const h of data.dailyHabits){if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${todayD}-${h.id}`])todayDone++}}
    const todayProgress=data.dailyHabits.length>0?(todayDone/data.dailyHabits.length)*100:0;
    let wDone=0,wTotal=data.weeklyHabits.length*weeksInMonth;
    for(let w=1;w<=weeksInMonth;w++)for(const h of data.weeklyHabits){if(data.weeklyChecks[`${data.currentYear}-${data.currentMonth}-w${w}-${h.id}`])wDone++}
    const weeklyProgress=wTotal>0?(wDone/wTotal)*100:0;
    const goalsDone=data.goals.filter(g=>g.status==="done").length;
    const goalsProgress=data.goals.length>0?(goalsDone/data.goals.length)*100:0;
    const streaks=habitScores.filter(h=>h.streak>0).sort((a,b)=>b.streak-a.streak);
    const dailyCompletions=[];
    for(let d=1;d<=daysInMonth;d++){let done=0;for(const h of data.dailyHabits){if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])done++}dailyCompletions.push({day:d,done,pct:data.dailyHabits.length>0?done/data.dailyHabits.length:0})}
    const weekStart=(()=>{if(!isCur)return 1;return Math.max(1,todayD-today.getDay())})();
    const weekEnd=Math.min(weekStart+6,daysInMonth);
    const goalsByCategory=CATEGORIES.map(cat=>{const gs=data.goals.filter(g=>g.category===cat.id);const done=gs.filter(g=>g.status==="done").length;return{...cat,total:gs.length,done,pct:gs.length>0?Math.round((done/gs.length)*100):0}});
    const yearData=[];
    for(let m=0;m<12;m++){const dm=getDaysInMonth(data.currentYear,m);let mDone=0,mTarget=0;for(const h of data.dailyHabits){mTarget+=(h.target||dm);for(let d=1;d<=dm;d++){if(data.dailyChecks[`${data.currentYear}-${m}-${d}-${h.id}`])mDone++}}yearData.push({month:m,done:mDone,target:mTarget,pct:mTarget>0?Math.round((mDone/mTarget)*100):0,isThisMonth:m===data.currentMonth,isFutureMonth:data.currentYear===today.getFullYear()&&m>today.getMonth()})}
    return{habitScores,totalDone,totalTarget,dailyProgress,todayDone,todayProgress,weeklyProgress,goalsProgress,goalsDone,totalGoals:data.goals.length,goalsByCategory,streaks,dailyCompletions,weekStart,weekEnd,yearData,maxDay};
  },[data,isCur,todayD,daysInMonth,weeksInMonth]);

  // Auto-scroll to today on mount (MUST be before conditional return - hooks rules)
  const scrollToToday=useCallback((el)=>{
    if(el&&todayD){
      const dayIndex=todayD-1;
      const scrollPos=Math.max(0,dayIndex*46-el.clientWidth/2+23);
      el.scrollLeft=scrollPos;
    }
  },[todayD]);

  if(loading||!data){
    if(fsError&&!data)return<div className="error-screen">
      <span style={{fontSize:16,fontWeight:600,color:"var(--text-primary)"}}>Erro de conexão</span>
      <span style={{fontSize:12,color:"var(--text-secondary)",textAlign:"center",maxWidth:280}}>Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.</span>
      <button onClick={()=>window.location.reload()} className="btn btn-primary" style={{marginTop:8}}>Recarregar</button>
    </div>;
    return<div className="loading-screen"><div className="loading-spinner"/><span className="loading-brand">FOCUS MIND LAB</span></div>;
  }

  return(
    <div className="app-container">

      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div className="header-inner">
          {/* Row 1: Logo left, Actions right */}
          <div className="header-row">
            <div className="logo-area">
              <div className="logo-bars">
                <div className="logo-bar logo-bar--tall"/>
                <div className="logo-bar logo-bar--short"/>
                <div className="logo-bar logo-bar--tall"/>
              </div>
              <div className="hide-mobile">
                <div className="logo-text">FOCUS MIND LAB</div>
                <div className="logo-sub">PAINEL DE HÁBITOS</div>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
                {isDark ? <SunIc/> : <MoonIc/>}
              </button>
              <img src={user?.photoURL||''} alt="" className="user-avatar" onError={e=>{e.target.style.display='none'}}/>
              <button onClick={onLogout} className="btn-logout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair
              </button>
            </div>
          </div>

          {/* Row 2: HOJE badge centered */}
          {isCur&&<div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
            <div className="badge-today">
              <span style={{fontSize:9,color:"var(--text-tertiary)",letterSpacing:1,fontWeight:600}}>HOJE</span>
              <span style={{fontSize:18,fontWeight:700,color:"var(--text-primary)"}}>{todayD}</span>
              <span style={{fontSize:10,color:"var(--accent)",fontWeight:600}}>{Math.round(stats.todayProgress)}%</span>
            </div>
          </div>}

          {/* Row 3: Month nav centered */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <button onClick={()=>nav(-1)} className="month-nav-btn"><Chev d="l"/></button>
            <div style={{textAlign:"center",minWidth:100}}>
              <div style={{fontSize:14,fontWeight:700,letterSpacing:3,lineHeight:1,color:"var(--text-primary)"}}>{MONTHS_PT[data.currentMonth].toUpperCase()}</div>
              <div style={{fontSize:10,color:"var(--text-tertiary)",marginTop:1}}>{data.currentYear}</div>
              {isCur&&<div style={{fontSize:7,letterSpacing:1.5,color:"var(--accent)",fontWeight:600,marginTop:2}}>✦ Mantenha o Foco ✦</div>}
            </div>
            <button onClick={()=>nav(1)} className="month-nav-btn"><Chev d="r"/></button>
          </div>
        </div>
      </header>

      {/* ═══ DAILY BAR CHART + STREAK ═══ */}
      <div className="container" style={{padding:"12px 16px"}}>
        <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
          {/* Bar chart */}
          <div className="card" style={{flex:1,padding:"12px 10px 8px",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"0 2px"}}>
              <span className="card-title">PROGRESSO DIÁRIO</span>
              <span style={{fontSize:10,fontWeight:600,color:"var(--accent)"}}>{stats.totalDone}/{stats.totalTarget}</span>
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:1,height:48,overflow:"hidden"}}>
              {stats.dailyCompletions?.map(dc=>{
                const isT=dc.day===todayD;
                const isF=isCur&&dc.day>todayD;
                const pct=Math.max(dc.pct*100,0);
                const barH=Math.max(pct/100*44,2);
                const isSunday=new Date(data.currentYear,data.currentMonth,dc.day).getDay()===0&&dc.day>1;
                return<div key={dc.day} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",
                  height:48,
                  borderLeft:isSunday?"1.5px solid var(--border)":"none",
                  paddingLeft:isSunday?1:0,
                }}>
                  <div style={{
                    width:"100%",maxWidth:14,minWidth:3,
                    height:barH,
                    borderRadius:"3px 3px 1px 1px",
                    background:isF?"var(--bar-empty)":isT?"var(--accent)":pct>=80?"var(--success)":pct>0?"var(--bar-mid)":"var(--bar-empty)",
                    transition:"height 0.4s ease",
                    opacity:isF?0.4:1,
                    ...(isT?{boxShadow:"0 0 0 1.5px var(--accent-glow)"}:{}),
                  }}/>
                </div>;
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,padding:"0 1px"}}>
              <span style={{fontSize:7,color:"var(--text-muted)"}}>1</span>
              <span style={{fontSize:7,color:"var(--text-muted)"}}>{Math.round(daysInMonth/2)}</span>
              <span style={{fontSize:7,color:"var(--text-muted)"}}>{daysInMonth}</span>
            </div>
          </div>

          {/* Streak glass card */}
          <div className="streak-card">
            <div style={{fontSize:7,letterSpacing:1.5,color:"var(--text-tertiary)",fontWeight:600,zIndex:1}}>SEQUÊNCIA</div>
            <div style={{fontSize:28,fontWeight:700,color:"var(--text-primary)",lineHeight:1,zIndex:1}}>
              {stats.streaks?.length>0?stats.streaks[0].streak:0}
            </div>
            <div style={{fontSize:8,color:"var(--accent)",fontWeight:600,zIndex:1}}>
              {stats.streaks?.length>0?stats.streaks[0].streak===1?"dia":"dias":"dias"}
            </div>
            {stats.streaks?.length>0&&<div style={{fontSize:10,zIndex:1,marginTop:2}}>🔥</div>}
          </div>
        </div>
      </div>

      {/* ═══ MAIN TABS ═══ */}
      <div className="container" style={{paddingBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div className="tabs" style={{flex:1}}>
          {[{id:"habits",l:"Hábitos"},{id:"goals",l:"Metas"},{id:"progress",l:"Progresso"}].map(t=>(
            <button key={t.id} className={`tab ${mainTab===t.id?'tab--active':''}`} onClick={()=>setMainTab(t.id)}>{t.l}</button>
          ))}
        </div>
        {mainTab!=="progress"&&<button onClick={toggleEdit} className="btn" style={{
          padding:"7px 14px",fontSize:10,fontWeight:500,border:`1px solid ${editMode?'transparent':'var(--border)'}`,
          background:editMode?"var(--accent)":"var(--bg-secondary)",borderRadius:"var(--radius-md)",
          color:editMode?"white":"var(--text-secondary)",whiteSpace:"nowrap"
        }}>{editMode?"Salvar":"Editar"}</button>}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="container" style={{paddingBottom:40}}>

      {/* ════ HABITS TAB ════ */}
      {mainTab==="habits"&&(
        <div style={{animation:"fadeInUp 0.35s ease"}}>
          {/* Sub tabs */}
          <div style={{display:"flex",gap:2,marginBottom:12}}>
            {[{id:"daily",l:"Diário"},{id:"weekly",l:"Semanal"},{id:"monthly",l:"Mensal"}].map(t=>(
              <button key={t.id} className={`sub-tab ${habitSub===t.id?'sub-tab--active':''}`} onClick={()=>setHabitSub(t.id)}>{t.l}</button>
            ))}
          </div>

          {/* ──── DAILY ──── */}
          {habitSub==="daily"&&(
            <div style={{animation:"fadeInUp 0.4s ease"}}>

              {/* Focus banner */}
              {!tipDismissed&&<div className="focus-banner">
                <div style={{fontSize:18,zIndex:1,flexShrink:0}}>🎯</div>
                <div style={{flex:1,zIndex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-primary)",lineHeight:1.4}}>Foco no essencial</div>
                  <div style={{fontSize:10,color:"var(--text-secondary)",lineHeight:1.5,marginTop:2}}>Comece com poucos hábitos. Só quando um estiver no automático, adicione o próximo. Quem persegue muitos coelhos acaba sem nenhum.</div>
                </div>
                <button onClick={()=>setTipDismissed(true)} className="btn" style={{
                  background:"none",border:"none",color:"var(--text-muted)",fontSize:16,
                  padding:"4px",flexShrink:0,zIndex:1,borderRadius:4,
                }}>×</button>
              </div>}

              {/* Export button */}
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                <button onClick={exportForAI} className="btn btn-ghost" style={{gap:6}}>
                  <DlIc/> Exportar para AI
                </button>
              </div>

              {/* 3-column layout: Names | Scrollable all days | Progress */}
              <div className="daily-grid">
                {/* Left: habit names */}
                <div className="daily-grid-names">
                  <div style={{padding:"10px 12px",borderBottom:"2px solid var(--border)",minHeight:48,display:"flex",alignItems:"flex-end"}}>
                    <span className="card-title">HÁBITOS</span>
                  </div>
                  {data.dailyHabits.map((habit,idx)=>(
                    <div key={habit.id} className={`habit-row ${idx%2!==0?'habit-row--alt':''}`}>
                      {editMode&&<button onClick={()=>removeHabit("daily",habit.id)} className="btn btn-danger"><Trash/></button>}
                      <div style={{position:"relative"}}>
                        <span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===habit.id?null:habit.id)}>{habit.icon}</span>
                        {editMode&&showIconPicker===habit.id&&<IconPicker cur={habit.icon} onSelect={ic=>updateIcon("daily",habit.id,ic)} onClose={()=>setShowIconPicker(null)}/>}
                      </div>
                      <span style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{habit.name}</span>
                    </div>
                  ))}
                </div>

                {/* Middle: scrollable all days with week dividers */}
                <div ref={el=>{scrollRef.current=el;scrollToToday(el)}} className="daily-grid-scroll">
                  <div style={{display:"inline-flex",flexDirection:"column",minWidth:daysInMonth*46}}>
                    {/* Header */}
                    <div style={{display:"flex",borderBottom:"2px solid var(--border)"}}>
                      {Array.from({length:daysInMonth},(_,i)=>{
                        const d=i+1;const dow=new Date(data.currentYear,data.currentMonth,d).getDay();
                        const isT=d===todayD;const isF=isFutureDate(data.currentYear,data.currentMonth,d);
                        const isSunday=dow===0&&d>1;
                        return<div key={d} className={`daily-header-cell ${isT?'daily-header-cell--today':''} ${isF?'daily-header-cell--future':''}`} style={{
                          borderLeft:isSunday?"2px solid var(--border-strong)":"none",
                          fontWeight:isT?700:500,
                        }}>
                          <div style={{fontSize:9,letterSpacing:0.3}}>{WEEKDAYS_HEADER[dow]}</div>
                          <div style={{fontSize:13,fontWeight:isT?700:500,marginTop:1}}>{d}</div>
                        </div>;
                      })}
                    </div>
                    {/* Rows */}
                    {data.dailyHabits.map((habit,idx)=>(
                      <div key={habit.id} style={{display:"flex",borderBottom:"1px solid var(--border)",background:idx%2===0?"transparent":"var(--row-alt)"}}>
                        {Array.from({length:daysInMonth},(_,i)=>{
                          const d=i+1;const dow=new Date(data.currentYear,data.currentMonth,d).getDay();
                          const k=`${data.currentYear}-${data.currentMonth}-${d}-${habit.id}`;
                          const checked=!!data.dailyChecks[k];const isT=d===todayD;const isF=isFutureDate(data.currentYear,data.currentMonth,d);
                          const isSunday=dow===0&&d>1;
                          return<div key={d} className={`day-cell ${isT?'day-cell--today':''} ${isSunday?'day-cell--sunday':''}`}>
                            <CB checked={checked} onClick={()=>togDaily(d,habit.id)} disabled={isF} isToday={isT} size={24}/>
                          </div>;
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: progress */}
                <div className="daily-grid-progress">
                  <div style={{padding:"10px 8px",borderBottom:"2px solid var(--border)",minHeight:48,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                    <span style={{fontSize:8,fontWeight:600,color:"var(--text-tertiary)",letterSpacing:0.5}}>PROG.</span>
                  </div>
                  {data.dailyHabits.map((habit,idx)=>{
                    const sc=stats.habitScores?.find(h=>h.id===habit.id);
                    const over=sc&&sc.pct>=100;
                    return<div key={habit.id} style={{padding:"5px 8px",borderBottom:"1px solid var(--border)",minHeight:42,display:"flex",alignItems:"center",justifyContent:"center",background:idx%2===0?"transparent":"var(--row-alt)"}}>
                      <div onClick={()=>setEditingTarget(editingTarget===habit.id?null:habit.id)} style={{cursor:"pointer",textAlign:"center",minWidth:50}}>
                        {editingTarget===habit.id?
                          <input type="number" min={1} max={31} value={habit.target||daysInMonth} autoFocus
                            onChange={e=>save({...data,dailyHabits:data.dailyHabits.map(h=>h.id===habit.id?{...h,target:parseInt(e.target.value)||1}:h)})}
                            onBlur={()=>setEditingTarget(null)}
                            className="input" style={{width:34,padding:"2px",fontSize:11,fontWeight:600,textAlign:"center"}}/>
                        :<>
                          <div style={{fontSize:11,fontWeight:600,color:over?"var(--success)":"var(--text-primary)"}}>{sc?.count||0}<span style={{color:"var(--text-muted)",fontWeight:400}}>/</span>{sc?.target||daysInMonth}</div>
                          <MiniBar pct={sc?.pct||0} color={over?"var(--success)":sc?.pct>=80?"var(--accent)":"var(--bar-empty)"} h={3}/>
                          <div style={{fontSize:7,fontWeight:600,color:over?"var(--success)":"var(--text-tertiary)",marginTop:1}}>{Math.min(sc?.pct||0,999)}%</div>
                        </>}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} className="btn" style={{width:34,height:34,borderRadius:"var(--radius-sm)",border:"1.5px solid var(--border)",background:"var(--bg-secondary)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hábito..." onKeyDown={e=>e.key==="Enter"&&addHabit("daily")} className="input" style={{flex:1}} autoFocus/>
                  <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,color:"var(--text-tertiary)"}}>Meta:</span>
                    <input type="number" value={newTarget} onChange={e=>setNewTarget(parseInt(e.target.value)||1)} min={1} max={31} className="input" style={{width:42,textAlign:"center",padding:"6px 4px"}}/>
                  </div>
                  <button onClick={()=>addHabit("daily")} className="btn btn-primary">+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="btn btn-ghost">×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="btn-add-trigger"><Plus s={14}/> Novo hábito</button>}
              </div>}

              {/* ──── DAILY NOTES ──── */}
              <div style={{marginTop:24,animation:"fadeInUp 0.4s 0.1s ease both"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span className="card-title">NOTAS & REFLEXÕES DIÁRIAS</span>
                    <button onClick={()=>setShowReflectionTip(true)} className="btn" style={{
                      width:18,height:18,borderRadius:"50%",border:"1.5px solid var(--border)",background:"transparent",
                      fontSize:10,fontWeight:700,color:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",
                      lineHeight:1,padding:0,
                    }}>?</button>
                  </div>
                </div>

                <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
                  {Array.from({length:Math.min(isCur?todayD:daysInMonth,daysInMonth)},(_,i)=>{
                    const d=i+1;const note=getNote(d);const hasNote=note.title||note.text;
                    const isSel=selectedNoteDay===d;
                    return<button key={d} onClick={()=>setSelectedNoteDay(isSel?null:d)} className={`note-pill ${isSel?'note-pill--active':''} ${hasNote&&!isSel?'note-pill--has-note':''}`}>
                      {d}{hasNote&&!isSel&&<div className="note-dot"/>}
                    </button>
                  })}
                </div>
                {selectedNoteDay&&(()=>{
                  const note=getNote(selectedNoteDay);
                  const dow=WEEKDAYS_HEADER[new Date(data.currentYear,data.currentMonth,selectedNoteDay).getDay()];
                  return<div className="card" style={{animation:"fadeInScale 0.25s ease"}}>
                    <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:8}}>{dow}, {selectedNoteDay} de {MONTHS_PT[data.currentMonth]}</div>
                    <input value={note.title} onChange={e=>saveNote(selectedNoteDay,{title:e.target.value})}
                      placeholder="Título da nota (opcional)..."
                      className="input" style={{width:"100%",fontWeight:600,fontSize:13,marginBottom:8,padding:"8px 12px"}}/>
                    <textarea value={note.text} onChange={e=>saveNote(selectedNoteDay,{text:e.target.value})}
                      placeholder="Reflexão do dia..."
                      rows={4} style={{width:"100%",padding:"10px 12px",fontSize:12,fontFamily:"var(--font)",border:"1.5px solid var(--input-border)",borderRadius:"var(--radius-md)",background:"var(--bg-tertiary)",color:"var(--text-primary)",resize:"vertical",outline:"none",lineHeight:1.7,transition:"border-color 0.2s ease"}}/>
                  </div>;
                })()}
              </div>
            </div>
          )}

          {/* ──── WEEKLY ──── */}
          {habitSub==="weekly"&&(
            <div>
              <div className="card" style={{padding:0,overflow:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}} cellSpacing={0} cellPadding={0}>
                  <thead><tr>
                    <th style={{textAlign:"left",padding:"10px 12px",borderBottom:"2px solid var(--border)",fontSize:10,letterSpacing:1,color:"var(--text-tertiary)",fontWeight:600,minWidth:160}}>HÁBITOS SEMANAIS</th>
                    {Array.from({length:weeksInMonth},(_,i)=>{const w=i+1;const isCurW=isCur&&w===curWeek;
                      return<th key={w} style={{padding:"10px 14px",textAlign:"center",fontSize:11,fontWeight:isCurW?700:500,color:isCurW?"var(--accent)":"var(--text-tertiary)",borderBottom:"2px solid var(--border)"}}>Sem {w}</th>})}
                    <th style={{padding:"10px",textAlign:"right",fontSize:9,fontWeight:600,color:"var(--text-tertiary)",borderBottom:"2px solid var(--border)"}}>%</th>
                  </tr></thead>
                  <tbody>{data.weeklyHabits.map((h,idx)=>{
                    let done=0;for(let w=1;w<=weeksInMonth;w++)if(data.weeklyChecks[`${data.currentYear}-${data.currentMonth}-w${w}-${h.id}`])done++;
                    const pct=weeksInMonth>0?Math.round((done/weeksInMonth)*100):0;
                    return<tr key={h.id} style={{background:idx%2===0?"transparent":"var(--row-alt)",transition:"background 0.2s ease"}}>
                      <td style={{padding:"10px 12px",borderBottom:"1px solid var(--border)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {editMode&&<button onClick={()=>removeHabit("weekly",h.id)} className="btn btn-danger"><Trash/></button>}
                          <div style={{position:"relative"}}><span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===h.id?null:h.id)}>{h.icon}</span>
                            {editMode&&showIconPicker===h.id&&<IconPicker cur={h.icon} onSelect={ic=>updateIcon("weekly",h.id,ic)} onClose={()=>setShowIconPicker(null)}/>}</div>
                          <span style={{fontSize:12,fontWeight:500}}>{h.name}</span>
                        </div>
                      </td>
                      {Array.from({length:weeksInMonth},(_,i)=>{const w=i+1;const k=`${data.currentYear}-${data.currentMonth}-w${w}-${h.id}`;const checked=!!data.weeklyChecks[k];const isCurW=isCur&&w===curWeek;
                        return<td key={w} style={{padding:"10px",textAlign:"center",borderBottom:"1px solid var(--border)"}}>
                          <CB checked={checked} onClick={()=>togWeekly(w,h.id)} disabled={monthIsFuture} size={28} activeColor="var(--accent)" isToday={isCurW}/>
                        </td>})}
                      <td style={{padding:"10px",textAlign:"right",borderBottom:"1px solid var(--border)"}}><MiniBar pct={pct} color="var(--accent)"/><span style={{fontSize:10,fontWeight:600,color:"var(--text-tertiary)"}}>{pct}%</span></td>
                    </tr>})}</tbody>
                </table>
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} className="btn" style={{width:34,height:34,borderRadius:"var(--radius-sm)",border:"1.5px solid var(--border)",background:"var(--bg-secondary)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hábito semanal..." onKeyDown={e=>e.key==="Enter"&&addHabit("weekly")} className="input" style={{flex:1}} autoFocus/>
                  <button onClick={()=>addHabit("weekly")} className="btn btn-primary">+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="btn btn-ghost">×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="btn-add-trigger"><Plus s={14}/> Novo hábito semanal</button>}
              </div>}
            </div>
          )}

          {/* ──── MONTHLY ──── */}
          {habitSub==="monthly"&&(
            <div>
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span className="card-title">TAREFAS DO MÊS</span>
                  <span style={{fontSize:11,color:"var(--accent)",fontWeight:600}}>
                    {data.monthlyHabits.filter(h=>data.monthlyChecks[`${data.currentYear}-${data.currentMonth}-${h.id}`]).length}/{data.monthlyHabits.length}
                  </span>
                </div>
                {data.monthlyHabits.map((h,idx)=>{
                  const k=`${data.currentYear}-${data.currentMonth}-${h.id}`;
                  const checked=!!data.monthlyChecks[k];
                  return<div key={h.id} className={`habit-row ${idx%2===0?'':'habit-row--alt'}`} style={{padding:"10px 16px",gap:10}}>
                    {editMode&&<button onClick={()=>removeHabit("monthly",h.id)} className="btn btn-danger"><Trash/></button>}
                    <CB checked={checked} onClick={()=>togMonthly(h.id)} disabled={monthIsFuture} size={24} activeColor="var(--success)"/>
                    <div style={{position:"relative"}}><span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===h.id?null:h.id)}>{h.icon}</span>
                      {editMode&&showIconPicker===h.id&&<IconPicker cur={h.icon} onSelect={ic=>updateIcon("monthly",h.id,ic)} onClose={()=>setShowIconPicker(null)}/>}</div>
                    <span style={{fontSize:12,fontWeight:500,flex:1,textDecoration:checked?"line-through":"none",opacity:checked?0.5:1}}>{h.name}</span>
                  </div>})}
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} className="btn" style={{width:34,height:34,borderRadius:"var(--radius-sm)",border:"1.5px solid var(--border)",background:"var(--bg-secondary)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Tarefa mensal..." onKeyDown={e=>e.key==="Enter"&&addHabit("monthly")} className="input" style={{flex:1}} autoFocus/>
                  <button onClick={()=>addHabit("monthly")} className="btn btn-primary">+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="btn btn-ghost">×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="btn-add-trigger"><Plus s={14}/> Nova tarefa mensal</button>}
              </div>}
            </div>
          )}
        </div>
      )}

      {/* ════ GOALS TAB ════ */}
      {mainTab==="goals"&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          {/* Areas */}
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <span className="card-title">ÁREAS DA VIDA</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Ring progress={stats.goalsProgress} size={38} sw={3} color="var(--success)"/>
                <div><div style={{fontSize:16,fontWeight:700,lineHeight:1}}>{stats.goalsDone}/{stats.totalGoals}</div><div style={{fontSize:9,color:"var(--text-tertiary)"}}>atingidas</div></div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {stats.goalsByCategory?.filter(c=>c.total>0).map(cat=>(
                <div key={cat.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"var(--bg-tertiary)",borderRadius:"var(--radius-sm)",fontSize:11,transition:"all 0.2s ease"}}>
                  <span>{cat.icon}</span><span style={{fontWeight:500}}>{cat.name}</span>
                  <span style={{fontWeight:600,color:cat.color}}>{cat.done}/{cat.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal cards */}
          <div className="grid-goals" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
            {data.goals.map(goal=>{
              const cat=CATEGORIES.find(c=>c.id===goal.category);const st=STATUS_OPTIONS.find(s=>s.id===goal.status);
              const aDone=goal.actions.filter(a=>a.done).length;const aPct=goal.actions.length>0?Math.round((aDone/goal.actions.length)*100):0;
              const isEd=editMode&&editingGoalId===goal.id;
              return<div key={goal.id} className="goal-card">
                <div style={{padding:"14px 16px 10px",borderBottom:"1px solid var(--border)",borderLeft:`3px solid ${cat?.color||'var(--accent)'}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    {isEd?<input value={goal.title} onChange={e=>updateGoal(goal.id,{title:e.target.value})} className="input" style={{fontSize:13,fontWeight:700,letterSpacing:0.3,flex:1,padding:"4px 8px"}}/>
                    :<h3 style={{fontSize:13,fontWeight:700,letterSpacing:0.3,lineHeight:1.3,flex:1}}>{goal.title.toUpperCase()}</h3>}
                    {editMode&&<div style={{display:"flex",gap:3}}>
                      <button onClick={()=>setEditingGoalId(isEd?null:goal.id)} className="btn btn-icon" style={{width:24,height:24,border:"none"}}><Edit2/></button>
                      <button onClick={()=>removeGoal(goal.id)} className="btn btn-danger" style={{padding:3}}><Trash/></button>
                    </div>}
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:8,fontSize:10,flexWrap:"wrap"}}>
                    <div><span style={{color:"var(--text-tertiary)",fontWeight:600,letterSpacing:0.5}}>CAT </span>
                      {isEd?<select value={goal.category} onChange={e=>updateGoal(goal.id,{category:e.target.value})} className="input" style={{padding:"2px 4px",fontSize:10}}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
                      :<span style={{color:cat?.color}}>{cat?.icon} {cat?.name}</span>}</div>
                    <div><span style={{color:"var(--text-tertiary)",fontWeight:600,letterSpacing:0.5}}>STATUS </span>
                      {isEd?<select value={goal.status} onChange={e=>updateGoal(goal.id,{status:e.target.value})} className="input" style={{padding:"2px 4px",fontSize:10}}>{STATUS_OPTIONS.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}</select>
                      :<span style={{color:st?.color,fontWeight:500}}>{st?.icon} {st?.label}</span>}</div>
                  </div>
                  {(goal.reward||isEd)&&<div style={{marginTop:6,fontSize:10}}><span style={{color:"var(--text-tertiary)",fontWeight:600}}>RECOMPENSA </span>
                    {isEd?<input value={goal.reward||""} onChange={e=>updateGoal(goal.id,{reward:e.target.value})} className="input" style={{padding:"2px 6px",fontSize:10,flex:1}}/>
                    :<span style={{color:"var(--accent)"}}>🏆 {goal.reward}</span>}</div>}
                </div>
                <div style={{padding:"10px 16px"}}>
                  <div className="card-title" style={{marginBottom:6}}>AÇÕES</div>
                  {goal.actions.map((a,ai)=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:9,color:"var(--text-muted)",width:14,textAlign:"right"}}>{ai+1}</span>
                    <CB checked={a.done} onClick={()=>toggleAction(goal.id,a.id)} size={18} activeColor="var(--success)"/>
                    <span style={{fontSize:11,flex:1,textDecoration:a.done?"line-through":"none",opacity:a.done?0.5:1}}>{a.text}</span>
                    {editMode&&<button onClick={()=>removeAction(goal.id,a.id)} className="btn btn-danger"><Trash/></button>}
                  </div>)}
                  {editMode&&<input placeholder="+ Ação..." onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addAction(goal.id,e.target.value);e.target.value=""}}} className="input" style={{width:"100%",padding:"5px 8px",fontSize:10,marginTop:6}}/>}
                </div>
                <div style={{padding:"8px 16px 12px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div style={{fontSize:9}}><span style={{fontWeight:600,color:"var(--text-tertiary)"}}>PRAZO </span>
                    {isEd?<input type="date" value={goal.deadline||""} onChange={e=>updateGoal(goal.id,{deadline:e.target.value})} className="input" style={{padding:"1px 4px",fontSize:9}}/>
                    :<span style={{fontWeight:500}}>{goal.deadline?new Date(goal.deadline+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}):"—"}</span>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:50}}><MiniBar pct={aPct} color="var(--success)"/></div><span style={{fontSize:11,fontWeight:700,color:aPct===100?"var(--success)":"var(--text-primary)"}}>{aPct}%</span></div>
                </div>
              </div>})}
            {editMode&&!showAddGoal&&<button onClick={()=>setShowAddGoal(true)} className="btn-add-trigger" style={{borderRadius:"var(--radius-lg)",padding:30,flexDirection:"column",minHeight:150,justifyContent:"center"}}>
              <Plus s={20}/><span style={{fontSize:11,color:"var(--accent)",fontWeight:500}}>Nova Meta</span></button>}
          </div>

          {editMode&&showAddGoal&&<div className="card" style={{marginTop:14}}>
            <div className="card-title" style={{marginBottom:12}}>NOVA META</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input value={newGoal.title} onChange={e=>setNewGoal({...newGoal,title:e.target.value})} placeholder="Título..." className="input"/>
              <select value={newGoal.category} onChange={e=>setNewGoal({...newGoal,category:e.target.value})} className="input">{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
              <input value={newGoal.reward} onChange={e=>setNewGoal({...newGoal,reward:e.target.value})} placeholder="Recompensa..." className="input"/>
              <input type="date" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal,deadline:e.target.value})} className="input"/>
            </div>
            <div style={{marginTop:10}}>
              {newGoal.actions.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}><span style={{fontSize:10,color:"var(--text-muted)"}}>{i+1}.</span><span style={{fontSize:11}}>{a.text}</span>
                <button onClick={()=>setNewGoal({...newGoal,actions:newGoal.actions.filter((_,j)=>j!==i)})} className="btn" style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",padding:0}}>×</button></div>)}
              <input placeholder="Ação (Enter)..." onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){setNewGoal({...newGoal,actions:[...newGoal.actions,{text:e.target.value.trim(),done:false}]});e.target.value=""}}} className="input" style={{width:"100%",marginTop:4,fontSize:11}}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={addGoal} className="btn btn-primary">Criar</button>
              <button onClick={()=>{setShowAddGoal(false);setNewGoal({title:"",category:"carreira",reward:"",deadline:"",actions:[]})}} className="btn btn-ghost" style={{padding:"6px 14px",fontSize:11}}>Cancelar</button>
            </div>
          </div>}

        </div>
      )}

      {/* ════ PROGRESS TAB ════ */}
      {mainTab==="progress"&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          <div className="tabs" style={{width:"fit-content",marginBottom:16}}>
            {["weekly","monthly","year"].map(v=>(
              <button key={v} className={`tab ${overviewView===v?'tab--active':''}`} onClick={()=>setOverviewView(v)} style={{flex:"none",padding:"6px 14px"}}>
                {{weekly:"Semanal",monthly:"Mensal",year:"Ano"}[v]}
              </button>
            ))}
          </div>

          {overviewView==="weekly"&&<div>
            <div className="grid-overview" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
              <div className="card"><div className="card-title">SEMANA {curWeek}</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginTop:10}}>
                  <Ring progress={stats.todayProgress} size={70} sw={5} color={stats.todayProgress===100?"var(--success)":"var(--accent)"}/>
                  <div><div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{stats.todayDone}/{data.dailyHabits.length}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>hábitos hoje</div></div>
                </div>
              </div>
              <div className="card"><div className="card-title">DIAS DA SEMANA</div>
                <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                  {Array.from({length:Math.min(7,stats.weekEnd-stats.weekStart+1)},(_,i)=>{
                    const d=stats.weekStart+i;if(d>daysInMonth||d<1)return null;
                    const dow=new Date(data.currentYear,data.currentMonth,d).getDay();const dc=stats.dailyCompletions[d-1];const isT=d===todayD;
                    return<div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px",borderRadius:"var(--radius-md)",flex:1,minWidth:36,background:isT?"var(--today-bg)":"var(--bg-tertiary)",border:isT?"1.5px solid var(--accent)":"1px solid var(--border)",transition:"all 0.2s ease"}}>
                      <span style={{fontSize:8,color:"var(--text-tertiary)",fontWeight:600}}>{WEEKDAYS_HEADER[dow]}</span>
                      <span style={{fontSize:14,fontWeight:700}}>{d}</span>
                      <MiniBar pct={(dc?.pct||0)*100} color={dc?.pct>=0.8?"var(--success)":"var(--accent)"} h={3}/>
                      <span style={{fontSize:8,fontWeight:600,color:dc?.pct>=0.8?"var(--success)":"var(--text-tertiary)"}}>{dc?Math.round(dc.pct*100):0}%</span>
                    </div>})}
                </div>
              </div>
            </div>
            <div className="card"><div className="card-title">HÁBITOS ESTA SEMANA</div>
              {stats.habitScores?.map(h=>{let wd=0,wds=0;for(let d=stats.weekStart;d<=Math.min(stats.weekEnd,daysInMonth);d++){wds++;if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])wd++}const wp=wds>0?Math.round((wd/wds)*100):0;
                return<div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:14}}>{h.icon}</span><span style={{fontSize:12,fontWeight:500,flex:1}}>{h.name}</span>
                  <div style={{width:70}}><MiniBar pct={wp} color={wp>=80?"var(--success)":"var(--accent)"}/></div>
                  <span style={{fontSize:12,fontWeight:600,width:45,textAlign:"right",color:wp>=80?"var(--success)":"var(--text-primary)"}}>{wd}/{wds}</span>
                </div>})}
            </div>
          </div>}

          {overviewView==="monthly"&&<div>
            <div className="grid-overview" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
              <div className="card"><div className="card-title">PROGRESSO MENSAL</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginTop:10}}><Ring progress={stats.dailyProgress} size={80} sw={5}/>
                  <div><div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{stats.totalDone}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>de {stats.totalTarget}</div></div></div>
              </div>
              <div className="card"><div className="card-title">RANKING DE CONSISTÊNCIA</div>
                {[...(stats.habitScores||[])].sort((a,b)=>b.pct-a.pct).slice(0,5).map((h,i)=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:11,fontWeight:700,width:18,textAlign:"center",color:i<3?"var(--accent)":"var(--text-muted)"}}>{i+1}</span>
                    <span style={{fontSize:13}}>{h.icon}</span><span style={{fontSize:11,flex:1}}>{h.name}</span>
                    <div style={{width:60}}><MiniBar pct={h.pct} color={h.pct>=100?"var(--success)":h.pct>=80?"var(--accent)":"var(--bar-empty)"}/></div>
                    <span style={{fontSize:11,fontWeight:600,width:36,textAlign:"right",color:h.pct>=100?"var(--success)":"var(--text-primary)"}}>{Math.min(h.pct,999)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card"><div className="card-title">MAPA DE CALOR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:8}}>
                {stats.dailyCompletions?.map(dc=>{const isT=dc.day===todayD;const isF=isCur&&dc.day>todayD;
                  return<div key={dc.day} className="heatmap-cell" style={{
                    background:isF?"var(--bg-tertiary)":dc.pct===0?"var(--heatmap-0)":dc.pct<0.5?"var(--heatmap-1)":dc.pct<0.8?"var(--heatmap-2)":dc.pct<1?"var(--heatmap-3)":"var(--heatmap-4)",
                    color:dc.pct>=0.8&&!isF?"#fff":"var(--text-primary)",border:isT?"2px solid var(--text-primary)":"1px solid transparent",opacity:isF?0.3:1}}>{dc.day}</div>})}
              </div>
              <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}><span style={{fontSize:8,color:"var(--text-tertiary)"}}>Menos</span>
                {["var(--heatmap-0)","var(--heatmap-1)","var(--heatmap-2)","var(--heatmap-3)","var(--heatmap-4)"].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>)}<span style={{fontSize:8,color:"var(--text-tertiary)"}}>Mais</span></div>
            </div>
            {stats.streaks?.length>0&&<div className="card" style={{marginTop:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><FireIc/><span className="card-title">SEQUÊNCIAS ATIVAS</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{stats.streaks.map(h=>(
                <div key={h.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"var(--bg-tertiary)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)"}}>
                  <span>{h.icon}</span><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>{h.streak}d</span>
                </div>))}</div>
            </div>}
          </div>}

          {overviewView==="year"&&<div>
            <div className="card"><div className="card-title">VISÃO ANUAL — {data.currentYear}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10,marginTop:12}}>
                {stats.yearData?.map(yd=>(
                  <div key={yd.month} className={`year-month-card ${yd.isThisMonth?'year-month-card--current':''} ${yd.isFutureMonth?'year-month-card--future':''}`}>
                    <div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:yd.isThisMonth?"var(--accent)":"var(--text-tertiary)",marginBottom:8}}>{MONTHS_SHORT[yd.month].toUpperCase()}</div>
                    <Ring progress={yd.pct} size={48} sw={3} color={yd.pct>=80?"var(--success)":yd.pct>=50?"var(--accent)":"var(--bar-empty)"}/>
                    <div style={{fontSize:9,color:"var(--text-tertiary)",marginTop:6}}>{yd.done}/{yd.target}</div>
                  </div>))}
              </div>
            </div>
            <div className="grid-overview" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:14}}>
              {(()=>{const tyd=stats.yearData?.reduce((s,m)=>s+m.done,0)||0;const tyt=stats.yearData?.reduce((s,m)=>s+m.target,0)||0;const yp=tyt>0?Math.round((tyd/tyt)*100):0;
                const bm=stats.yearData?.filter(m=>!m.isFutureMonth&&m.done>0).sort((a,b)=>b.pct-a.pct)[0];const ma=stats.yearData?.filter(m=>m.done>0).length||0;
                return<>
                  <div className="card"><div className="card-title">TOTAL</div><div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}><Ring progress={yp} size={60} sw={4}/><div><div style={{fontSize:20,fontWeight:700}}>{tyd}</div><div style={{fontSize:10,color:"var(--text-tertiary)"}}>de {tyt}</div></div></div></div>
                  <div className="card"><div className="card-title">MELHOR MÊS</div><div style={{marginTop:8}}><div style={{fontSize:18,fontWeight:700,color:"var(--success)"}}>{bm?MONTHS_PT[bm.month]:"—"}</div><div style={{fontSize:10,color:"var(--text-tertiary)"}}>{bm?`${bm.pct}%`:"Sem dados"}</div></div></div>
                  <div className="card"><div className="card-title">MESES ATIVOS</div><div style={{marginTop:8}}><div style={{fontSize:18,fontWeight:700}}>{ma}/12</div><div style={{fontSize:10,color:"var(--text-tertiary)"}}>com registro</div></div></div>
                </>;})()}
            </div>
          </div>}
        </div>
      )}

      </div>
      {/* ═══ GLASS MODAL - REFLECTION TIP (root level, never clipped) ═══ */}
      {showReflectionTip&&<>
        <div onClick={()=>setShowReflectionTip(false)} className="modal-overlay"/>
        <div className="modal-content">
          <button onClick={()=>setShowReflectionTip(false)} className="modal-close">×</button>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontSize:20,marginBottom:4}}>💡</div>
            <h3 style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:6,letterSpacing:0.3}}>Dica: Reflexão com IA</h3>
            <p style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.7,marginBottom:16}}>
              Para facilitar suas reflexões diárias, use uma IA como assistente. Grave um áudio descrevendo os principais pontos do seu dia e envie junto com o prompt abaixo. A IA vai compilar tudo em um texto organizado — depois é só colar aqui.
            </p>
            <div className="card-title" style={{marginBottom:8}}>COMO USAR</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {[{n:"1",t:"Abra uma IA (Claude, ChatGPT, etc.)"},{n:"2",t:"Cole o prompt abaixo"},{n:"3",t:"Grave um áudio ou digite os pontos do dia"},{n:"4",t:"Copie o resultado e cole nas suas notas"}].map(s=>(
                <div key={s.n} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"var(--accent-subtle)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--accent)",flexShrink:0}}>{s.n}</div>
                  <span style={{fontSize:11,color:"var(--text-primary)"}}>{s.t}</span>
                </div>
              ))}
            </div>
            <div className="card-title" style={{marginBottom:8}}>PROMPT PARA COPIAR</div>
            <div style={{background:"var(--bg-tertiary)",borderRadius:"var(--radius-lg)",border:"1px solid var(--border)",padding:16,fontSize:11,color:"var(--text-primary)",lineHeight:1.8,fontFamily:"var(--font)"}}>
              <div id="reflection-prompt" style={{whiteSpace:"pre-wrap"}}>{`Você é um coach de alta performance e desenvolvimento pessoal. Vou descrever em áudio ou texto os principais pontos do meu dia. Compile minha reflexão em um texto organizado e conciso seguindo esta estrutura:

📌 TÍTULO: Uma frase que resume o dia

🏆 VITÓRIAS DO DIA
- O que fiz bem hoje (ações concretas)

📚 LIÇÕES APRENDIDAS
- Insights, padrões que notei, feedbacks recebidos

⚠️ PONTOS DE MELHORIA
- O que posso fazer diferente amanhã (específico e acionável)

🎯 FOCO PARA AMANHÃ
- 1 a 3 prioridades para o próximo dia

Regras:
- Seja direto e objetivo, sem enrolação
- Use minhas próprias palavras quando possível
- Destaque padrões de comportamento (bons e ruins)
- Se eu mencionar algo que devo parar de fazer, destaque em "cessar"
- Mantenha o tom motivador mas realista
- Máximo 150 palavras no total`}</div>
              <button onClick={()=>{
                const text=document.getElementById('reflection-prompt').innerText;
                navigator.clipboard.writeText(text).then(()=>{
                  const btn=document.getElementById('copy-prompt-btn');
                  if(btn){btn.innerText='✓ Copiado!';setTimeout(()=>{btn.innerText='Copiar prompt'},2000)}
                });
              }} id="copy-prompt-btn" className="btn btn-primary" style={{
                marginTop:12,width:"100%",letterSpacing:0.5,
              }}>Copiar prompt</button>
            </div>
            <p style={{fontSize:10,color:"var(--text-tertiary)",marginTop:14,textAlign:"center",lineHeight:1.5,fontStyle:"italic"}}>
              "Quem reflete sobre o dia, constrói o amanhã com intenção."
            </p>
          </div>
        </div>
      </>}

      <footer className="footer">
        <div className="footer-line"/>
        <span className="footer-text">FOCUS MIND LAB © {data.currentYear}</span>
      </footer>
    </div>
  );
}
