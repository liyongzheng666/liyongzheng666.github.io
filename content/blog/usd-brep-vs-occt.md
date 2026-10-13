---
topic: ai-cad
title: usd-brep 与 OCCT 全面对比：从参数化与拓扑到实体、曲面算法
date: 2026-10-13T22:00:00+08:00
description: 基于固定版本源码，从参数化、拓扑、实体与曲面算法、精度、互操作和工程集成全面比较 usd-brep 与 OCCT，附长方体三维交互动画。
tags: [CAD, BRep, usd-brep, SMLib, OCCT, C++]
draft: false
width: wide
aliases: [/blog/usd-brep-occt-topology/]
---

[直接查看完整拓扑遍历动画](#edgeuse-cycle) · [AI 与 CAD 内容入口](/ai-cad/)

**usd-brep 是包含独立 SMLib 建模内核、Python 接口和 USD 场景集成的开源项目，值得作为 OCCT 的真正技术对照。** 它的能力远超基本体拼装：有布尔、圆角、抽壳、求交、Gordon/Coons 曲面和能量正则拟合。若目标是通用机械 CAD、工程格式交换与长期特征编辑，OCCT 提供的整体基础设施更完整；若目标是 USD 资产生成、数字孪生几何管线或内核算法研究，usd-brep 很有研究和试用价值。

这个评价来自固定版本源码、接口契约和公开问题记录，**不是性能或算法成功率排名**。本文逐项比较参数化、拓扑表达、实体与曲面算法、鲁棒性、数据交换、工程集成及维护条件；拓扑章节配有三幅三维交互图，从简单长方体解释 Region、Faceuse，以及共享边上四个 Edgeuse 的完整遍历。

## 1. 比较基线与整体结论

本次阅读固定在以下提交，避免把不同年代、商业扩展和开发分支混在一起：

| 项目 | 比较版本 | 固定源码 |
|---|---|---|
| NVIDIA usd-brep | 1.0.0 | [c9c5979](https://github.com/NVIDIA-Omniverse/usd-brep/tree/c9c5979f04cea8c38213004d4f04df0dcfb40d05) |
| Open CASCADE Technology | 8.0.1 | [b8f597c](https://github.com/Open-Cascade-SAS/OCCT/tree/b8f597c677811d1f9f4d8a97f5ae2825c0353a42) |

文中的 OCC 指 OCCT 几何内核。“具备某项能力”表示存在明确接口或可追踪实现，不表示所有复杂输入都能得到有效结果。本文完成静态源码核查，未构建、安装或运行两套内核的算法基准。三维动画是按照源码关系制作的教学示意，面层与箭头的错位不表示模型有真实厚度，也不是内核运行截图。

| 比较维度 | usd-brep 1.0.0 | OCCT 8.0.1 | 判断重点 |
|---|---|---|---|
| 定位 | SMLib 内核及 USD/Python 集成 | 通用 CAD/CAM/CAE 几何与应用组件 | 两者都是实际建模技术，不只是 mesh 工具 |
| 数学参数化 | 解析几何、NURBS、求值与导数 | Geom/Geom2d 与相关计算包 | 两者都有基础能力 |
| 尺寸脚本 | 自带 Python 建模入口 | C++ API，可结合上层绑定 | 适合程序生成，仍需管理参数与选择 |
| 特征历史 | 有属性传播，未核实完整特征框架 | OCAF、TFunction、TNaming | OCCT 现成基础设施更齐全 |
| 拓扑 | 显式 Region、use、mate/radial | 共享 TShape，加 Location/Orientation | 都能表达非流形，邻接组织不同 |
| 实体算法 | 布尔、圆角、扫掠、偏置、抽壳等 | 对应算法族和更多应用构件 | 适用输入、容差和失败诊断需逐项比较 |
| 曲面算法 | Gordon/Coons、NURBS 编辑、能量拟合等 | 对应工具及 GeomPlate 约束填面 | 底层数学、便利 API 和整体曲面质量要分开 |
| USD | 自带 BrepArray、转换、Hydra | 本次开源基线无同等内置链路 | usd-brep 的突出优势 |
| CAD 交换 | 重点是 USD、SMB、OCCT `.brep` 桥 | STEP、IGES、BREP、XDE | 通用工程交换优先以 OCCT 建立基线 |
| 显示交互 | Hydra 与配套 Python 工具 | AIS、V3d、选择与显示框架 | 场景管线与 CAD 应用的侧重点不同 |
| 并发 | 普通 API 建议进程隔离，部分 USD 批处理例外 | 部分布尔与离散算法支持并行 | 均需按接口核查线程契约 |
| 许可与治理 | 主体 Apache-2.0，当前不接受外部代码贡献 | LGPL-2.1 加特别例外，长期公开维护 | 分发条件、维护路径与算法质量分别评估 |

没有统一业务数据集时，星级、百分比和速度倍数会制造虚假精度。更专业的结论应说明：哪种工作流更接近现成能力，哪种风险有确定证据，哪种判断还需要运行验证。

## 2. 架构定位：内核、格式和应用不是同一层

BRep（边界表示）用顶点、边、环、面、壳及区域之间的拓扑关系描述物体，再将边、面关联到数学曲线和曲面。圆柱侧面可以保存为可求值的曲面，显示时才按误差要求离散成三角网格。相较 mesh，BRep 保留了更适合精确建模的几何与边界语义。

usd-brep 的主要链路可以读作：

```text
应用 / Python 建模脚本
    → SM_API / SmPyLib
    → SMLib 几何与拓扑内核
    ↔ BREP_SM_USD 转换
    ↔ omniSolid/BrepArray 场景数据
    → Hydra 离散与显示

OCCT .brep 文件 ↔ 独立格式解析/写出器 ↔ BrepArray
```

SMLib 中有实际的实体求交、分类、圆角与修复实现；SM_API 是较高层的 C 风格 C++ API；Python 使用 pybind11。布尔进入 `SmMerge`，圆角进入 `SmFilletExecutive`，偏置/抽壳进入 `SmOffsetExecutive`，曲面数学还会进入本仓库编译的 NLib 源码。[核心编译范围](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/premake5.lua#L4-L36)、[布尔入口](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiBrep.cpp#L208-L255)

`OCCT_BREP_IMPORT/EXPORT` 自行读写 OCCT 文件格式，构建脚本明确不链接 OCCT 内核 SDK。因此“支持 OCCT 格式”不能理解成“布尔和圆角由 OCCT 代算”。“独立内核”也不意味着没有 TBB、USD 等依赖，或所有算法都由 NVIDIA 从零原创。[格式桥构建说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/OCCT_BREP_IMPORT/premake5.lua#L4-L20)

OCCT 的范围则同时覆盖几何/拓扑建模、文件交换、可视化和 OCAF 应用框架。它提供大量构件，但也不是装上就拥有完整草图、装配约束、历史树、工程图和交互命令的成品 CAD。[OCCT 项目定位](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/README.md#L3-L11)

## 3. 参数化：至少分清三个层次

### 3.1 数学参数化：曲线与曲面怎样被求值

这一层包括曲线 `C(t)`、曲面 `S(u,v)`，解析几何参数，NURBS 的控制点、节点、权重、阶次和周期性，以及导数和局部性质。两套内核都具备这些工具。它回答的是“给定参数，曲面上的点和法向在哪里”，尚未回答“这个孔必须离左边 10 mm”。

跨内核传递 UV 或导数时，必须检查参数契约。SMLib 的 `EvaluateSTEP` 在某些解析面上使用以度计的角参数，普通 `Evaluate` 使用普通曲面参数化，二者不能直接互换。相同三维曲面也可以有不同参数尺度；一阶和高阶导数需要按参数变换应用链式法则。看起来相同的法向方向，不能证明原始导数数值可直接比较。[参数与导数说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/Examples/SMLib/README.md#L49-L133)

### 3.2 尺寸驱动：修改参数后重新执行程序

两边都能用长度、半径、角度驱动构造：先建立长方体，再用圆柱差集打孔，最后给选中的边倒圆。修改变量后重新运行脚本，是实用的参数化建模方式。usd-brep 自带 Python API，使此类实验和批量生成较直接；OCCT 则可通过 C++ 或上层绑定实现。[usd-brep 基本体参数](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/inc/SmApiPrimitives.h#L58-L98)

困难往往不在重新输入半径，而在重新定位目标。若布尔把一条边分成两条，下一步按“第 7 条边”选圆角，就可能选错。脚本参数化需要明确的几何选择策略；它不会自动产生持久的特征身份。

### 3.3 特征系统：依赖、历史和拓扑命名

完整 CAD 还要维护特征依赖图、重算顺序、失败传播、撤销重做和跨操作引用。OCCT 的 **OCAF** 管理文档与属性，**TFunction** 提供计算驱动与依赖基础，**TNaming** 记录生成、修改和删除时的形状演化。应用仍需定义自己的特征函数、driver 和重算逻辑，并正确提供 old/new shape 对；TNaming 不能在缺失演化信息时自动解决所有命名问题。[TFunction](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ApplicationFramework/TKLCAF/TFunction/TFunction_Function.hxx#L31-L64)、[命名演化](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ApplicationFramework/TKCAF/TNaming/TNaming_Builder.hxx#L30-L71)

SMLib 有属性在复制、分裂、合并、删除中的传播，也有用户索引和临时标记；这些可以帮助上层实现跟踪机制，但在本次公开的内核、API、Python 和 USD 包装层核查中，未找到完整对应的特征依赖与稳定重生成系统。GUI 的源码历史保存也不等于特征执行图。USD 的图层、引用和变体服务于场景组织，同样不会自动变成尺寸约束求解器。[属性传播机制](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmAttribute.h#L213-L277)、[源码快照历史](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/tools/smlib_gui/history.py#L3-L45)

草图约束还要单独看：OCCT 有约束属性和若干圆/线的相切、过点等构造算法，但不能据此宣称提供完整草图系统的自由度、过约束分析和拖动求解。SMLib 的 Newton 等几何数值求解器，也不能被直接称作草图或装配约束系统。[OCCT 约束属性](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ApplicationFramework/TKCAF/TDataXtd/TDataXtd_Constraint.hxx#L36-L46)

对程序生成模型，两者都有有用的基础；对可长期编辑的 CAD 产品，OCCT 的应用构件更完整，而两边仍需要上层设计系统。

## 4. 拓扑表达：用一个长方体读懂两种组织方式

本章只使用一个无孔、无空腔、六个面未细分的实心长方体。三维图中的分层与偏移用于显露使用关系；实际几何面和边仍然重合。

### 4.1 一个长方体，为什么有两个 Region

#### Region 记录空间区域

一个封闭长方体将周围空间分成两部分：有限的实体内部，以及延伸到无限远的外部。SMLib 为它们分别建立 `SmRegion`，再用 void 标记区分材料区域和空区域。

`SmRegion` 中的关键字段是：

```cpp
SmBoolean m_bIsVoidFlag;
```

其注释明确说明，无限 Region 属于 void；实体里的空腔也属于 void。**Region 不等于“一个有材料的 Solid”**，它还参与描述空空间。[SmRegion.h：Region 与 void](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmRegion.h#L28-L41)

对本文这个简单例子，内部非 void Region 有一个边界 Shell，外部无限 Region 也有一个边界 Shell。它们围绕同一组六个面建立两侧边界关系。这里的“两个壳”不会增加六张几何面，更不意味着模型是一层有厚度的外皮。

还应避免一个术语陷阱：这里按所属空间称“实体 Region 的壳”和“无限 Region 的壳”，不能将它们直接翻译成源码的 inner shell / outer shell。按 Region 的包含关系分类，本例实体 Region 的壳是它的 outer shell；无限 Region 没有 outer shell，其边界壳被归为 inner shell，相当于无限空间中被长方体挖去的边界。[Region 与壳的包含规则](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/.agents/skills/smlib-brep-model/references/brep-format.md#L182-L203)

{{< brep-lab mode="regions" >}}

阅读图时，先找顶面，再观察它朝向实体内部的一侧与朝向外部的一侧。分开展示只是在把原本重合的拓扑使用关系画清楚。

#### Face 是面，Faceuse 是面的一侧如何被使用

顶面只有一个 `SmFace`。它关联支撑曲面以及裁剪参数域。但是，同一个顶面同时邻接内部和外部，因此需要两个 `SmFaceuse`，分别进入两侧 Region 的 Shell。

`SmFaceuse` 的核心成员可概括为：

```cpp
SmFace*      m_pF;
SmFaceuse*   m_pFUMate;
SmOrientType m_eOrientation;
```

`m_pF` 指向共享的 Face；`m_pFUMate` 指向这张面另一侧的 Faceuse；方向记录本侧法向与支撑曲面法向相同还是相反。源码使用 `SM_OT_SAME` / `SM_OT_OPPOSITE`，它们是**相对于支撑几何的方向**，不能直接翻译成“外部 / 内部”。曲面本身的参数方向改变后，这种简单等同就会出错。[SmFaceuse.h：字段与所属关系](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmFaceuse.h#L30-L66)

本文统一用“外侧 Faceuse”表示属于外部 Region 边界的那次使用，“内侧 Faceuse”表示属于实体 Region 边界的那次使用。**内外是本文的空间标注，SAME/OPPOSITE 是源码中的方向标注。**

#### Shell、Loopuse 将使用关系连起来

Faceuse 的所属对象是 Shell，`GetRegion()` 再通过 Shell 找到 Region。Faceuse 管理 Loopuse；对于矩形顶面，普通边界 Loop 有正反两侧的使用，每一侧的 Loopuse 再串起对应的 Edgeuse。[Faceuse 的 Shell/Region 访问](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmFaceuse.h#L51-L65)、[Loopuse 的组成](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmLoopuse.h#L45-L58)

因而，可以从空间边界方向阅读：

```text
SmBrep
  ├─ 实体内部 Region → 实体 Region 的壳 → 六个内侧 Faceuse
  └─ 外部无限 Region → 无限 Region 的壳 → 六个外侧 Faceuse

每个 Faceuse → Loopuse → Edgeuse
每对 Faceuse → 共享同一个 Face
```

对这个完整缝合、定向正确的普通长方体，由模型结构得到：2 个 Region、2 个 Shell、6 个 Face、12 个 Faceuse；几何拓扑仍然只有 12 条 Edge 和 8 个 Vertex。这是针对本例的计数，不是每一种 SmBrep 都满足的公式。Shell 还可以承载线或孤点；存在空腔、开放面或非流形连接时，组织方式会进一步变化。[SmShell.h：内容类型](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmShell.h#L40-L61)

### 4.2 聚焦顶面与右侧面共享的那条边

将这条几何拓扑边记为 **E**，顶面记为 **T**，右侧面记为 **R**。顶面有内外两侧，右侧面也有内外两侧；四个面侧各通过自己的 Loopuse 使用 E，因此产生四个 Edgeuse：

| 本文名称 | 所在 Face | 所在 Faceuse 一侧 | 所在 Shell / Region |
|---|---|---|---|
| T外 | 顶面 T | 外侧 | 无限 void Region 的壳 |
| T内 | 顶面 T | 内侧 | 实体 Region 的壳 |
| R内 | 右侧面 R | 内侧 | 实体 Region 的壳 |
| R外 | 右侧面 R | 外侧 | 无限 void Region 的壳 |

这里的 `T外` 是 **Edgeuse 的简称**，不是 Faceuse 本身。完整含义是“顶面外侧 Faceuse 的 Loopuse 中，使用 E 的那个 Edgeuse”。

所以本例的数量是：**2 个相邻面 × 每面 2 个面侧 = 4 个 Edgeuse**。四者始终关联同一条 Edge E，既不是四条空间上不同的边，也不要求复制四份三维曲线。`SmEdge::IsManifold()` 的注释直接写出了普通情形的四个 Edgeuse；seam 另有一张面使用同一条边两次的特殊情形。[SmEdge.h：边的分类](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmEdge.h#L349-L358)

### 4.3 从 T外 出发，交替走 mate 和 radial {#edgeuse-cycle}

先给出完整路线，然后让动画逐步解释：

```text
T外 ──mate──▶ T内 ──radial──▶ R内
 ▲                              │
 │                              mate
 radial                         ▼
 └──────────── R外 ◀─────────────┘
```

也就是 **T外 → T内 → R内 → R外 → T外**，四步操作依次为 **mate、radial、mate、radial**。

{{< brep-lab mode="cycle" >}}

先复位到 T外，再单步观察四次切换；熟悉每一步后再播放整圈。图中高亮表达的是“当前访问哪个 Edgeuse”，不是一个点沿棱边的长度方向移动。动画中的错位箭头也没有改变 E 的位置或数量。

#### 第一步：T外 沿 mate 到 T内

`mate` 将当前 Edgeuse 配对到**同一张 Face 的另一侧**，方向相反。

因此顶面仍然是顶面，使用的边仍然是 E；变化的是 Faceuse/Loopuse 的一侧。在这个闭合长方体里，所属 Shell 从无限 Region 的壳变为实体 Region 的壳，所属 Region 也从无限 void Region 变为实体 Region。

源码对 `GetMate()` 的定义正是：另一面侧上、相反方向的对应 Edgeuse。[SmEdgeuse.cpp：GetMate](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmEdgeuse.cpp#L3527-L3557)

#### 第二步：T内 沿 radial 到 R内

这一步确实到 **R内**。

`radial` 将当前 Edgeuse 配对到**同一壳内、围绕 E 的相邻面使用**。T内 与 R内 共同界定 E 附近的实体内部扇区，因此由顶面内侧进入右侧面内侧。Face 从 T 变为 R，Shell 和 Region 保持不变。

源码对此有比名称更可靠的直接约束：每对 mate 共用一个 Face；每对 radial 共用一个 Shell。对于长方体，内部 radial 对是 `T内 ↔ R内`，外部 radial 对是 `T外 ↔ R外`。[SmEdgeuse.h：mate/radial 不变量](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmEdgeuse.h#L52-L73)

若沿 E 的轴向看横截面，顶面和右侧面像两条射线夹出扇区：一个是长方体内部的 90° 扇区，另一个是外部的 270° 扇区。radial 将**同一扇区两侧的使用**配对起来。这种解释比“往旁边找一个面”更准确，也更容易推广到非流形情况。

#### 第三步：R内 沿 mate 到 R外

仍然留在右侧面 R，换到这张面的另一侧；从实体 Region 切换回外部无限 Region。边 E 不变，方向再次反转。

#### 第四步：R外 沿 radial 回到 T外

沿外部扇区的配对关系，从右侧面外侧回到顶面外侧。至此，四个 Edgeuse 全部访问到，并返回起点。

| 操作 | 起点 → 终点 | Face | Shell / Region |
|---|---|---|---|
| mate | T外 → T内 | 不变 | 切换内外侧 |
| radial | T内 → R内 | 顶面 → 右侧面 | 不变 |
| mate | R内 → R外 | 不变 | 切换内外侧 |
| radial | R外 → T外 | 右侧面 → 顶面 | 不变 |

“mate 切换 Region”在这里成立，是因为本例面两侧确实分属两个 Region。对开放薄面等结构，两个面侧可能仍在同一 Region，不能把这个长方体结论升级为通用定义。通用定义应保留“同面另一侧”和“同壳径向配对”。

### 4.4 radial 不是“沿环前进一个节点”

这是最值得结合源码细看的地方。两条配对关系各自往返：

```text
mate(mate(T外))     = T外
radial(radial(T外)) = T外
```

所以，从 T外 连续调用 `GetRadial()`，会在 **T外、R外、T外、R外……** 之间往返，访问不到 T内 与 R内。完整遍历需要交替使用 mate/radial，或者按底层列表的方向遍历。

#### 链表字段同时承载两种关系

`SmEdgeuse` 没有简单地分别声明 `m_pMate`、`m_pRadial`。它借用继承自 `SmTopology` 的双向循环链表指针 `m_pNext`、`m_pLast`，组织该 Edge 上的所有 Edgeuse。头文件给出的顺序是：

```text
PrimaryEdgeuse → Mate → Radial → Mate → … → PrimaryEdgeuse
```

其中相邻 `[0,1]、[2,3]……` 是 mate 对，相邻 `[1,2]、[3,4]……` 是 radial 对。mate 对在同一 Face 上；radial 对位于同一 Shell 中。列表中的使用方向交替出现 SAME 和 OPPOSITE，但起始项可以是其中任意一种。[完整字段说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmEdgeuse.h#L52-L95)

#### GetNext 到底是 mate 还是 radial，要先比较方向

对于本文这种属于 Loopuse 的 Edgeuse，源码逻辑可以等价简化为：

```cpp
// 示意代码：省略 wire/shell edgeuse 分支及类型转换。
const bool sameAsPrimary =
    eu->GetOrientation() == edge->GetPrimaryEdgeuse()->GetOrientation();

auto mate   = sameAsPrimary ? eu->GetNext() : eu->GetLast();
auto radial = sameAsPrimary ? eu->GetLast() : eu->GetNext();
```

也就是：

| 当前方向与 PrimaryEdgeuse 的方向 | GetMate | GetRadial |
|---|---|---|
| 相同 | GetNext | GetLast |
| 不同 | GetLast | GetNext |

对照 [GetMate/GetRadial 实现](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmEdgeuse.cpp#L3536-L3580)，两者恰好选择相反的链表方向。**GetLast 在这里是前驱节点，不是“最后一个元素”。**

若为了演示选 T外 为 PrimaryEdgeuse，底层 Next 顺序可写成 `T外 → T内 → R内 → R外 → T外`。真实对象的 primary 由内核管理，不能假定它永远是顶面外侧；从任意起点执行 mate/radial 交替步进，也不必然等于始终调用 Next。

另外，`m_pCW` / `m_pCCW` 是**同一个 Loopuse 边界内的前后关系**。它们让访问者从顶面的这条边转到顶面的另一条边；mate/radial 则围绕同一条 E 访问不同使用。这两种“绕行”不能混用。

### 4.5 同一个长方体，在 OCCT 中如何表示

OCCT 的入口不是显式的 Region-use 图，而是 `TopoDS_Shape`。在所选基线中，它的三个核心成员是：

```cpp
occ::handle<TopoDS_TShape> myTShape;
TopLoc_Location           myLocation;
TopAbs_Orientation        myOrient;
```

可读作：**共享的拓扑定义 + 放置位置 + 使用方向**。[TopoDS_Shape.hxx](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/TopoDS/TopoDS_Shape.hxx#L323-L326)

#### 两个 Wire occurrence，共享同一条底层 Edge

普通长方体通常按 `Solid → Shell → Face → Wire → Edge → Vertex` 组织。顶面的 Wire 使用共享边 E 一次，右侧面的 Wire 也使用 E 一次；两次 `TopoDS_Edge` occurrence 可以共享同一底层 TShape 与放置位置，同时在所在边界中携带各自的方向。

{{< brep-lab mode="occt" >}}

这里的 occurrence 指“该形状在某个父级结构中的一次出现”。一个普通长方体有 12 条唯一 Edge；若分别枚举六个 Face 的四条边，则得到 24 次面边界使用。因此“遍历到了多少次边”和“有多少条唯一边”本来就是两个问题。

OCCT 的这两次 Wire 使用，与 SMLib 的四个 Edgeuse **不是同一粒度的计数**。OCCT 普通 Solid 不会默认再为外部无限空间建立一个 Region、一个镜像 Shell 和相应的 mate 对；SMLib 则显式保存每张面的两侧。不能据此说 OCCT 丢了一半信息，也不能把一个 `TopoDS_Edge` 生硬地替换成一个 `SmEdgeuse`。

#### 不要只读取子形状的原始方向

若一个闭壳被一致定向，其两相邻面的有效边界走向沿共享边相反。但这不保证两个 Wire 内保存的原始 `Orientation()` 值，一定恰好一个 FORWARD、一个 REVERSED，因为父级自身也有方向。

`TopoDS_Iterator` 的通用遍历可累计父级方向与位置：实现中使用 `TopAbs::Compose` 合成方向，并对当前子形状应用父级 Location。不同算法还可能先将 Face 规范到某个方向，再处理它自己的 Wire/UV 域。调试时必须说明观察的是**局部 occurrence 的方向**，还是**沿父级路径累计后的方向**。[TopoDS_Iterator 的方向与位置累计](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/TopoDS/TopoDS_Iterator.cxx#L24-L79)

TopoDS 的方向枚举也不止正反两种，还有 INTERNAL、EXTERNAL；本文普通闭壳示例只需要先理解 FORWARD/REVERSED。

#### 共享身份与邻接的表达方式不同

OCCT 明确区分三种相等关系：`IsPartner` 只比较 TShape，`IsSame` 比较 TShape 与 Location，`IsEqual` 还比较 Orientation。这对去重、邻接映射、带方向遍历都很关键。[身份判断实现](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/TopoDS/TopoDS_Shape.hxx#L260-L279)

`TopoDS_TShape` 存放子形状列表，核心类型中没有与 SMLib 一一对应的 Edgeuse mate/radial 链。需要从边查相邻面时，应用通常遍历建立祖先/邻接映射；若还需要几何意义上的径向扇区顺序，则要进一步使用方向和几何关系组织它。与之相比，SMLib 将这些区域边界关系直接写进运行时结构。[TopoDS_TShape 的子形状存储](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/TopoDS/TopoDS_TShape.hxx#L174-L186)

这是数据组织的取舍，不是速度排行榜。更显式的邻接便于直接遍历，但编辑时要维护更多关联不变量；共享 occurrence 适合统一组织各类 Shape，也可能需要额外的查询映射层。

### 4.6 从指针关系走向真正的几何一致性

#### 关联图不等于所有权树

SMLib 的 `SmBrep` 注释明确：它拥有所包含的面、边、曲线、顶点等对象。Edgeuse 中指向 Edge、Loopuse、其他 Edgeuse 的关系，不能据“我持有这个指针”就解释成“我应独立 delete 它”。特别是同一 Edge 被四个 use 关联，生命周期仍应按内核契约管理。[SmBrep 所有权说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmBrep.h#L121-L129)

OCCT 的 Shape 则通过 handle 共享 TShape。复制一个 `TopoDS_Shape` 通常复制的是这层引用及其位置、方向，不是深复制整个模型。若准备修改共享的底层拓扑或几何，应先确定是否需要真正复制，不能把普通 C++ 值拷贝自动当成对象隔离。

#### 同一条空间边，在两个曲面上有不同 pcurve

共享边 E 有三维曲线 `C(t)`。它在顶面参数域里还有一条二维曲线 `P_T(t)`，在右侧面参数域里有 `P_R(t)`，即 pcurve。在采用一致参数 t 的有效表示下，相应的空间映射应在容差内一致；存在重参数化时，需要先建立正确的参数对应：

```text
C(t) ≈ S_T(P_T(t)) ≈ S_R(P_R(t))
```

SMLib 的 UV trim 每对 mate 保存一份，挂在方向为 SAME 的 Edgeuse 上，方向与 Edge 的三维曲线一致。四个 Edgeuse 因而不意味着必须有四份 pcurve。缺省 UV 曲线可通过 `GetOrCreateUVTrimCurve` 延迟创建。[UV trim 存储约定](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmEdgeuse.h#L88-L150)

OCCT 的 `BRep_TEdge` 保存曲线表示列表以及容差、SameParameter、SameRange、Degenerated 等状态。一个 Edge 可以关联多张面上的 pcurve；方向并不能代替这些参数映射关系。[BRep_TEdge.hxx](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/BRep/BRep_TEdge.hxx#L29-L81)

#### seam 与非流形是长方体之后的两道检查题

圆柱面的接缝 seam，在三维空间中可以是一条边，却在同一张曲面的 UV 展开域两侧出现两次。SMLib 这时也可能有四个 Edgeuse，但已经不是“两个不同 Face × 两侧”，而是“同一 Face 的两次边界使用 × 两侧”。OCCT 对闭曲面上的边也有保存两条 pcurve 的专门表示。[SMLib seam 定义](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/inc/SmEdge.h#L349-L358)、[OCCT 双 pcurve 表示](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKBRep/BRep/BRep_CurveOnClosedSurface.hxx#L28-L68)

对于三个或更多面使用围绕一条边的情况，SMLib 的 spine edge 可以有六个或更多 Edgeuse，径向链组织各个扇区。OCCT 同样允许混维和非流形拓扑，缝合也有专门的非流形模式；正确比较是“是否显式记录径向区域邻接”，不能写成“OCCT 不支持非流形”。表示层能容纳某种结构，也不保证每个布尔、圆角或抽壳算子都接受它。[OCCT 建模数据说明](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/dox/user_guides/modeling_data/modeling_data.md#L572-L643)、[非流形缝合开关](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKTopAlgo/BRepBuilderAPI/BRepBuilderAPI_Sewing.hxx#L224-L230)

## 5. 实体算法：不能只比较函数清单

下面的“具备”均指固定版本的源码或接口契约。真正的工程比较，应统一输入拓扑、单位、容差、预处理和后置验证；同名算法不意味着拥有相同的适用范围。

| 算法 | usd-brep / SMLib | OCCT | 最值得检查的边界 |
|---|---|---|---|
| 基本体 | box、sphere、cylinder、cone、torus | BRepPrimAPI 等 | 极点、seam、退化边；基本体成功不能代表复杂编辑可靠 |
| 布尔与分割 | `SmMerge`，流形/非流形分派，union/difference/intersection/merge/imprint | BRepAlgoAPI、BOPAlgo、Splitter、CellsBuilder | 相切、共面、小边、薄片、混维和不一致容差 |
| 恒/变半径圆角 | SmFilletExecutive；便利变半径入口确认线性 law | BRepFilletAPI_MakeFillet，含变化律支持 | 半径冲突、短边、多边角部和结果连续性 |
| 倒角 | 恒定距离 solver 与线性截面等专门组合 | BRepFilletAPI_MakeChamfer | 半径、退距、倒角宽度的参数含义不能混用 |
| 拉伸、旋转 | 线性/旋转构造，taper/draft sweep | MakePrism、MakeRevol | 输入维度决定边/面/壳/实体；封闭性要另查 |
| 路径扫掠 | curve/pipe sweep，可含缩放条件 | MakePipe、MakePipeShell | 标架扭转、路径奇异点、自交及截面朝向 |
| Loft / skin | 多截面、次数控制、首尾封口等 | ThruSections，壳或实体 | 截面对应、轮廓方向、拓扑变化与近似误差 |
| 既有面拔模 | 已确认带斜度拉伸，未核实同等通用既有面编辑入口 | DraftAngle | OCCT 也限平面/柱面/锥面，且不能引起拓扑变化 |
| 偏置 | SmOffsetExecutive，延伸求交或过渡面策略 | MakeOffsetShape | 大偏距、曲率半径、局部/全局自交清理 |
| 抽壳/加厚 | shell_brep，solid 与 sheet 分支 | MakeThickSolid | 面删除、壁厚方向、薄壁消失和结果有效性 |
| 缝合 | StitchIntoSolid/Shell、高级 stitch，返回成实体标志及 gap 信息 | Sewing，含非流形模式 | 缝上若干边不等于得到闭合有效实体 |
| Healing | 容差调整、退化处理、seam 等修复 | ShapeFix、ShapeAnalysis、ShapeUpgrade | 哪些问题实际被修复，是否误删面或改变空腔 |
| 去特征 | 有 remove_fillet 底层实现，存在结果/状态风险 | Defeaturing → RemoveFeatures | 输入范围、面选择、重建质量和失败报告 |
| 面积/体积 | 精细积分/网格近似测量路径，部分裁剪边界有已知误差 | GProp/BRepGProp | 统一积分精度，用解析参考值检查 |
| 网格离散 | SMLib tessellation、PolyBrep/mesh | BRepMesh | 弦高、法向、边界一致性、失败面和三角形质量 |

这张表的用途是确定对测项目，不是将两列判定为功能等价。尤其是拔模、去特征、变半径曲线 law 和自交处理，应继续读实际契约。[SMLib 圆角及变半径入口](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiBrep.cpp#L2049-L2182)、[倒角 solver](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiFillets.cpp#L60-L94)、[OCCT 拔模限制](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKOffset/BRepOffsetAPI/BRepOffsetAPI_DraftAngle.hxx#L39-L61)

### 5.1 布尔：从数值交线进入拓扑分类

`SmApiBoolean` 检查输入是否为 manifold solid，再分派至 `SmMerge::ManifoldBoolean` 或 `NonManifoldBoolean`。非流形分支改变约束和状态后进入一般主流程；其中 `SmTopologyIntersector::IntersectInsertRelate` 负责求交、插入拓扑并建立关系，后续再作保留/删除分类、线与点处理、结果重建和后处理。[布尔分派](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiBrep.cpp#L208-L255)、[非流形与主流程](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmMerge.cpp#L2393-L2510)

这条链路说明 SMLib 有真正的 BRep 布尔结构。上一章的 use、Region 和径向关系，在这里成为处理中间拓扑和区域分类的工具。OCCT 也通过求交数据和 BOP 构造器组装结果；最有价值的对比是同一个退化案例怎样被识别、切分和分类，而不是只比较两个 union 函数名。[OCCT 布尔执行链](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKBO/BRepAlgoAPI/BRepAlgoAPI_BooleanOperation.cxx#L172-L215)

### 5.2 圆角：solver、截面、角部与合并缺一不可

SMLib 圆角入口会建立半径 law 和 solver 参数，执行局部求解、截面生成和角部处理，再将生成的 fillet BRep 与原模型求交、裁剪、合并并定向。源码中有多变量 Newton 局部求解，也有独立角部构造，不能称为只有 API 外壳。[圆角角部执行](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmFilletExecutive.cpp#L1568-L1591)、[生成圆角体再合并](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmFilletExecutive.cpp#L2910-L2928)

但局部截面求解成功不等于整个操作成功：圆角可能在端部、三边交汇或短边附近失效，也可能生成了面却没有完成正确的裁剪和缝合。两边测试都应分开检查半径误差、连续性、缺失面、自交与闭合性。

### 5.3 偏置、抽壳与去特征的边界

SMLib 偏置实现区分凸侧间隙的延伸求交/过渡面，以及凹侧求交裁剪；抽壳对 solid 与 sheet 使用不同流程。高层抽壳入口先复制输入，因此不能将底层可能消耗对象的语义套在所有高层 API 上。[偏置策略](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmOffsetExecutive.cpp#L87-L129)、[高层复制与抽壳](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiBrep.cpp#L2366-L2417)

OCCT `MakeOffsetShape` 明确列出全局 Intersection 和自交消除的未完成范围；其去特征入口接受 Solid、CompSolid 或实体 Compound，并以指定 Face 为移除对象，也不是任意模型的自动特征识别器。[OCCT 偏置限制](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKOffset/BRepOffsetAPI/BRepOffsetAPI_MakeOffsetShape.hxx#L47-L105)、[去特征契约](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKBO/BRepAlgoAPI/BRepAlgoAPI_Defeaturing.hxx#L25-L64)

## 6. 曲线与曲面算法：底层能力比便利接口更丰富

### 6.1 表示、求值与 NURBS 编辑

两边都有解析曲线/曲面与 B-spline/NURBS 表示，也有点、导数、法向、参数域和周期性工具。不能将 SMLib 概括为“所有几何都先变成 NURBS”，也不能将 OCCT 概括为“只有拓扑与布尔”。底层 Surface 的能力、Face 的裁剪边界和最终文件支持的类型，是三个不同问题。

SMLib 可追踪到控制点/权重修改、U/V 升阶、容差降阶、插节点和删节点的实现。升阶和插节点属于保形表示操作；降阶、删节点可能需要在误差范围内近似。某个降阶调用成功，也可能因为误差要求无法满足而保留原阶数，因此需检查输出参数。解析子类也不一定允许直接修改其控制点。[控制点与权重](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurface.cpp#L4740-L4808)、[曲面升降阶](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurfaceNLib.cpp#L6257-L6348)

OCCT 同样提供节点、控制点、权重、次数和周期性操作；本次基线 B-spline 曲面的最高次数为 25。这类实现上限会影响复杂有理网络组合，不能只看数学定义上“可以构造”。[OCCT B-spline 曲面契约](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKG3d/Geom/Geom_BSplineSurface.hxx#L39-L52)

### 6.2 求交与投影：必须区分几何域和拓扑域

SMLib 有曲线—曲线、曲线—曲面、曲面—曲面、裁剪 Face 和 BRep 层面的求交入口；曲面求交可返回三维交线、两侧 UV 曲线、类型及偏差。OCCT 的 `GeomAPI_IntSS/IntCS` 与更底层的求交包提供相应能力，但数学 Surface 求交不能直接等同于带任意 trim 边界的 Face—Face 求交。[SMLib 求交入口](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiIntersectors.cpp#L114-L206)、[OCCT IntSS 的域](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKGeomAlgo/GeomAPI/GeomAPI_IntSS.hxx#L31-L69)

投影同样要区分点的最近点、法向投影、指定方向投影和三维曲线落到曲面参数域。SMLib 的 Drop/Trim/Lift 链路会生成 UV 曲线，必要时再提升回三维；OCCT 的 GeomProjLib 也可能执行近似并失败。跨 seam、近极点、多解分支和切触情形，应验证曲线完整性及 UV/3D 一致性，不能只看有没有输出一条曲线。[SMLib Drop/Lift](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiCurves.cpp#L1184-L1258)、[OCCT pcurve 构造](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKGeomBase/GeomProjLib/GeomProjLib.hxx#L32-L70)

### 6.3 Coons 与 Gordon：两边都有，输入和近似策略不同

SMLib 有四边界的 Coons 补片，以及附加跨边界切向条件的构造分支。Gordon 则从相交的 U/V 曲线网格构造曲面，先处理参数相容性，再进入 NLib；有理曲线输入在相应路径中会先近似为非有理副本。因而不能宣称任意 NURBS 网络都能无条件精确插值。[Coons 构造](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurfaceNLib.cpp#L4296-L4437)、[Gordon 前提与实现](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurfaceNLib.cpp#L2706-L2797)

**OCCT 8.0.1 已有 `GeomFill_Gordon`**。它处理曲线转换、交点、网络排序和相容重参数化；有理网络的精确组合可能受到乘积次数上限影响。显式允许 approximate fallback 时，结果可能改用采样或曲线近似，并通过 `IsApproximate()` 标记，不能再保证精确插值全部输入。[OCCT Gordon 模式与限制](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKGeomAlgo/GeomFill/GeomFill_Gordon.hxx#L27-L165)

所以本项不应以“谁有 Gordon”结束；需要对比交点误差、网络单调性、周期曲线、有理性、重参数化和失败诊断。

### 6.4 拟合、能量正则与 GeomPlate

SMLib 有规则点阵、散点、最小二乘和容差驱动拟合。更值得注意的是，`ApproximateRefit` 的底层在正则权重大于零且 U/V 均为三次的分支中，积分加入 `Suu² + 2Suv² + Svv²` 薄板能量项；另有可变形周期拟合，涉及样本权重、边界、抗拉伸、抗弯曲和 stiffness。它不是只有基础 skin 或插值面。[能量项实现](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/NL_SrfLstSqFit.cpp#L8381-L8417)、[可变形拟合入口](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurfaceNLib.cpp#L1118-L1149)

这些数学能力值得肯定，但不能与 OCCT GeomPlate 的点/曲线连续性约束填充框架逐项画等号。OCCT 的 MakeFilling 可接受位置、切向和曲率连续性要求，最终能否满足仍受几何和误差约束影响。比较时要明确问题是“点云拟合得更平顺”，还是“沿指定边界满足给定连续性”。底层 NLib 支持的 solver 选项，也未必全部由稳定 Python 便利 API 暴露。[OCCT 填面约束](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKOffset/BRepOffsetAPI/BRepOffsetAPI_MakeFilling.hxx#L155-L204)

### 6.5 G2/G3 与“精确几何”的边界

SMLib 的 blend 有局部高阶导数构造，相关截面中 G2 使用五次、G3 使用七次插值；三边交汇角部仍只承诺 G1。这意味着局部截面的高阶连续性，不能推广为所有补片边界、角部和整个造型网络的 Class-A 品质。[高阶插值](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmFilletGeom.cpp#L6964-L6995)、[三边角部限制](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/.agents/operations/fillets.md#L127-L130)

“精确 BRep/NURBS”首先是表示方式的描述，相对于固定三角网格。一般求交、扫掠、拟合和偏置仍使用浮点、数值迭代和逼近。直线平移扫掠可以有精确构造，一般路径扫掠则可能通过采样截面和 skin 近似；数学偏置面能够求值，也不代表偏置后的裁剪实体已经消除自交。[精确与近似扫掠的区别](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBSplineSurfaceNLib.cpp#L5728-L5765)、[OCCT 偏置面的自交边界](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingData/TKG3d/Geom/Geom_OffsetSurface.hxx#L40-L55)

## 7. 鲁棒性：实现存在、状态成功与结果正确是三件事

### 7.1 去圆角不是空实现，但上层状态有风险

`remove_fillet` 的底层 `SmFilletRemoval::RemoveFace` 会收集拓扑、计算角点、延长侧边、求交、删面并重接边和 UV trim。它有明确的四边及相切关系等输入前提；wrapper 又会忽略部分识别/删除失败，零删除仍可能返回 success。上游也列出“没有删除却报告成功”的问题。[wrapper 控制流](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiFillets.cpp#L195-L245)、[真实 removal 算法与前提](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmFilletRemoval.cpp#L124-L245)

准确结论是：有算法实现，但当前公开 API 的实际结果和失败可观测性存在明确风险。不能说算法完全没写，也不能把调用后仍返回 Brep 类型当成圆角已经消失的证据。

### 7.2 Healing 的状态在哪里丢失

外层 `SmApiHealBrep` 会返回 `pBrep->HealBrep(...)` 的状态；真正的一层丢失发生在 `SmBrep::HealBrep`：调用内部 healer 时未接收返回值，随后返回 `SM_SUCCESS`。内部 seam 拆分还存在忽略子操作返回值的路径，部分 gap 修复仍是 TODO。[外层状态传递](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiHeal.cpp#L27-L38)、[BRep 层丢失状态](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBrep.cpp#L20761-L20801)、[gap 修复边界](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmHealData.cpp#L3984-L4065)

因此，修复是否完成必须用后置条件回答：gap 是否缩小、seam 是否完整、空腔是否保留、体积是否合理、UV 和三维边是否一致。只检查 manifold 性质仍不充分。

### 7.3 官方已知问题如何影响选型

该固定版本的公开问题包括周期面 seam 误处理、空腔被错误合入实体、极点附近投影分类遗漏、圆角邻近位置的反向三角形、特定裁剪曲线导致质量属性误差，以及畸形 BrepArray counts/indices 可能触发越界崩溃。[KNOWN_ISSUES.md](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/KNOWN_ISSUES.md#L10-L69)

这是上游记录，不是本文逐项复现。例如上游报告某些带内部节点的裁剪曲线在默认相对精度设置下出现约 1.4% 面积误差，不能把它推广为整个库的统一精度，也不能忽略它对测量验收的影响。公开列出问题提供了可测试的边界，并不能证明 OCCT 没有同类问题。

OCCT 的 `IsDone()` 同样不能代替结果验证。圆角 Build 在取得底层结果后不自动运行完整 BRepCheck；`BRepCheck_Analyzer` 的默认距离校验涉及采样，几何/拓扑有效也不等于满足指定壁厚和设计意图。[圆角完成路径](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKFillet/BRepFilletAPI/BRepFilletAPI_MakeFillet.cxx#L371-L385)、[有效性检查契约](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKTopAlgo/BRepCheck/BRepCheck_Analyzer.hxx#L87-L146)

两边都应分别记录状态码/异常、非空结果、拓扑有效性、几何残差和业务断言。页面上看起来闭合，只能证明显示效果；一个成功返回的壳仍可能不是预期的实体。

## 8. 数据交换：USD 优势与 CAD 格式能力分开比较

### 8.1 运行时图和 BrepArray 数组不是同一个表示

SMLib 的 `SmBrep` 是对象与指针组成的运行时拓扑图；USD 中的 BrepArray 通过 counts、索引和压平数组组织多个 BRep。导出先将对象指针映射为索引，把一对 mate Edgeuse 压为一条逻辑记录；导入重新分配成对的 Edgeuse，恢复 mate/radial 关系。因此前文长方体共享边的四个运行时 Edgeuse，在 BrepArray 中对应两条逻辑记录，统计口径并不矛盾。[schema 记录约定](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/schema/omniSolid/resources/schema.usda#L21-L108)、[运行时重建](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SMLib/src/SmBrep.cpp#L20032-L20056)

BrepArray 的关键几何数据使用 double、point3d 等双精度类型，不要求先三角化。然而“用了双精度”不能保证往返无损，需要检查实际转换策略。

### 8.2 往返的五个具体边界

1. **逐实体容差被汇总。** 当前导出对 BRep、面、边、顶点的有效 zone tolerance 取最大，再写入 BRep 级容差；原先各处不同的容差分布不能仅凭这个值恢复。[容差汇总实现](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L71-L105)
2. **几何类型会归一化或近似。** 边曲线输出为 NURBS；直线、圆等可以被精确表示，其他类型可能进入拟合。部分解析面保留解析标签，其他曲面尝试近似。丢失类型标签与丢失几何精度要分别判断。[曲线输出分支](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L2354-L2394)
3. **部分 UV trim 被丢弃后重建。** 解析面的内部参数与 schema 参数不完全相同；NURBS UV 还需处理方向和参数域映射。SMLib 中与三维 Edge 同向的存储约定，也不能直接照搬为 USD 中的 edgeuse 遍历方向。[解析面策略](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L1971-L2024)、[UV 参数映射](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L904-L925)
4. **应用属性并非全部自动保存。** `FromBrep` 收集属性，但对应 USD 构建处仍有待写出的 TODO。内核运行时属性与场景存储属性不是天然一一映射。[属性导出路径](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L1600-L1667)
5. **转换状态需要逐实体检查。** 不支持曲面的近似失败路径会记录错误并继续，函数末尾仍可能返回 success。缺省 UV 的零阶数占位还与 schema 正阶数条款存在静态不一致；这些应进入独立结构验证，而不是只检验文件能否打开。[曲面近似失败分支](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L2164-L2198)、[函数末尾状态](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L2458)、[缺省 UV 写法](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/BREP_SM_USD/src/SmuConvert.cpp#L1114-L1124)、[UV schema 条款](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/schema/omniSolid/resources/schema.usda#L465-L513)

这些是具体控制流和格式契约的风险证据，不是本文已经测得某个模型往返失败。测试时应把“不修复的原始转换”和“启用 healing 的转换”分开，避免修复掩盖转换层错误。

### 8.3 `.brep` 桥不等于完整 CAD 文档交换

当前桥能处理带面的实体、开壳和自由面，导入会跳过自由 wire/edge/vertex 等根成分，导出也跳过没有面的 BRep。它读取/写出几何拓扑，不保存完整特征树或 XCAF 装配文档语义。[导入范围](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/OCCT_BREP_IMPORT/src/OcctFileSource.cpp#L193-L283)、[导出范围](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/OCCT_BREP_EXPORT/src/UsdBrepToOcctModel.cpp#L1501-L1547)

OCCT 的 STEP、IGES、BREP 及 XDE 组成更广的 CAD 数据交换栈，可承载装配、颜色、名称等工程信息。usd-brep 源码中的 STEP 风格参数求值、IGES 注释或中立 staging 类型，不能被当成已交付的完整 STEP/IGES/JT 转换器。[OCCT XDE 范围](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/dox/user_guides/xde/xde.md#L9-L52)

### 8.4 自定义 USD schema、Hydra 与标准范围

本次 usd-brep 运行时使用自定义 `omniSolid/BrepArray` schema。仓库保存的 UsdSolid 提案快照，不等于已经被所有 OpenUSD 应用内置支持的核心标准；也不能把另外销售的 OCCT USD 组件计入本次开源克隆的默认能力。[运行时 schema](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/schema/omniSolid/resources/schema.usda#L9-L37)、[提案与运行时说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/proposals/README.md)

Hydra 插件在内存中将 BRep 离散为临时 mesh 交给渲染器，不自动向 stage 写入 mesh prim；此版本 BRep 几何与拓扑使用 uniform 默认值，不支持它们随时间采样，只支持相应的变换和可见性动画。USD 场景集成的距离确实更短，但“可以显示”与“所有几何、材质和时间语义都支持”仍需区分。[Hydra 行为与限制](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/HYDRA_USD_BREP/README.md#L4-L26)

## 9. 工程集成：API、生命周期、并发与平台

### 9.1 C 风格接口不自动等于稳定纯 C ABI

SM_API 使用 C 风格命名和不透明对象指针，但接口仍含 C++ 类型、引用、重载和默认参数。跨语言绑定和二进制分发需要按实际 ABI 设计，不能仅凭函数名就按纯 C 动态库直接加载。[接口类型与重载](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/inc/SmApiGeneral.h#L51-L62)

普通双体布尔尤其要先读所有权契约：常见操作成功后，第一输入被就地修改并作为结果，第二输入被删除；失败时结果为 null，但输入可能已经改变。部分 imprint/保留工具体选项有例外。需要事务式回退或保留原始模型时，应明确复制、临时对象清理和失败恢复策略。[布尔输入输出与所有权](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/inc/SmApiBrep.h#L42-L80)

Python 包装中的借用几何也要遵守宿主 BRep 生命周期。出现 Python 对象不意味着底层几何一定由 Python 独立拥有；获取 `Face.surface` 等引用后再删除或大幅编辑原 BRep，不能未经契约检查继续使用。OCCT 同样需要区分 Shape 引用复制、几何共享与真正深复制。[Python 借用几何处理](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SmPyLib/src/SmPyBorrowedGeometry.cpp#L45-L125)

### 9.2 CPU 与并发：逐操作检查上下文

本次追踪到的是 C++ CPU 几何算法，没有证据支持“因为 NVIDIA，所以布尔、圆角和曲面求交由 CUDA 加速”。TBB 依赖、Hydra 渲染与几何建模算子的并行是不同层。

普通 `SmApi*` 默认使用进程级 Context，包含工作状态和遍历标记，延迟创建没有同步。上游对该发布构建的说明是普通单次操作单线程，建议独立进程隔离任务；源码中存在的 `SM_USE_TBB` 条件分支，不能据文件中出现 `parallel_for` 就宣称实际启用。[默认 Context](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API/src/SmApiGeneral.cpp#L33-L64)、[发布构建并发契约](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/.agents/operations/concurrency.md#L9-L37)

部分 USD 批处理有明确例外：每个 BrepArray 使用独立 Context，分工作线程修复或离散，再串行写出 stage。这不能推广为所有 `SmApi*` 都线程安全。OCCT 的部分布尔与 BRepMesh 有并行选项，也不构成“全库共享对象可任意并发修改”的保证。[USD 修复流水线](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/source/SM_API_USD/src/SmApiUsdHeal.cpp#L570-L630)、[OCCT 并行选项](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/src/ModelingAlgorithms/TKBO/BOPAlgo/BOPAlgo_Options.hxx#L103-L117)

### 9.3 Python wheel、macOS 和依赖成本

usd-brep 1.0.0 的现成 Python wheel 面向 CPython 3.12，提供 Windows/Linux 平台分发，未提供 macOS wheel。仓库有 Apple Silicon 源码构建路径，完整 Python/USD 栈需要本地 OpenUSD；上游还说明固定的 macOS Premake 包不在公共 Packman 服务上。这些是源码和分发条件，本文没有实际尝试构建，不能写成已经复现的编译失败。[Python 包要求](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/tools/pyproject/README.md#L25-L44)、[macOS 构建说明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/README.md#L76-L96)

wheel 自带 OpenUSD 25.11，stage 通过文件交换，不向调用者直接提供 `pxr` 对象。上游明确不支持在同一进程再加载另一份同版本 OpenUSD 构建，因为符号命名空间会冲突；不同版本隔离也不能推导为任意组合都已验证。[OpenUSD 运行时边界](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/tools/pyproject/README.md#L33-L44)

OCCT 使用 CMake，默认 C++17，可按组件选择依赖。核心内核、AIS 显示、DRAW 测试环境和文件交换的依赖成本不同；不能将全套桌面环境要求算成每个嵌入式内核集成都必须承担的成本。其 AIS/V3d/选择框架与 DRAW 工具有利于 CAD 应用和回归建设，但仓库包含测试不等于本文运行通过了测试。[平台与组件依赖](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/dox/introduction/introduction.md#L309-L373)

## 10. 许可与维护模式

usd-brep 主体采用 Apache-2.0，部分构建引导和第三方组件另有许可；发布包中的 OpenUSD、TBB、pybind11 等需要与主体分开核对。OCCT 采用 LGPL-2.1 加特别例外，例外对用库目标码纳入头文件材料等特定情况附条件放宽，并未将整个库改成 Apache/MIT 式许可。[usd-brep 许可](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/LICENSE)、[第三方声明](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/THIRD_PARTY_NOTICES.md#L3-L31)、[OCCT 例外原文](https://github.com/Open-Cascade-SAS/OCCT/blob/b8f597c677811d1f9f4d8a97f5ae2825c0353a42/OCCT_LGPL_EXCEPTION.txt)

在本文固定版本中，usd-brep 接受 issue/bug report，但不接受外部代码贡献。这会影响团队将修复反馈上游、维护私有补丁和规划升级的方式。OCCT 具有更长的公开维护和回归历史，提供的可观察证据更充分；usd-brep 的公开历史较短，却不能反推其底层 SMLib 算法刚刚开始开发。[贡献政策](https://github.com/NVIDIA-Omniverse/usd-brep/blob/c9c5979f04cea8c38213004d4f04df0dcfb40d05/CONTRIBUTING.md#L5-L9)

许可宽松、源码规模大、品牌知名或公开问题少，都不能单独证明算法成熟。长期成本还包括错误可定位性、补丁可合入性、格式兼容和升级回归。

## 11. 按使用场景给出专业判断

| 使用目标 | 更合适的起点 | 原因与条件 |
|---|---|---|
| 学习独立 C++ 内核设计 | 并排阅读 usd-brep 与 OCCT | use/radial、求交插入拓扑、圆角与修复有真实实现可比 |
| USD 资产程序生成、数字孪生管线 | 优先做 usd-brep 小规模验证 | BRep/USD/Hydra 链路现成，需验证 schema 支持与转换质量 |
| 通用机械 CAD 与 STEP/IGES 交换 | 优先以 OCCT 建立基线 | 数据交换、文档、命名、显示和算法组件更完整 |
| 开发长期可编辑的特征历史系统 | OCCT 的现成构件更多 | OCAF/TFunction/TNaming 可用，仍需应用特征和约束系统 |
| 高级自由曲面研究 | 按具体问题对测两边 | SMLib 底层数学丰富，不能只看 Python；连续性与输入限制决定结果 |
| 替换生产中的 OCCT | 暂不据静态调查直接替换 | 缺少业务成功率、性能、回归与迁移成本的共同数据 |
| 在 OCCT 应用旁增加 USD 能力 | 可评估混合架构 | 先确认有面模型、pcurve、容差和属性保真，控制往返次数 |
| 直接取得完整 CAD 产品 | 两者均需大量上层开发 | 内核、约束、特征、交互和工程工作流不是同一交付层 |

这里优先 OCCT 的条件是“通用 CAD 的整体工程底座”，并不是断言每一个曲面算法、每一个布尔案例都更好。肯定 usd-brep 的条件是其独立算法、径向拓扑和 USD 集成价值，也不是承诺它已能无缝替换现有产品内核。

如果研究资源有限，建议先选三条能贯穿整个系统的链路：**曲面求交 → 拓扑切分与区域分类；圆角 solver → 角部 → 裁剪合并；运行时 BRep → USD 数组 → 重建与验证。** 它们比无差别遍历所有类更容易揭示架构取舍和质量边界。

## 12. 共同基准应该怎样设计

下表是建议方案，本文没有执行这些运行测试。

| 用例组 | 输入重点 | 验收指标 |
|---|---|---|
| 基本体与测量 | 球、柱、圆环及解析面积/体积 | 绝对/相对误差、积分参数、单位和尺度 |
| 布尔退化 | 切触、共面、微小重叠、薄壁、小边 | 完成状态、有效性、连通体数量、体积和遗漏区域 |
| 圆角交汇 | 短边、三边/多边角点、变半径、大半径 | 半径残差、缺失面、角部连续性、法向和自交 |
| 周期与空腔 | seam、极点、带孔柱面、空心实体 | 误删面、空腔保留、UV 闭合和体积 |
| 曲面求交/投影 | 近相切、跨 seam、多解、有理网络 | 三维残差、UV/3D 一致性、分支完整性 |
| 曲面拟合/填充 | 同一点集、相同边界与导数约束 | 最大误差、均方误差、边界连续性与光顺程度 |
| 偏置与抽壳 | 高曲率、薄壁消失、自交 | 壁厚误差、结果有效性、失败位置和诊断 |
| 数据往返 | OCCT→USD→OCCT，修复开关分开 | 尺寸、方向、区域语义、容差分布、属性和拓扑变化 |
| 离散与显示 | 相同弦高/角度误差目标 | 最大偏差、边界裂缝、反向三角形、失败面 |
| 长期运行 | 相同机器与构建选项、连续批处理 | 墙钟时间、峰值内存、泄漏、并发稳定性 |

每个用例应保留原始输入与配置，将“不能求解”“返回错误结果”“超时”“进程崩溃”分别记录。性能统计前先通过相同质量门槛；一个内核用了更松容差或漏掉部分面，不能因此获得更好的性能成绩。预热、重复次数、线程数和失败任务是否计入平均值，也必须一致。

拓扑数量可以帮助发现异常，但不能成为唯一判据：合理重参数化、面合并和边拆分都可能改变计数而保持几何语义。相反，面数完全相同也可能已经改变空腔、方向或 pcurve。格式转换应先测试关闭 healing 的路径，再独立测试修复收益与副作用。

本文的结论停留在源码证据允许的范围：usd-brep 是具有广泛数学与实体算法的独立内核，USD 集成和显式径向拓扑值得深入研究；OCCT 在通用 CAD 的整体应用与交换基础上更完整。真正的生产选型，应让上述共同模型和验收条件继续回答成功率、精度、性能与维护成本。
