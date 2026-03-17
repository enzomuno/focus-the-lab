import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const WEEKDAYS_HEADER = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const HABIT_ICONS = ["☀️","💪","📖","💧","🧘","⚡","🏃","🎯","✍️","🧠","💤","🥗","🚭","💊","📱","🎵","🧹","📋","🌱","🔥","❤️","💰","📈","🎨","🏋️","🚀","⏰","🍎","🧪","📌"];

const CATEGORIES = [
  { id:"carreira", name:"Carreira", icon:"💼", color:"#a27b5c" },
  { id:"financas", name:"Finanças", icon:"💰", color:"#6b8f71" },
  { id:"saude", name:"Saúde e Bem-Estar", icon:"❤️", color:"#c47a7a" },
  { id:"crescimento", name:"Crescimento Pessoal", icon:"📈", color:"#7a9ec4" },
  { id:"relacionamentos", name:"Relacionamentos", icon:"👥", color:"#b08fc7" },
];
const STATUS_OPTIONS = [
  { id:"not_started", label:"Não iniciado", icon:"○", color:"#b5a898" },
  { id:"in_progress", label:"Em progresso", icon:"◐", color:"#a27b5c" },
  { id:"done", label:"Concluída", icon:"●", color:"#6b8f71" },
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
const Chk=({s=14})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const FireIc=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/></svg>;
const Edit2=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DlIc=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

function IconPicker({cur,onSelect,onClose}){
  return <div style={{position:"absolute",top:"100%",left:0,zIndex:50,marginTop:4,background:"#fff",border:"1px solid #e8e3db",borderRadius:10,padding:10,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",width:210}}>
    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{HABIT_ICONS.map(ic=><button key={ic} onClick={()=>{onSelect(ic);onClose();}} style={{width:30,height:30,borderRadius:5,border:ic===cur?"2px solid #a27b5c":"1px solid #e8e3db",background:ic===cur?"rgba(162,123,92,0.1)":"transparent",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>)}</div>
  </div>;
}

function Ring({progress,size=80,sw=5,color="#a27b5c"}){
  const r=(size-sw)/2,c=r*2*Math.PI,o=c-(Math.min(progress,100)/100)*c;
  return <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8e3db" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease"}}/></svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:size*0.26,fontWeight:700,color:"#2c3639"}}>{Math.round(progress)}%</span></div>
  </div>;
}
function MiniBar({pct,color="#a27b5c",h=4}){
  return <div style={{width:"100%",height:h,background:"#e8e3db",borderRadius:h/2,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:h/2,transition:"width 0.4s ease"}}/></div>;
}
function calcStreak(hId,checks,y,m){let s=0,d=new Date();if(d.getFullYear()!==y||d.getMonth()!==m)return 0;while(d.getMonth()===m&&d.getDate()>=1){if(checks[`${y}-${m}-${d.getDate()}-${hId}`]){s++;d.setDate(d.getDate()-1)}else break}return s}

// Checkbox component
function CB({checked,onClick,disabled,size=22,activeColor="#a27b5c",isToday}){
  return <div className={disabled?"":"hov"} onClick={disabled?undefined:onClick} style={{
    width:size,height:size,borderRadius:4,border:checked?"none":`1.5px solid ${disabled?"#e8e3db":"#d5d0c6"}`,
    background:checked?activeColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
    color:"#fff",opacity:disabled?0.2:1,cursor:disabled?"default":"pointer",
    ...(isToday&&!checked&&!disabled?{borderColor:"#a27b5c",boxShadow:"0 0 0 2px rgba(162,123,92,0.15)"}:{}),
  }}>{checked&&<Chk s={size-8}/>}</div>;
}

// ═══════════════════════════════════════
export default function FocusMindLab() {
  const STORAGE_KEY = "fml-v5";
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
  const scrollRef = useRef(null);

  const today = new Date();

  useEffect(()=>{
    (async()=>{try{
      const r=await window.storage.get(STORAGE_KEY);
      if(r?.value){
        setData(sanitizeData(JSON.parse(r.value)));
      }else setData(sanitizeData(getDefaultData()));
    }catch{setData(sanitizeData(getDefaultData()))}setLoading(false)})();
  },[]);

  const save=useCallback(async(nd)=>{setData(nd);try{await window.storage.set(STORAGE_KEY,JSON.stringify(nd))}catch(e){console.error(e)}},[]);

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
  const exportNotes=()=>{
    const lines=["# Reflexões — Focus Mind Lab",`# ${MONTHS_PT[data.currentMonth]} ${data.currentYear}`,""];
    const maxD=isCur?todayD:daysInMonth;
    for(let d=1;d<=maxD;d++){
      const note=getNote(d);
      if(note.title||note.text){
        const dow=WEEKDAYS_HEADER[new Date(data.currentYear,data.currentMonth,d).getDay()];
        lines.push(`## ${dow}, ${d} de ${MONTHS_PT[data.currentMonth]}`);
        if(note.title)lines.push(`**${note.title}**`);
        if(note.text)lines.push(note.text);
        lines.push("");
      }
    }
    if(lines.length<=3){alert("Nenhuma reflexão registrada neste mês.");return}
    lines.push("---","Analise minhas reflexões diárias acima. Identifique padrões de comportamento, sentimentos recorrentes, áreas de melhoria e progresso. Sugira ajustes práticos para o próximo mês.");
    const blob=new Blob([lines.join("\n")],{type:"text/markdown"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`reflexoes-${MONTHS_SHORT[data.currentMonth].toLowerCase()}-${data.currentYear}.md`;a.click();URL.revokeObjectURL(url);
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

  if(loading||!data)return<div style={{fontFamily:"'Poppins',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f5f2ed"}}><span style={{fontSize:24,letterSpacing:6,fontWeight:300,color:"#2c3639"}}>FOCUS MIND LAB</span></div>;

  return(
    <div style={{fontFamily:"'Poppins',sans-serif",background:"#f5f2ed",minHeight:"100vh",color:"#2c3639"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#f5f2ed}
        ::-webkit-scrollbar{height:6px;width:4px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#a27b5c!important}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .hov{transition:all 0.15s ease;cursor:pointer}.hov:hover{transform:scale(1.05)}
        .rhov:hover{background:rgba(162,123,92,0.04)!important}
        .chov{transition:box-shadow 0.2s}.chov:hover{box-shadow:0 4px 20px rgba(0,0,0,0.06)!important}
        @media(max-width:640px){.hm{display:none!important}.gg{grid-template-columns:1fr!important}.og{grid-template-columns:1fr!important}}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{background:"#fff",borderBottom:"1px solid #e8e3db",padding:"10px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          {/* Row 1: Logo left, Today+User right */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",gap:3,alignItems:"flex-end"}}>
                <div style={{width:3,height:16,background:"#a27b5c",borderRadius:2}}/>
                <div style={{width:3,height:11,background:"#a27b5c",borderRadius:2,opacity:0.6}}/>
                <div style={{width:3,height:16,background:"#a27b5c",borderRadius:2}}/>
              </div>
              <div className="hm">
                <div style={{fontSize:12,fontWeight:700,letterSpacing:3,color:"#2c3639",lineHeight:1}}>FOCUS MIND LAB</div>
                <div style={{fontSize:8,letterSpacing:2,color:"#a27b5c",fontWeight:500,marginTop:1}}>PAINEL DE HÁBITOS</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:"#8a8377",fontWeight:600,letterSpacing:1}}>FML</span>
            </div>
          </div>

          {/* Row 2: HOJE badge centered */}
          {isCur&&<div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#faf8f5",border:"1px solid #e8e3db",borderRadius:8,padding:"4px 14px"}}>
              <span style={{fontSize:9,color:"#8a8377",letterSpacing:1,fontWeight:600}}>HOJE</span>
              <span style={{fontSize:18,fontWeight:700,color:"#2c3639"}}>{todayD}</span>
              <span style={{fontSize:10,color:"#a27b5c",fontWeight:600}}>{Math.round(stats.todayProgress)}%</span>
            </div>
          </div>}

          {/* Row 3: Month nav centered */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <button onClick={()=>nav(-1)} className="hov" style={S.navBtn}><Chev d="l"/></button>
            <div style={{textAlign:"center",minWidth:100}}>
              <div style={{fontSize:14,fontWeight:700,letterSpacing:3,lineHeight:1}}>{MONTHS_PT[data.currentMonth].toUpperCase()}</div>
              <div style={{fontSize:10,color:"#8a8377",marginTop:1}}>{data.currentYear}</div>
              {isCur&&<div style={{fontSize:7,letterSpacing:1.5,color:"#a27b5c",fontWeight:600,marginTop:2}}>✦ Mantenha o Foco ✦</div>}
            </div>
            <button onClick={()=>nav(1)} className="hov" style={S.navBtn}><Chev d="r"/></button>
          </div>
        </div>
      </header>

      {/* ═══ DAILY BAR CHART + STREAK ═══ */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"12px 16px"}}>
        <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
          {/* Bar chart */}
          <div style={{flex:1,background:"#fff",borderRadius:12,border:"1px solid #e8e3db",padding:"12px 10px 8px",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"0 2px"}}>
              <span style={{fontSize:8,letterSpacing:1.2,color:"#8a8377",fontWeight:600}}>PROGRESSO DIÁRIO</span>
              <span style={{fontSize:10,fontWeight:600,color:"#a27b5c"}}>{stats.totalDone}/{stats.totalTarget}</span>
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
                  borderLeft:isSunday?"1.5px solid #e8e3db":"none",
                  paddingLeft:isSunday?1:0,
                }}>
                  <div style={{
                    width:"100%",maxWidth:14,minWidth:3,
                    height:barH,
                    borderRadius:"3px 3px 1px 1px",
                    background:isF?"#ece8e1":isT?"#a27b5c":pct>=80?"#6b8f71":pct>0?"#c4a882":"#e8e3db",
                    transition:"height 0.4s ease",
                    opacity:isF?0.4:1,
                    ...(isT?{boxShadow:"0 0 0 1.5px rgba(162,123,92,0.3)"}:{}),
                  }}/>
                </div>;
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,padding:"0 1px"}}>
              <span style={{fontSize:7,color:"#b5a898"}}>1</span>
              <span style={{fontSize:7,color:"#b5a898"}}>{Math.round(daysInMonth/2)}</span>
              <span style={{fontSize:7,color:"#b5a898"}}>{daysInMonth}</span>
            </div>
          </div>

          {/* Streak glass card */}
          <div style={{
            minWidth:100,borderRadius:12,padding:"14px 16px",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
            background:"linear-gradient(135deg, rgba(162,123,92,0.12) 0%, rgba(220,215,201,0.3) 100%)",
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:"1px solid rgba(162,123,92,0.2)",
            boxShadow:"0 4px 20px rgba(162,123,92,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
            position:"relative",overflow:"hidden",
          }}>
            {/* Glass shine effect */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",borderRadius:"12px 12px 0 0",pointerEvents:"none"}}/>
            <div style={{fontSize:7,letterSpacing:1.5,color:"#8a8377",fontWeight:600,zIndex:1}}>SEQUÊNCIA</div>
            <div style={{fontSize:28,fontWeight:700,color:"#2c3639",lineHeight:1,zIndex:1}}>
              {stats.streaks?.length>0?stats.streaks[0].streak:0}
            </div>
            <div style={{fontSize:8,color:"#a27b5c",fontWeight:600,zIndex:1}}>
              {stats.streaks?.length>0?stats.streaks[0].streak===1?"dia":"dias":"dias"}
            </div>
            {stats.streaks?.length>0&&<div style={{fontSize:10,zIndex:1,marginTop:2}}>🔥</div>}
          </div>
        </div>
      </div>

      {/* ═══ MAIN TABS ═══ */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div style={{display:"flex",gap:2,background:"#e8e3db",borderRadius:8,padding:3,flex:1}}>
          {[{id:"habits",l:"Hábitos"},{id:"goals",l:"Metas"},{id:"progress",l:"Progresso"}].map(t=>(
            <button key={t.id} className="hov" onClick={()=>setMainTab(t.id)} style={{
              flex:1,padding:"7px 10px",fontSize:11,fontWeight:mainTab===t.id?600:500,border:"none",
              background:mainTab===t.id?"#fff":"transparent",borderRadius:6,
              color:mainTab===t.id?"#2c3639":"#8a8377",fontFamily:"'Poppins',sans-serif",
              boxShadow:mainTab===t.id?"0 1px 3px rgba(0,0,0,0.06)":"none",
            }}>{t.l}</button>
          ))}
        </div>
        {mainTab!=="progress"&&<button onClick={toggleEdit} className="hov" style={{
          padding:"6px 12px",fontSize:10,fontWeight:500,border:"1px solid #dcd7c9",
          background:editMode?"#a27b5c":"#fff",borderRadius:6,
          color:editMode?"#fff":"#8a8377",fontFamily:"'Poppins',sans-serif",cursor:"pointer",whiteSpace:"nowrap"
        }}>{editMode?"Salvar":"Editar"}</button>}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px 40px"}}>

      {/* ════ HABITS TAB ════ */}
      {mainTab==="habits"&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          {/* Sub tabs */}
          <div style={{display:"flex",gap:2,marginBottom:12}}>
            {[{id:"daily",l:"Diário"},{id:"weekly",l:"Semanal"},{id:"monthly",l:"Mensal"}].map(t=>(
              <button key={t.id} className="hov" onClick={()=>setHabitSub(t.id)} style={{
                padding:"6px 14px",fontSize:11,fontWeight:habitSub===t.id?600:400,border:"none",
                borderBottom:habitSub===t.id?"2px solid #a27b5c":"2px solid transparent",
                background:"transparent",color:habitSub===t.id?"#2c3639":"#8a8377",
                fontFamily:"'Poppins',sans-serif",cursor:"pointer",
              }}>{t.l}</button>
            ))}
          </div>

          {/* ──── DAILY ──── */}
          {habitSub==="daily"&&(
            <div>
              {/* 3-column layout: Names | Scrollable all days | Progress */}
              <div style={{display:"flex",background:"#fff",borderRadius:12,border:"1px solid #e8e3db",overflow:"hidden"}}>
                {/* Left: habit names */}
                <div style={{flexShrink:0,borderRight:"2px solid #e8e3db",background:"#fff",zIndex:5}}>
                  <div style={{padding:"10px 12px",borderBottom:"2px solid #e8e3db",minHeight:48,display:"flex",alignItems:"flex-end"}}>
                    <span style={{fontSize:9,letterSpacing:1,color:"#8a8377",fontWeight:600}}>HÁBITOS</span>
                  </div>
                  {data.dailyHabits.map((habit,idx)=>(
                    <div key={habit.id} className="rhov" style={{padding:"8px 10px",borderBottom:"1px solid #f0ece6",minHeight:42,display:"flex",alignItems:"center",gap:6,background:idx%2===0?"transparent":"rgba(220,215,201,0.08)"}}>
                      {editMode&&<button onClick={()=>removeHabit("daily",habit.id)} className="hov" style={{background:"none",border:"none",color:"#c47a7a",padding:1,display:"flex",opacity:0.5}}><Trash/></button>}
                      <div style={{position:"relative"}}>
                        <span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===habit.id?null:habit.id)}>{habit.icon}</span>
                        {editMode&&showIconPicker===habit.id&&<IconPicker cur={habit.icon} onSelect={ic=>updateIcon("daily",habit.id,ic)} onClose={()=>setShowIconPicker(null)}/>}
                      </div>
                      <span style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{habit.name}</span>
                    </div>
                  ))}
                </div>

                {/* Middle: scrollable all days with week dividers */}
                <div ref={el=>{scrollRef.current=el;scrollToToday(el)}} style={{flex:1,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"}}>
                  <div style={{display:"inline-flex",flexDirection:"column",minWidth:daysInMonth*46}}>
                    {/* Header */}
                    <div style={{display:"flex",borderBottom:"2px solid #e8e3db"}}>
                      {Array.from({length:daysInMonth},(_,i)=>{
                        const d=i+1;const dow=new Date(data.currentYear,data.currentMonth,d).getDay();
                        const isT=d===todayD;const isF=isFutureDate(data.currentYear,data.currentMonth,d);
                        const isSunday=dow===0&&d>1;
                        return<div key={d} style={{width:46,flexShrink:0,padding:"6px 0",textAlign:"center",
                          borderLeft:isSunday?"2px solid #dcd7c9":"none",
                          background:isT?"rgba(162,123,92,0.08)":"transparent",
                          color:isT?"#a27b5c":isF?"#d5d0c6":"#8a8377",fontWeight:isT?700:500}}>
                          <div style={{fontSize:9,letterSpacing:0.3}}>{WEEKDAYS_HEADER[dow]}</div>
                          <div style={{fontSize:13,fontWeight:isT?700:500,marginTop:1}}>{d}</div>
                        </div>;
                      })}
                    </div>
                    {/* Rows */}
                    {data.dailyHabits.map((habit,idx)=>(
                      <div key={habit.id} style={{display:"flex",borderBottom:"1px solid #f0ece6",background:idx%2===0?"transparent":"rgba(220,215,201,0.08)"}}>
                        {Array.from({length:daysInMonth},(_,i)=>{
                          const d=i+1;const dow=new Date(data.currentYear,data.currentMonth,d).getDay();
                          const k=`${data.currentYear}-${data.currentMonth}-${d}-${habit.id}`;
                          const checked=!!data.dailyChecks[k];const isT=d===todayD;const isF=isFutureDate(data.currentYear,data.currentMonth,d);
                          const isSunday=dow===0&&d>1;
                          return<div key={d} style={{width:46,flexShrink:0,padding:"5px 0",display:"flex",alignItems:"center",justifyContent:"center",minHeight:42,
                            borderLeft:isSunday?"2px solid #dcd7c9":"none",
                            background:isT?"rgba(162,123,92,0.08)":"transparent"}}>
                            <CB checked={checked} onClick={()=>togDaily(d,habit.id)} disabled={isF} isToday={isT} size={24}/>
                          </div>;
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: progress */}
                <div style={{flexShrink:0,borderLeft:"2px solid #e8e3db",background:"#fff",zIndex:5}}>
                  <div style={{padding:"10px 8px",borderBottom:"2px solid #e8e3db",minHeight:48,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                    <span style={{fontSize:8,fontWeight:600,color:"#8a8377",letterSpacing:0.5}}>PROG.</span>
                  </div>
                  {data.dailyHabits.map((habit,idx)=>{
                    const sc=stats.habitScores?.find(h=>h.id===habit.id);
                    const over=sc&&sc.pct>=100;
                    return<div key={habit.id} style={{padding:"5px 8px",borderBottom:"1px solid #f0ece6",minHeight:42,display:"flex",alignItems:"center",justifyContent:"center",background:idx%2===0?"transparent":"rgba(220,215,201,0.08)"}}>
                      <div onClick={()=>setEditingTarget(editingTarget===habit.id?null:habit.id)} style={{cursor:"pointer",textAlign:"center",minWidth:50}}>
                        {editingTarget===habit.id?
                          <input type="number" min={1} max={31} value={habit.target||daysInMonth} autoFocus
                            onChange={e=>save({...data,dailyHabits:data.dailyHabits.map(h=>h.id===habit.id?{...h,target:parseInt(e.target.value)||1}:h)})}
                            onBlur={()=>setEditingTarget(null)}
                            style={{width:34,padding:"2px",fontSize:11,fontWeight:600,border:"1px solid #a27b5c",borderRadius:4,textAlign:"center",fontFamily:"'Poppins',sans-serif"}}/>
                        :<>
                          <div style={{fontSize:11,fontWeight:600,color:over?"#6b8f71":"#2c3639"}}>{sc?.count||0}<span style={{color:"#b5a898",fontWeight:400}}>/</span>{sc?.target||daysInMonth}</div>
                          <MiniBar pct={sc?.pct||0} color={over?"#6b8f71":sc?.pct>=80?"#a27b5c":"#d5d0c6"} h={3}/>
                          <div style={{fontSize:7,fontWeight:600,color:over?"#6b8f71":"#8a8377",marginTop:1}}>{Math.min(sc?.pct||0,999)}%</div>
                        </>}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} style={{width:34,height:34,borderRadius:6,border:"1.5px solid #e8e3db",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hábito..." onKeyDown={e=>e.key==="Enter"&&addHabit("daily")} style={{...S.input,flex:1}} autoFocus/>
                  <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,color:"#8a8377"}}>Meta:</span>
                    <input type="number" value={newTarget} onChange={e=>setNewTarget(parseInt(e.target.value)||1)} min={1} max={31} style={{...S.input,width:42,textAlign:"center",padding:"6px 4px"}}/>
                  </div>
                  <button onClick={()=>addHabit("daily")} className="hov" style={S.addBtn}>+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="hov" style={S.cancelBtn}>×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="hov" style={S.addTrigger}><Plus s={14}/> Novo hábito</button>}
              </div>}

              {/* ──── DAILY NOTES ──── */}
              <div style={{marginTop:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,letterSpacing:1.5,color:"#8a8377",fontWeight:600}}>NOTAS & REFLEXÕES DIÁRIAS</span>
                    <button onClick={()=>setShowReflectionTip(true)} className="hov" style={{
                      width:18,height:18,borderRadius:"50%",border:"1.5px solid #dcd7c9",background:"transparent",
                      fontSize:10,fontWeight:700,color:"#a27b5c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'Poppins',sans-serif",lineHeight:1,
                    }}>?</button>
                  </div>
                  <button onClick={exportNotes} className="hov" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",fontSize:10,fontWeight:500,color:"#a27b5c",border:"1px solid #dcd7c9",borderRadius:6,background:"#fff",cursor:"pointer",fontFamily:"'Poppins',sans-serif"}}>
                    <DlIc/> Exportar para AI
                  </button>
                </div>

                {/* Glass modal - Reflection tip */}
                {showReflectionTip&&<>
                  <div onClick={()=>setShowReflectionTip(false)} style={{position:"fixed",inset:0,background:"rgba(44,54,57,0.4)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",zIndex:200}}/>
                  <div style={{
                    position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,
                    width:"90%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",
                    background:"linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(250,248,245,0.9) 100%)",
                    backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
                    borderRadius:20,border:"1px solid rgba(162,123,92,0.2)",
                    boxShadow:"0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
                    padding:"28px 24px",
                  }}>
                    {/* Glass shine */}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",borderRadius:"20px 20px 0 0",pointerEvents:"none"}}/>

                    {/* Close */}
                    <button onClick={()=>setShowReflectionTip(false)} style={{
                      position:"absolute",top:12,right:12,width:28,height:28,borderRadius:"50%",border:"none",
                      background:"rgba(162,123,92,0.1)",color:"#8a8377",fontSize:16,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Poppins',sans-serif",zIndex:1
                    }}>×</button>

                    {/* Content */}
                    <div style={{position:"relative",zIndex:1}}>
                      <div style={{fontSize:20,marginBottom:4}}>💡</div>
                      <h3 style={{fontSize:15,fontWeight:700,color:"#2c3639",marginBottom:6,letterSpacing:0.3}}>Dica: Reflexão com IA</h3>
                      <p style={{fontSize:12,color:"#5a5248",lineHeight:1.7,marginBottom:16}}>
                        Para facilitar suas reflexões diárias, use uma IA como assistente. Grave um áudio descrevendo os principais pontos do seu dia e envie junto com o prompt abaixo. A IA vai compilar tudo em um texto organizado — depois é só colar aqui.
                      </p>

                      <div style={{fontSize:9,letterSpacing:1.5,color:"#8a8377",fontWeight:600,marginBottom:8}}>COMO USAR</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                        {[
                          {n:"1",t:"Abra uma IA (Claude, ChatGPT, etc.)"},
                          {n:"2",t:"Cole o prompt abaixo"},
                          {n:"3",t:"Grave um áudio ou digite os pontos do dia"},
                          {n:"4",t:"Copie o resultado e cole nas suas notas"},
                        ].map(s=>(
                          <div key={s.n} style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(162,123,92,0.12)",
                              display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#a27b5c",flexShrink:0}}>{s.n}</div>
                            <span style={{fontSize:11,color:"#2c3639"}}>{s.t}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{fontSize:9,letterSpacing:1.5,color:"#8a8377",fontWeight:600,marginBottom:8}}>PROMPT PARA COPIAR</div>
                      <div style={{
                        background:"rgba(44,54,57,0.04)",borderRadius:12,border:"1px solid #e8e3db",
                        padding:16,fontSize:11,color:"#2c3639",lineHeight:1.8,
                        fontFamily:"'Poppins',sans-serif",position:"relative",
                      }}>
                        <div id="reflection-prompt" style={{whiteSpace:"pre-wrap"}}>
{`Você é um coach de alta performance e desenvolvimento pessoal. Vou descrever em áudio ou texto os principais pontos do meu dia. Compile minha reflexão em um texto organizado e conciso seguindo esta estrutura:

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
- Máximo 150 palavras no total`}
                        </div>
                        <button onClick={()=>{
                          const text=document.getElementById('reflection-prompt').innerText;
                          navigator.clipboard.writeText(text).then(()=>{
                            const btn=document.getElementById('copy-prompt-btn');
                            if(btn){btn.innerText='✓ Copiado!';setTimeout(()=>{btn.innerText='Copiar prompt'},2000)}
                          });
                        }} id="copy-prompt-btn" className="hov" style={{
                          marginTop:12,width:"100%",padding:"10px",fontSize:11,fontWeight:600,
                          background:"#a27b5c",color:"#fff",border:"none",borderRadius:8,
                          cursor:"pointer",fontFamily:"'Poppins',sans-serif",letterSpacing:0.5,
                        }}>Copiar prompt</button>
                      </div>

                      <p style={{fontSize:10,color:"#8a8377",marginTop:14,textAlign:"center",lineHeight:1.5,fontStyle:"italic"}}>
                        "Quem reflete sobre o dia, constrói o amanhã com intenção."
                      </p>
                    </div>
                  </div>
                </>}
                <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
                  {Array.from({length:Math.min(isCur?todayD:daysInMonth,daysInMonth)},(_,i)=>{
                    const d=i+1;const note=getNote(d);const hasNote=note.title||note.text;
                    const isSel=selectedNoteDay===d;
                    return<button key={d} onClick={()=>setSelectedNoteDay(isSel?null:d)} className="hov" style={{
                      width:30,height:30,borderRadius:6,border:"none",fontSize:10,fontWeight:isSel?700:500,
                      background:isSel?"#a27b5c":hasNote?"rgba(162,123,92,0.15)":"#e8e3db",
                      color:isSel?"#fff":"#2c3639",cursor:"pointer",fontFamily:"'Poppins',sans-serif",
                      position:"relative",
                    }}>{d}{hasNote&&!isSel&&<div style={{position:"absolute",top:1,right:1,width:5,height:5,borderRadius:"50%",background:"#a27b5c"}}/>}</button>
                  })}
                </div>
                {selectedNoteDay&&(()=>{
                  const note=getNote(selectedNoteDay);
                  const dow=WEEKDAYS_HEADER[new Date(data.currentYear,data.currentMonth,selectedNoteDay).getDay()];
                  return<div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",padding:16}}>
                    <div style={{fontSize:10,color:"#8a8377",marginBottom:8}}>{dow}, {selectedNoteDay} de {MONTHS_PT[data.currentMonth]}</div>
                    <input value={note.title} onChange={e=>saveNote(selectedNoteDay,{title:e.target.value})}
                      placeholder="Título da nota (opcional)..."
                      style={{...S.input,width:"100%",fontWeight:600,fontSize:13,marginBottom:8,padding:"8px 12px"}}/>
                    <textarea value={note.text} onChange={e=>saveNote(selectedNoteDay,{text:e.target.value})}
                      placeholder="Reflexão do dia..."
                      rows={4} style={{width:"100%",padding:"10px 12px",fontSize:12,fontFamily:"'Poppins',sans-serif",border:"1.5px solid #e8e3db",borderRadius:8,background:"#faf8f5",color:"#2c3639",resize:"vertical",outline:"none",lineHeight:1.7}}/>
                  </div>;
                })()}
              </div>
            </div>
          )}

          {/* ──── WEEKLY ──── */}
          {habitSub==="weekly"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",overflow:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}} cellSpacing={0} cellPadding={0}>
                  <thead><tr>
                    <th style={{textAlign:"left",padding:"10px 12px",borderBottom:"2px solid #e8e3db",fontSize:10,letterSpacing:1,color:"#8a8377",fontWeight:600,minWidth:160}}>HÁBITOS SEMANAIS</th>
                    {Array.from({length:weeksInMonth},(_,i)=>{const w=i+1;const isCurW=isCur&&w===curWeek;
                      return<th key={w} style={{padding:"10px 14px",textAlign:"center",fontSize:11,fontWeight:isCurW?700:500,color:isCurW?"#a27b5c":"#8a8377",borderBottom:"2px solid #e8e3db"}}>Sem {w}</th>})}
                    <th style={{padding:"10px",textAlign:"right",fontSize:9,fontWeight:600,color:"#8a8377",borderBottom:"2px solid #e8e3db"}}>%</th>
                  </tr></thead>
                  <tbody>{data.weeklyHabits.map((h,idx)=>{
                    let done=0;for(let w=1;w<=weeksInMonth;w++)if(data.weeklyChecks[`${data.currentYear}-${data.currentMonth}-w${w}-${h.id}`])done++;
                    const pct=weeksInMonth>0?Math.round((done/weeksInMonth)*100):0;
                    return<tr key={h.id} className="rhov" style={{background:idx%2===0?"transparent":"rgba(220,215,201,0.08)"}}>
                      <td style={{padding:"10px 12px",borderBottom:"1px solid #f0ece6"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {editMode&&<button onClick={()=>removeHabit("weekly",h.id)} className="hov" style={{background:"none",border:"none",color:"#c47a7a",padding:1,display:"flex",opacity:0.5}}><Trash/></button>}
                          <div style={{position:"relative"}}><span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===h.id?null:h.id)}>{h.icon}</span>
                            {editMode&&showIconPicker===h.id&&<IconPicker cur={h.icon} onSelect={ic=>updateIcon("weekly",h.id,ic)} onClose={()=>setShowIconPicker(null)}/>}</div>
                          <span style={{fontSize:12,fontWeight:500}}>{h.name}</span>
                        </div>
                      </td>
                      {Array.from({length:weeksInMonth},(_,i)=>{const w=i+1;const k=`${data.currentYear}-${data.currentMonth}-w${w}-${h.id}`;const checked=!!data.weeklyChecks[k];const isCurW=isCur&&w===curWeek;
                        return<td key={w} style={{padding:"10px",textAlign:"center",borderBottom:"1px solid #f0ece6"}}>
                          <CB checked={checked} onClick={()=>togWeekly(w,h.id)} disabled={monthIsFuture} size={28} activeColor="#2c3639" isToday={isCurW}/>
                        </td>})}
                      <td style={{padding:"10px",textAlign:"right",borderBottom:"1px solid #f0ece6"}}><MiniBar pct={pct} color="#2c3639"/><span style={{fontSize:10,fontWeight:600,color:"#8a8377"}}>{pct}%</span></td>
                    </tr>})}</tbody>
                </table>
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} style={{width:34,height:34,borderRadius:6,border:"1.5px solid #e8e3db",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hábito semanal..." onKeyDown={e=>e.key==="Enter"&&addHabit("weekly")} style={{...S.input,flex:1}} autoFocus/>
                  <button onClick={()=>addHabit("weekly")} className="hov" style={S.addBtn}>+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="hov" style={S.cancelBtn}>×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="hov" style={S.addTrigger}><Plus s={14}/> Novo hábito semanal</button>}
              </div>}
            </div>
          )}

          {/* ──── MONTHLY ──── */}
          {habitSub==="monthly"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid #e8e3db",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,letterSpacing:1.5,color:"#8a8377",fontWeight:600}}>TAREFAS DO MÊS</span>
                  <span style={{fontSize:11,color:"#a27b5c",fontWeight:600}}>
                    {data.monthlyHabits.filter(h=>data.monthlyChecks[`${data.currentYear}-${data.currentMonth}-${h.id}`]).length}/{data.monthlyHabits.length}
                  </span>
                </div>
                {data.monthlyHabits.map((h,idx)=>{
                  const k=`${data.currentYear}-${data.currentMonth}-${h.id}`;
                  const checked=!!data.monthlyChecks[k];
                  return<div key={h.id} className="rhov" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid #f0ece6",background:idx%2===0?"transparent":"rgba(220,215,201,0.08)"}}>
                    {editMode&&<button onClick={()=>removeHabit("monthly",h.id)} className="hov" style={{background:"none",border:"none",color:"#c47a7a",padding:1,display:"flex",opacity:0.5}}><Trash/></button>}
                    <CB checked={checked} onClick={()=>togMonthly(h.id)} disabled={monthIsFuture} size={24} activeColor="#6b8f71"/>
                    <div style={{position:"relative"}}><span style={{fontSize:14,cursor:editMode?"pointer":"default"}} onClick={()=>editMode&&setShowIconPicker(showIconPicker===h.id?null:h.id)}>{h.icon}</span>
                      {editMode&&showIconPicker===h.id&&<IconPicker cur={h.icon} onSelect={ic=>updateIcon("monthly",h.id,ic)} onClose={()=>setShowIconPicker(null)}/>}</div>
                    <span style={{fontSize:12,fontWeight:500,flex:1,textDecoration:checked?"line-through":"none",opacity:checked?0.5:1}}>{h.name}</span>
                  </div>})}
              </div>
              {editMode&&<div style={{paddingTop:12}}>
                {showAdd?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setShowIconPicker(showIconPicker==="new"?null:"new")} style={{width:34,height:34,borderRadius:6,border:"1.5px solid #e8e3db",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{newIcon}</button>
                    {showIconPicker==="new"&&<IconPicker cur={newIcon} onSelect={setNewIcon} onClose={()=>setShowIconPicker(null)}/>}
                  </div>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Tarefa mensal..." onKeyDown={e=>e.key==="Enter"&&addHabit("monthly")} style={{...S.input,flex:1}} autoFocus/>
                  <button onClick={()=>addHabit("monthly")} className="hov" style={S.addBtn}>+</button>
                  <button onClick={()=>{setShowAdd(false);setNewName("")}} className="hov" style={S.cancelBtn}>×</button>
                </div>:<button onClick={()=>setShowAdd(true)} className="hov" style={S.addTrigger}><Plus s={14}/> Nova tarefa mensal</button>}
              </div>}
            </div>
          )}
        </div>
      )}

      {/* ════ GOALS TAB ════ */}
      {mainTab==="goals"&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          {/* Areas */}
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",padding:16,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:10,letterSpacing:1.5,color:"#8a8377",fontWeight:600}}>ÁREAS DA VIDA</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Ring progress={stats.goalsProgress} size={38} sw={3} color="#6b8f71"/>
                <div><div style={{fontSize:16,fontWeight:700,lineHeight:1}}>{stats.goalsDone}/{stats.totalGoals}</div><div style={{fontSize:9,color:"#8a8377"}}>atingidas</div></div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {stats.goalsByCategory?.filter(c=>c.total>0).map(cat=>(
                <div key={cat.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#faf8f5",borderRadius:6,fontSize:11}}>
                  <span>{cat.icon}</span><span style={{fontWeight:500}}>{cat.name}</span>
                  <span style={{fontWeight:600,color:cat.color}}>{cat.done}/{cat.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal cards */}
          <div className="gg" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
            {data.goals.map(goal=>{
              const cat=CATEGORIES.find(c=>c.id===goal.category);const st=STATUS_OPTIONS.find(s=>s.id===goal.status);
              const aDone=goal.actions.filter(a=>a.done).length;const aPct=goal.actions.length>0?Math.round((aDone/goal.actions.length)*100):0;
              const isEd=editMode&&editingGoalId===goal.id;
              return<div key={goal.id} className="chov" style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",overflow:"hidden"}}>
                <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f0ece6"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    {isEd?<input value={goal.title} onChange={e=>updateGoal(goal.id,{title:e.target.value})} style={{...S.input,fontSize:13,fontWeight:700,letterSpacing:0.3,flex:1,padding:"4px 8px"}}/>
                    :<h3 style={{fontSize:13,fontWeight:700,letterSpacing:0.3,lineHeight:1.3,flex:1}}>{goal.title.toUpperCase()}</h3>}
                    {editMode&&<div style={{display:"flex",gap:3}}>
                      <button onClick={()=>setEditingGoalId(isEd?null:goal.id)} className="hov" style={{background:"none",border:"none",color:"#a27b5c",padding:3,display:"flex"}}><Edit2/></button>
                      <button onClick={()=>removeGoal(goal.id)} className="hov" style={{background:"none",border:"none",color:"#c47a7a",padding:3,display:"flex"}}><Trash/></button>
                    </div>}
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:8,fontSize:10,flexWrap:"wrap"}}>
                    <div><span style={{color:"#8a8377",fontWeight:600,letterSpacing:0.5}}>CAT </span>
                      {isEd?<select value={goal.category} onChange={e=>updateGoal(goal.id,{category:e.target.value})} style={{...S.input,padding:"2px 4px",fontSize:10}}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
                      :<span style={{color:cat?.color}}>{cat?.icon} {cat?.name}</span>}</div>
                    <div><span style={{color:"#8a8377",fontWeight:600,letterSpacing:0.5}}>STATUS </span>
                      {isEd?<select value={goal.status} onChange={e=>updateGoal(goal.id,{status:e.target.value})} style={{...S.input,padding:"2px 4px",fontSize:10}}>{STATUS_OPTIONS.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}</select>
                      :<span style={{color:st?.color,fontWeight:500}}>{st?.icon} {st?.label}</span>}</div>
                  </div>
                  {(goal.reward||isEd)&&<div style={{marginTop:6,fontSize:10}}><span style={{color:"#8a8377",fontWeight:600}}>RECOMPENSA </span>
                    {isEd?<input value={goal.reward||""} onChange={e=>updateGoal(goal.id,{reward:e.target.value})} style={{...S.input,padding:"2px 6px",fontSize:10,flex:1}}/>
                    :<span style={{color:"#a27b5c"}}>🏆 {goal.reward}</span>}</div>}
                </div>
                <div style={{padding:"10px 16px"}}>
                  <div style={{fontSize:8,letterSpacing:1.2,color:"#8a8377",fontWeight:600,marginBottom:6}}>AÇÕES</div>
                  {goal.actions.map((a,ai)=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:"1px solid #f5f2ed"}}>
                    <span style={{fontSize:9,color:"#b5a898",width:14,textAlign:"right"}}>{ai+1}</span>
                    <CB checked={a.done} onClick={()=>toggleAction(goal.id,a.id)} size={18} activeColor="#6b8f71"/>
                    <span style={{fontSize:11,flex:1,textDecoration:a.done?"line-through":"none",opacity:a.done?0.5:1}}>{a.text}</span>
                    {editMode&&<button onClick={()=>removeAction(goal.id,a.id)} className="hov" style={{background:"none",border:"none",color:"#c47a7a",padding:1,display:"flex",opacity:0.4}}><Trash/></button>}
                  </div>)}
                  {editMode&&<input placeholder="+ Ação..." onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addAction(goal.id,e.target.value);e.target.value=""}}} style={{...S.input,width:"100%",padding:"5px 8px",fontSize:10,marginTop:6}}/>}
                </div>
                <div style={{padding:"8px 16px 12px",borderTop:"1px solid #f0ece6",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div style={{fontSize:9}}><span style={{fontWeight:600,color:"#8a8377"}}>PRAZO </span>
                    {isEd?<input type="date" value={goal.deadline||""} onChange={e=>updateGoal(goal.id,{deadline:e.target.value})} style={{...S.input,padding:"1px 4px",fontSize:9}}/>
                    :<span style={{fontWeight:500}}>{goal.deadline?new Date(goal.deadline+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}):"—"}</span>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:50}}><MiniBar pct={aPct} color="#6b8f71"/></div><span style={{fontSize:11,fontWeight:700,color:aPct===100?"#6b8f71":"#2c3639"}}>{aPct}%</span></div>
                </div>
              </div>})}
            {editMode&&!showAddGoal&&<button onClick={()=>setShowAddGoal(true)} className="hov" style={{background:"transparent",borderRadius:12,border:"2px dashed #dcd7c9",padding:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",minHeight:150}}>
              <Plus s={20}/><span style={{fontSize:11,color:"#a27b5c",fontWeight:500}}>Nova Meta</span></button>}
          </div>

          {editMode&&showAddGoal&&<div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",padding:20,marginTop:14}}>
            <div style={{fontSize:10,letterSpacing:1.5,color:"#8a8377",fontWeight:600,marginBottom:12}}>NOVA META</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input value={newGoal.title} onChange={e=>setNewGoal({...newGoal,title:e.target.value})} placeholder="Título..." style={S.input}/>
              <select value={newGoal.category} onChange={e=>setNewGoal({...newGoal,category:e.target.value})} style={S.input}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
              <input value={newGoal.reward} onChange={e=>setNewGoal({...newGoal,reward:e.target.value})} placeholder="Recompensa..." style={S.input}/>
              <input type="date" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal,deadline:e.target.value})} style={S.input}/>
            </div>
            <div style={{marginTop:10}}>
              {newGoal.actions.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}><span style={{fontSize:10,color:"#b5a898"}}>{i+1}.</span><span style={{fontSize:11}}>{a.text}</span>
                <button onClick={()=>setNewGoal({...newGoal,actions:newGoal.actions.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:"#c47a7a",cursor:"pointer"}}>×</button></div>)}
              <input placeholder="Ação (Enter)..." onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){setNewGoal({...newGoal,actions:[...newGoal.actions,{text:e.target.value.trim(),done:false}]});e.target.value=""}}} style={{...S.input,width:"100%",marginTop:4,fontSize:11}}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={addGoal} className="hov" style={S.addBtn}>Criar</button>
              <button onClick={()=>{setShowAddGoal(false);setNewGoal({title:"",category:"carreira",reward:"",deadline:"",actions:[]})}} className="hov" style={{...S.cancelBtn,padding:"6px 14px",fontSize:11}}>Cancelar</button>
            </div>
          </div>}

        </div>
      )}

      {/* ════ PROGRESS TAB ════ */}
      {mainTab==="progress"&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"flex",gap:2,background:"#e8e3db",borderRadius:8,padding:3,marginBottom:16,width:"fit-content"}}>
            {["weekly","monthly","year"].map(v=>(
              <button key={v} className="hov" onClick={()=>setOverviewView(v)} style={{
                padding:"6px 14px",fontSize:11,fontWeight:overviewView===v?600:500,border:"none",
                background:overviewView===v?"#fff":"transparent",borderRadius:6,
                color:overviewView===v?"#2c3639":"#8a8377",fontFamily:"'Poppins',sans-serif",
                boxShadow:overviewView===v?"0 1px 3px rgba(0,0,0,0.06)":"none",
              }}>{{weekly:"Semanal",monthly:"Mensal",year:"Ano"}[v]}</button>
            ))}
          </div>

          {overviewView==="weekly"&&<div>
            <div className="og" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
              <div style={S.card}><div style={S.cardT}>SEMANA {curWeek}</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginTop:10}}>
                  <Ring progress={stats.todayProgress} size={70} sw={5} color={stats.todayProgress===100?"#6b8f71":"#a27b5c"}/>
                  <div><div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{stats.todayDone}/{data.dailyHabits.length}</div><div style={{fontSize:11,color:"#8a8377"}}>hábitos hoje</div></div>
                </div>
              </div>
              <div style={S.card}><div style={S.cardT}>DIAS DA SEMANA</div>
                <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                  {Array.from({length:Math.min(7,stats.weekEnd-stats.weekStart+1)},(_,i)=>{
                    const d=stats.weekStart+i;if(d>daysInMonth||d<1)return null;
                    const dow=new Date(data.currentYear,data.currentMonth,d).getDay();const dc=stats.dailyCompletions[d-1];const isT=d===todayD;
                    return<div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px",borderRadius:8,flex:1,minWidth:36,background:isT?"rgba(162,123,92,0.08)":"#faf8f5",border:isT?"1.5px solid #a27b5c":"1px solid #e8e3db"}}>
                      <span style={{fontSize:8,color:"#8a8377",fontWeight:600}}>{WEEKDAYS_HEADER[dow]}</span>
                      <span style={{fontSize:14,fontWeight:700}}>{d}</span>
                      <MiniBar pct={(dc?.pct||0)*100} color={dc?.pct>=0.8?"#6b8f71":"#a27b5c"} h={3}/>
                      <span style={{fontSize:8,fontWeight:600,color:dc?.pct>=0.8?"#6b8f71":"#8a8377"}}>{dc?Math.round(dc.pct*100):0}%</span>
                    </div>})}
                </div>
              </div>
            </div>
            <div style={S.card}><div style={S.cardT}>HÁBITOS ESTA SEMANA</div>
              {stats.habitScores?.map(h=>{let wd=0,wds=0;for(let d=stats.weekStart;d<=Math.min(stats.weekEnd,daysInMonth);d++){wds++;if(data.dailyChecks[`${data.currentYear}-${data.currentMonth}-${d}-${h.id}`])wd++}const wp=wds>0?Math.round((wd/wds)*100):0;
                return<div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f2ed"}}>
                  <span style={{fontSize:14}}>{h.icon}</span><span style={{fontSize:12,fontWeight:500,flex:1}}>{h.name}</span>
                  <div style={{width:70}}><MiniBar pct={wp} color={wp>=80?"#6b8f71":"#a27b5c"}/></div>
                  <span style={{fontSize:12,fontWeight:600,width:45,textAlign:"right",color:wp>=80?"#6b8f71":"#2c3639"}}>{wd}/{wds}</span>
                </div>})}
            </div>
          </div>}

          {overviewView==="monthly"&&<div>
            <div className="og" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
              <div style={S.card}><div style={S.cardT}>PROGRESSO MENSAL</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginTop:10}}><Ring progress={stats.dailyProgress} size={80} sw={5}/>
                  <div><div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{stats.totalDone}</div><div style={{fontSize:11,color:"#8a8377"}}>de {stats.totalTarget}</div></div></div>
              </div>
              <div style={S.card}><div style={S.cardT}>RANKING DE CONSISTÊNCIA</div>
                {[...(stats.habitScores||[])].sort((a,b)=>b.pct-a.pct).slice(0,5).map((h,i)=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f2ed"}}>
                    <span style={{fontSize:11,fontWeight:700,width:18,textAlign:"center",color:i<3?"#a27b5c":"#b5a898"}}>{i+1}</span>
                    <span style={{fontSize:13}}>{h.icon}</span><span style={{fontSize:11,flex:1}}>{h.name}</span>
                    <div style={{width:60}}><MiniBar pct={h.pct} color={h.pct>=100?"#6b8f71":h.pct>=80?"#a27b5c":"#c4bdb0"}/></div>
                    <span style={{fontSize:11,fontWeight:600,width:36,textAlign:"right",color:h.pct>=100?"#6b8f71":"#2c3639"}}>{Math.min(h.pct,999)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.card}><div style={S.cardT}>MAPA DE CALOR</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:8}}>
                {stats.dailyCompletions?.map(dc=>{const isT=dc.day===todayD;const isF=isCur&&dc.day>todayD;
                  return<div key={dc.day} style={{width:28,height:28,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,
                    background:isF?"#f0ece6":dc.pct===0?"#e8e3db":dc.pct<0.5?"#dcd0b8":dc.pct<0.8?"#c4a882":dc.pct<1?"#a27b5c":"#6b8f71",
                    color:dc.pct>=0.8&&!isF?"#fff":"#2c3639",border:isT?"2px solid #2c3639":"1px solid transparent",opacity:isF?0.3:1}}>{dc.day}</div>})}
              </div>
              <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}><span style={{fontSize:8,color:"#8a8377"}}>Menos</span>
                {["#e8e3db","#dcd0b8","#c4a882","#a27b5c","#6b8f71"].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>)}<span style={{fontSize:8,color:"#8a8377"}}>Mais</span></div>
            </div>
            {stats.streaks?.length>0&&<div style={{...S.card,marginTop:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><FireIc/><span style={S.cardT}>SEQUÊNCIAS ATIVAS</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{stats.streaks.map(h=>(
                <div key={h.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#faf8f5",borderRadius:6,border:"1px solid #e8e3db"}}>
                  <span>{h.icon}</span><span style={{fontSize:11}}>{h.name}</span><span style={{fontSize:13,fontWeight:700,color:"#a27b5c"}}>{h.streak}d</span>
                </div>))}</div>
            </div>}
          </div>}

          {overviewView==="year"&&<div>
            <div style={S.card}><div style={S.cardT}>VISÃO ANUAL — {data.currentYear}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10,marginTop:12}}>
                {stats.yearData?.map(yd=>(
                  <div key={yd.month} style={{padding:12,borderRadius:8,textAlign:"center",
                    background:yd.isThisMonth?"rgba(162,123,92,0.08)":"#faf8f5",border:yd.isThisMonth?"1.5px solid #a27b5c":"1px solid #e8e3db",opacity:yd.isFutureMonth?0.3:1}}>
                    <div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:yd.isThisMonth?"#a27b5c":"#8a8377",marginBottom:8}}>{MONTHS_SHORT[yd.month].toUpperCase()}</div>
                    <Ring progress={yd.pct} size={48} sw={3} color={yd.pct>=80?"#6b8f71":yd.pct>=50?"#a27b5c":"#c4bdb0"}/>
                    <div style={{fontSize:9,color:"#8a8377",marginTop:6}}>{yd.done}/{yd.target}</div>
                  </div>))}
              </div>
            </div>
            <div className="og" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:14}}>
              {(()=>{const tyd=stats.yearData?.reduce((s,m)=>s+m.done,0)||0;const tyt=stats.yearData?.reduce((s,m)=>s+m.target,0)||0;const yp=tyt>0?Math.round((tyd/tyt)*100):0;
                const bm=stats.yearData?.filter(m=>!m.isFutureMonth&&m.done>0).sort((a,b)=>b.pct-a.pct)[0];const ma=stats.yearData?.filter(m=>m.done>0).length||0;
                return<>
                  <div style={S.card}><div style={S.cardT}>TOTAL</div><div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}><Ring progress={yp} size={60} sw={4}/><div><div style={{fontSize:20,fontWeight:700}}>{tyd}</div><div style={{fontSize:10,color:"#8a8377"}}>de {tyt}</div></div></div></div>
                  <div style={S.card}><div style={S.cardT}>MELHOR MÊS</div><div style={{marginTop:8}}><div style={{fontSize:18,fontWeight:700,color:"#6b8f71"}}>{bm?MONTHS_PT[bm.month]:"—"}</div><div style={{fontSize:10,color:"#8a8377"}}>{bm?`${bm.pct}%`:"Sem dados"}</div></div></div>
                  <div style={S.card}><div style={S.cardT}>MESES ATIVOS</div><div style={{marginTop:8}}><div style={{fontSize:18,fontWeight:700}}>{ma}/12</div><div style={{fontSize:10,color:"#8a8377"}}>com registro</div></div></div>
                </>;})()}
            </div>
          </div>}
        </div>
      )}

      </div>
      <footer style={{padding:16,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <div style={{width:30,height:2,background:"#dcd7c9",borderRadius:1}}/><span style={{fontSize:8,letterSpacing:2,color:"#b5a898"}}>FOCUS MIND LAB © {data.currentYear}</span>
      </footer>
    </div>
  );
}

