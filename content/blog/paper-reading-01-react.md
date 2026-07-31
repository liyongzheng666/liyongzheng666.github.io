---
title: 论文精读 01 | ReAct：让语言模型边推理边行动
date: 2026-07-24T00:00:00+08:00
lastmod: 2026-07-31T00:00:00+08:00
description: 论文精读系列开篇。精读 Yao et al. 2022 的 ReAct（ICLR 2023），聚焦 §2 方法本体与 §3 实验——Â = A ∪ L 这一行消解了什么元问题、为什么轨迹每次都那么整齐、以及 §3 测的其实是一笔交易而不是一次胜利。
tags:
  - 论文精读
  - Agent
  - LLM
draft: false
---

这是「论文精读」系列的第一篇。开这个系列的动机很简单：agent 领域的很多"常识"其实都能追溯到几篇原始论文，与其读二手转述，不如把源头逐篇啃下来——每篇写清楚**它当时要解决什么问题、方法本体是什么、哪些结论今天仍然成立**。

第一篇从 ReAct 开始，因为今天几乎所有 tool-use agent 的循环骨架都是它定下的。

<!--more-->

## 论文信息

| | |
|---|---|
| 标题 | ReAct: Synergizing Reasoning and Acting in Language Models |
| 作者 | Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao |
| 发表 | arXiv 2022.10，**ICLR 2023 Oral（top 5%）** |
| 链接 | [arXiv 2210.03629](https://arxiv.org/abs/2210.03629) · [项目页](https://react-lm.github.io/) · [本站 PDF 备份](/papers/ReAct-Yao-2022.pdf) |

**本文精读范围**：§2（方法本体）+ §3（知识密集型推理任务），佐证材料取自 Appendix A.1 / C.1。§4 的决策任务实验只在必要时跨节引用。

**关于证据分级**：本文默认每句话都出自论文原文（关键处标页码）。只有两种例外会显式标注——**【外部】**（网络二手来源，附链接）、**【我判】**（我的推论，论文没这么说）。

## 一句话概括

ReAct 的技术含量**不在**「让模型边想边做」这句话上——那是结果不是方法。它的方法本体只有一行：

> **Â = A ∪ L**

把「说一句想法」塞进动作空间。这一行的真正后果是**消解了「何时思考」这个元问题**——不需要调度器，因为 think 还是 act 变成了同一个策略的一次普通采样。

而 §3 的价值同样不在分数（ReAct 在 HotpotQA 上是**输**给 CoT 的，作者照登），而在**实验设计**：四个 baseline 全是同一份 prompt 的删行消融，外加一张 200 例人工标注的失效模式表。

---

## §1 在解决什么：两条互不相交的线

2022 年秋，「推理」和「行动」是两条各自发展、互不相交的线：

| 线 | 代表 | 能力 | 硬伤 |
|---|---|---|---|
| 只想 | Chain-of-Thought（Wei et al. 2022） | 把中间推理写出来，算术/常识/符号任务大涨 | 论文原话：**"a static black box"**，模型只用自己的内部表征，**不被外部世界接地**（not grounded in the external world）→ 事实幻觉 + 错误沿链传播 |
| 只做 | SayCan、WebGPT、Inner Monologue 等 | 在环境里真操作 | 不用语言模型做**抽象**推理，也不维护 working memory；Inner Monologue 虽有"内心独白"，但那只是**环境状态的观察复述**，不是真思维（§4 明确说 IM 的 inner monologue "is limited to observations of the environment state"） |

ReAct 把两者缝起来。作者在 §1 开头用的动机是人类认知：做菜时人会在两个具体动作之间用语言追踪进度（"现在都切好了，该烧水了"）、处理异常（"没盐了，那用酱油加胡椒代替"）、意识到需要外部信息（"面团怎么做？上网搜一下"）——这条 inner speech / working memory 的线索引了 Vygotsky、Luria、Baddeley。

---

## §2 方法本体

### 形式化起点：π(a_t|c_t) 把「agent」定义成了什么

论文第一段（p3）先立了一个极简的交互式设定，没有任何 LLM 味道：

- 时刻 t，agent 从环境收到观察 `o_t ∈ O`，按策略 `π(a_t|c_t)` 采取动作 `a_t ∈ A`
- 上下文 `c_t = (o₁, a₁, …, o_{t−1}, a_{t−1}, o_t)`——**全历史，不是当前状态**

两个细节值得停一下：

1. **它没有写 state，只写 context。** 这是把问题当成部分可观察来处理：agent 不假设自己能看到真实状态，只有观察-动作的历史。所有"记忆"都在 `c_t` 里，没有额外的隐状态槽。
2. **策略只条件在 `c_t` 上。** 这意味着**任何"何时思考"的调度信息也必须编码在 `c_t` 里**——这是下一节那个论证的伏笔。

作者随即点出难处（原文）：**"Learning a policy is challenging when the mapping c_t ↦ a_t is highly implicit and requires extensive computation."**

**注意这个论证的形状**：问题不是"模型不会做动作"，而是"从 `c_t` 到 `a_t` 的映射太隐式，需要中间计算，而这个计算无处安放"。ReAct 接下来给的就是一个**安放中间计算的地方**。

### 核心一行：Â = A ∪ L

原文（p3）：**"The idea of ReAct is simple: we augment the agent's action space to Â = A ∪ L, where L is the space of language."**

`L` 是语言空间。落在 `L` 里的动作 `â_t` 叫 **thought / reasoning trace**。这一行有三个直接后果，论文一句话全给了：

| 后果 | 原文依据 | 工程含义 |
|---|---|---|
| ① **无环境副作用** | thought "does not affect the external environment" | 思维是纯的，不改世界，因此**可以任意插入、删除、重写**而不破坏轨迹合法性 |
| ② **无观察反馈** | "thus leading to no observation feedback" | 思维后面**不跟 Observation 行**——这是格式上区分 thought 与 action 的硬标志 |
| ③ **上下文 append-only** | `c_{t+1} = (c_t, â_t)` | 思维唯一的作用是把自己**追加进上下文**，供后续推理或行动使用 |

第 ③ 条是全文最容易被读薄的一句。展开说：thought 的收益机制**不是**"模型想明白了"，而是**"模型把一个中间结论写进了自己下一步的输入"**。

原文对 thought 的定位是 "aims to **compose** useful information by reasoning over the current context `c_t`"——**compose**（组织、提炼），不是 compute。它把散落在长上下文里的信息压成一句显式的话，下一次前向就能直接读到，不必重新在 20 条 Observation 里检索。

> **这就是 working memory 的实现方式：一个可写的、纯追加的暂存区，而暂存区恰好就是 prompt 本身。**

### 它真正消解的：不是「让模型能说话」，是「何时思考」

假设你不知道 ReAct，要给一个 tool-use agent 加推理能力，你有四条路：

| 路 | 做法 | 谁决定何时思考 |
|---|---|---|
| A | 每步动作前强制生成一段推理 | 固定模板（永远思考） |
| B | 每 k 步插一次推理 | 固定超参 |
| C | 训一个分类器判断"这步该不该想" | 一个**额外的元控制器** |
| D | **把 thought 放进动作空间** | ——没有人，问题消失了 |

A/B/C 都需要一个**「元控制器」**：位于策略之外、决定"下一步是思考还是行动"的东西。它要么是硬编码模板，要么是第二个模型。

路 D 让这个元问题**退化成一次普通的动作选择**。因为 thought 和 action 现在住在同一个空间 `Â`，"下一步写 Thought 还是写 Action"就是 `π(·|c_t)` 这一次采样的结果——同一个策略、同一次前向、同一个分布。**成本为零，因为它复用了本来就要做的那次前向。**

论文在 §2 第三段给了一句直白确认，也是很多人读漏的（p4，讲决策类任务时）：

> "so we let the language model decide the **asynchronous occurrence** of thoughts and actions for itself."

没有调度器，没有模板，没有第二个模型。**这才是 Â = A ∪ L 那一行的全部含量**——它不是"让模型能说话"（模型本来就会说话），它是把"何时思考"这个元问题消解掉了。

⚠️ 但这句话的适用范围有严格边界，见下面的「主语差异」一节——它**只**对决策类任务成立。

### 思维在干什么活：论文枚举的五类

原文（p3）明确列了 thought 的用途，并给了 Figure 1 的行号锚点：

| # | 功能 | 例子 |
|---|---|---|
| 1 | **拆解任务目标** | "I need to search Apple Remote and find the program it was originally designed to interact with" |
| 2 | **注入常识知识** | "pepper shaker…more likely to appear in cabinets (1-6), countertops (1-3)…" |
| 3 | **从观察中抽取要点** | "The paragraph does not tell x" |
| 4 | **追踪进度、迁移动作计划** | "Now I find a pepper shaker 1. Next, I need to put it in/on drawer 1." |
| 5 | **处理异常、调整计划** | "Front Row is not found. I need to search Front Row (software)." |

**【我判】** 这五类不是并列的，可以按"是否需要外部信息"分成两组：第 2 类是**从模型权重里取知识**（内生），1/3/4/5 是**对上下文做操作**（组织、抽取、记账、纠错）。后一组正是上一节说的 compose——它们不产生新事实，只重排已有信息。

这解释了为什么 thought 不接触环境却仍然有用：**它做的是信息组织，不是信息获取。**

### 为什么必须「冻结大模型 + few-shot」

原文（p3）：**"However, as the language space L is unlimited, learning in this augmented action space is difficult and requires strong language priors."**

这句话是全文最重要的**边界声明**，也最常被误引：

- ❌ 常见误读：「奖励稀疏，所以学不动」——论文**没有**这么说，这里根本不在讲 RL。
- ✅ 论文的实际论证：`L` 是**无界**的。原来的动作空间 `A` 有限（HotpotQA 就 3 个动作），一旦并上语言空间，动作空间的势变成无穷。在无穷动作空间上从零学策略不可行，所以**必须借用已经学好的语言先验**——也就是一个预训练大模型。

于是 setup 被钉死：**冻结的 PaLM-540B + few-shot in-context examples**。每个 in-context 示例是**一条人写的轨迹**（a human trajectory of actions, thoughts, and environment observations）。

⚠️ 脚注 1 里藏了一句反直觉的话：**"We show some GPT-3 results in Appendix A.1 which outperforms PaLM-540B."** 主实验用的模型**不是**当时最强的那个。

### 稠密 vs 稀疏：一个被普遍读漏的主语差异

论文（p3 末–p4 头）把任务分成两类，给了**两种不同的思维安排**：

| regime | 任务类型 | 论文原句 | 主语 |
|---|---|---|---|
| **稠密思维** | 推理为主（HotpotQA / FEVER） | "**we** alternate the generation of thoughts and actions…" | **作者** |
| **稀疏思维** | 决策为主（ALFWorld / WebShop） | "…so **we let the language model decide** the asynchronous occurrence of thoughts and actions for itself" | **模型** |

**这是本节最重要的一条，也是网上二手解读几乎一律读漏的地方。**

在推理类任务里，是**作者**在写 exemplar 时就把 Thought/Action 严格交替地排好了——模型只是照抄这个位置模式。**只有在决策类任务里**，论文才说"让语言模型自行决定"。

所以「ReAct 让模型自主决定何时思考」这句流行说法，**只对论文的一半成立**。§3 全篇讲的都是稠密 regime，那里的 think/act 交替基本是**格式规定的**，不是模型选的。

### 追问：为什么轨迹每次都那么整齐？

读到这里会自然冒出一个问题：既然是"稠密交替"，为什么模型每一步都能不多不少地写出 `Thought n / Action n / Observation n`，一次都不乱？

**首先要纠一个词：这不是「强制」。** ReAct 里没有任何硬约束（没有语法约束、没有 constrained decoding）阻止模型写出乱格式。整齐是**软压力**压出来的。拆成四层看：

**① 三行里有一行根本不是模型写的。**

`Observation n` 那一行**由环境产出**。论文那句「thought 不影响外部环境，**因此没有观察反馈**」反过来读就是：action 有观察反馈——`search[entity]` 返回维基页前 5 句，那 5 句是 Wikipedia API 写的。

所以整条轨迹是**两个作者合写**的：模型写 Thought / Action，环境写 Observation。**三分之一的行天然整齐，不需要模型配合。**

〔实现层，§2/§3 正文没写〕ReAct 式循环的标准实现还会再帮一把：生成时设 stop sequence 停在 `Observation` 之前，再由 harness 把真实观察拼回去。也就是说模型**根本没有机会**写出一行格式错误的 Observation。这条是按 ReAct 参考实现的通行做法讲的，不是从论文正文读到的。

**② 剩下的 Thought/Action 交替，是「补全」不是「遵守」。**

模型不是在执行指令，它在对一份**局部模式极强的文档**做下一 token 预测。关键在于：`Observation n → Thought n+1` 这个行级二元组在 6 条示例里出现了**二十多次，无一例外**（可以在下面附录 B 的原文里数）。当上下文刚追加完 `Observation 3`，下一行行首是 `Thought` 的条件概率被这二十多个同构实例推到接近 1。

**这不是"模型愿意配合"，这是复制局部模式——transformer 最擅长的事之一**，比 `Thought 3` 那一行**内部**要做的语义推理容易得多。

**③ 标签里的数字本身在携带状态。**

```
Thought 3     → Action 3        数字不变
Observation 3 → Thought 4       数字 +1
```

**编号是一个计数器。** 它把"我现在走到轨迹哪一步"显式写在 prompt 里，于是模型不需要"记住"进度，只需要抄同一个数字、或者加一。

**④ 【我判】格式正确率随轨迹推进而升高，不是降低。**

第 1 步时模型手里的证据是 6 条示例；到第 4 步时，上下文里是 6 条示例**加上它自己刚写对的 3 步**。模式证据变多了，而且新增部分和它自己的措辞风格完全一致。**格式不是每步都要重赌一次，而是越走越稳**——这跟直觉相反。

**反过来看：什么时候真的不整齐？**

论文自己报的失效（§3.3 观察 B）：模型会**反复生成之前的思维与动作**，跳不出循环。这里有个很值得停一下的细节——

> 这个失败模式**不是"格式崩了"，而是"格式完好但内容在打转"**。

模型一丝不乱地写着 `Thought 5 / Action 5 / Thought 6 / Action 6`，只是内容和第 3、4 步一模一样。**这恰恰证明格式机器比推理机器结实**：推理先崩，格式还在。

【外部】而小模型上格式和循环会一起崩——[一篇小模型实测](https://www.vietanh.dev/blog/2026-06-15-plan-once-then-act-small-model-agents)里 1.7B 模型调完第一个工具就写「我已经帮你完成了」，直接跳出循环。所以"整齐"是**模型能力 × 模式强度**的函数，不是范式的保证。

**一句话收口**：整齐来自三处叠加——**1/3 的行由环境写**、**编号充当计数器**、**模式证据随轨迹自我增强**；而模型真正吃力的地方从来不是"该写 `Thought 3` 了"，是"`Thought 3` 里写什么"。**格式是这套东西里最简单的部分。**

### 四条性质，逐条翻成工程语言

论文（p4）自评四条：

| 性质 | 原文要点 | 工程语言 | 今天还成立吗 |
|---|---|---|---|
| **A) 直观易设计** | 标注者只需在动作之上写下想法；**本文未用任何 ad-hoc 格式选择、思维设计或示例筛选** | 标注成本≈0，无 prompt 工程玄学 | ✅ 且更强了 |
| **B) 通用灵活** | 思维空间与出现格式都灵活，适配 QA / 事实核验 / 文字游戏 / 网页导航 | 一套范式跨四个域 | ✅ 这是它成为事实标准的原因 |
| **C) 高性能且稳健** | **只用 1–6 个示例**就能泛化；且对 prompt 选择稳健 | 样本效率极高 | 🟡 "稳健"存疑 |
| **D) 人类对齐、可控** | 推理过程可检查；人可**通过编辑思维**在运行中纠正 agent 行为 | 可解释 + 可干预 | ✅ 且被低估 |

