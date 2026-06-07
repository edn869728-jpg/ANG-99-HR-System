/*
  ANG HR Schedule Cycle Fix v1
  目的：修正員工端「請假/排班」頁週選休與月選休 UI。
  - 週選休：依 week_start_day / weekOpen 算 7 天週期，日期以結果列顯示，不再顯示每日按鈕。
  - 月選休：依 month_start_day / monthOpen 算完整月週期，例如 8 號～下月 7 號，顯示完整週期月曆。
  - 防呆：date / 日期 / workDate、shift / 班別、name / 姓名、id / 員編 都能吃。
*/
(function(){
  'use strict';

  var FIX_MARK = 'ang-schedule-cycle-fix-v1';
  var DAY_NAMES = ['週日','週一','週二','週三','週四','週五','週六'];
  var WEEKDAY_MAP = {
    '日':0,'天':0,'星期日':0,'週日':0,'周日':0,'sunday':0,'sun':0,
    '一':1,'星期一':1,'週一':1,'周一':1,'monday':1,'mon':1,
    '二':2,'星期二':2,'週二':2,'周二':2,'tuesday':2,'tue':2,
    '三':3,'星期三':3,'週三':3,'周三':3,'wednesday':3,'wed':3,
    '四':4,'星期四':4,'週四':4,'周四':4,'thursday':4,'thu':4,
    '五':5,'星期五':5,'週五':5,'周五':5,'friday':5,'fri':5,
    '六':6,'星期六':6,'週六':6,'周六':6,'saturday':6,'sat':6
  };

  function qs(sel, root){return (root||document).querySelector(sel)}
  function qsa(sel, root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function pad2(n){return String(n).padStart(2,'0')}
  function html(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
  function cloneDate(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12,0,0,0)}
  function todayNoon(){return cloneDate(new Date())}
  function iso(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())}
  function md(d){return (d.getMonth()+1)+'/'+d.getDate()}
  function ymd(d){return d.getFullYear()+'/'+pad2(d.getMonth()+1)+'/'+pad2(d.getDate())}
  function rangeLabel(p){return md(p.start)+'～'+md(p.end)}
  function addDays(d,n){var x=cloneDate(d);x.setDate(x.getDate()+Number(n||0));return x}
  function addMonths(d,n){var x=cloneDate(d);var day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+Number(n||0));var max=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(day,max));return x}
  function parseDate(v){
    if(!v && v!==0)return null;
    if(v instanceof Date && !isNaN(v.getTime()))return cloneDate(v);
    var s=String(v).trim();
    if(!s)return null;
    s=s.replace(/[年月]/g,'/').replace(/[日]/g,'').replace(/-/g,'/');
    if(/^\d{8}$/.test(s))s=s.slice(0,4)+'/'+s.slice(4,6)+'/'+s.slice(6,8);
    var m=s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if(m){
      var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
      return isNaN(d.getTime())?null:d;
    }
    var t=new Date(s);
    return isNaN(t.getTime())?null:cloneDate(t);
  }

  function getGlobalState(){
    return window.state || window.ANG_HR_STATE || {};
  }

  function firstVal(){
    for(var i=0;i<arguments.length;i++){
      var v=arguments[i];
      if(v!==undefined && v!==null && String(v).trim()!=='')return v;
    }
    return '';
  }

  function parseWeekday(v, fallback){
    if(v===undefined || v===null || String(v).trim()==='')return fallback;
    if(typeof v==='number'){
      if(v>=0 && v<=6)return v;
      if(v>=1 && v<=7)return v===7?0:v;
    }
    var s=String(v).trim().toLowerCase();
    var direct=WEEKDAY_MAP[s];
    if(direct!==undefined)return direct;
    var zh=String(v).match(/[日天一二三四五六]/);
    if(zh && WEEKDAY_MAP[zh[0]]!==undefined)return WEEKDAY_MAP[zh[0]];
    var n=s.match(/\d+/);
    if(n){
      var num=Number(n[0]);
      if(num>=0 && num<=6)return num;
      if(num>=1 && num<=7)return num===7?0:num;
    }
    return fallback;
  }

  function parseMonthDay(v, fallback){
    if(v===undefined || v===null || String(v).trim()==='')return fallback;
    var n=Number(String(v).match(/\d+/) && String(v).match(/\d+/)[0]);
    if(!isFinite(n))return fallback;
    return Math.min(31,Math.max(1,Math.floor(n)));
  }

  function readSettings(){
    var st=getGlobalState();
    var boot=window.__ANG_LAST_BOOTSTRAP || {};
    var cfg=st.adminSalaryConfig || st.preselectSettings || st.scheduleSettings || st.system || boot.preselectSettings || boot.scheduleSettings || boot.system || {};
    var modeRaw=String(firstVal(
      cfg.schedule_mode,cfg.scheduleMode,cfg.mode,cfg.preselect_mode,cfg.preselectMode,
      st.scheduleMode,st.preselectMode,boot.schedule_mode,boot.mode,'week'
    )).toLowerCase();
    var mode=modeRaw.indexOf('month')>-1 || modeRaw.indexOf('月')>-1 ? 'month':'week';
    var weekStart=parseWeekday(firstVal(
      cfg.week_start_day,cfg.weekStartDay,cfg.weekStart,cfg.week_open_day,cfg.weekOpenDay,cfg.weekOpen,
      st.week_start_day,st.weekStartDay,boot.week_start_day,boot.weekStartDay
    ),1);
    var monthStart=parseMonthDay(firstVal(
      cfg.month_start_day,cfg.monthStartDay,cfg.monthStart,cfg.month_open_day,cfg.monthOpenDay,cfg.monthOpen,
      st.month_start_day,st.monthStartDay,boot.month_start_day,boot.monthStartDay
    ),1);
    return {mode:mode,weekStartDay:weekStart,monthStartDay:monthStart,raw:cfg};
  }

  function getOffset(){
    var st=getGlobalState();
    var n=Number(firstVal(st.scheduleWeekOffset,st.schedulePeriodOffset,window.scheduleWeekOffset,0));
    return isFinite(n)?n:0;
  }

  function getWeekPeriod(offset){
    var settings=readSettings();
    var base=todayNoon();
    var diff=(base.getDay()-settings.weekStartDay+7)%7;
    var start=addDays(base,-diff+(Number(offset||0)*7));
    var end=addDays(start,6);
    var days=[];
    for(var i=0;i<7;i++)days.push(addDays(start,i));
    return {type:'week',start:start,end:end,days:days,settings:settings};
  }

  function startOfMonthCycle(base, startDay){
    var d=cloneDate(base);
    var maxThis=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    var sd=Math.min(startDay,maxThis);
    var start=new Date(d.getFullYear(),d.getMonth(),sd,12,0,0,0);
    if(d.getDate()<sd){
      start=new Date(d.getFullYear(),d.getMonth()-1,1,12,0,0,0);
      var maxPrev=new Date(start.getFullYear(),start.getMonth()+1,0).getDate();
      start.setDate(Math.min(startDay,maxPrev));
    }
    return start;
  }

  function getMonthPeriod(offset){
    var settings=readSettings();
    var start=startOfMonthCycle(todayNoon(),settings.monthStartDay);
    start=addMonths(start,Number(offset||0));
    var next=addMonths(start,1);
    var end=addDays(next,-1);
    var days=[];
    for(var d=cloneDate(start);d<=end;d=addDays(d,1))days.push(cloneDate(d));
    return {type:'month',start:start,end:end,days:days,settings:settings};
  }

  function normalizeRecord(item){
    if(!item)return null;
    var date=parseDate(firstVal(item.date,item.Date,item.start,item.Start,item.startDate,item.workDate,item.scheduleDate,item.shiftDate,item.day,item['日期'],item['工作日期'],item['排班日期']));
    if(!date)return null;
    return {
      date:date,
      iso:iso(date),
      id:firstVal(item.id,item.empId,item.employeeId,item.userId,item['員編'],item['員工編號']),
      name:firstVal(item.name,item.empName,item.employeeName,item.nickname,item['姓名'],item['員工姓名'],item['暱稱']),
      shift:firstVal(item.shift,item.shiftName,item.className,item.workShift,item.title,item.Title,item['班別'],item['班次']),
      status:firstVal(item.status,item.state,item['狀態'],item['排班狀態']),
      color:firstVal(item.color,item.bgColor,item.backgroundColor,item['顏色']),
      raw:item
    };
  }

  function collectRecords(){
    var st=getGlobalState();
    var boot=window.__ANG_LAST_BOOTSTRAP || {};
    var buckets=[
      st.publishedScheduleEvents,st.publishedSchedule,st.scheduleRecords,st.scheduleList,st.schedules,st.calendarSchedules,st.scheduleEvents,
      boot.publishedSchedule,boot.scheduleRecords,boot.scheduleList,boot.schedules,boot.calendarSchedules,boot.scheduleEvents,
      boot.data && boot.data.publishedSchedule, boot.data && boot.data.scheduleList
    ];
    var out=[];
    buckets.forEach(function(arr){
      if(!Array.isArray(arr))return;
      arr.forEach(function(x){var r=normalizeRecord(x);if(r)out.push(r)});
    });
    return out;
  }

  function recordByDate(){
    var map={};
    collectRecords().forEach(function(r){
      if(!map[r.iso])map[r.iso]=[];
      map[r.iso].push(r);
    });
    return map;
  }

  function selectedLabel(idx, dateIso, records){
    var st=getGlobalState();
    if(records && records.length){
      var r=records[0];
      var status=String(r.status||'');
      if(/休|off|rest|holiday/i.test(status))return {text:'休',cls:'rest'};
      if(r.shift)return {text:'已排班｜'+r.shift,cls:'work'};
      if(status)return {text:status,cls:'work'};
      return {text:'已發布',cls:'work'};
    }
    var sel=Array.isArray(st.selectedWeekdays)?st.selectedWeekdays:[];
    var selDates=Array.isArray(st.selectedDates)?st.selectedDates:[];
    var restDates=Array.isArray(st.selectedRestDates)?st.selectedRestDates:[];
    if(restDates.indexOf(dateIso)>-1)return {text:'休',cls:'rest'};
    if(selDates.indexOf(dateIso)>-1)return {text:'可上班',cls:'work'};
    if(sel.length){
      return sel.indexOf(idx)>-1 ? {text:'可上班',cls:'work'} : {text:'休',cls:'rest'};
    }
    return {text:'尚未發布',cls:'empty'};
  }

  function ensureStyles(){
    if(document.getElementById(FIX_MARK+'-style'))return;
    var style=document.createElement('style');
    style.id=FIX_MARK+'-style';
    style.textContent=[
      '.ang-cycle-note{margin:8px 0 10px;padding:10px 12px;border-radius:16px;background:linear-gradient(180deg,#fff,rgba(var(--emp-rgb),.08));border:1px solid rgba(var(--emp-rgb),.14);font-size:12px;font-weight:900;color:var(--muted);line-height:1.45}',
      '.weekday-strip.ang-cycle-week-list{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin-bottom:10px!important}',
      '.ang-cycle-row{display:grid;grid-template-columns:86px 1fr auto;gap:8px;align-items:center;padding:12px;border-radius:16px;background:#fff;border:1px solid rgba(var(--emp-rgb),.12);box-shadow:0 6px 16px rgba(var(--emp-rgb),.05)}',
      '.ang-cycle-date{font-weight:1000;color:var(--emp-deep);font-size:13px;line-height:1.2}',
      '.ang-cycle-sub{font-weight:900;color:var(--muted);font-size:12px;line-height:1.2}',
      '.ang-cycle-status{border-radius:999px;padding:6px 10px;font-size:12px;font-weight:1000;white-space:nowrap;background:#f3f4f6;color:#6b7280}',
      '.ang-cycle-status.work{background:#ecfdf5;color:#047857}.ang-cycle-status.rest{background:#fff7ed;color:#c2410c}.ang-cycle-status.empty{background:#f3f4f6;color:#6b7280}',
      '.ang-cycle-month-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 0 10px}.ang-cycle-month-head b{font-size:15px;color:var(--emp-deep)}.ang-cycle-month-head span{font-size:12px;color:var(--muted);font-weight:900}',
      '.ang-cycle-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;background:#fff;border-radius:18px;padding:8px;border:1px solid rgba(var(--emp-rgb),.12)}',
      '.ang-cycle-day{min-height:72px;border-radius:14px;padding:7px 6px;background:linear-gradient(180deg,#fff,rgba(var(--emp-rgb),.045));border:1px solid rgba(var(--emp-rgb),.10);display:flex;flex-direction:column;gap:4px;cursor:pointer}',
      '.ang-cycle-day:active{transform:scale(.98)}.ang-cycle-day.work{background:#ecfdf5;border-color:#a7f3d0}.ang-cycle-day.rest{background:#fff7ed;border-color:#fed7aa}',
      '.ang-cycle-day .d{font-size:13px;font-weight:1000;color:var(--emp-deep)}.ang-cycle-day .w{font-size:10px;font-weight:900;color:var(--muted)}.ang-cycle-day .s{margin-top:auto;font-size:10px;font-weight:1000;line-height:1.25;color:#374151;word-break:break-word}',
      '@media(max-width:420px){.ang-cycle-row{grid-template-columns:76px 1fr auto;padding:10px}.ang-cycle-month-grid{gap:4px;padding:6px}.ang-cycle-day{min-height:66px;padding:6px 4px}.ang-cycle-day .d{font-size:12px}.ang-cycle-day .s{font-size:9px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function updateTabs(){
    var mode=readSettings().mode;
    var tabs=qsa('.week-tabs button');
    if(!tabs.length)return;
    if(mode==='month'){
      var p0=getMonthPeriod(0), p1=getMonthPeriod(1);
      if(tabs[0])tabs[0].innerHTML='本期排班\n'+rangeLabel(p0);
      if(tabs[1])tabs[1].innerHTML='下期排班\n'+rangeLabel(p1);
    }else{
      var w0=getWeekPeriod(0), w1=getWeekPeriod(1);
      if(tabs[0])tabs[0].innerHTML='本週排班\n'+rangeLabel(w0);
      if(tabs[1])tabs[1].innerHTML='下週排班\n'+rangeLabel(w1);
    }
  }

  function updateTitle(period){
    var title=qs('.calendar-title .t') || qs('#scheduleCalendarTitle') || qs('#scheduleTitle');
    var sub=qs('.calendar-title .s') || qs('#scheduleCalendarSub') || qs('#scheduleSub');
    if(title)title.textContent=(period.type==='month'?'本期排班':'週期排班')+'（'+rangeLabel(period)+'）';
    if(sub)sub.textContent=period.type==='month'?'月選休':'週選休';
  }

  function renderWeek(){
    ensureStyles();
    var offset=getOffset();
    var period=getWeekPeriod(offset);
    updateTabs();
    updateTitle(period);
    var strip=qs('#weekdayStrip') || qs('.weekday-strip');
    if(!strip)return;
    strip.classList.add('ang-cycle-week-list');
    var map=recordByDate();
    strip.innerHTML=period.days.map(function(d,idx){
      var key=iso(d);
      var records=map[key]||[];
      var lab=selectedLabel(idx,key,records);
      var extra='';
      if(records.length){
        extra=records.map(function(r){return [r.name,r.id].filter(Boolean).join(' / ')}).filter(Boolean).slice(0,2).join('、');
      }
      return '<div class="ang-cycle-row" data-date="'+key+'">'+
        '<div><div class="ang-cycle-date">'+DAY_NAMES[d.getDay()]+'</div><div class="ang-cycle-sub">'+md(d)+'</div></div>'+
        '<div><div class="ang-cycle-date">'+ymd(d)+'</div><div class="ang-cycle-sub">'+html(extra||'週選休結果列')+'</div></div>'+
        '<div class="ang-cycle-status '+lab.cls+'">'+html(lab.text)+'</div>'+
      '</div>';
    }).join('');
    insertNote(strip,'週選休模式：依系統設定的起始星期計算 7 天週期；日期只顯示結果，不再做每日二次按鈕選擇。');
  }

  function toggleMonthDate(dateIso){
    var st=getGlobalState();
    if(!Array.isArray(st.selectedDates))st.selectedDates=[];
    var i=st.selectedDates.indexOf(dateIso);
    if(i>-1)st.selectedDates.splice(i,1);else st.selectedDates.push(dateIso);
    if(Array.isArray(st.selectedDates)){var p=getMonthPeriod(getOffset());st.selectedWeekdays=p.days.map(function(d,i){return st.selectedDates.indexOf(iso(d))>-1?i:null}).filter(function(v){return v!==null});}
    if(typeof window.updateScheduleConfirmNote==='function')setTimeout(function(){try{window.updateScheduleConfirmNote()}catch(e){}},0);
    renderMonth();
  }

  function renderMonth(){
    ensureStyles();
    var offset=getOffset();
    var period=getMonthPeriod(offset);
    updateTabs();
    updateTitle(period);
    var cal=qs('#cal-main') || qs('.calendar-box') || qs('#scheduleCalendar');
    var strip=qs('#weekdayStrip') || qs('.weekday-strip');
    if(strip){strip.classList.remove('ang-cycle-week-list');strip.innerHTML='';insertNote(strip,'月選休模式：下方改為完整週期月曆，起始日依系統 month_start_day / monthOpen 設定。');}
    if(!cal)return;
    var map=recordByDate();
    var st=getGlobalState();
    var selectedDates=Array.isArray(st.selectedDates)?st.selectedDates:[];
    var htmlDays=period.days.map(function(d,idx){
      var key=iso(d);
      var records=map[key]||[];
      var lab=selectedLabel(idx,key,records);
      if(selectedDates.indexOf(key)>-1)lab={text:'可上班',cls:'work'};
      var title=lab.text;
      if(records.length){
        var r=records[0];
        title=r.shift?('班別 '+r.shift):lab.text;
      }
      return '<div class="ang-cycle-day '+lab.cls+'" data-date="'+key+'" role="button">'+
        '<div class="d">'+md(d)+'</div><div class="w">'+DAY_NAMES[d.getDay()]+'</div><div class="s">'+html(title)+'</div>'+
      '</div>';
    }).join('');
    cal.innerHTML='<div class="ang-cycle-month-head"><b>'+ymd(period.start)+' ～ '+ymd(period.end)+'</b><span>月選休週期｜'+period.days.length+' 天</span></div><div class="ang-cycle-month-grid">'+htmlDays+'</div>';
    qsa('.ang-cycle-day',cal).forEach(function(el){
      el.addEventListener('click',function(){toggleMonthDate(el.getAttribute('data-date'))});
    });
  }

  function insertNote(anchor,text){
    if(!anchor || !anchor.parentNode)return;
    var old=anchor.parentNode.querySelector('.ang-cycle-note');
    if(!old){old=document.createElement('div');old.className='ang-cycle-note';anchor.parentNode.insertBefore(old,anchor.nextSibling)}
    old.textContent=text;
  }

  function render(){
    try{
      var mode=readSettings().mode;
      if(mode==='month')renderMonth();else renderWeek();
    }catch(e){
      try{console.error('[ANG_SCHEDULE_CYCLE_FIX]',e)}catch(_e){}
    }
  }

  function wrapFunction(name, afterDelay){
    var old=window[name];
    if(typeof old!=='function' || old.__angCycleWrapped)return;
    var wrapped=function(){
      var ret=old.apply(this,arguments);
      setTimeout(render,afterDelay||80);
      return ret;
    };
    wrapped.__angCycleWrapped=true;
    wrapped.__old=old;
    window[name]=wrapped;
  }


  function getAuthPayload(){
    var st=getGlobalState();
    var ctx=window.APP_CTX || window.CTX || {};
    return {
      id:firstVal(st.employeeId,st.userId,ctx.id,localStorage.getItem('ang_employee_id')),
      token:firstVal(st.userToken,st.token,ctx.token,localStorage.getItem('ang_employee_token'))
    };
  }

  function getSelectedScheduleSummaryFixed(){
    var settings=readSettings();
    var st=getGlobalState();
    var period=settings.mode==='month'?getMonthPeriod(getOffset()):getWeekPeriod(getOffset());
    if(settings.mode==='month'){
      var dates=(Array.isArray(st.selectedDates)?st.selectedDates:[]).map(function(x){return parseDate(x)}).filter(Boolean).sort(function(a,b){return a-b});
      if(!dates.length)return '';
      return dates.map(function(d){return DAY_NAMES[d.getDay()]+' '+md(d)}).join('、');
    }
    var idxs=(Array.isArray(st.selectedWeekdays)?st.selectedWeekdays:[]).slice().sort(function(a,b){return a-b});
    if(!idxs.length)return '';
    return idxs.map(function(idx){var d=period.days[idx];return d?(DAY_NAMES[d.getDay()]+' '+md(d)):''}).filter(Boolean).join('、');
  }

  function updateConfirmNoteFixed(){
    var note=qs('#schedule-confirm-note') || qs('.schedule-confirm-note');
    if(!note)return;
    var settings=readSettings();
    var period=settings.mode==='month'?getMonthPeriod(getOffset()):getWeekPeriod(getOffset());
    var summary=getSelectedScheduleSummaryFixed();
    if(summary){note.textContent='目前選擇：'+summary+'｜按「確認日期選擇」完成';return;}
    if(settings.mode==='week'){
      note.textContent='週選休模式：'+rangeLabel(period)+'，日期如下方結果列顯示。';
    }else{
      note.textContent='月選休模式：'+rangeLabel(period)+'，請在下方完整月曆點選日期。';
    }
  }

  function confirmScheduleSelectionFixed(){
    var settings=readSettings();
    var st=getGlobalState();
    var period=settings.mode==='month'?getMonthPeriod(getOffset()):getWeekPeriod(getOffset());
    var summary=getSelectedScheduleSummaryFixed();
    if(!summary){
      if(typeof window.showWarning==='function')window.showWarning(settings.mode==='month'?'請先在月曆點選日期':'目前沒有可送出的日期選擇');
      else alert(settings.mode==='month'?'請先在月曆點選日期':'目前沒有可送出的日期選擇');
      return;
    }
    var auth=getAuthPayload();
    var payload={
      id:auth.id,
      token:auth.token,
      mode:settings.mode,
      schedule_mode:settings.mode,
      weekOffset:getOffset(),
      periodOffset:getOffset(),
      periodStart:iso(period.start),
      periodEnd:iso(period.end),
      week_start_day:settings.weekStartDay,
      month_start_day:settings.monthStartDay,
      weekdays:(Array.isArray(st.selectedWeekdays)?st.selectedWeekdays.slice():[]),
      dates:(Array.isArray(st.selectedDates)?st.selectedDates.slice():[]),
      selectedDates:(Array.isArray(st.selectedDates)?st.selectedDates.slice():[])
    };
    function done(res){
      if(res && res.ok===false){
        if(typeof window.showError==='function')window.showError(res.message||'預選送出失敗');
        else alert(res.message||'預選送出失敗');
        return;
      }
      var note=qs('#schedule-confirm-note') || qs('.schedule-confirm-note');
      if(note)note.textContent='✅ 已送出：'+summary;
      if(typeof window.showSuccess==='function')window.showSuccess('已確認：'+summary);
      else alert('已確認：'+summary);
      render();
    }
    if(typeof window.apiPost==='function'){
      window.apiPost('employeePreselect',payload,done);
    }else{
      done({ok:true});
    }
  }

  function install(){
    ensureStyles();
    wrapFunction('handleBootstrapData',120);
    wrapFunction('nav',120);
    wrapFunction('syncWeekTabs',80);
    // 直接覆蓋舊的每日按鈕渲染邏輯
    window.renderWeekdayStrip=render;
    window.getSelectedScheduleSummary=getSelectedScheduleSummaryFixed;
    window.updateScheduleConfirmNote=updateConfirmNoteFixed;
    window.confirmScheduleSelection=confirmScheduleSelectionFixed;
    window.ANG_HR_SCHEDULE_CYCLE_FIX={
      render:render,
      readSettings:readSettings,
      getWeekPeriod:getWeekPeriod,
      getMonthPeriod:getMonthPeriod,
      normalizeRecord:normalizeRecord
    };
    document.addEventListener('DOMContentLoaded',function(){setTimeout(render,260);setTimeout(render,900)});
    window.addEventListener('load',function(){setTimeout(render,260);setTimeout(render,1200)});
    setTimeout(render,300);
    setTimeout(render,1500);
  }

  install();
})();
