(() => {
'use strict';
const lessons=[...(window.BT_FOUNDATIONS||[]),...(window.BT_ADVANCED||[])],custom=new Map();
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ol=a=>`<ol>${a.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`;
let lesson,frames,position=0,timer=null;
const stop=()=>{clearInterval(timer);timer=null;if($('#play'))$('#play').textContent='▶ 播放';};
const codeHTML=s=>s.split('\n').map((s,i)=>`<span class="code-line" data-line="${i+1}"><span class="line-num">${i+1}</span>${esc(s)}</span>`).join('');
function drawTree(f){
 const nodes=new Map();
 for(const t of frames.slice(0,position+1))if(t.nodeId!=null&&!nodes.has(String(t.nodeId)))nodes.set(String(t.nodeId),{id:String(t.nodeId),parent:t.parentId==null?null:String(t.parentId),label:String(t.edgeLabel||JSON.stringify(t.path)),path:t.path,depth:t.depth});
 const chain=[];let n=nodes.get(String(f.nodeId));while(n){chain.unshift(n.id);n=nodes.get(n.parent);}$('#call-stack').textContent=chain.length?`当前调用链：${chain.join(' → ')}`:'';
 if(!nodes.size){$('#tree').innerHTML='<p class="tree-caption">这一课按区间长度填回文表，再从左到右更新 cut。动态规划没有递归调用树，请观察上方表格。</p>';return;}
 const ordered=[...nodes.values()],width=Math.max(520,...ordered.map(n=>n.depth*175+220)),height=ordered.length*42+35;
 const coords=new Map(ordered.map((n,i)=>[n.id,{x:n.depth*175+20,y:i*42+22}]));
 const lines=ordered.map(n=>{const a=coords.get(n.parent),b=coords.get(n.id);return a?`<path d="M${a.x+145},${a.y} H${b.x-12} V${b.y} H${b.x}" class="branch ${n.id===String(f.nodeId)?'current-edge':''}"/>`:'';}).join('');
 const boxes=ordered.map(n=>{const c=coords.get(n.id);return `<g class="call-node ${n.id===String(f.nodeId)?'current-node':''}"><title>调用 ${esc(n.id)}；路径 ${esc(JSON.stringify(n.path))}</title><rect x="${c.x}" y="${c.y-15}" width="145" height="30" rx="6"/><text x="${c.x+8}" y="${c.y+4}">${esc(n.label.length>16?n.label.slice(0,15)+'…':n.label)}</text></g>`;}).join('');
 let returning='';const returningId=f.action==='return'?String(f.nodeId):f.action==='undo'?String(f.variables.returnedNodeId??frames[position-1]?.nodeId):null;const child=nodes.get(returningId),parent=child&&nodes.get(child.parent);if(child&&parent){const a=coords.get(child.id),b=coords.get(parent.id);returning=`<path d="M${a.x},${a.y} H${a.x-18} V${b.y} H${b.x+145}" class="return-edge" marker-end="url(#return-arrow)"/>`;}
 $('#tree').innerHTML=`<svg width="${width}" height="${height}" role="img" aria-label="深度优先搜索调用树"><defs><marker id="return-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#b45732"/></marker></defs>${lines}${returning}${boxes}</svg>`;
 const c=coords.get(String(f.nodeId));if(c){$('#tree').scrollTop=Math.max(0,c.y-130);$('#tree').scrollLeft=Math.max(0,c.x-100);}
}
function render(){
 const f=frames[position];$('#progress').value=position;$('#count').textContent=`步骤 ${position+1} / ${frames.length}`;$('#depth').textContent=String(lesson.id)==='132'?'前缀动态规划':`递归深度 ${f.depth}`;
 const names={choose:'选择',enter:'进入调用',answer:'记录结果',undo:'撤销 / 恢复',skip:'跳过候选',reject:'不合法',prune:'剪枝',return:'即将返回',resume:'返回父调用',pal:'更新回文表',dp:'更新 DP',init:'初始状态',done:'完成'};
 if(String(lesson.id)==='132')names.enter='计算当前前缀';
 $('#event').dataset.action=f.action;$('#event').innerHTML=`<strong>${esc(names[f.action]||f.action)}</strong>${esc(f.message)}`;
 $('#path').innerHTML=f.path.map(x=>`<span class="chip">${esc(typeof x==='object'?JSON.stringify(x):x)}</span>`).join('')||'<span class="variables">空路径 []</span>';
 $('#vars').innerHTML=Object.entries(f.variables).map(([k,v])=>`<div><b>${esc(k)}</b> = ${esc(JSON.stringify(v))}</div>`).join('');$('#answers').textContent=JSON.stringify(f.answers,null,2);
 if($('#string-view')){const s=custom.get('131')||'aabbaa',start=Number(f.variables.start),end=Number(f.variables.end);$('#string-view').innerHTML=Array.from(s,(ch,i)=>`<div class="string-cell ${i>=start&&i<=end?'candidate':''} ${i<start?'consumed':''}"><small>${i}</small><b>${esc(ch)}</b></div>`).join('');}
 $('#special').innerHTML='';
 if(f.board){const b=f.board;
  if(String(lesson.id)==='132'){const chars=Array.from(f.variables.s);$('#special').innerHTML=`<h4>pal[left][right]：T 表示回文</h4><div class="board palindrome-table" style="grid-template-columns:repeat(${b[0].length+1},minmax(0,1fr))"><div class="cell">↘</div>${chars.map((c,i)=>`<div class="cell">${i}<br>${esc(c)}</div>`).join('')}${b.map((row,ri)=>`<div class="cell">${ri}<br>${esc(chars[ri])}</div>${row.map((c,ci)=>`<div class="cell ${ri===f.variables.left&&ci===f.variables.right?'visited':''}">${esc(c)}</div>`).join('')}`).join('')}</div><h4>cut[right]：前缀最少切数</h4>`;}
  else $('#special').innerHTML=`<div class="board" style="grid-template-columns:repeat(${b[0].length},1fr)">${b.flatMap((r,ri)=>Array.from(r,(c,ci)=>`<div class="cell ${f.variables.visited?.[ri]?.[ci]?'visited':''}">${esc(c)}</div>`)).join('')}</div>`;
 }
 if(f.dp)$('#special').innerHTML+=`<div class="dp">${f.dp.map((v,i)=>`<div class="cell">[${i}]<br><b>${esc(v)}</b></div>`).join('')}</div>`;
 drawTree(f);
 $('#trace-code').querySelectorAll('.active').forEach(x=>x.classList.remove('active'));const line=$(`#trace-code [data-line="${f.line}"]`);if(line){line.classList.add('active');const box=$('#trace-code'),y=line.offsetTop;if(y<box.scrollTop||y>box.scrollTop+box.clientHeight-50)box.scrollTop=y-box.clientHeight/2;}
 $('#previous').disabled=position===0;$('#next').disabled=position===frames.length-1;$('#jump-return').disabled=String(lesson.id)==='132';
}
function load(id){
 stop();lesson=lessons.find(l=>String(l.id)===id)||lessons[0];frames=lesson.trace(custom.get(String(lesson.id)));position=0;
 $('#navigation').innerHTML=lessons.map((l,i)=>`<button data-id="${esc(l.id)}" class="${l===lesson?'active':''}" ${l===lesson?'aria-current="step"':''}><small>${String(i+1).padStart(2,'0')} · ${esc(l.stage)}</small>${esc(l.title)}</button>`).join('');
 $('#mount').innerHTML=`<p class="eyebrow">${esc(lesson.stage)}</p><h2>${esc(lesson.title)}</h2><p class="goal">${esc(lesson.goal)}</p><p>${esc(lesson.statement)}</p>${lesson.url?`<a href="${esc(lesson.url)}" target="_blank" rel="noopener">阅读 LeetCode 官方题目 ↗</a>`:''}<div class="card example">${esc(typeof lesson.example==='string'?lesson.example:JSON.stringify(lesson.example,null,2))}</div><h3>先用自己的话走一遍</h3>${ol(lesson.walkthrough)}<div class="card">${String(lesson.id)==='131'?`<div class="sample-control"><label for="sample-string">要分割的字符串</label><input id="sample-string" maxlength="8" value="${esc(custom.get('131')||'aabbaa')}" aria-describedby="sample-help"><button id="apply-sample">重新生成搜索树</button><small id="sample-help">1–8 个小写字母；越多回文，分支越多。</small></div><div id="string-view" class="string-view"></div>`:''}<div class="controls"><button id="previous">← 上一步</button><button id="play" class="primary">▶ 播放</button><button id="next">下一步 →</button><button id="reset">重置</button><button id="jump-return">下一次返回</button><button id="jump-answer">下一条答案</button><label>每步 <select id="speed"><option value="1800">1.8 秒</option><option value="900">0.9 秒</option><option value="3000">3 秒</option></select></label></div><input id="progress" type="range" min="0" max="${frames.length-1}" value="0" aria-label="动画步骤"><div class="step-meta"><span id="count"></span><span id="depth"></span></div><div id="event" class="event" aria-live="polite"></div><div class="state-grid"><div><h4>当前路径 path</h4><div id="path" class="chips"></div><h4>变量与约束</h4><div id="vars" class="variables"></div></div><div><h4>已收集答案 / 当前结果</h4><pre id="answers" class="answers"></pre><div id="special"></div></div></div><p class="tree-caption">${String(lesson.id)==='132'?'回文表先按长度递增填好，再枚举每个前缀的最后一段，更新最少切数。':'搜索调用树按 DFS 首次进入顺序从上到下展开；向右是更深一层。绿色标出当前调用，橙色虚线箭头显示返回方向。返回之后回到父节点，撤销选择，才继续兄弟分支。'}</p><div id="call-stack" class="variables"></div><div id="tree" class="tree"></div><p class="tree-caption">高亮行对应当前事件。完整代码的 main 使用默认示例；改动动画输入后，运行 C++ 时也请修改 main 中的输入。</p><h4>对应 C++ 执行位置</h4><pre class="code" id="trace-code">${codeHTML(lesson.code)}</pre></div><h3>每个变量到底代表什么</h3>${lesson.concepts.map(c=>`<div class="concept"><b>${esc(c.name)}</b><p>${esc(c.text)}</p></div>`).join('')}<h3>先独立尝试，再展开提示</h3>${lesson.hints.map((h,i)=>`<details><summary>提示 ${i+1}</summary><p>${esc(h)}</p></details>`).join('')}<details><summary>C++17 练习骨架</summary><pre class="code">${esc(lesson.starter)}</pre></details><details><summary>完整 C++17 示例 · 包含 main，可本地运行</summary><button id="download">下载 .cpp</button><pre class="code">${esc(lesson.code)}</pre><p>编译：<code>clang++ -std=c++17 lesson.cpp -o lesson</code>；运行：<code>./lesson</code>。提交 LeetCode 时保留算法函数，按题目给出的 class Solution 接口包装；去掉 main 与输出辅助函数。</p></details><h3>搜索规模与空间</h3><p>${esc(lesson.complexity)}</p><h3>容易踩的坑</h3>${ol(lesson.pitfalls)}<h3>过关检查</h3>${ol(lesson.checks)}<div class="controls"><button id="prev-lesson">上一课</button><button id="next-lesson" class="primary">下一课 →</button></div>`;
 $('#previous').onclick=()=>{stop();position=Math.max(0,position-1);render();};$('#next').onclick=()=>{stop();position=Math.min(frames.length-1,position+1);render();};$('#reset').onclick=()=>{stop();position=0;render();};$('#progress').oninput=e=>{stop();position=Number(e.target.value);render();};
 for(const [selector,actions]of[['#jump-return',['return','undo','resume']],['#jump-answer',['answer']]])$(selector).onclick=()=>{stop();const n=frames.findIndex((f,i)=>i>position&&actions.includes(f.action));position=n<0?frames.length-1:n;render();};
 $('#play').onclick=()=>{if(timer){stop();return;}if(position===frames.length-1)position=0;$('#play').textContent='Ⅱ 暂停';timer=setInterval(()=>{position++;render();if(position===frames.length-1)stop();},Number($('#speed').value));};$('#speed').onchange=stop;
 if($('#apply-sample'))$('#apply-sample').onclick=()=>{const v=$('#sample-string').value.trim();if(!/^[a-z]{1,8}$/.test(v)){$('#sample-help').textContent='请输入 1–8 个小写字母。';return;}custom.set('131',v);load('131');};
 $('#download').onclick=()=>{const u=URL.createObjectURL(new Blob([lesson.code],{type:'text/plain'})),a=document.createElement('a');a.href=u;a.download=`backtracking-${lesson.id}.cpp`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
 const index=lessons.indexOf(lesson);for(const [selector,d]of[['#prev-lesson',-1],['#next-lesson',1]]){const b=$(selector);b.disabled=!lessons[index+d];b.onclick=()=>location.hash=`lesson-${lessons[index+d].id}`;}
 render();
}
$('#navigation').onclick=e=>{const b=e.target.closest('[data-id]');if(b)location.hash=`lesson-${b.dataset.id}`;};
window.addEventListener('hashchange',()=>load(location.hash.replace('#lesson-','')));window.addEventListener('pagehide',stop);
load(location.hash.replace('#lesson-',''));
})();