**性质 D 值得单独说**，它是四条里唯一至今没被超越的。Appendix A.3 给了实证：ALFWorld 里 ReAct 因为某一步的幻觉思维而失败；**人只改两句思维**，轨迹就转向并成功。原文的对照极锋利——这对 Act-only 和之前的 RL 方法**做不到**，因为人改不了模型参数，而改几个动作并不会改变后续行为。

**【我判】** 这条是 ReAct 对 agent 可运维性最被忽视的贡献：它把"纠正 agent"的成本从"改模型/改几十个动作"降到"改一句话"。今天所有做 human-in-the-loop agent 的产品，本质上都在吃这条红利。

---

## §3 在测什么：一笔交易，不是一次胜利

§3 读起来像"结果章"——一堆表和基线清单，所以很容易以为重点是分数。**其实它的论点跟分数没多大关系。**

> §3 不是在证明「ReAct 更强」，而是在**量化"给推理接上外部世界"这笔交易换到了什么、赔掉了什么**。换到的是幻觉 56% → 0%，赔掉的是推理错误 16% → 47% 外加 23% 的检索风险。**因为这是一次置换、不是一次改进，所以结论必然是"混合"而不是"取代"。**

### 一个故意做弱的动作空间

**任务**：HotpotQA（多跳问答，需在两个及以上维基段落上推理）、FEVER（事实核验，`SUPPORTS` / `REFUTES` / `NOT ENOUGH INFO`）。关键设定是 **question-only**——模型拿不到支撑段落，必须靠内部知识或去外部取。

