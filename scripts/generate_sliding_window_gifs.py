#!/usr/bin/env python3
"""Generate deterministic teaching GIFs for the sliding-window article."""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "static/images/blog/sliding-window"
QA_DIR = Path("/tmp/sliding-window-gif-qa")

WIDTH = 1200
HEIGHT = 640

COLORS = {
    "ink": "#172033",
    "muted": "#667085",
    "line": "#D7DCE5",
    "paper": "#FFFFFF",
    "soft": "#F5F7FA",
    "teal": "#087F74",
    "teal_soft": "#DDF5EF",
    "blue": "#2563A6",
    "blue_soft": "#E7F0FC",
    "green": "#2D7A46",
    "green_soft": "#E5F4E9",
    "red": "#BC3A3A",
    "red_soft": "#FCE8E6",
    "amber": "#A96608",
    "amber_soft": "#FFF1D6",
    "purple": "#7047A3",
    "purple_soft": "#F0E9F8",
}

FONT_REGULAR = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def font(size: int, *, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_MONO if mono else FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(path, size=size)


def text_width(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def draw_fitted_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    *,
    size: int,
    min_size: int = 15,
    color: str = COLORS["ink"],
    bold: bool = False,
    mono: bool = False,
    align: str = "left",
) -> None:
    x1, y1, x2, y2 = box
    chosen = font(size, bold=bold, mono=mono)
    while text_width(draw, text, chosen) > x2 - x1 and size > min_size:
        size -= 1
        chosen = font(size, bold=bold, mono=mono)

    text_box = draw.textbbox((0, 0), text, font=chosen)
    width = text_box[2] - text_box[0]
    height = text_box[3] - text_box[1]
    if align == "center":
        x = x1 + ((x2 - x1) - width) / 2
    elif align == "right":
        x = x2 - width
    else:
        x = x1
    y = y1 + ((y2 - y1) - height) / 2 - text_box[1]
    draw.text((x, y), text, font=chosen, fill=color)


def draw_dashed_rectangle(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    *,
    fill: str,
    width: int = 4,
    dash: int = 12,
    gap: int = 8,
) -> None:
    x1, y1, x2, y2 = box
    for start in range(x1, x2, dash + gap):
        draw.line((start, y1, min(start + dash, x2), y1), fill=fill, width=width)
        draw.line((start, y2, min(start + dash, x2), y2), fill=fill, width=width)
    for start in range(y1, y2, dash + gap):
        draw.line((x1, start, x1, min(start + dash, y2)), fill=fill, width=width)
        draw.line((x2, start, x2, min(start + dash, y2)), fill=fill, width=width)


def array_layout(length: int) -> tuple[list[int], int, int]:
    gap = 10
    cell_width = min(86, (WIDTH - 140 - gap * (length - 1)) // length)
    total_width = cell_width * length + gap * (length - 1)
    start_x = (WIDTH - total_width) // 2
    return [start_x + i * (cell_width + gap) for i in range(length)], cell_width, gap


def draw_array(
    draw: ImageDraw.ImageDraw,
    values: list[object],
    state: dict,
) -> None:
    xs, cell_width, _ = array_layout(len(values))
    y = 238
    height = 78
    left = state["left"]
    right = state["right"]
    special = set(state.get("special", []))
    match = set(state.get("match", []))

    for index, value in enumerate(values):
        active = left <= index <= right
        fill = COLORS["teal_soft"] if active else COLORS["soft"]
        outline = COLORS["teal"] if active else COLORS["line"]
        width = 3 if active else 2
        if index in match:
            fill = COLORS["green_soft"]
            outline = COLORS["green"]
        if index in special:
            fill = COLORS["red_soft"]
            outline = COLORS["red"]
            width = 4

        box = (xs[index], y, xs[index] + cell_width, y + height)
        draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=width)
        draw_fitted_text(
            draw,
            box,
            str(value),
            size=31,
            min_size=20,
            color=COLORS["ink"],
            bold=True,
            mono=True,
            align="center",
        )
        draw_fitted_text(
            draw,
            (xs[index], y + height + 8, xs[index] + cell_width, y + height + 32),
            str(index),
            size=15,
            color=COLORS["muted"],
            mono=True,
            align="center",
        )

    missed = state.get("missed_range")
    if missed:
        start, end = missed
        draw_dashed_rectangle(
            draw,
            (xs[start] - 7, y - 7, xs[end] + cell_width + 7, y + height + 7),
            fill=COLORS["red"],
        )

    pointer_y = y - 37
    if state.get("hide_pointers"):
        return
    if 0 <= left < len(values) and left == right:
        draw_fitted_text(
            draw,
            (xs[left] - 12, pointer_y, xs[left] + cell_width + 12, y - 5),
            "L / R",
            size=18,
            color=COLORS["teal"],
            bold=True,
            align="center",
        )
    else:
        if 0 <= left < len(values):
            draw_fitted_text(
                draw,
                (xs[left], pointer_y, xs[left] + cell_width, y - 5),
                "L",
                size=18,
                color=COLORS["teal"],
                bold=True,
                align="center",
            )
        if 0 <= right < len(values):
            draw_fitted_text(
                draw,
                (xs[right], pointer_y, xs[right] + cell_width, y - 5),
                "R",
                size=18,
                color=COLORS["blue"],
                bold=True,
                align="center",
            )


def status_colors(tone: str) -> tuple[str, str]:
    return {
        "valid": (COLORS["green_soft"], COLORS["green"]),
        "invalid": (COLORS["red_soft"], COLORS["red"]),
        "waiting": (COLORS["amber_soft"], COLORS["amber"]),
        "match": (COLORS["blue_soft"], COLORS["blue"]),
        "review": (COLORS["purple_soft"], COLORS["purple"]),
    }[tone]


def draw_status_card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    value: str,
    *,
    tone: str = "waiting",
) -> None:
    fill, accent = status_colors(tone)
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=accent, width=2)
    x1, y1, x2, y2 = box
    draw_fitted_text(
        draw,
        (x1 + 18, y1 + 12, x2 - 18, y1 + 40),
        label,
        size=16,
        color=accent,
        bold=True,
    )
    draw_fitted_text(
        draw,
        (x1 + 18, y1 + 44, x2 - 18, y2 - 12),
        value,
        size=24,
        min_size=15,
        color=COLORS["ink"],
        bold=True,
        align="center",
    )


