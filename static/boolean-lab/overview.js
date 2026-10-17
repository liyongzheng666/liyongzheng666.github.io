const profiles=['aligned_1e-7','default','aligned_1e-5'];
const names={default:'各自默认', 'aligned_1e-7':'对齐到 10⁻⁷', 'aligned_1e-5':'对齐到 10⁻⁵'};
const engines=['smlib','occt'];
const familyNames={gap:'微小间隙',contact:'精确面接触',overlap:'薄重叠'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function summarize(data,profile){
  const cohort=data.cases.filter(c=>['gap','contact','overlap'].includes(c.family));
  return Object.fromEntries(engines.map(engine=>{
    const rows=cohort.map(c=>({c,r:c.results?.[profile]?.[engine]})).filter(x=>x.r);
    const passed=rows.filter(x=>x.r.all_pass).length;
    const pointOnly=rows.filter(x=>!x.r.all_pass&&x.r.failed_checks?.length===1&&x.r.failed_checks[0]==='point_states').length;
    const errorCases=rows.filter(x=>x.r.status==='error').length;
    return [engine,{total:rows.length,expectedTotal:cohort.length,passed,pointOnly,
      geometryPassed:passed+pointOnly,stable:rows.filter(x=>x.r.repeatable===true).length,
      thinnest:Math.min(...rows.filter(x=>x.c.family==='overlap'&&x.c.operation==='intersection'&&x.r.all_pass).map(x=>Math.abs(x.c.delta_mm))),
      errorCases,runs:rows.reduce((n,x)=>n+x.r.runs,0),
      families:Object.fromEntries(Object.keys(familyNames).map(f=>{const a=rows.filter(x=>x.c.family===f);return [f,{passed:a.filter(x=>x.r.all_pass).length,total:a.length}]}))}];
  }));
}

export function initOverview(data){
  const host=document.getElementById('comparison-overview');
  if(!host)return;
  if(data.dataset_kind==='reproduction'){renderReproductionOverview(data,host);return;}
  let active='aligned_1e-7';
  const summary=Object.fromEntries(profiles.map(p=>[p,summarize(data,p)]));
  function render(){
    const s=summary[active];
    const pct=x=>x.total?(100*x.passed/x.total).toFixed(1):'—';
    const cards=engines.map(e=>`<article class="overview-engine ${e}"><h3><i></i>${e==='smlib'?'SMLib':'OCCT'}</h3><div class="overview-score"><strong>${s[e].passed}<small> / ${s[e].total}</small></strong><span>${pct(s[e])}%</span></div><div class="overview-bar"><span style="width:${pct(s[e])}%"></span></div><p>全部严格检查通过的场景</p></article>`).join('');
    const row=(label,fn,description='')=>`<tr><th scope="row">${label}${description?`<small>${description}</small>`:''}</th>${engines.map(e=>`<td>${fn(s[e])}</td>`).join('')}</tr>`;
    const detailRows=Object.entries(familyNames).map(([f,label])=>row(label,x=>`${x.families[f].passed} / ${x.families[f].total}`)).join('');
    const context=active==='default'?'默认输入容差不同：SMLib 约 10⁻⁵，OCCT 约 10⁻⁷。此栏展示开箱配置，不是相同容差条件。':`输入边/点最大容差实际读回 ${active==='aligned_1e-7'?'10⁻⁷':'10⁻⁵'}。公开设置已尽量对齐，内部求交与点分类政策仍不完全相同。`;
    const takeaway=active==='aligned_1e-7'?'对齐后，几何量 / 拓扑检查均为 33 / 45；SMLib 另有 2 例仅点分类未通过。两边通过的具体场景仍有差别。':active==='default'?'默认配置的差距明显受容差影响。切换“对齐到 10⁻⁷”可看受控对比。':'共同提高容差后，两边都会丢失更薄的特征；容差带内仍有不同处理方式。';
    host.innerHTML=`<div class="overview-heading"><div><div class="eyebrow">MEASURED COMPARISON · 实际运行数据</div><h1>先看实测，两者差在哪里</h1><p>同一批 45 个间隙、接触、薄重叠场景；每场景、每内核独立重复 10 次。</p></div><a href="${esc(data.report_url||'data/reports/index.html')}" target="_blank">完整报告 ↗</a></div>
      <div class="overview-tabs" role="tablist" aria-label="数据对比配置">${profiles.map(p=>`<button role="tab" aria-selected="${active===p}" data-overview-profile="${p}">${names[p]}</button>`).join('')}</div>
      <p class="overview-context">${context}</p><div class="overview-cards">${cards}</div>
      <div class="overview-takeaway">${takeaway}</div>
      <div class="overview-table-wrap"><table><thead><tr><th scope="col">比较项目</th><th scope="col">SMLib</th><th scope="col">OCCT</th></tr></thead><tbody>
      ${row('几何量 / 拓扑检查',x=>`${x.geometryPassed} / ${x.total}`,'体积、面积、质心、范围、实体 / 空腔及内核自检，不含点分类')}
      ${row('仅点分类未通过',x=>`${x.pointOnly} 个场景`,'形体相关检查通过，但材料内外点判断与严格答案不符')}
      ${row('已测可保留的最薄交集',x=>Number.isFinite(x.thinnest)?x.thinnest.toExponential(0)+' mm':'未通过','只取本批已测离散厚度，不是算法精度极限')}
      ${row('重复结果稳定',x=>`${x.stable} / ${x.total}`,'10 次状态一致、测量在阈值内一致；稳定失配不算正确')}
      ${row('运行异常',x=>`${x.errorCases} / ${x.total} 场景`,'每核 '+s.smlib.runs+' 次观测；异常、超时或崩溃的场景数')}
      </tbody></table></div>
      <details class="overview-details"><summary>展开：具体场景与三种配置的完整对照</summary><div class="overview-table-wrap"><table><thead><tr><th>当前配置下的严格通过</th><th>SMLib</th><th>OCCT</th></tr></thead><tbody>${detailRows}</tbody></table></div>
      <div class="overview-table-wrap"><table><thead><tr><th>同一批 45 场景</th><th>SMLib 严格通过</th><th>OCCT 严格通过</th></tr></thead><tbody>${['default','aligned_1e-7','aligned_1e-5'].map(p=>`<tr><th>${names[p]}</th>${engines.map(e=>`<td>${summary[p][e].passed} / ${summary[p][e].total}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
      <div class="overview-baseline"><b>另测的常规形体（默认配置）</b>${['basic','curved'].map(f=>{const c=data.cases.filter(x=>x.family===f);return `<span>${f==='basic'?'固定盒体布尔':'球 / 柱 / 盒曲面布尔'}：${engines.map(e=>`${e==='smlib'?'SMLib':'OCCT'} ${c.filter(x=>x.results?.default?.[e]?.all_pass).length}/${c.length}`).join(' · ')}</span>`}).join('')}</div>
      <p class="overview-boundary"><strong>这是已测能力，不是通用 CAD 排名。</strong>有限几何指标与采样不是完整形状证明；容差附近的失配须分别看造型、查询和分类。本轮仅覆盖下方列出的复杂曲面布尔场景；尚未覆盖任意自由曲面、抽壳和长期 / 并发稳定性，速度也未作公平排名。</p>
      ${advancedHtml(data)}<div class="overview-actions"><a href="https://github.com/liyongzheng666/occt-smlib-boolean-benchmark/releases/tag/v0.1.0" target="_blank" rel="noopener">下载报告、实测数据与完整网页 ↗</a><a href="#box_overlap_1e-6_intersection?profile=${active}" data-jump-model>看一个关键实例：10⁻⁶ mm 薄片 →</a><a href="#model-example" data-jump-only>往下查看模型</a></div>`;
    host.querySelectorAll('[data-overview-profile]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.overviewProfile;render()}));
    host.querySelectorAll('[data-jump-model]').forEach(a=>a.addEventListener('click',()=>document.getElementById('model-example').scrollIntoView({behavior:'auto',block:'start'})));
    host.querySelector('[data-jump-only]').addEventListener('click',e=>{e.preventDefault();document.getElementById('model-example').scrollIntoView({behavior:'auto',block:'start'})});
  }
  render();
}

export function summarizeAdvanced(data,family,profile,engine){
  const cohort=data.cases.filter(c=>c.family===family);
  const rows=cohort.map(c=>({c,r:c.results?.[profile]?.[engine]})).filter(x=>x.r);
  const level=x=>x.r.oracle_level||x.c.oracle_level||x.c.oracle?.level||'invariants';
  const passed=x=>x.r.all_pass===true||x.r.status==='pass';
  const subset=fn=>{const list=rows.filter(fn);return {total:list.length,passed:list.filter(passed).length};};
  return {total:rows.length,expected:cohort.length,analytic:subset(x=>level(x)==='analytic'),invariants:subset(x=>level(x)!=='analytic'),failed:rows.filter(x=>!passed(x)).length,stable:rows.filter(x=>x.r.repeatable===true).length,runs:rows.reduce((n,x)=>n+(Array.isArray(x.r.runs)?x.r.runs.length:Number(x.r.runs)||0),0)};
}
function advancedHtml(data){
  const families=[['complex_boolean','复杂曲面布尔']];
  const sections=families.filter(([f])=>data.cases.some(c=>c.family===f));
  if(!sections.length)return '';
  return `<section class="advanced-overview"><div class="eyebrow">新增建模实验 · 独立统计</div><h2>复杂曲面布尔，哪些检查通过了</h2><p class="overview-boundary">解析答案检查与必要条件检查分开统计。必要条件通过只表明没有发现这些问题，不证明形状完全正确。以下统计独立于上方 45 个微小特征场景。</p>${sections.map(([family,label])=>{
    const cohort=data.cases.filter(c=>c.family===family),profile='aligned_1e-7';
    const stats=Object.fromEntries(engines.map(e=>[e,summarizeAdvanced(data,family,profile,e)]));
    const row=(name,key)=>`<tr><th>${name}</th>${engines.map(e=>`<td>${stats[e][key].total?stats[e][key].passed+' / '+stats[e][key].total:'未设置'}</td>`).join('')}</tr>`;
    const examples=cohort.filter(c=>engines.some(e=>c.results?.[profile]?.[e]));
    return `<article class="advanced-family"><h3>${label}<span>${cohort.length} 个场景</span></h3><p class="overview-context">当前新增实测：对齐目标 10⁻⁷ mm。其他容差方案未测；相同目标值不等于两内核全部内部公差一致。</p><div class="overview-table-wrap"><table><thead><tr><th>验收分组</th><th>SMLib</th><th>OCCT</th></tr></thead><tbody>${row('解析答案及声明检查通过','analytic')}${row('必要条件检查通过（非完整证明）','invariants')}<tr><th>检查未通过 / 异常 / 超时 / 无效<small>按场景计数</small></th>${engines.map(e=>`<td>${stats[e].failed} / ${stats[e].total}</td>`).join('')}</tr><tr><th>重复观测一致<small>稳定失败也计入一致；不等同于正确</small></th>${engines.map(e=>`<td>${stats[e].stable} / ${stats[e].total}</td>`).join('')}</tr><tr><th>实际运行次数</th>${engines.map(e=>`<td>${stats[e].runs}</td>`).join('')}</tr></tbody></table></div><details class="overview-details"><summary>查看这 ${examples.length} 个场景的真实模型</summary><div class="advanced-model-links">${examples.map(c=>`<a data-jump-model href="#${encodeURIComponent(c.id)}?profile=${profile}">${esc(c.label||c.id)}</a>`).join('')}</div></details></article>`;
  }).join('')}</section>`;
}

function renderReproductionOverview(data,host){
  const rows=engines.map(e=>{const list=data.cases.flatMap(c=>Object.entries(c.results||{}).map(([profile,rr])=>({c,profile,r:rr[e]}))).filter(x=>x.r);return {engine:e,list};});
  host.innerHTML=`<div class="overview-heading"><div><div class="eyebrow">INDEPENDENT REPRODUCTION · 本次独立复现</div><h1>本次运行的实际结果</h1><p>统计仅来自当前运行目录，未混入历史参考记录。${esc(data.run_info?.started_at||'')} 至 ${esc(data.run_info?.finished_at||'')}</p></div><a href="${esc(data.report_url)}" target="_blank">本次报告 ↗</a></div><div class="overview-table-wrap"><table><thead><tr><th>内核</th><th>通过 / 场景方案</th><th>解析检查通过</th><th>必要条件通过</th><th>重复一致</th><th>调用次数</th></tr></thead><tbody>${rows.map(({engine,list})=>{const split=level=>{const a=list.filter(x=>(x.r.oracle_level||x.c.oracle?.level||'analytic')===level);return `${a.filter(x=>x.r.all_pass).length} / ${a.length}`;};return `<tr><th>${engine==='smlib'?'SMLib':'OCCT'}</th><td>${list.filter(x=>x.r.all_pass).length} / ${list.length}</td><td>${split('analytic')}</td><td>${split('invariants')}</td><td>${list.some(x=>Number(x.r.runs)>1)?`${list.filter(x=>Number(x.r.runs)>1&&x.r.repeatable).length} / ${list.filter(x=>Number(x.r.runs)>1).length}`:'未评估（单次）'}</td><td>${list.reduce((a,x)=>a+Number(x.r.runs||0),0)}</td></tr>`;}).join('')}</tbody></table></div><p class="overview-boundary">必要条件通过不证明完整形状正确；稳定失败也可能重复一致。各场景按当前实测方案展示；未导出模型时会明确提示，不借用历史模型。比较目标容差不代表内部公差政策完全一致。</p><div class="overview-actions"><a href="#model-example" data-fresh-model>往下查看真实模型 ↓</a><a href="https://github.com/liyongzheng666/occt-smlib-boolean-benchmark" target="_blank" rel="noopener">复现仓库 ↗</a></div>`;
  host.querySelector('[data-fresh-model]').onclick=e=>{e.preventDefault();document.getElementById('model-example').scrollIntoView({behavior:'auto'});};
}