**动作空间**只有三个：

| 动作 | 语义 |
|---|---|
| `search[entity]` | 返回该实体维基页的**前 5 句**；页面不存在则返回维基搜索引擎的 top-5 相似实体 |
| `lookup[string]` | 返回页内**下一个**包含 `string` 的句子（明说是模拟浏览器 Ctrl+F） |
| `finish[answer]` | 以 `answer` 结束任务 |

然后是这一节最值得记的一句：

> "We note that this action space mostly can only retrieve a small part of a passage based on exact passage name, which is **significantly weaker than state-of-the-art lexical or neural retrievers**. The purpose is to simulate how humans would interact with Wikipedia, and **force models to retrieve via explicit reasoning in language**."

**作者是故意把检索器做弱的。** 这不是资源限制，是实验设计：给一个强检索器，一次召回就能答对，那就测不出"语言推理在检索中起了什么作用"。

**【我判】** 这条设计哲学比 ReAct 本身更值得抄：**想测什么，就把别的路堵死。**

（顺带澄清一个常见误会：这篇论文里**没有 embedding、没有向量检索**。`search` 是按精确页名取前 5 句而已。）

### 全文最值得抄的实验设计：四个 baseline 全是删行消融

这是整篇论文方法论上最漂亮的地方。原文开宗明义：**"We systematically ablate ReAct trajectories to build prompts for multiple baselines."**