def window_text(values: list[object], state: dict) -> str:
    left = state["left"]
    right = state["right"]
    if left > right:
        return "空窗口"
    body = " ".join(str(value) for value in values[left : right + 1])
    return f"[{left}, {right}]  {body}"


def render_frame(spec: dict, state: dict, step: int, total: int) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), COLORS["paper"])
    draw = ImageDraw.Draw(image)

    draw_fitted_text(
        draw,
        (58, 28, 760, 58),
        "滑动窗口 · 逐帧推导",
        size=17,
        color=COLORS["teal"],
        bold=True,
    )
    draw_fitted_text(
        draw,
        (58, 60, 970, 108),
        spec["title"],
        size=35,
        min_size=27,
        color=COLORS["ink"],
        bold=True,
    )
    draw.rounded_rectangle((1020, 42, 1142, 88), radius=8, fill=COLORS["soft"])
    draw_fitted_text(
        draw,
        (1020, 42, 1142, 88),
        f"{step} / {total}",
        size=20,
        color=COLORS["muted"],
        bold=True,
        mono=True,
        align="center",
    )

    draw.rounded_rectangle((58, 128, 1142, 184), radius=8, fill=COLORS["blue_soft"])
    draw_fitted_text(
        draw,
        (78, 128, 1122, 184),
        spec["rule"],
        size=22,
        min_size=17,
        color=COLORS["blue"],
        bold=True,
        align="center",
    )

    draw_array(draw, spec["values"], state)

    card_top = 388
    card_bottom = 516
    card_width = 340
    gap = 30
    start_x = 60
    draw_status_card(
        draw,
        (start_x, card_top, start_x + card_width, card_bottom),
        "当前窗口",
        state.get("window", window_text(spec["values"], state)),
        tone=state.get("window_tone", "waiting"),
    )
    draw_status_card(
        draw,
        (start_x + card_width + gap, card_top, start_x + 2 * card_width + gap, card_bottom),
        "条件判断",
        state["condition"],
        tone=state["tone"],
    )
    draw_status_card(
        draw,
        (start_x + 2 * (card_width + gap), card_top, start_x + 3 * card_width + 2 * gap, card_bottom),
        "动作 / 结果",
        state["action"],
        tone=state.get("action_tone", state["tone"]),
    )

    draw.line((58, 552, 1142, 552), fill=COLORS["line"], width=2)
    draw_fitted_text(
        draw,
        (58, 565, 1142, 612),
        state["note"],
        size=20,
        min_size=16,
        color=COLORS["muted"],
        align="center",
    )
    return image


