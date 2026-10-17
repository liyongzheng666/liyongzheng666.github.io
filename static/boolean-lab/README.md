# 布尔实验室网页

本目录是无需安装前端依赖的静态网页。正式测试测量、每场景判据与真实内核模型组成可独立分发的快照。网页仅含布尔并集、差集和交集，按原来的默认配置、微小特征容差对齐、复杂曲面三批记录独立展示。

- 在线浏览：<https://www.goudanx.top/boolean-lab/>
- 脚本、配置与复现说明：<https://github.com/liyongzheng666/occt-smlib-boolean-benchmark>
- 报告、数据与完整网页下载：<https://github.com/liyongzheng666/occt-smlib-boolean-benchmark/releases/tag/v0.1.0>

`data/meshes/` 的 420 份模型文件随完整网页发布包分发。下载并解压完整网页后，可通过任意静态 HTTP 服务浏览；直接打开本地 HTML 会受到浏览器文件访问限制。

```sh
python3 -m http.server 8000 --directory web
```

网页的所有本地资源均使用相对路径，可部署到 `/boolean-lab/` 等子路径。

## 重新导出

以下命令复制已有测量快照与实际网格，不会运行建模引擎或改变判据。实际运行步骤见仓库根目录说明。

```sh
python3 web/export_site.py --output dist
python3 web/verify_site.py dist
```

也可以使用 `--source PATH_TO_EXPORTED_SITE` 从另一份导出索引和模型重新构建网页数据；网页应用仍使用当前仓库中的界面。`verify_site.py` 校验模型引用、三角网格索引、文件散列与报告入口，并写入 `file-manifest.json`。

细化薄透镜的展示网格来自已核对原生测量一致的独立重放；其来源在对应场景的 `evidence_note` 和 `display_replay` 中说明。正式观测数据没有被展示重放替换。网格仅供观察，正确性判定来自原始 BRep 测量。

## 将新运行导出为独立网页

```sh
python3 benchmark.py --suite complex --meshes --output runs/my-run
python3 web/export_run.py --run runs/my-run --output dist-fresh
python3 web/verify_site.py dist-fresh
python3 -m http.server 8001 --directory dist-fresh
```

新网页只统计当前运行的 `cases.json` 与 `summary.json`，展示模型来自当前运行的 `meshes/`。历史参考记录不会补入新运行；没有导出的模型会明确显示未导出。基础和默认挑战组的独立展示重放保留 `mesh_replay` 来源及核对结果。