| baseline | 从 ReAct 轨迹里删掉了什么 | 剩下 |
|---|---|---|
| **Standard** | **所有** thought、action、observation | Question → Answer |
| **CoT** | action 与 observation | Question → Thought → Answer |
| **CoT-SC** | 同上，但采 **21 条**、温度 **0.7**、取多数答案 | self-consistency |
| **Act** | thought | Question → Action → Observation |

**为什么这个设计强**：四个 baseline 和 ReAct **共享同一批人写轨迹、同一批题、同一个模型**，彼此差别**只有"哪几行被删掉"**。所以性能差异能干净地归因到"缺了 thought"或"缺了 action"，而不是"prompt 写得好不好"。

这一点在 Appendix C.1 可以逐字核对——四块 prompt 并排放着，Act 块就是 ReAct 块删掉 `Thought n` 行的结果（见下面附录 B）。

### Table 1 怎么读：只有三组比较有意义

| Prompt Method | HotpotQA (EM) | Fever (Acc) |
|---|---|---|
| Standard | 28.7 | 57.1 |
| CoT | 29.4 | 56.3 |
| CoT-SC | 33.4 | 60.4 |
| Act | 25.7 | 58.9 |
| **ReAct** | **27.4** | **60.9** |
| CoT-SC → ReAct | 34.2 | **64.6** |
| ReAct → CoT-SC | **35.1** | 62.0 |
| *Supervised SoTA* | *67.5* | *89.5* |