def validate_spec(spec: dict) -> None:
    values = spec["values"]
    previous_left = -1
    previous_right = -1
    for state in spec["states"]:
        left = state["left"]
        right = state["right"]
        assert left >= previous_left, f"left moved backwards in {spec['slug']}"
        assert right >= previous_right, f"right moved backwards in {spec['slug']}"
        previous_left = left
        previous_right = right

        window = values[left : right + 1] if left <= right else []
        check = spec["check"]
        if check == "unique":
            actual = max(Counter(window).values(), default=0) <= 1
            assert actual == state["valid"]
        elif check == "minimum_sum":
            actual_sum = sum(window)
            assert actual_sum == state["sum"]
            assert (actual_sum >= spec["target"]) == state["meets"]
        elif check == "anagram":
            actual = len(window) == len(spec["pattern"]) and Counter(window) == Counter(spec["pattern"])
            assert actual == state["is_match"]
        elif check == "product":
            actual_product = math.prod(window) if window else 1
            assert actual_product == state["product"]
            assert (actual_product < spec["target"]) == state["valid"]
        elif check == "negative_failure" and not state.get("review"):
            assert sum(window) == state["sum"]

    if spec["check"] == "negative_failure":
        start, end = spec["states"][-1]["missed_range"]
        assert sum(values[start : end + 1]) == spec["target"]


def save_contact_sheet(slug: str, frames: list[Image.Image]) -> None:
    columns = 3
    thumb_width = 380
    thumb_height = HEIGHT * thumb_width // WIDTH
    gap = 16
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new(
        "RGB",
        (columns * thumb_width + (columns + 1) * gap, rows * thumb_height + (rows + 1) * gap),
        COLORS["soft"],
    )
    for index, frame in enumerate(frames):
        x = gap + (index % columns) * (thumb_width + gap)
        y = gap + (index // columns) * (thumb_height + gap)
        sheet.paste(frame.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS), (x, y))
    sheet.save(QA_DIR / f"{slug}-contact.png")


def save_gif(spec: dict) -> dict:
    validate_spec(spec)
    frames = [
        render_frame(spec, state, index + 1, len(spec["states"]))
        for index, state in enumerate(spec["states"])
    ]
    palette = frames[0].convert("P", palette=Image.Palette.ADAPTIVE, colors=192)
    quantized = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    durations = [state.get("duration", 1400) for state in spec["states"]]
    output_path = OUTPUT_DIR / f"{spec['slug']}.gif"
    quantized[0].save(
        output_path,
        save_all=True,
        append_images=quantized[1:],
        duration=durations,
        loop=0,
        disposal=2,
        optimize=True,
    )
    save_contact_sheet(spec["slug"], frames)

    with Image.open(output_path) as result:
        assert result.size == (WIDTH, HEIGHT)
        assert result.n_frames == len(frames)

    return {
        "file": str(output_path.relative_to(ROOT)),
        "frames": len(frames),
        "size": [WIDTH, HEIGHT],
        "rule": spec["rule"],
    }