const S={
  navBtn:{background:"none",border:"1px solid #e8e3db",borderRadius:6,padding:"5px 7px",color:"#2c3639",cursor:"pointer",display:"flex",alignItems:"center"},
  navBtnSm:{background:"none",border:"1px solid #e8e3db",borderRadius:6,padding:"4px 6px",color:"#2c3639",cursor:"pointer",display:"flex",alignItems:"center"},
  input:{padding:"7px 10px",fontSize:12,border:"1.5px solid #e8e3db",borderRadius:6,fontFamily:"'Poppins',sans-serif",background:"#fff",color:"#2c3639"},
  addBtn:{padding:"7px 14px",fontSize:14,fontWeight:600,background:"#a27b5c",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontFamily:"'Poppins',sans-serif"},
  cancelBtn:{padding:"4px 10px",fontSize:16,background:"none",border:"1px solid #e8e3db",borderRadius:6,color:"#8a8377",cursor:"pointer",lineHeight:1},
  addTrigger:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:11,fontWeight:500,color:"#a27b5c",border:"1.5px dashed #d5d0c6",background:"transparent",borderRadius:8,cursor:"pointer",fontFamily:"'Poppins',sans-serif"},
  card:{background:"#fff",borderRadius:12,border:"1px solid #e8e3db",padding:18},
  cardT:{fontSize:10,letterSpacing:1.2,color:"#8a8377",fontWeight:600},
};