八行里真正构成论证的只有三组：

| 比什么 | 测的是 | 结论 |
|---|---|---|
| ReAct **vs Act** | thought 的价值 | ✅ 两项都赢（**核心消融**，全节存在的理由） |
| ReAct **vs CoT** | 接地 vs 内生 | 🟡 一胜一负 → 引出互补性论证 |
| 混合 **vs 单打** | 组合收益 | ✅ 两项都最优 |
| Standard `28.7/57.1` | **地板** | 标尺，不是对手 |
| Supervised SoTA `67.5/89.5` | **天花板** | 清醒剂：最好的 prompting 才 35.1/64.6 |

两点必须读出来：

1. **ReAct 单打在 HotpotQA 上 27.4，低于 CoT 的 29.4。** 作者把这个负结果**照登在主表第 5 行**，还专门用一段解释为什么。这是这篇论文可信度的来源。
2. **ReAct 稳赢 Act**（27.4 > 25.7，60.9 > 58.9）——收益尤其在**合成最终答案**那一步。

### Table 2 才是 §3 的心脏

`27.4 vs 29.4` 这两个数**关于机制什么都没说**。分数接近时分数本身没有信息量，所以作者干了件笨重的事：**从两种方法各抽 50 条对、50 条错，共 200 条轨迹，人工逐条标注失效原因**。

| | 类型 | ReAct | CoT |
|---|---|---|---|
| 成功 | True positive | 94% | 86% |
| 成功 | **False positive**（答对但推理/事实是幻觉） | **6%** | **14%** |
| 失败 | Reasoning error（含陷入重复步骤） | **47%** | 16% |
| 失败 | Search result error | 23% | — |
| 失败 | **Hallucination** | **0%** | **56%** |
| 失败 | Label ambiguity | 29% | 28% |

**读这张表必须注意三件事**：

1. **这些是组内占比，不是绝对率。**「CoT 幻觉 56%」是说**在它那 50 条失败样本里**，56% 的败因是幻觉——不能读成"CoT 有 56% 的题会幻觉"。
2. **`False positive` 这一栏就是"假绿"**：**答案对了，但推理过程或事实是编的**。只看最终答案 EM，这 6% / 14% 全部算成功；只有人去看轨迹，才发现它们答对的理由是假的。**2022 年他们靠人眼发现了这件事——今天这该做成评测里的一个自动维度。**
3. **代价栏也很诚实**：ReAct 的 reasoning error 是 47%，CoT 只有 16%。

**正确的阅读顺序是先看 Table 2，再回头看 Table 1。Table 2 解释 Table 1。**

### 三条观察：接地是双刃剑

- **A) 幻觉对 CoT 是严重问题。** 成功模式下假阳率高得多（14% vs 6%），失败模式下更是主因（56%）。相比之下 ReAct 的轨迹"更接地、更事实驱动、更可信"，**归功于能访问外部知识库**。
- **B) 结构约束降低灵活性。** 交替的 thought-action-observation 提高了接地性，但也**降低了组织推理步骤的灵活性**。这里点名了一个 **ReAct 特有的高频错误**：模型反复生成之前的思维与动作，跳不出循环。⚠️ **脚注 4** 给了一个存疑归因：**"We suspect that this could be due to the sub-optimal greedy decoding procedure"**——用词是 suspect，**这是猜测不是结论**。
- **C) 检到有用知识是 ReAct 的命门。** 无信息量的检索占了 **23%** 的错误样本，会带偏推理且难以恢复。作者称这是**事实性与灵活性之间可预期的权衡**。

**一句话总结**：外部观察能把幻觉摁回地面（A），但也把推理绑进了固定节奏（B），还把命运交给了检索质量（C）。

### 混合策略：两个 backoff

既然两者的失效模式**几乎不重叠**（一个爱编，一个爱僵），组合就是必然：

| 方向 | 触发条件 | 阈值 |
|---|---|---|
| **ReAct → CoT-SC** | ReAct 在给定步数内没能返回答案 | HotpotQA **7 步**、FEVER **5 步** |
| **CoT-SC → ReAct** | n 个 CoT-SC 样本中多数答案出现次数**少于 n/2**（内部知识没把握） | — |

阈值不是拍脑袋的——**脚注 3** 做了自洽性检查：**在所有最终答对的轨迹里，用满 7 步 / 5 步的分别只占 0.84% 和 1.33%**。走到上限还没答出来的基本已经没救，此时切走的机会成本极低。**先量化"再走下去还有多少收益"，再定超参**——这个做法本身就值得抄。