SPECS = [
    {
        "slug": "longest-no-repeat",
        "title": "LC 3 · 无重复字符的最长子串",
        "rule": "最长合法窗口：加入 R；若出现重复，while 非法就移动 L；恢复合法后更新答案",
        "values": list("abcabcbb"),
        "check": "unique",
        "states": [
            {"left": 0, "right": 0, "valid": True, "condition": "freq(a)=1，合法", "action": "ans = 1", "tone": "valid", "note": "窗口合法，记录当前最长长度。"},
            {"left": 0, "right": 1, "valid": True, "condition": "a、b 均不重复", "action": "ans = 2", "tone": "valid", "note": "右端扩张后仍合法，不需要移动 left。"},
            {"left": 0, "right": 2, "valid": True, "condition": "a、b、c 均不重复", "action": "ans = 3", "tone": "valid", "note": "当前最长无重复子串是 abc。"},
            {"left": 0, "right": 3, "valid": False, "condition": "freq(a)=2，非法", "action": "移出左端 a", "tone": "invalid", "special": [0, 3], "note": "新加入的 a 制造重复，触发 while 收缩。", "duration": 1900},
            {"left": 1, "right": 3, "valid": True, "condition": "bca 无重复，合法", "action": "ans 仍为 3", "tone": "valid", "note": "left 只向右移动；窗口恢复合法后再更新答案。"},
            {"left": 1, "right": 4, "valid": False, "condition": "freq(b)=2，非法", "action": "移出左端 b", "tone": "invalid", "special": [1, 4], "note": "同样的规则处理新的重复字符 b。", "duration": 1800},
            {"left": 2, "right": 4, "valid": True, "condition": "cab 无重复，合法", "action": "ans 仍为 3", "tone": "valid", "note": "恢复合法，不遗漏以当前 right 结尾的最长合法窗口。"},
            {"left": 2, "right": 5, "valid": False, "condition": "freq(c)=2，非法", "action": "移出左端 c", "tone": "invalid", "special": [2, 5], "note": "一个新元素可能触发一次或多次 left 移动。", "duration": 1800},
            {"left": 3, "right": 5, "valid": True, "condition": "abc 无重复，合法", "action": "最终 ans = 3", "tone": "valid", "match": [3, 4, 5], "note": "整个过程中，left 和 right 都从不回退。", "duration": 2600},
        ],
    },
    {
        "slug": "minimum-positive-sum",
        "title": "LC 209 · 长度最小的子数组",
        "rule": "最短满足窗口：正整数保证 sum 单调；while sum ≥ 7 时更新答案并继续收缩",
        "values": [2, 3, 1, 2, 4, 3],
        "check": "minimum_sum",
        "target": 7,
        "states": [
            {"left": 0, "right": 0, "sum": 2, "meets": False, "condition": "sum=2 < 7", "action": "继续扩张 R", "tone": "waiting", "note": "尚未达到 target，不能开始寻找更短窗口。"},
            {"left": 0, "right": 1, "sum": 5, "meets": False, "condition": "sum=5 < 7", "action": "继续扩张 R", "tone": "waiting", "note": "所有元素为正，向右扩张只会让 sum 增大。"},
            {"left": 0, "right": 2, "sum": 6, "meets": False, "condition": "sum=6 < 7", "action": "继续扩张 R", "tone": "waiting", "note": "窗口仍未满足条件。"},
            {"left": 0, "right": 3, "sum": 8, "meets": True, "condition": "sum=8 ≥ 7", "action": "ans=4；移出 2", "tone": "valid", "note": "窗口已满足；因为求最短，要在合法时继续收缩。", "duration": 1900},
            {"left": 1, "right": 3, "sum": 6, "meets": False, "condition": "sum=6 < 7", "action": "停止收缩", "tone": "waiting", "note": "删除左端 2 后不再满足，继续扩张 right。"},
            {"left": 1, "right": 4, "sum": 10, "meets": True, "condition": "sum=10 ≥ 7", "action": "ans仍4；移出 3", "tone": "valid", "note": "满足条件，进入 while 收缩。"},
            {"left": 2, "right": 4, "sum": 7, "meets": True, "condition": "sum=7 ≥ 7", "action": "ans=3；移出 1", "tone": "valid", "note": "收缩后仍满足，所以继续收缩，不要只写 if。", "duration": 1900},
            {"left": 3, "right": 4, "sum": 6, "meets": False, "condition": "sum=6 < 7", "action": "停止收缩", "tone": "waiting", "note": "窗口第一次变为不满足，while 结束。"},
            {"left": 3, "right": 5, "sum": 9, "meets": True, "condition": "sum=9 ≥ 7", "action": "ans仍3；移出 2", "tone": "valid", "note": "加入最后一个 3 后，再次开始压缩窗口。"},
            {"left": 4, "right": 5, "sum": 7, "meets": True, "condition": "sum=7 ≥ 7", "action": "ans = 2", "tone": "match", "action_tone": "match", "match": [4, 5], "note": "找到最短窗口 [4,5]，即 [4,3]，长度为 2。", "duration": 2800},
        ],
    },
    {
        "slug": "fixed-anagram-window",
        "title": "LC 438 · 找到字符串中所有字母异位词",
        "rule": "固定窗口：k=3；长度达到 3 后，每次 R 右移一格，L 也同步右移一格",
        "values": list("cbaebabacd"),
        "pattern": list("abc"),
        "check": "anagram",
        "states": [
            {"left": 0, "right": 0, "is_match": False, "condition": "长度 1 < 3", "action": "继续扩张", "tone": "waiting", "note": "模式串 p=abc，候选窗口必须恰好长 3。"},
            {"left": 0, "right": 1, "is_match": False, "condition": "长度 2 < 3", "action": "继续扩张", "tone": "waiting", "note": "窗口未达到固定长度，暂不比较频次。"},
            {"left": 0, "right": 2, "is_match": True, "condition": "freq(cba)=freq(abc)", "action": "记录起点 0", "tone": "match", "match": [0, 1, 2], "note": "字符顺序不同，但频次完全相同，因此 cba 是异位词。", "duration": 2200},
            {"left": 1, "right": 3, "is_match": False, "condition": "bae ≠ abc", "action": "窗口右移一格", "tone": "invalid", "note": "加入 e 的同时移出 c，窗口长度始终为 3。"},
            {"left": 2, "right": 4, "is_match": False, "condition": "aeb ≠ abc", "action": "窗口右移一格", "tone": "invalid", "note": "固定窗口的 left 由长度决定，不由合法性决定。"},
            {"left": 3, "right": 5, "is_match": False, "condition": "eba ≠ abc", "action": "窗口右移一格", "tone": "invalid", "note": "每次只加入一个右端字符，并移出一个左端字符。"},
            {"left": 4, "right": 6, "is_match": False, "condition": "bab ≠ abc", "action": "继续右移", "tone": "invalid", "note": "中间窗口可按相同规则逐个检查。"},
            {"left": 5, "right": 7, "is_match": False, "condition": "aba ≠ abc", "action": "继续右移", "tone": "invalid", "note": "窗口内缺少字符 c，因此频次不相等。"},
            {"left": 6, "right": 8, "is_match": True, "condition": "freq(bac)=freq(abc)", "action": "记录起点 6", "tone": "match", "match": [6, 7, 8], "note": "第二个异位词窗口是 bac，答案加入索引 6。", "duration": 2800},
            {"left": 7, "right": 9, "is_match": False, "condition": "acd ≠ abc", "action": "遍历完成：[0,6]", "tone": "invalid", "action_tone": "match", "note": "最后一个固定窗口不匹配，完整答案为起点索引 [0,6]。", "duration": 2800},
        ],
    },
    {
        "slug": "product-count-contribution",
        "title": "LC 713 · 乘积小于 K 的子数组",
        "rule": "计数窗口：恢复 product < 100 后，新增 right-left+1 个以 right 结尾的合法子数组",
        "values": [10, 5, 2, 6],
        "target": 100,
        "check": "product",
        "states": [
            {"left": 0, "right": 0, "product": 10, "valid": True, "condition": "product=10 < 100", "action": "新增1；total=1", "tone": "valid", "note": "以索引 0 结尾的合法子数组只有 [10]。"},
            {"left": 0, "right": 1, "product": 50, "valid": True, "condition": "product=50 < 100", "action": "新增2；total=3", "tone": "valid", "note": "新增 [10,5] 与 [5]，数量为 R-L+1=2。"},
            {"left": 0, "right": 2, "product": 100, "valid": False, "condition": "product=100，不合法", "action": "移出左端 10", "tone": "invalid", "special": [0, 1, 2], "note": "题目要求严格小于 100；等于 100 也必须收缩。", "duration": 2000},
            {"left": 1, "right": 2, "product": 10, "valid": True, "condition": "product=10 < 100", "action": "新增2；total=5", "tone": "valid", "note": "新增 [5,2] 与 [2]；所有更短后缀也合法。", "duration": 1900},
            {"left": 1, "right": 3, "product": 60, "valid": True, "condition": "product=60 < 100", "action": "新增3；total=8", "tone": "match", "action_tone": "match", "match": [1, 2, 3], "note": "新增 [5,2,6]、[2,6]、[6]，最终答案为 8。", "duration": 3000},
        ],
    },
    {
        "slug": "negative-sum-counterexample",
        "title": "LC 560 反例 · 负数破坏求和窗口的单调性",
        "rule": "错误规则演示：一看到 sum > 3 就移动 L；该规则会漏掉未来由负数拉回目标值的区间",
        "values": [1, 4, -2],
        "target": 3,
        "check": "negative_failure",
        "states": [
            {"left": 0, "right": 0, "sum": 1, "condition": "sum=1 < 3", "action": "朴素规则：扩张", "tone": "waiting", "note": "以下演示的是错误算法，用来说明普通求和窗口为何失效。"},
            {"left": 0, "right": 1, "sum": 5, "condition": "sum=5 > 3", "action": "误判：开始收缩", "tone": "invalid", "special": [0, 1], "note": "算法不知道后面还有 -2，会把仍有价值的左边界丢掉。", "duration": 2200},
            {"left": 1, "right": 1, "sum": 4, "condition": "sum=4 > 3", "action": "继续移出 4", "tone": "invalid", "special": [1], "note": "移出 1 后仍大于 3，朴素规则继续推进 left。"},
            {"left": 2, "right": 1, "sum": 0, "condition": "窗口已空", "action": "left 已到索引 2", "tone": "waiting", "window": "空窗口 · L 已越过 R", "note": "索引 0 和 1 已被永久越过，left 不会回头。"},
            {"left": 2, "right": 2, "sum": -2, "condition": "sum=-2 < 3", "action": "错误算法找不到答案", "tone": "invalid", "special": [2], "note": "加入 -2 后，总和反而下降；此前收缩的决定无法撤销。", "duration": 2200},
            {"left": 2, "right": 2, "review": True, "hide_pointers": True, "condition": "真实区间 [0,2] 和为 3", "action": "普通窗口漏解", "tone": "review", "action_tone": "invalid", "missed_range": [0, 2], "window": "虚线框：被漏掉的答案", "note": "1+4-2=3。含负数时，sum>target 不能推出 left 应右移。", "duration": 3400},
        ],
    },
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = [save_gif(spec) for spec in SPECS]
    (QA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
