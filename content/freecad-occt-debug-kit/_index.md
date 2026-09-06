---
title: AI Harness · 几何诊断与验证
description: 围绕圆角与倒角失败，建立可复现的根因诊断与验证过程。
layout: project-detail
topic: ai-cad
---

[查看项目源码](https://github.com/liyongzheng666/freecad-occt-debug-kit) · [阅读 README](https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/README.md)

## 项目在解决什么

`freecad-occt-debug-kit` 面向 OCCT / FreeCAD 的圆角与倒角失败场景，把“为什么会失败”变成可复现、可定位、可回归的调试过程：从构建环境、几何采集，到根因诊断 Agent 与量化评估。

## 按问题选择阅读入口

| 你关心的问题 | 从哪里开始 |
|---|---|
| 几何建模与内核中的失效机制、缺陷导出、调试捕获 | [GEOMETRY.md](https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/GEOMETRY.md) |
| Agent 的决策过程、规则与模型对照、评估与轨迹回看 | [AGENT.md](https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/AGENT.md) |
| 环境准备、构建与完整使用说明 | [README.md](https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/README.md) |

## 从观察到验证

1. **准备可复现环境**：固定的上游版本、Pixi 工具链与 bootstrap 脚本，支持 OCCT / FreeCAD 调试。
2. **采集几何证据**：把 BREP 转为网格、几何和缺陷信息，并检查面面自交等问题。
3. **定位失败机制**：沿观察、定位、机制、反事实到结论的顺序，保留可追踪的决策链。
4. **量化评估与回归**：对照规则和模型的决策，用评估基线检验改动。
5. **直观看调试结果**：通过 [几何可视化工具](https://www.goudanx.top/Print/) 检查转换后的几何资产。

## 准备好环境之后

以下命令在项目仓库及其配置好的环境中运行，完整前置步骤以 README 为准。

```bash
# 合成 case 根因诊断
python -m agent.loop.investigate box 5

# 对自己的模型文件进行诊断
python -m agent.loop.investigate "brep:/abs/m.brep" 5 --edges 3

# 运行量化评估
bash agent/eval/eval.sh
```

## 相关学习

- [几何工程师的 AI 之路](https://www.goudanx.top/geometry-engineer-ai-road/)：从学习与练习补齐工程实践所需的能力。
- [ReAct 论文精读](/blog/paper-reading-01-react/)：理解推理与行动相互配合的基本思路。
- [返回 AI Harness 专题](/ai-cad/)。
