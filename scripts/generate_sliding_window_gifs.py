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


_GLYPH_CACHE: dict[tuple[str, str], bool] = {}


def font_path(*, bold: bool = False, mono: bool = False) -> str:
    return FONT_MONO if mono else FONT_BOLD if bold else FONT_REGULAR


def has_glyph(path: str, character: str) -> bool:
    """True if the font really has this glyph.

    A missing character renders as .notdef — a hollow box in STHeiti — which
    reads as a typo rather than a bug. Menlo has no CJK; STHeiti has no check
    marks. Comparing against an unassigned code point makes this exact.
    """
    key = (path, character)
    if key not in _GLYPH_CACHE:
        probe = ImageFont.truetype(path, 32)

        def render(char: str) -> bytes:
            canvas = Image.new("L", (72, 72), 0)
            ImageDraw.Draw(canvas).text((8, 8), char, font=probe, fill=255)
            return canvas.tobytes()

        _GLYPH_CACHE[key] = render(character) != render(chr(0xFFFF))
    return _GLYPH_CACHE[key]


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
    path = font_path(bold=bold, mono=mono)
    missing = sorted({ch for ch in text if ord(ch) > 127 and not has_glyph(path, ch)})
    assert not missing, f"{Path(path).name} 缺少字形 {missing}，文本：{text!r}"

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
    previous_phase = None
    phase_total = 0
    for state in spec["states"]:
        phase = state.get("phase")
        if previous_phase is not None and phase != previous_phase:
            previous_left = -1
            previous_right = -1
            phase_total = 0
        previous_phase = phase

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
        elif check == "zero_budget":
            zero_count = window.count(0)
            assert zero_count == state["zero_count"]
            assert (zero_count <= spec["budget"]) == state["valid"]
        elif check == "replacement":
            max_frequency = max(Counter(window).values(), default=0)
            replacement_cost = len(window) - max_frequency
            assert max_frequency == state["max_frequency"]
            assert replacement_cost == state["replacement_cost"]
            assert (replacement_cost <= spec["budget"]) == state["valid"]
        elif check == "minimum_sum":
            actual_sum = sum(window)
            assert actual_sum == state["sum"]
            assert (actual_sum >= spec["target"]) == state["meets"]
        elif check == "coverage":
            window_counts = Counter(window)
            need_counts = Counter(spec["target_values"])
            covers = all(window_counts[value] >= count for value, count in need_counts.items())
            assert covers == state["covers"]
        elif check == "anagram":
            actual = len(window) == len(spec["pattern"]) and Counter(window) == Counter(spec["pattern"])
            assert actual == state["is_match"]
        elif check == "product":
            actual_product = math.prod(window) if window else 1
            assert actual_product == state["product"]
            assert (actual_product < spec["target"]) == state["valid"]
        elif check == "exact_distinct" and not state.get("review"):
            distinct = len(set(window))
            assert distinct == state["distinct"]
            assert distinct <= state["limit"]
            assert state["contribution"] == right - left + 1
            phase_total += state["contribution"]
            assert phase_total == state["total"]
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


def rgb(hex_colour: str) -> tuple[int, int, int]:
    return tuple(int(hex_colour[i : i + 2], 16) for i in (1, 3, 5))