收益在 Figure 2：两个混合方法**显著且一致地优于 CoT-SC**，并且——

> "reaching CoT-SC performance with 21 samples using merely **3-5 samples**."

**用 3–5 个样本达到纯 CoT-SC 用 21 个样本的水平，采样成本降到约 1/5。**

> **⚠️ 别和 hybrid search 搞混。** 这个"混合"和 RAG 里的**混合检索**（BM25 + 向量，RRF 融合）完全是两层的事：混合检索混的是**检索器**，并行跑再融合排名，解决召回率；ReAct + CoT-SC 混的是**知识来源**，串行 + 条件退避，解决"该信参数里的知识还是外部检索到的知识"。一句话——**混合检索管「怎么翻书」，ReAct+CoT-SC 管「翻不翻书」。** 顺带一提，`CoT-SC → ReAct` 那条（置信不足才检索）血统上是 adaptive RAG / Self-RAG 那条线的雏形，不是 hybrid search 那条线。

### 微调实验：范式排序反转

Figure 3 是 §3 最反直觉的结果：

| 设定 | ReAct 在四种方法里排第几 |
|---|---|
| **prompting**（8B / 62B） | **最后**——"同时从 in-context 示例里学推理和行动太难" |
| **微调**（仅 3,000 条自举轨迹） | **第一** |

而且 **PaLM-8B 微调后的 ReAct 超过所有 62B 的 prompting 方法；62B 微调后超过所有 540B 的 prompting 方法。**

微调数据来自 **STaR 式自举**：拿 ReAct 生成的 3,000 条答对轨迹，微调小模型去解码整条轨迹。

作者的解释很锋利：微调 Standard/CoT 本质上在**教模型背诵（可能是幻觉的）知识事实**，微调 ReAct/Act 在**教模型怎么（推理并）行动去取信息**——后者是更可泛化的技能。

**【我判】** 这段对今天最有预言性。"教检索/行动技能优于教事实"正是后来 tool-use 微调、agentic RL 那一整条线的前提；而"prompting 排最后、微调排第一"的反转，也解释了为什么 ReAct 作为 **prompt 技巧**在逐渐退场，作为**训练目标形态**却越来越主流。

### §3 没做的对照（诚实边界）

1. **只有一个主模型。** 主实验全在 PaLM-540B。Appendix A.1 补了 GPT-3 对照：HotpotQA `29.4 → 30.8`，ALFWorld `70.9 → 78.4`，**GPT-3 一致地更好**。所以"在别的模型上也行"是**附录级证据**。
2. **没有机制分析。** 全文没解释"模型如何决定 think/act"，也没做 prompt 格式的敏感性消融。
3. **动作空间只有 3 个。** 能否外推到几十上百个工具，§3 没有证据。
4. **基准本身是脏的。** Table 2 里 label ambiguity 占 29%/28%——近三成"失败"其实是**预测对了但没精确匹配标签**。Appendix A.2 还给了一个 HotpotQA 标签**已经过期**的例子（问酒店房间数，原标签是数据集构建时的数字），只有 ReAct 通过真实网络交互拿到了最新答案。

⚠️ **一个易踩的坑**：Table 1 的 ReAct-HotpotQA 是 **27.4**，但 Appendix A.1 的 Table 5 里 PaLM-540B 是 **29.4**。这不矛盾——Table 5 说明写明是在**随机抽的 500 道验证题**子集上跑的，与 Table 1 不是同一个评测集。别混，也别把它和 Table 1 里 CoT 的 29.4 看成同一个数（纯属巧合）。

---

## 这篇论文后来怎么样了

> 本节全部为**【外部】**二手来源。

**成了事实标准。** 它定义的 Thought → Action → Observation 循环成了此后几乎所有 tool-use agent 框架的骨架。最直接的证据是 LangChain：`AgentExecutor` 管理的就是这个循环，累积推理历史的字段直接叫 **`agent_scratchpad`**——即论文的 `c_t`。

