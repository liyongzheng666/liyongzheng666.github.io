---
title: 论文精读 01 | ReAct：让语言模型边推理边行动
date: 2026-07-24T00:00:00+08:00
description: 论文精读系列开篇。精读 Yao et al. 2022 的 ReAct（ICLR 2023），聚焦 §1–3：Thought → Action → Observation 循环如何把「只想不做」的 CoT 和「只做不想」的 action 生成缝合成一个范式。
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
| 发表 | arXiv 2022.10，ICLR 2023 |
| 链接 | [arXiv 2210.03629](https://arxiv.org/abs/2210.03629) · [项目页](https://react-lm.github.io/) · [本站 PDF 备份](/papers/ReAct-Yao-2022.pdf) |

## 一句话概括

在 ReAct 之前，「推理」和「行动」是两条各自发展的线：chain-of-thought 让模型把中间推理写出来，但全程闭着眼睛想，不接触外部世界，想错了只会一路错下去（幻觉 + 错误传播）；action-only 的方法让模型在环境里操作，但不维护对目标的抽象推理，走偏了没有自我纠正的机制。ReAct 的做法是把两者**交织**起来：

> Thought → Action → Observation → Thought → Action → Observation → …

推理为行动服务（拆解目标、跟踪进度、处理异常），行动为推理服务（从外部拿回真实信息，把推理"接地"）。关键的技术动作其实很轻：**把「说一句想法」也扩充进 action space**——thought 是一种不影响环境、只更新自身上下文的特殊动作。

## 精读范围：§1–3

这次只精读前三节，各自回答一个问题：

- **§1 Introduction** — 为什么"只想"和"只做"各自都不够？注意作者用人类"做菜时边想边做"的类比引出动机，以及 Figure 1 里四种 prompting 方式（Standard / CoT / Act-only / ReAct）在同一道 HotpotQA 题上的对照——这张图是全文最高效的信息来源。
- **§2 方法本体** — action space 扩充这一段是核心中的核心。另外注意两个工程细节：thought 在知识型任务里是密集交替的，在决策型任务里是**稀疏、按需出现**的；few-shot 示例只用了 1–6 个人写的轨迹。
- **§3 知识密集型任务实验** — HotpotQA / FEVER 上的结果。最值得记的不是分数，而是错误分析：CoT 的失败模式是幻觉（编得流畅但错），ReAct 的失败模式是**推理被检索结果牵着走**（检索质量差时反而不如 CoT）——所以最优配置是 ReAct 和 CoT 的混合切换。这个"接地是双刃剑"的结论今天依然成立。

§4 之后（ALFWorld / WebShop 的决策任务实验）这次跳过，不影响理解范式本身。

## 带着读的三个问题

1. thought 既然不改变环境，为什么它对最终成功率有实质贡献？（提示：working memory）
2. ReAct 降低幻觉的机制是什么？它引入了什么新的失败模式作为代价？
3. 如果把 ReAct 循环里的"下一步做什么"抽成一个独立的决策函数，工具执行全部确定性化，这个范式会变成什么形态？——这是把论文往现代 agent 工程实践映射时最值得琢磨的一步。

读完 §1–3 后我会把自己的答案和批注补进本文的后续版本。
