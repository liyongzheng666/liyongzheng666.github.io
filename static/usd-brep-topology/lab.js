/* Source-guided illustrations, not kernel output. No external runtime or network dependencies. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { fg:'var(--bl-fg)', muted:'var(--bl-muted)', bg:'var(--bl-panel)', line:'var(--bl-line)', outer:'var(--bl-outer)', inner:'var(--bl-inner)', edge:'var(--bl-edge)' };
  const V = [[-1.25,-.8,-1],[1.25,-.8,-1],[1.25,.8,-1],[-1.25,.8,-1],[-1.25,-.8,1],[1.25,-.8,1],[1.25,.8,1],[-1.25,.8,1]];
  const F = [[0,4,5,1],[0,1,2,3],[4,7,6,5],[0,3,7,4],[1,5,6,2],[3,2,6,7]];
  const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const NAMES = ['T外','T内','R内','R外'];
  const OPS = ['mate','radial','mate','radial'];
  const COLORS = [C.outer,C.inner,C.inner,C.outer];
  const ANGLES = [162,198,252,288].map(a => a*Math.PI/180);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const note = '<p class="bl-note">源码结构示意 · 未运行几何内核。颜色表示 Region 侧，不能直接换成 SAME / OPPOSITE。位移和连线仅为展示关系，不创建额外几何。</p>';
  const hint = '<p class="bl-hint">拖动旋转 · 聚焦图后可按方向键 · 按钮可复原视角</p>';
  const legend = '<div class="bl-legend"><span><i class="bl-dot bl-outer"></i>无限 Region 一侧</span><span><i class="bl-dot bl-inner"></i>实体 Region 一侧</span><span><i class="bl-dot"></i>共享几何 / 拓扑</span></div>';

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent,x,y,value,attrs={}) {
    const t=el('text',{x,y,...attrs},parent); t.textContent=value; return t;
  }
  function line(parent,a,b,color=C.line,width=1,attrs={}) {
    return el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':width,...attrs},parent);
  }
  function poly(parent,pts,color,opacity=.2,stroke='none',attrs={}) {
    return el('polygon',{points:pts.map(p=>p.slice(0,2).map(n=>n.toFixed(2)).join(',')).join(' '),fill:color,'fill-opacity':opacity,stroke,'stroke-width':1,'stroke-linejoin':'round',...attrs},parent);
  }
  function arrow(parent,a,b,color,width=2,attrs={}) {
    line(parent,a,b,color,width,attrs);
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<2)return;
    const u=[dx/len,dy/len],v=[-u[1],u[0]],size=7;
    poly(parent,[b,[b[0]-u[0]*size+v[0]*3.3,b[1]-u[1]*size+v[1]*3.3],[b[0]-u[0]*size-v[0]*3.3,b[1]-u[1]*size-v[1]*3.3]],color,1,'none',attrs);
  }
  function trace(parent,pts,color,width=1.6,attrs={}) {
    return el('polyline',{points:pts.map(p=>p.slice(0,2).map(n=>n.toFixed(2)).join(',')).join(' '),fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...attrs},parent);
  }
  function halo(parent,p,color,active=false) {
    el('circle',{cx:p[0],cy:p[1],r:active?8:4,fill:C.bg,stroke:color,'stroke-width':active?2.5:1.4},parent);
    if(active)el('circle',{cx:p[0],cy:p[1],r:3,fill:color},parent);
  }
  function annotate(svg,pos,anchor,label,color,align='start') {
    line(svg,pos,[anchor[0],anchor[1]-4],color,1,{opacity:.7});
    el('circle',{cx:pos[0],cy:pos[1],r:2.6,fill:color},svg);
    txt(svg,anchor[0],anchor[1],label,{'text-anchor':align,'paint-order':'stroke',stroke:C.bg,'stroke-width':5,'stroke-linejoin':'round'});
  }
  function prepare(svg) {
    const w=Math.max(svg.clientWidth,215),h=svg.clientHeight||320;
    svg.replaceChildren(); svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    return [w,h];
  }
  function rotate(p,state) {
    const c=Math.cos(state.yaw),s=Math.sin(state.yaw),q=Math.cos(state.pitch),t=Math.sin(state.pitch);
    const x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2];
    return [x,q*p[1]-t*z,t*p[1]+q*z];
  }
  function projector(state,w,h,edgeView=false) {
    return p=>{
      const r=rotate(p,state),scale=Math.min(w/(edgeView?5.65:5.3),h/4.9),k=8/(8-r[2]);
      return [w*(edgeView?.42:.5)+r[0]*scale*k,h*.56-r[1]*scale*k,r[2]];
    };
  }
  function body(svg,P,state,{top=false,edge=false}={}) {
    for(let n=-3;n<=3;n++) {
      line(svg,P([n*.6,-.84,-1.7]),P([n*.6,-.84,1.7]),C.line,1,{opacity:.3});
      line(svg,P([-1.8,-.84,n*.6]),P([1.8,-.84,n*.6]),C.line,1,{opacity:.3});
    }
    const faces=F.map((f,i)=>({i,ps:f.map(k=>V[k])})).sort((a,b)=>a.ps.reduce((s,p)=>s+rotate(p,state)[2],0)-b.ps.reduce((s,p)=>s+rotate(p,state)[2],0));
    faces.forEach(f=>poly(svg,f.ps.map(P),(top&&f.i===5)||(edge&&f.i>=4)?C.edge:C.muted,(top&&f.i===5)||(edge&&f.i>=4)?.13:.065,C.line));
    E.forEach(([a,b])=>line(svg,P(V[a]),P(V[b]),C.fg,1,{opacity:.33}));
    if(edge)line(svg,P(V[2]),P(V[6]),C.edge,4,{'data-part':'shared-edge'});
  }
  function topPoints(y) {return [[-1.25,y,-1],[1.25,y,-1],[1.25,y,1],[-1.25,y,1]];}
  function pairPoint(index,t,radius=.61) {
    const a=ANGLES[index],b=index===3?ANGLES[0]+Math.PI*2:ANGLES[index+1];
    // mate crosses one face; radial stays inside its region's angular sector.
    if(index===0||index===2) {
      const p=[Math.cos(a)*radius,Math.sin(a)*radius],q=[Math.cos(b)*radius,Math.sin(b)*radius];
      return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
    }
    const angle=a+(b-a)*t; return [Math.cos(angle)*radius,Math.sin(angle)*radius];
  }
  function pairSamples(index,radius=.61) {return Array.from({length:45},(_,n)=>pairPoint(index,n/44,radius));}
  function nodePoint(index,radius=.61) {return [Math.cos(ANGLES[index])*radius,Math.sin(ANGLES[index])*radius];}
  function button(action,label,extra='') {return `<button type="button" data-action="${action}" ${extra}>${label}</button>`;}
  function svgMarkup(kind,label) {return `<svg class="${kind==='model'?'bl-model':'bl-cut'}" data-canvas="${kind}" role="img" aria-label="${label}" ${kind==='model'?'tabindex="0"':''} xmlns="${NS}"></svg>`;}
  function heading(kicker,title,description) {return `<div class="bl-kicker">${kicker}</div><h3 class="bl-title">${title}</h3><p class="bl-description">${description}</p>`;}
  function bindView(svg,state,draw) {
    let drag=null;
    svg.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      drag=[event.clientX,event.clientY,state.yaw,state.pitch];
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener('pointermove',event=>{
      if(!drag)return;
      state.yaw=drag[2]+(event.clientX-drag[0])*.009;
      state.pitch=Math.max(-.55,Math.min(1.1,drag[3]+(event.clientY-drag[1])*.009));
      draw();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>svg.addEventListener(name,()=>{drag=null;}));
    svg.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='ArrowLeft')state.yaw-=.12;
      if(event.key==='ArrowRight')state.yaw+=.12;
      if(event.key==='ArrowUp')state.pitch=Math.min(1.1,state.pitch+.1);
      if(event.key==='ArrowDown')state.pitch=Math.max(-.55,state.pitch-.1);
      draw();
    });
  }
  function observe(root,draw) {
    let raf=0;
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw();});};
    if('ResizeObserver' in window)new ResizeObserver(schedule).observe(root);
    else window.addEventListener('resize',schedule);
  }

  function initRegions(root) {
    const state={yaw:-.65,pitch:.5,expanded:true,side:'both'};
    root.innerHTML=heading('01 / FACE & FACEUSE','一块顶面，两侧使用','同一个无孔、无空腔的长方体。左侧显示 Region 的显式边界使用；右侧显示 OCCT 的实体层级。')+
      `<div class="bl-controls"><label class="bl-check"><input type="checkbox" data-action="explode" checked>展开顶面两侧（示意）</label>${button('view-reset','复原视角')}</div>`+
      `<div class="bl-grid"><section class="bl-panel"><h4>usd-brep / SMLib</h4><p class="bl-panel-sub">2 Region · 2 Shell · 6 Face · 12 Faceuse</p>${svgMarkup('model','SMLib 长方体：顶面两个 Faceuse 分别属于实体和无限 Region 的壳，共享同一个 Face。')}${hint}
        <div class="bl-controls">${button('both','两侧','aria-pressed="true"')}${button('outer','外侧 Faceuse','aria-pressed="false"')}${button('inner','内侧 Faceuse','aria-pressed="false"')}</div>
        <div class="bl-tree"><div class="bl-tree-duo"><div data-branch="outer"><div class="bl-tree-node bl-outer">无限 Region<br>void</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-outer">无限 Region 的壳</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-outer">顶面外侧 Faceuse</div></div><div data-branch="inner"><div class="bl-tree-node bl-inner">实体 Region<br>non-void</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-inner">实体 Region 的壳</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-inner">顶面内侧 Faceuse</div></div></div><div class="bl-tree-mate">两个 Faceuse 互为 mate<br>↘ m_pF &nbsp;&nbsp;&nbsp; m_pF ↙</div><div class="bl-tree-node bl-edge bl-tree-shared">同一个 SmFace · 顶面</div></div>
      </section><section class="bl-panel"><h4>OCCT / TopoDS</h4><p class="bl-panel-sub">普通长方体：1 Solid · 1 Shell · 6 Face</p>${svgMarkup('model','OCCT 长方体：Solid 的 Shell 使用 TopoDS_Face，引用包含 TShape、Location 和 Orientation。')}${hint}
        <div class="bl-tree"><div class="bl-tree-node">TopoDS_Solid</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node">TopoDS_Shell</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-outer">TopoDS_Face<br>Location + Orientation</div><span class="bl-tree-arrow">↓ myTShape</span><div class="bl-tree-node bl-edge bl-tree-shared">共享底层 TShape</div><p class="bl-note">方向属于 Shape 引用；不默认配对构造显式的无限 Region。</p></div>
      </section></div>${legend}<div class="bl-status" data-status aria-live="polite"></div>${note}`;
    const models=[...root.querySelectorAll('.bl-model')];
    function drawModel(svg,smlib) {
      const [w,h]=prepare(svg),P=projector(state,w,h); body(svg,P,state,{top:true});
      const gap=state.expanded?.4:0;
      if(smlib) {
        const sides=[{y:.8-gap,color:C.inner,opacity:state.side==='outer'?.05:.3},{y:.8+gap,color:C.outer,opacity:state.side==='inner'?.05:.3}];
        sides.sort((a,b)=>rotate([0,a.y,0],state)[2]-rotate([0,b.y,0],state)[2]);
        sides.forEach(s=>poly(svg,topPoints(s.y).map(P),s.color,s.opacity,s.color));
        if(state.expanded)for(const corner of [[-1.25,1],[1.25,-1]])line(svg,P([corner[0],.8-gap,corner[1]]),P([corner[0],.8+gap,corner[1]]),C.muted,1,{'stroke-dasharray':'3 4'});
        annotate(svg,P([-.8,.8+gap,-.4]),[8,27],'外侧 Faceuse',C.outer);
        annotate(svg,P([.8,.8-gap,.6]),[w-8,h-40],'内侧 Faceuse',C.inner,'end');
        txt(svg,w-8,48,'无限 Region',{'text-anchor':'end',class:'bl-subtle'});
        txt(svg,w*.48,h*.74,'实体 Region',{'text-anchor':'middle',class:'bl-subtle','paint-order':'stroke',stroke:C.bg,'stroke-width':3});
      } else {
        poly(svg,topPoints(.808).map(P),C.outer,.32,C.outer);
        annotate(svg,P([-.8,.81,-.5]),[8,27],'TopoDS_Face',C.outer);
        txt(svg,w*.5,h*.74,'Solid',{'text-anchor':'middle',class:'bl-subtle'});
      }
      poly(svg,topPoints(.8).map(P),'none',0,C.edge,{'stroke-width':1.8,'data-part':'shared-face'});
      annotate(svg,P([-1.25,.8,1]),[8,h-13],smlib?'同一个顶面 F':'共享底层 TShape',C.edge);
    }
    function draw() {
      drawModel(models[0],true); drawModel(models[1],false);
      ['both','outer','inner'].forEach(side=>root.querySelector(`[data-action="${side}"]`).setAttribute('aria-pressed',String(side===state.side)));
      root.querySelector('[data-branch="outer"]').classList.toggle('bl-tree-inactive',state.side==='inner');
      root.querySelector('[data-branch="inner"]').classList.toggle('bl-tree-inactive',state.side==='outer');
      root.querySelector('[data-status]').textContent=state.side==='outer'?'外侧 Faceuse → 无限 Region 的壳 → 无限 void Region。它的 mate 是同一个顶面的内侧 Faceuse。':state.side==='inner'?'内侧 Faceuse → 实体 Region 的壳 → 有限 non-void Region。两个 Faceuse 的 m_pF 都指向同一个 SmFace。':'六个 Face，每个 Face 两侧各有一个 Faceuse，共十二个。展开仅为看清使用关系：物理边界仍是同一张顶面。';
      root.dataset.current=state.side;root.dataset.expanded=String(state.expanded);
    }
    root.querySelector('[data-action="explode"]').addEventListener('change',e=>{state.expanded=e.target.checked;draw();});
    root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.action==='view-reset'){state.yaw=-.65;state.pitch=.5;}else state.side=b.dataset.action;draw();
    }));
    models.forEach(svg=>bindView(svg,state,draw));observe(root,draw);draw();
  }

  function initCycle(root) {
    const state={yaw:-.66,pitch:.5,step:0,playing:false,elapsed:0,last:0};
    const duration=1800,hold=350;
    const route=NAMES.concat('T外').map((name,i)=>`<li><span class="bl-route-node ${i===0||i>=3?'bl-outer':'bl-inner'}" data-route-node="${i}">${name}</span>${i<4?`<span class="bl-route-link" data-route-link="${i}">${OPS[i]}<span>→</span></span>`:''}</li>`).join('');
    root.innerHTML=heading('02 / THE FOUR EDGEUSES','沿 mate 与 radial，完整走一圈','起点 T外。每次到达都检查：还是同一个 Face 吗？还是同一个 Region 的壳吗？')+
      `<div class="bl-controls">${button('play','播放一圈','class="bl-primary" aria-pressed="false"')}${button('prev','上一步')}${button('next','下一步')}${button('reset','从 T外 复位')}${button('view-reset','复原视角')}</div>`+
      `<div class="bl-grid"><section class="bl-panel"><h4>同一条三维边 E</h4><p class="bl-panel-sub">T = 顶面 · R = 右侧面</p>${svgMarkup('model','可旋转长方体。共享边 E 上四个 Edgeuse 分开绘制；标记沿选中的 mate 或 radial 关系移动。')}${hint}</section><section class="bl-panel"><h4>沿 E 看横截面</h4><p class="bl-panel-sub">点 E 对应左图整条共享边</p>${svgMarkup('cut','共享边横截面。左下区域是材料；mate 连接同面两侧，radial 在同一个 Region 的角扇区内连接相邻面。')}<p class="bl-hint">mate 穿过面侧 · radial 沿同一区域的扇区</p></section></div>`+
      `<ol class="bl-route" aria-label="遍历路线">${route}</ol><div class="bl-progress-row"><progress max="4" value="0" aria-label="完成的遍历步数"></progress><span class="bl-progress-label" data-progress-label>0 / 4</span></div>${legend}`+
      `<dl class="bl-facts"><div class="bl-fact"><dt>当前 Edgeuse</dt><dd data-fact="use">T外</dd></div><div class="bl-fact"><dt>Face / Faceuse</dt><dd data-fact="face">顶面 / 外侧</dd></div><div class="bl-fact"><dt>Region</dt><dd data-fact="region">无限 void Region</dd></div><div class="bl-fact"><dt>Shell</dt><dd data-fact="shell">无限 Region 的壳</dd></div></dl>`+
      `<div class="bl-status" data-status aria-live="polite"></div><p class="bl-note">四个箭头共用一条 Edge；箭头沿边方向取一组自洽的示意方向。mate 和 radial 各自都是双向配对。此处不预设交替路线等同于 GetNext() 的链表顺序；这也不是实体边界上的 Loopuse 遍历。</p>${note}<p class="bl-note" data-reduced hidden>检测到系统“减少动态效果”：播放将改为逐站切换，保留完整四步关系。</p>`;
    const model=root.querySelector('.bl-model'),cut=root.querySelector('.bl-cut');
    const captions=[
      '起点 T外：位于顶面的无限 Region 一侧。下一步沿 mate，进入同一顶面的另一侧。',
      '第 1 步 · T外 — mate → T内：Face 仍是顶面；Faceuse 切换到另一侧，来到实体 Region 的壳。',
      '第 2 步 · T内 — radial → R内：从顶面换到右侧面；仍在实体 Region 的同一个壳。',
      '第 3 步 · R内 — mate → R外：Face 仍是右侧面；切换面侧，来到无限 Region 的壳。',
      '第 4 步 · R外 — radial → T外：换回顶面；仍在无限 Region 的同一个壳。完整一圈结束，回到起点。'
    ];
    let raf=0,lastStatus='';
    function transition() {
      const active=state.step<4&&state.elapsed>0;
      return {active,link:active?state.step:state.step>0?state.step-1:-1,t:active?(REDUCED.matches?0:Math.min(1,Math.max(0,(state.elapsed-hold)/(duration-hold)))):1};
    }
    function drawModel() {
      const [w,h]=prepare(model),P=projector(state,w,h,true),tr=transition(),active=state.step%4;
      body(model,P,state,{edge:true});
      const lift=q=>P([1.25+q[0],.8+q[1],0]);
      for(let i=0;i<4;i++){
        const points=pairSamples(i).map(lift);
        trace(model,points,i%2===0?C.muted:i===1?C.inner:C.outer,1.2,{opacity:.35,'stroke-dasharray':'3 4','data-pair':`${NAMES[i]}-${NAMES[(i+1)%4]}`});
      }
      if(tr.link>=0){const points=pairSamples(tr.link).map(lift);trace(model,points,COLORS[(tr.link+1)%4],2.5,{opacity:.9,'data-active-link':OPS[tr.link]});}
      const anchors=[[8,36],[8,h-78],[w-8,h-51],[w-8,60]];
      for(let i=0;i<4;i++){
        const q=nodePoint(i),x=1.25+q[0],y=.8+q[1],sign=i%2===0?-1:1,selected=i===active;
        const g=el('g',{opacity:selected?1:.63,'data-eu':NAMES[i]},model);
        arrow(g,P([x,y,-.68*sign]),P([x,y,.68*sign]),COLORS[i],selected?3.5:2);
        annotate(g,P([x,y,i<2?-.32:.32]),anchors[i],NAMES[i]+(selected?' · 当前':''),COLORS[i],i>=2?'end':'start');
        halo(model,P([x,y,0]),COLORS[i],selected&&!tr.active);
      }
      if(tr.active)halo(model,lift(pairPoint(tr.link,tr.t)),C.fg,true);
      annotate(model,P([1.25,.8,.87]),[8,h-13],'共享 Edge E',C.edge);
      txt(model,w-8,h-13,'4 个使用 ≠ 4 条边',{'text-anchor':'end',class:'bl-subtle'});
    }
    function drawCut() {
      const [w,h]=prepare(cut),cx=w*.53,cy=h*.45,r=Math.min(w*.285,90),to=q=>[cx+q[0],cy-q[1]],tr=transition(),active=state.step%4;
      el('circle',{cx,cy,r:r*1.5,fill:C.outer,'fill-opacity':.045},cut);
      el('path',{d:`M ${cx} ${cy} L ${cx-r*1.5} ${cy} A ${r*1.5} ${r*1.5} 0 0 0 ${cx} ${cy+r*1.5} Z`,fill:C.inner,'fill-opacity':.12},cut);
      line(cut,[cx-r*1.5,cy],[cx,cy],C.fg,2);line(cut,[cx,cy],[cx,cy+r*1.5],C.fg,2);
      txt(cut,cx-r*1.47,cy-10,'T 顶面',{'text-anchor':'start',class:'bl-subtle'});
      txt(cut,cx+9,cy+r*1.47,'R 右侧面',{class:'bl-subtle'});
      txt(cut,cx-r*.65,cy+r*.64,'材料',{'text-anchor':'middle',class:'bl-subtle'});
      txt(cut,cx,23,'无限外部空间',{'text-anchor':'middle',class:'bl-subtle'});
      for(let i=0;i<4;i++){
        const points=pairSamples(i,r).map(to),color=i%2===0?C.muted:i===1?C.inner:C.outer;
        const selected=i===tr.link;
        trace(cut,points,color,selected?3:1.35,{opacity:selected?1:.4,'stroke-dasharray':selected?'none':'3 4','data-pair':`${NAMES[i]}-${NAMES[(i+1)%4]}`});
        arrow(cut,points[4],points[1],color,1.3,{opacity:selected?1:.5});
        arrow(cut,points[40],points[43],color,1.3,{opacity:selected?1:.5});
      }
      for(let i=0;i<4;i++){
        const p=to(nodePoint(i,r)); halo(cut,p,COLORS[i],i===active&&!tr.active);
        const dx=i<2?-11:i===2?-12:12,dy=i===0?-10:i===1?16:19;
        txt(cut,p[0]+dx,p[1]+dy,NAMES[i],{'text-anchor':i===3?'start':'end',fill:COLORS[i],'paint-order':'stroke',stroke:C.bg,'stroke-width':4,'data-eu':NAMES[i]});
      }
      halo(cut,[cx,cy],C.edge);txt(cut,cx+10,cy-9,'E',{fill:C.edge});
      if(tr.active)halo(cut,to(pairPoint(tr.link,tr.t,r)),C.fg,true);
      const op=tr.link>=0?OPS[tr.link]:'起点';
      const from=tr.link>=0?NAMES[tr.link]:'T外',dest=tr.link>=0?NAMES[(tr.link+1)%4]:'';
      txt(cut,w/2,h-27,tr.link>=0?`${from} — ${op} → ${dest}`:'T外：准备出发',{'text-anchor':'middle'});
      txt(cut,w/2,h-8,'每条配对可反向走回；亮圈为遍历标记',{'text-anchor':'middle',class:'bl-subtle'});
    }
    function sync() {
      const i=state.step%4,isOuter=i===0||i===3,face=i<2?'顶面':'右侧面';
      root.dataset.current=NAMES[i];root.dataset.step=String(state.step);root.dataset.playing=String(state.playing);
      root.dataset.target=state.step<4?NAMES[(state.step+1)%4]:'T外';
      root.querySelector('[data-fact="use"]').textContent=NAMES[i];
      root.querySelector('[data-fact="face"]').textContent=`${face} / ${isOuter?'外':'内'}侧`;
      root.querySelector('[data-fact="region"]').textContent=isOuter?'无限 void Region':'实体 non-void Region';
      root.querySelector('[data-fact="shell"]').textContent=isOuter?'无限 Region 的壳':'实体 Region 的壳';
      const play=root.querySelector('[data-action="play"]');play.textContent=state.playing?'暂停':state.step===4?'再播放一圈':state.elapsed>0?'继续播放':'播放一圈';play.setAttribute('aria-pressed',String(state.playing));
      root.querySelector('[data-action="prev"]').disabled=state.step===0&&state.elapsed===0;
      root.querySelector('[data-action="next"]').disabled=state.step===4;
      root.querySelector('[data-reduced]').hidden=!REDUCED.matches;
      root.querySelector('progress').value=state.step+(state.step<4?state.elapsed/duration:0);
      root.querySelector('[data-progress-label]').textContent=`${state.step} / 4`;
      root.querySelectorAll('[data-route-node]').forEach(n=>{if(+n.dataset.routeNode===state.step)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
      const tr=transition();root.querySelectorAll('[data-route-link]').forEach(n=>n.classList.toggle('bl-active',+n.dataset.routeLink===tr.link));
      let caption=captions[state.step];
      if(state.playing&&state.step<4)caption+=` 正在沿 ${OPS[state.step]} 前往 ${NAMES[(state.step+1)%4]}。`;
      if(caption!==lastStatus){root.querySelector('[data-status]').textContent=caption;lastStatus=caption;}
    }
    function draw(){sync();drawModel();drawCut();}
    function stop(){state.playing=false;state.last=0;if(raf)cancelAnimationFrame(raf);raf=0;}
    function tick(time){
      if(!state.playing)return;
      if(state.last)state.elapsed+=Math.min(time-state.last,120);
      state.last=time;
      if(state.elapsed>=duration){state.elapsed=0;state.step++;if(state.step===4)stop();}
      draw();if(state.playing)raf=requestAnimationFrame(tick);
    }
    root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      const action=b.dataset.action;
      if(action==='view-reset'){state.yaw=-.66;state.pitch=.5;draw();return;}
      if(action==='play'){
        if(state.playing)stop();else{
          if(state.step===4){state.step=0;state.elapsed=0;}
          state.playing=true;state.last=0;raf=requestAnimationFrame(tick);
        }
      }else{
        stop();state.elapsed=0;
        if(action==='next')state.step=Math.min(4,state.step+1);
        if(action==='prev')state.step=Math.max(0,state.step-1);
        if(action==='reset')state.step=0;
      }
      draw();
    }));
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing){stop();draw();}});
    REDUCED.addEventListener('change',draw);
    bindView(model,state,draw);observe(root,draw);draw();
  }

  function initOcct(root) {
    const state={yaw:-.66,pitch:.5,selected:'both'};
    root.innerHTML=heading('03 / OCCT EDGE OCCURRENCES','两个 Wire，两处 Edge 使用','在这个普通流形共享边的例子里，两个 Face 的边界各使用一次 Edge。它们共享 TShape 与相同 Location，各自携带 Orientation。')+
      `<div class="bl-controls">${button('both','同时看两处','aria-pressed="true"')}${button('top','顶面 Wire','aria-pressed="false"')}${button('right','右侧 Wire','aria-pressed="false"')}${button('view-reset','复原视角')}</div>`+
      `<div class="bl-grid"><section class="bl-panel"><h4>同一个实体、同一条 E</h4><p class="bl-panel-sub">箭头表示两处边界使用的示意方向</p>${svgMarkup('model','OCCT 长方体：顶面 Wire 与右侧 Wire 中的两处 Edge 使用，共享一个 BRep_TEdge。')}${hint}<p class="bl-occt-legend">蓝色 = 顶面中的使用；橙色 = 右侧面中的使用。这里的颜色不代表 Region 的内外。</p></section><section class="bl-panel"><h4>方向放在 Shape 引用里</h4><div class="bl-tree"><div class="bl-tree-duo"><div data-branch="top"><div class="bl-tree-node">顶面 Face</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node">Wire T</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-outer">Edge occurrence T<br>Location + Orientation</div></div><div data-branch="right"><div class="bl-tree-node">右侧 Face</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node">Wire R</div><span class="bl-tree-arrow">↓</span><div class="bl-tree-node bl-inner">Edge occurrence R<br>Location + Orientation</div></div></div><div class="bl-tree-mate">↘ myTShape &nbsp;&nbsp;&nbsp; myTShape ↙</div><div class="bl-tree-node bl-edge">同一个 BRep_TEdge</div><span class="bl-tree-arrow">↓ 几何表示</span><div class="bl-tree-node">3D curve：空间中的边<br>pcurves：相应曲面的 UV 表示</div></div><p class="bl-note bl-occt-info">实际结构可含多种曲线表示。seam edge 可能有同一支撑曲面上的两条 pcurve；退化边等情况不适用本图的简单计数。</p></section></div>`+
      `<div class="bl-status" data-status aria-live="polite"></div><p class="bl-note">两个 occurrence 在统一的实体边界解释中沿共享边反向使用。读取原始存储的 Orientation 与遍历时累计父级 Orientation 是不同层次；本图不声称原始枚举值固定为 FORWARD / REVERSED。</p><p class="bl-note">源码结构示意 · 未运行 OCCT。TopoDS_Edge 不提供 SMLib 式的 mate / radial 成员；不能把两处 occurrence 直接展开成四个 Edgeuse。</p>`;
    const model=root.querySelector('.bl-model');
    function draw(){
      const [w,h]=prepare(model),P=projector(state,w,h,true);body(model,P,state,{edge:true});
      const uses=[{id:'top',a:[.92,.95,.75],b:[.92,.95,-.75],label:'顶面中的 E',anchor:[8,35],color:C.outer},{id:'right',a:[1.4,.42,-.75],b:[1.4,.42,.75],label:'右侧面中的 E',anchor:[w-8,63],color:C.inner}];
      uses.forEach(u=>{
        const g=el('g',{opacity:state.selected==='both'||state.selected===u.id?1:.2},model);
        arrow(g,P(u.a),P(u.b),u.color,3);annotate(g,P([(u.a[0]+u.b[0])/2,(u.a[1]+u.b[1])/2,0]),u.anchor,u.label,u.color,u.id==='top'?'start':'end');
      });
      annotate(model,P([1.25,.8,.85]),[8,h-15],'共享 BRep_TEdge',C.edge);
      ['both','top','right'].forEach(id=>root.querySelector(`[data-action="${id}"]`).setAttribute('aria-pressed',String(state.selected===id)));
      ['top','right'].forEach(id=>root.querySelector(`[data-branch="${id}"]`).classList.toggle('bl-tree-inactive',state.selected!=='both'&&state.selected!==id));
      root.querySelector('[data-status]').textContent=state.selected==='top'?'顶面 Wire 中的 Edge occurrence：引用共享的 BRep_TEdge，并在该父级上下文中携带方向。':'right'===state.selected?'右侧 Wire 中的 Edge occurrence：仍引用同一 BRep_TEdge；几何共享并不消除使用方向的差异。':'共同点：共享实体，区分使用。差异：SMLib 显式连接 use 对象；OCCT 用 TShape + Location + Orientation 表示 Shape 引用，邻接一般由遍历和映射建立。';
      root.dataset.current=state.selected;
    }
    root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.action==='view-reset'){state.yaw=-.66;state.pitch=.5;}else state.selected=b.dataset.action;draw();}));
    bindView(model,state,draw);observe(root,draw);draw();
  }

  function init(){
    document.querySelectorAll('[data-brep-lab]').forEach(root=>{
      if(root.dataset.ready==='true')return;
      if(root.dataset.mode==='regions')initRegions(root);
      else if(root.dataset.mode==='cycle')initCycle(root);
      else if(root.dataset.mode==='occt')initOcct(root);
      root.dataset.ready='true';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
