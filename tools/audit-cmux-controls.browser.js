// Does every control on /cmux actually do something visible?
//
// Paste this into the browser console on /cmux (or run it through a CDP driver). It
// flips each control to a value it is not currently at and reports one of:
//
//   VISIBLE     the AFTER window changed  -- what you want
//   labelled    no visual change, and the control says so ("no visual change" badge)
//   overridden  disabled because another setting is overriding it, and it says which
//   DEAD        nothing changed and nothing explains why  -- a bug
//
// It exists because "I cannot see live updates when I choose different fonts and
// basically everything else" turned out to be several separate causes, and only an
// exhaustive flip-everything pass separated the real bugs from the settings that
// genuinely have no visual (scrollback, scroll speed) and the ones being masked by a
// parent setting (sidebar tint under match-terminal-background).
//
// The headline bug it found: the font-family style was built with JSON.stringify, whose
// double quotes terminated the style="..." attribute, so no font ever applied.
//
// A run with dead === 0 is the bar.

(async () => {
  const q=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
  const wait=()=>new Promise(r=>setTimeout(r,80));
  const snap=()=>{
    const cs=getComputedStyle(q('#winAfter .cwin')), t=q('#winAfter .cterm');
    return JSON.stringify({cls:q('#winAfter .cwin').className,
      vars:['--cm-bg','--cm-text','--cm-titlebar','--cm-sidebar','--cm-chrome','--cm-pane',
            '--cm-panehot','--cm-divider','--cm-divider-w','--cm-sel','--cm-font','--cm-sidefont',
            '--cm-tabfont','--cm-opacity','--cm-blur'].map(v=>cs.getPropertyValue(v).trim()).join('|'),
      font:t?getComputedStyle(t).fontFamily:'', size:t?getComputedStyle(t).fontSize:'',
      align:t?t.getAttribute('data-align'):'', tabs:all('#winAfter .ctabs').length,
      scroll:all('#winAfter .cscroll').length, side:(q('#winAfter .cside')||{}).textContent||'',
      ind:(q('#winAfter .cws.on')||{getAttribute:()=>''}).getAttribute('data-ind'),
      title:(q('#winAfter .ttext')||{}).textContent||''});
  };
  const files=()=>q('#fileGhostty').textContent+'||'+q('#fileJson').textContent;
  // Reset every dependency parent OFF first, so nothing is masked, then flip each
  // control to a value it is genuinely not at.
  for (const [id,want] of [['m_shd',false],['m_mtb',false],['m_min',false]]) {
    const e=q(id.startsWith('#')?id:'#'+id); if(e.checked!==want){e.click();await wait();}
  }
  const bo=q('#m_bo'); bo.value=0.8; bo.dispatchEvent(new Event('input')); await wait();

  const CASES=[
    ['terminal font','#m_font','Monaco','change'],['font size','#m_fs',22],
    ['sidebar font','#m_sf',20],['tab bar font','#m_tf',18],
    ['ghostty theme','#m_theme','Nord','input'],
    ['bg blur','#m_bb',36],['bg opacity','#m_bo',0.5],
    ['scrollback','#m_sb',90000000],['appearance','#m_appear','light','change'],
    ['placement','#m_place','end','change'],['window title','#m_title','my-title','input'],
    ['tint strength','#m_to',0.5],['indicator style','#m_ind','solidFill','change'],
    ['branch layout','#m_bl','inline','change'],['show description','#m_sd','TOGGLE'],
    ['show PRs','#m_spr','TOGGLE'],['git status','#m_sgs','TOGGLE'],
    ['scroll bar','#m_ssb','TOGGLE'],['copy on select','#m_cos','TOGGLE'],
    ['scroll speed','#m_ss',2.5],['content alignment','#m_align','left','change'],
    ['minimal mode','#m_min','TOGGLE'],['hide sidebar details','#m_shd','TOGGLE'],
    ['match terminal bg','#m_mtb','TOGGLE'],
  ];
  const rows=[];
  for (const [label,id,val,ev] of CASES) {
    const e=q(id); if(!e){rows.push('MISSING  '+label);continue;}
    const row=e.closest('.ctl')||e.closest('.ctl2');
    if(e.disabled){rows.push('overridden  '+label+'  ('+(row.querySelector('.ovnote')||{}).textContent+')');continue;}
    const s0=snap(), f0=files();
    if(val==='TOGGLE')e.click(); else {e.value=val;e.dispatchEvent(new Event(ev||'input'));}
    await wait();
    const vis=snap()!==s0, fil=files()!==f0;
    const badge=!!row.querySelector('.nov');
    rows.push((vis?'VISIBLE ':(badge?'labelled':'DEAD    '))+(fil?' file ':' NOFILE')+'  '+label);
  }
  for (const [label,mode,pick] of [['pane border','#m_pbm','#m_pb'],['focused border','#m_apbm','#m_apb'],
      ['divider','#m_dvm','#m_dv'],['sidebar tint','#m_tnm','#m_tn'],['selection','#m_slm','#m_sl']]) {
    const pk=q(pick);
    if(pk.disabled){rows.push('overridden  '+label);continue;}
    const s0=snap(), f0=files();
    all(mode+' .stychip')[1].click();
    pk.value='#ff0000'; pk.dispatchEvent(new Event('input')); await wait();
    rows.push((snap()!==s0?'VISIBLE ':'DEAD    ')+(files()!==f0?' file ':' NOFILE')+'  '+label+' (custom)');
  }
  return {dead:rows.filter(r=>/^DEAD|^MISSING/.test(r)).length, rows};
})()