def build_palette(frames: list[Image.Image]) -> Image.Image:
    """Palette with every brand colour pinned, adaptive for the rest.

    Deriving it from frames[0] alone silently drops any accent colour that
    only appears later: the red "this algorithm is wrong" frames used to be
    remapped to the nearest grey, deleting the visual signal entirely.
    """
    forced = list(dict.fromkeys(COLORS.values()))
    thumb = (WIDTH // 3, HEIGHT // 3)
    strip = Image.new("RGB", (thumb[0], thumb[1] * len(frames)))
    for index, frame in enumerate(frames):
        strip.paste(frame.resize(thumb, Image.Resampling.NEAREST), (0, index * thumb[1]))
    adaptive = strip.convert("P", palette=Image.Palette.ADAPTIVE, colors=256 - len(forced))

    data: list[int] = []
    for hex_colour in forced:
        data.extend(rgb(hex_colour))
    data.extend(adaptive.getpalette()[: (256 - len(forced)) * 3])
    data = (data + [0] * 768)[:768]

    palette_image = Image.new("P", (1, 1))
    palette_image.putpalette(data)
    return palette_image


def save_gif(spec: dict) -> dict:
    validate_spec(spec)
    frames = [
        render_frame(spec, state, index + 1, len(spec["states"]))
        for index, state in enumerate(spec["states"])
    ]
    palette = build_palette(frames)
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
        for index in range(result.n_frames):
            result.seek(index)
            rendered = set(result.convert("RGB").get_flattened_data())
            source = set(frames[index].get_flattened_data())
            for accent in {status_colors(t)[1] for t in ("valid", "invalid", "waiting", "match", "review")}:
                if rgb(accent) in source:
                    assert rgb(accent) in rendered, (
                        f"{spec['slug']} 第 {index + 1} 帧的强调色 {accent} 被调色板丢弃"
                    )

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
        "slug": "max-consecutive-ones-budget",
        "title": "LC 1004 · 最大连续 1 的个数 III",
        "rule": "最长合法窗口：把 0 的数量当作修改成本；while zeroCount > k 时移动 L",
        "values": [1, 1, 0, 0, 1, 1, 1, 0],
        "budget": 2,
        "check": "zero_budget",
        "states": [
            {"left": 0, "right": 0, "zero_count": 0, "valid": True, "condition": "zeroCount=0 ≤ 2", "action": "ans = 1", "tone": "valid", "note": "最多可以把 k=2 个 0 改成 1。"},
            {"left": 0, "right": 1, "zero_count": 0, "valid": True, "condition": "zeroCount=0 ≤ 2", "action": "ans = 2", "tone": "valid", "note": "没有消耗修改预算，窗口继续扩张。"},
            {"left": 0, "right": 2, "zero_count": 1, "valid": True, "condition": "zeroCount=1 ≤ 2", "action": "ans = 3", "tone": "valid", "note": "第一个 0 消耗一次修改预算。"},
            {"left": 0, "right": 3, "zero_count": 2, "valid": True, "condition": "zeroCount=2 ≤ 2", "action": "ans = 4", "tone": "valid", "note": "修改预算恰好用完，窗口仍然合法。"},
            {"left": 0, "right": 4, "zero_count": 2, "valid": True, "condition": "zeroCount=2 ≤ 2", "action": "ans = 5", "tone": "valid", "note": "加入 1 不增加违规成本。"},
            {"left": 0, "right": 5, "zero_count": 2, "valid": True, "condition": "zeroCount=2 ≤ 2", "action": "ans = 6", "tone": "valid", "note": "窗口继续保持合法。"},
            {"left": 0, "right": 6, "zero_count": 2, "valid": True, "condition": "zeroCount=2 ≤ 2", "action": "ans = 7", "tone": "match", "action_tone": "match", "match": [0, 1, 2, 3, 4, 5, 6], "note": "当前最优窗口 [0,6] 长度为 7。", "duration": 2300},
            {"left": 0, "right": 7, "zero_count": 3, "valid": False, "condition": "zeroCount=3 > 2", "action": "移出索引 0 的 1", "tone": "invalid", "special": [2, 3, 7], "note": "加入第三个 0 后窗口非法，开始执行 while。", "duration": 1900},
            {"left": 1, "right": 7, "zero_count": 3, "valid": False, "condition": "zeroCount仍为3", "action": "移出索引 1 的 1", "tone": "invalid", "special": [2, 3, 7], "note": "删除 1 不减少 zeroCount，所以仍需收缩。"},
            {"left": 2, "right": 7, "zero_count": 3, "valid": False, "condition": "zeroCount仍为3", "action": "移出索引 2 的 0", "tone": "invalid", "special": [2, 3, 7], "note": "一个新元素可能需要多次移动 left，不能只写 if。"},
            {"left": 3, "right": 7, "zero_count": 2, "valid": True, "condition": "zeroCount=2 ≤ 2", "action": "最终 ans = 7", "tone": "valid", "action_tone": "match", "note": "移出一个 0 后恢复合法；历史最优长度仍为 7。", "duration": 2800},
        ],
    },
    {
        "slug": "replacement-cost-window",
        "title": "LC 424 · 替换后的最长重复字符",
        "rule": "合法条件：窗口长度 - 窗口内真实最高频次 ≤ k；本例 k=1",
        "values": list("AABABBA"),
        "budget": 1,
        "check": "replacement",
        "states": [
            {"left": 0, "right": 0, "max_frequency": 1, "replacement_cost": 0, "valid": True, "condition": "1-1=0 ≤ 1", "action": "ans = 1", "tone": "valid", "note": "保留最高频字符，替换窗口中的其余字符。"},
            {"left": 0, "right": 1, "max_frequency": 2, "replacement_cost": 0, "valid": True, "condition": "2-2=0 ≤ 1", "action": "ans = 2", "tone": "valid", "note": "窗口 AA 不需要任何替换。"},
            {"left": 0, "right": 2, "max_frequency": 2, "replacement_cost": 1, "valid": True, "condition": "3-2=1 ≤ 1", "action": "ans = 3", "tone": "valid", "note": "AAB 中替换一个 B 即可全部变成 A。"},
            {"left": 0, "right": 3, "max_frequency": 3, "replacement_cost": 1, "valid": True, "condition": "4-3=1 ≤ 1", "action": "ans = 4", "tone": "match", "action_tone": "match", "match": [0, 1, 2, 3], "note": "AABA 只需替换一个 B，得到长度 4 的答案。", "duration": 2300},
            {"left": 0, "right": 4, "max_frequency": 3, "replacement_cost": 2, "valid": False, "condition": "5-3=2 > 1", "action": "移出左端 A", "tone": "invalid", "special": [2, 4], "note": "AABAB 至少需要替换两个 B，超过预算。", "duration": 1900},
            {"left": 1, "right": 4, "max_frequency": 2, "replacement_cost": 2, "valid": False, "condition": "4-2=2 > 1", "action": "继续移出 A", "tone": "invalid", "special": [1, 3], "note": "按当前窗口重新计算 maxFrequency，窗口仍然非法。"},
            {"left": 2, "right": 4, "max_frequency": 2, "replacement_cost": 1, "valid": True, "condition": "3-2=1 ≤ 1", "action": "恢复合法", "tone": "valid", "note": "BAB 只需把 A 替换成 B。"},
            {"left": 2, "right": 5, "max_frequency": 3, "replacement_cost": 1, "valid": True, "condition": "4-3=1 ≤ 1", "action": "ans 仍为 4", "tone": "valid", "note": "BABB 仍可用一次替换变成相同字符。"},
            {"left": 2, "right": 6, "max_frequency": 3, "replacement_cost": 2, "valid": False, "condition": "5-3=2 > 1", "action": "移出左端 B", "tone": "invalid", "note": "BABBA 的替换成本再次超过预算。"},
            {"left": 3, "right": 6, "max_frequency": 2, "replacement_cost": 2, "valid": False, "condition": "4-2=2 > 1", "action": "继续移出 A", "tone": "invalid", "note": "ABBA 中 A、B 各出现两次，至少要替换两个。"},
            {"left": 4, "right": 6, "max_frequency": 2, "replacement_cost": 1, "valid": True, "condition": "3-2=1 ≤ 1", "action": "最终 ans = 4", "tone": "valid", "action_tone": "match", "note": "BBA 恢复合法，历史最长答案保持为 4。", "duration": 2800},
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
        "slug": "minimum-cover-window",
        "title": "LC 76 · 最小覆盖子串",
        "rule": "目标 t=ABC：formed=3 表示完整覆盖；覆盖后更新最短答案，并持续移动 L",
        "values": list("ADOBECODEBANC"),
        "target_values": list("ABC"),
        "check": "coverage",
        "states": [
            {"left": 0, "right": 0, "covers": False, "condition": "formed=1/3", "action": "继续扩张 R", "tone": "waiting", "window": "[0,0] A", "note": "当前只有 A 达到需要的频次，还缺 B 和 C。"},
            {"left": 0, "right": 5, "covers": True, "condition": "formed=3/3，已覆盖", "action": "ans=6；移出 A", "tone": "valid", "window": "[0,5] ADOBEC", "note": "第一次覆盖 ABC；因为求最短，立即进入 while 收缩。", "duration": 2100},
            {"left": 1, "right": 5, "covers": False, "condition": "formed=2/3，缺 A", "action": "扩张 R 到索引 10", "tone": "waiting", "window": "[1,5] DOBEC", "note": "移出唯一的 A 后覆盖失效，停止收缩。"},
            {"left": 1, "right": 10, "covers": True, "condition": "formed=3/3，已覆盖", "action": "ans仍6；移出 D", "tone": "valid", "window": "[1,10] DOBECODEBA", "note": "右端扩张到新的 A 后，再次完整覆盖。"},
            {"left": 2, "right": 10, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 O", "tone": "valid", "window": "[2,10] OBECODEBA", "note": "D 不是必需字符，删除后仍然覆盖。"},
            {"left": 3, "right": 10, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 B", "tone": "valid", "window": "[3,10] BECODEBA", "note": "窗口中有两个 B，移出左侧 B 后仍有一个。"},
            {"left": 4, "right": 10, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 E", "tone": "valid", "window": "[4,10] ECODEBA", "note": "非必需字符可以继续丢弃。"},
            {"left": 5, "right": 10, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 C", "tone": "valid", "window": "[5,10] CODEBA", "note": "长度回到 6，答案暂时仍为 ADOBEC。"},
            {"left": 6, "right": 10, "covers": False, "condition": "formed=2/3，缺 C", "action": "扩张 R 到索引 12", "tone": "waiting", "window": "[6,10] ODEBA", "note": "移出唯一的 C 后覆盖失效，while 停止。"},
            {"left": 6, "right": 12, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 O", "tone": "valid", "window": "[6,12] ODEBANC", "note": "加入索引 12 的 C 后恢复覆盖，再次尝试收缩。"},
            {"left": 7, "right": 12, "covers": True, "condition": "formed=3/3，已覆盖", "action": "移出 D", "tone": "valid", "window": "[7,12] DEBANC", "note": "删除 O 后仍覆盖，继续收缩。"},
            {"left": 8, "right": 12, "covers": True, "condition": "formed=3/3，已覆盖", "action": "ans=5；移出 E", "tone": "valid", "window": "[8,12] EBANC", "note": "窗口 EBANC 长度为 5，刷新最短答案。"},
            {"left": 9, "right": 12, "covers": True, "condition": "formed=3/3，已覆盖", "action": "ans = 4；移出 B", "tone": "match", "action_tone": "match", "match": [9, 10, 11, 12], "window": "[9,12] BANC", "note": "BANC 长度为 4，是本题最终最短覆盖子串。", "duration": 2800},
            {"left": 10, "right": 12, "covers": False, "condition": "formed=2/3，缺 B", "action": "最终答案 BANC", "tone": "waiting", "action_tone": "match", "window": "[10,12] ANC", "note": "移出唯一的 B 后覆盖失效；最短答案保持为 BANC。", "duration": 2800},
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
        "slug": "exact-k-distinct",
        "title": "LC 992 · 恰好 K 个不同整数的子数组",
        "rule": "本例 K=2：exactly(2) = atMost(2) - atMost(1)，两次都按右端点累计贡献",
        "values": [1, 2, 1, 2, 3],
        "check": "exact_distinct",
        "states": [
            {"phase": "atMost2", "left": 0, "right": 0, "limit": 2, "distinct": 1, "contribution": 1, "total": 1, "condition": "atMost(2)：1种", "action": "新增1；total=1", "tone": "valid", "note": "先计算不同整数至多为 2 的子数组数量。"},
            {"phase": "atMost2", "left": 0, "right": 1, "limit": 2, "distinct": 2, "contribution": 2, "total": 3, "condition": "atMost(2)：2种", "action": "新增2；total=3", "tone": "valid", "note": "以索引 1 结尾的合法后缀有 [1,2] 和 [2]。"},
            {"phase": "atMost2", "left": 0, "right": 2, "limit": 2, "distinct": 2, "contribution": 3, "total": 6, "condition": "atMost(2)：2种", "action": "新增3；total=6", "tone": "valid", "note": "加入 1 没有增加不同整数种类。"},
            {"phase": "atMost2", "left": 0, "right": 3, "limit": 2, "distinct": 2, "contribution": 4, "total": 10, "condition": "atMost(2)：2种", "action": "新增4；total=10", "tone": "valid", "note": "以索引 3 结尾共有 4 个合法后缀。"},
            {"phase": "atMost2", "left": 3, "right": 4, "limit": 2, "distinct": 2, "contribution": 2, "total": 12, "condition": "atMost(2)：恢复为2种", "action": "新增2；total=12", "tone": "valid", "note": "加入 3 后曾有三种整数；left 从 0 移到 3 才恢复合法。", "duration": 2100},
            {"phase": "atMost1", "left": 0, "right": 0, "limit": 1, "distinct": 1, "contribution": 1, "total": 1, "condition": "atMost(1)：1种", "action": "新增1；total=1", "tone": "valid", "note": "第二次独立运行窗口，计算至多 1 种的数量。"},
            {"phase": "atMost1", "left": 1, "right": 1, "limit": 1, "distinct": 1, "contribution": 1, "total": 2, "condition": "atMost(1)：1种", "action": "新增1；total=2", "tone": "valid", "note": "加入 2 后需移出 1，只保留单一整数。"},
            {"phase": "atMost1", "left": 2, "right": 2, "limit": 1, "distinct": 1, "contribution": 1, "total": 3, "condition": "atMost(1)：1种", "action": "新增1；total=3", "tone": "valid", "note": "每次值发生变化，left 都收缩到当前元素。"},
            {"phase": "atMost1", "left": 3, "right": 3, "limit": 1, "distinct": 1, "contribution": 1, "total": 4, "condition": "atMost(1)：1种", "action": "新增1；total=4", "tone": "valid", "note": "截至索引 3，atMost(1) 累计为 4。"},
            {"phase": "atMost1", "left": 4, "right": 4, "limit": 1, "distinct": 1, "contribution": 1, "total": 5, "condition": "atMost(1)：1种", "action": "新增1；total=5", "tone": "valid", "note": "完整 atMost(1) 结果为 5。"},
            {"phase": "result", "left": 4, "right": 4, "review": True, "hide_pointers": True, "condition": "exactly(2)", "action": "12 - 5 = 7", "tone": "review", "action_tone": "match", "window": "atMost(2)=12；atMost(1)=5", "note": "恰好 2 种的子数组数量为 7；作差排除只有 1 种的情况。", "duration": 3400},
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