**失效模式被后续工作量化。** [LLMCompiler](https://arxiv.org/pdf/2312.04511)（ICML 2024）在 GPT-3.5 / GPT-4 / LLaMA-2-70B 上测出 ReAct 两个主导失效：**过早停止**（基于不完整中间结果就收工）和**重复调用**，合计损失约 **7–8%** 准确率。注意**重复调用**论文自己在观察 B 里已经点出来了，只是当时归因给贪心解码、没有量化。

**小模型上直接崩。** [Plan Once, Then Act](https://www.vietanh.dev/blog/2026-06-15-plan-once-then-act-small-model-agents) 报告小模型上 ReAct 循环急剧退化（qwen2.5-3b 96.6、llama-3.2-1b 66.8、phi-4-mini 36.8）。成本上，**ReAct 在 N 步任务上至少需要 N+1 次 LLM 调用**。该文也明确指出：**"bigger models take the same exits; they just take them less often"**。

**被原生工具调用"吸收"——换掉的是语法，不是循环。** 今天主流 LLM API 在 API 层面就实现了这个循环。最有说服力的证据来自 LangChain 自己：曾经的 `create_react_agent` 已被 `langchain.agents.create_agent` 取代（[LangGraph v1 迁移](https://docs.langchain.com/oss/python/migrate/langgraph-v1)）——**以 ReAct 命名的构造器退场了，它构造的那个循环没有退场。**

**作者自己的后续。** Shunyu Yao 把语言模型与自主 agent 的三个基本概念各做了一篇：**行动 = ReAct**、**学习 = Reflexion**、**规划 = Tree of Thoughts**；再往后是 SWE-agent / SWE-bench。读 ReAct 时把它当"三部曲的第一部"，比当孤立论文更容易理解它的野心边界。

**没取到的：** OpenReview 上的 ICLR 2023 审稿意见有验证墙，本次没拿到，所以本文没有任何关于审稿人具体批评的陈述。

---

## 回到开篇提的三个问题

**Q1｜thought 既然不改变环境，为什么它对最终成功率有实质贡献？**

因为它做的是**信息组织**而不是信息获取。论文的措辞是 compose——把散在长上下文里的东西压成一句显式的话写回 prompt，下一次前向直接读到，不必重新在几十条 Observation 里检索。它就是 working memory，而暂存区恰好是 prompt 本身。论文枚举的五类用途里，只有"注入常识"是从权重取知识，其余四类全是对上下文做操作。

**Q2｜ReAct 降低幻觉的机制是什么？它引入了什么新的失败模式作为代价？**

机制是**接地**——每步推理后面跟一个来自外部的真实观察，编造的东西活不过下一次 Observation。效果是 Table 2 里幻觉致败从 CoT 的 56% 降到 **0%**。

代价有两个，都在 Table 2 里明码标价：**推理错误从 16% 涨到 47%**（固定节奏降低了组织推理的灵活性，还包括跳不出重复循环），以及**新增了 23% 的检索失败**（检不到有用信息就带偏推理且难以恢复）。**这是一次置换，不是一次改进**——所以正确用法是混合，不是取代。

**Q3｜如果把"下一步做什么"抽成一个独立的决策函数、工具执行全部确定性化，这个范式会变成什么形态？**

它会从"一个模型贯穿全程的自由文本轨迹"变成**"受限决策策略 over 固定工具集"**：thought 从自由语言退化成一次结构化选择，轨迹从模型生成变成编排层调度，结论合成甚至可以完全不经模型。

代价是丢掉性质 B（动作空间要预先定义，通用性下降）和一部分性质 D（没有自由思维可供人编辑）；换来的是**可复现、可打分、可离线重放**。这条路今天有个名字——结构化工具调用 + 编排层，主流 agent 框架都在往这个方向收。

**【我判】** 有意思的是，这个方向恰好把论文里的一个"bug"变成了"feature"：LLMCompiler 说的**过早停止**之所以有害，是因为 ReAct 的最终答案由模型在轨迹末端生成，少看一步就是少一份信息。而一旦结论合成变成确定性的、且与工具执行顺序无关，**提前停止就只是省钱，不再丢信息**。"早停对不对"不是策略的性质，是结论合成方式的性质。

---

## 附录 A · 原始数字

**Table 2**（p6，ReAct 与 CoT 各抽 50 正确 + 50 错误 = 200 例人工标注；**百分比是组内占比**）见正文。

**Table 5**（p14，Appendix A.1；⚠️ HotpotQA 是**随机 500 题子集**，与 Table 1 不同集）

| | PaLM-540B | GPT-3 (text-davinci-002) |
|---|---|---|
| HotpotQA (EM) | 29.4 | **30.8** |
| ALFWorld (success %) | 70.9 | **78.4** |

**其它散落数字**：CoT-SC 采 21 条、温度 0.7｜HotpotQA / FEVER exemplar 6 条 / 3 条｜backoff 步数 7 / 5｜脚注 3 的 0.84% / 1.33%｜微调用 3,000 条自举轨迹｜Figure 2 的 "3–5 样本打平 21 样本"｜脚注 2「更多示例不提升性能」。

## 附录 B · exemplar 原文（"删行消融"与"位置模式"的证据）

同一道题在四种 prompt 下的形态（Appendix C.1，p16–p19 摘录）：

**Standard**

```text
Question   What is the elevation range for the area that the eastern sector of the
           Colorado orogeny extends into?
Answer     1,800 to 7,000 ft
```

**Act**（= ReAct 删掉 Thought 行）

```text
Question       What is the elevation range for the area that the eastern sector of the
               Colorado orogeny extends into?
Action 1       Search[Colorado orogeny]
Observation 1  The Colorado orogeny was an episode of mountain building (an orogeny) in
               Colorado and surrounding areas.
Action 2       Lookup[eastern sector]
Observation 2  (Result 1 / 1) The eastern sector extends into the High Plains and is called
               the Central Plains orogeny.
Action 3       Search[High Plains]
...
Action 5       Finish[1,800 to 7,000 ft]
```

**CoT**（= ReAct 删掉 Action / Observation 行）

```text
Question   What is the elevation range for the area that the eastern sector of the
           Colorado orogeny extends into?
Thought    Let's think step by step. The eastern sector of Colorado orogeny extends
           into the High Plains. High Plains rise in elevation from around 1,800 to
           7,000 ft, so the answer is 1,800 to 7,000 ft.
Answer     1,800 to 7,000 ft
```

**ReAct**

```text
Question       What is the elevation range for the area that the eastern sector of the
               Colorado orogeny extends into?
Thought 1      I need to search Colorado orogeny, find the area that the eastern sector
               of the Colorado orogeny extends into, then find the elevation range of
               the area.
Action 1       Search[Colorado orogeny]
Observation 1  The Colorado orogeny was an episode of mountain building (an orogeny) in
               Colorado and surrounding areas.
Thought 2      It does not mention the eastern sector. So I need to look up eastern
               sector.
Action 2       Lookup[eastern sector]
Observation 2  (Result 1 / 1) The eastern sector extends into the High Plains and is
               called the Central Plains orogeny.
Thought 3      The eastern sector of Colorado orogeny extends into the High Plains. So I
               need to search High Plains and find its elevation range.
Action 3       Search[High Plains]
Observation 3  High Plains refers to one of two distinct land regions
Thought 4      I need to instead search High Plains (United States).
Action 4       Search[High Plains (United States)]
Observation 4  The High Plains are a subregion of the Great Plains. From east to west,
               the High Plains rise in elevation from around 1,800 to 7,000 ft ...
Thought 5      High Plains rise in elevation from around 1,800 to 7,000 ft, so the answer
               is 1,800 to 7,000 ft.
Action 5       Finish[1,800 to 7,000 ft]
```

**两个可核对的事实**：① Act 块与 ReAct 块的 Question / Action / Observation 行**逐字相同**，差别只有 Thought 行的有无——这就是"删行消融"。② 六条 exemplar **无一例外**遵守 `Question → Thought 1`、`Thought n → Action n`、`Observation n → Thought n+1`，且 **HotpotQA 的 prompt 里没有任何指令行**（对比 FEVER 的 prompt 开头有 `Determine if there is Observation that SUPPORTS or REFUTES a Claim...`）。指令是任务说明，不是节奏说明；**节奏完全靠位置模式传递。**

## 附录 C · 原文页码速查

配合[本站 PDF 备份](/papers/ReAct-Yao-2022.pdf)使用：

| 页 | 内容 |
|---|---|
| p1 | Abstract、§1 Introduction 开头（inner speech / 做菜类比） |
| p2 | **Figure 1**（Standard / CoT / Act / ReAct 四方对照 + ALFWorld） |
| p3 | **§2 开头：形式化 + Â = A ∪ L + 思维五类 + 冻结 PaLM-540B**、脚注 1 |
| p4 | **§2 末：稀疏 regime + 性质 A/B/C/D**；**§3.1 Setup**；§3.2 开头、脚注 2 |
| p5 | **Table 1**、**Figure 2**；§3.2 Baselines / Combining（backoff 阈值 + 脚注 3）/ Finetuning |
| p6 | **Table 2**；ReAct vs CoT、观察 A/B/C（脚注 4）、ReAct+CoT-SC、微调结论 |
| p7 | **Figure 3**；§4 开头（ALFWorld / WebShop） |
| p8 | Table 3 / 4；§4 Results；Inner Monologue 对照 |
| p9 | §5 Related Work、§6 Conclusion |
| p14 | **Appendix A.1 GPT-3（Table 5）**、A.2 标签过期、A.3 人在环改思维 |
| p15 | **Figure 5**（人工编辑思维救回轨迹）、B.1 / B.2 |
| p16–19 | **Appendix C.1 HotpotQA 四块 prompt 原文** |
| p20+ | Appendix C.2 FEVER prompts（注意开头有指令行） |

## 引用来源

**一手**：ReAct 论文本身，页码见附录 C。

**二手**（正文中标注为【外部】的陈述）：

- LLMCompiler，[arXiv 2312.04511](https://arxiv.org/pdf/2312.04511)——ReAct 过早停止 / 重复调用的量化
- [Plan Once, Then Act](https://www.vietanh.dev/blog/2026-06-15-plan-once-then-act-small-model-agents)——小模型上的 ReAct 崩塌与调用次数经济学
- [LangChain create_react_agent 文档](https://reference.langchain.com/python/langchain-classic/agents/react/agent/create_react_agent) 与 [LangGraph v1 迁移指南](https://docs.langchain.com/oss/python/migrate/langgraph-v1)
- [Shunyu Yao 个人主页](https://ysymyth.github.io/)——ReAct / Reflexion / ToT 三部曲与后续工作

---

**如果只记一件事**：当两个方法分数接近时，**分数本身没有信息量——必须去看失效模式的分布**。作者为了这一句话手工标了 200 条轨迹。这是 §3 真正能带走的方法论，比"ReAct 是个好范式"有用得多。
