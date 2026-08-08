#!/usr/bin/env python3
"""Generate deterministic teaching GIFs for the A* article.

Unlike the sliding-window script, the per-frame annotations here are not
hand-authored: every frame is produced by actually running the search, and the
narration is checked against independently computed ground truth (BFS/Dijkstra
optima, admissibility, consistency). If a claim in the article is wrong, this
script fails instead of drawing a pretty lie.
"""

from __future__ import annotations

import heapq
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "static/images/blog/a-star"
QA_DIR = Path("/tmp/a-star-gif-qa")

WIDTH = 1200
HEIGHT = 640

COLORS = {
    "ink": "#172033",
    "muted": "#667085",
    "line": "#D7DCE5",
    "paper": "#FFFFFF",
    "soft": "#F5F7FA",
    "wall": "#3B4453",
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

INF = float("inf")


# --------------------------------------------------------------------------
# drawing primitives
# --------------------------------------------------------------------------


def font(size: int, *, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_MONO if mono else FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(path, size=size)


_GLYPH_CACHE: dict[tuple[str, str], bool] = {}


def has_glyph(path: str, character: str) -> bool:
    """True if the font really has this glyph.

    A missing character silently renders as .notdef — a hollow box in STHeiti,
    which looks like a typo rather than a bug. Comparing against the render of
    an unassigned code point makes the check exact instead of a guess.
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


def font_path(*, bold: bool = False, mono: bool = False) -> str:
    return FONT_MONO if mono else FONT_BOLD if bold else FONT_REGULAR


def is_ascii(text: object) -> bool:
    """Menlo has no CJK glyphs, so only ASCII cells may be rendered monospaced."""
    return all(ord(ch) < 128 for ch in str(text))


def text_width(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def draw_fitted_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    *,
    size: int,
    min_size: int = 13,
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
    for start in range(int(x1), int(x2), dash + gap):
        draw.line((start, y1, min(start + dash, x2), y1), fill=fill, width=width)
        draw.line((start, y2, min(start + dash, x2), y2), fill=fill, width=width)
    for start in range(int(y1), int(y2), dash + gap):
        draw.line((x1, start, x1, min(start + dash, y2)), fill=fill, width=width)
        draw.line((x2, start, x2, min(start + dash, y2)), fill=fill, width=width)


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    fill: str,
    width: int = 3,
    head: int = 14,
    trim_start: float = 0.0,
    trim_end: float = 0.0,
) -> tuple[float, float]:
    """Draw an arrow, trimmed at both ends; return the midpoint of the shaft."""
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return (x1, y1)
    ux, uy = dx / length, dy / length
    x1 += ux * trim_start
    y1 += uy * trim_start
    x2 -= ux * trim_end
    y2 -= uy * trim_end

    tip_x, tip_y = x2, y2
    base_x, base_y = x2 - ux * head, y2 - uy * head
    draw.line((x1, y1, base_x, base_y), fill=fill, width=width)
    draw.polygon(
        [
            (tip_x, tip_y),
            (base_x - uy * head * 0.42, base_y + ux * head * 0.42),
            (base_x + uy * head * 0.42, base_y - ux * head * 0.42),
        ],
        fill=fill,
    )
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def tone_colors(tone: str) -> tuple[str, str]:
    return {
        "valid": (COLORS["green_soft"], COLORS["green"]),
        "invalid": (COLORS["red_soft"], COLORS["red"]),
        "waiting": (COLORS["amber_soft"], COLORS["amber"]),
        "match": (COLORS["blue_soft"], COLORS["blue"]),
        "review": (COLORS["purple_soft"], COLORS["purple"]),
        "neutral": (COLORS["soft"], COLORS["muted"]),
    }[tone]


def draw_status_card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    value: str,
    *,
    tone: str = "waiting",
) -> None:
    fill, accent = tone_colors(tone)
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=accent, width=2)
    x1, y1, x2, y2 = box
    draw_fitted_text(draw, (x1 + 16, y1 + 9, x2 - 16, y1 + 33), label, size=15, color=accent, bold=True)
    draw_fitted_text(
        draw,
        (x1 + 16, y1 + 36, x2 - 16, y2 - 10),
        value,
        size=22,
        min_size=13,
        color=COLORS["ink"],
        bold=True,
        align="center",
    )


def draw_table(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    title: str,
    headers: list[str],
    rows: list[tuple[list[str], str]],
    *,
    widths: list[float],
    empty_note: str = "（空）",
) -> None:
    """Render a small table; each row is (cells, tone)."""
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=10, fill=COLORS["paper"], outline=COLORS["line"], width=2)
    draw_fitted_text(draw, (x1 + 16, y1 + 10, x2 - 16, y1 + 34), title, size=16, color=COLORS["ink"], bold=True)

    inner_left = x1 + 14
    inner_right = x2 - 14
    span = inner_right - inner_left
    total = sum(widths)
    edges = [inner_left]
    for weight in widths:
        edges.append(edges[-1] + span * weight / total)

    header_y = y1 + 40
    for index, head in enumerate(headers):
        draw_fitted_text(
            draw,
            (edges[index] + 6, header_y, edges[index + 1] - 6, header_y + 22),
            head,
            size=14,
            color=COLORS["muted"],
            bold=True,
            align="center",
        )
    draw.line((inner_left, header_y + 25, inner_right, header_y + 25), fill=COLORS["line"], width=2)

    row_top = header_y + 32
    available = y2 - 12 - row_top
    if not rows:
        draw_fitted_text(draw, (inner_left, row_top, inner_right, row_top + 30), empty_note, size=16, color=COLORS["muted"], align="center")
        return

    row_height = min(34, available / len(rows))
    for r_index, (cells, tone) in enumerate(rows):
        top = row_top + r_index * row_height
        fill, accent = tone_colors(tone)
        if tone != "neutral":
            draw.rounded_rectangle((inner_left, top + 1, inner_right, top + row_height - 3), radius=6, fill=fill)
        for c_index, cell in enumerate(cells):
            draw_fitted_text(
                draw,
                (edges[c_index] + 6, top + 2, edges[c_index + 1] - 6, top + row_height - 4),
                cell,
                size=17,
                min_size=11,
                color=COLORS["ink"] if tone == "neutral" else accent,
                bold=tone != "neutral",
                mono=is_ascii(cell),
                align="center",
            )


# --------------------------------------------------------------------------
# search cores — the frames come from these, not from hand-written data
# --------------------------------------------------------------------------

# Sorting key selects the algorithm, exactly like the article's 谱系表.
KEY_ASTAR = "f"       # g + h  → A*
KEY_DIJKSTRA = "g"    # g      → Dijkstra
KEY_GREEDY = "h"      # h      → 贪心最佳优先


def _priority(key: str, g: float, h: float) -> float:
    if key == KEY_ASTAR:
        return g + h
    if key == KEY_DIJKSTRA:
        return g
    if key == KEY_GREEDY:
        return h
    raise ValueError(key)


def search(
    neighbors,
    start,
    goal,
    heuristic,
    *,
    key: str = KEY_ASTAR,
    use_closed: bool = True,
    reopen: bool = False,
    node_order=None,
):
    """Generic best-first search. Records a trace with one entry per pop.

    `key` picks A* / Dijkstra / greedy. `use_closed=False` disables the closed
    set; `reopen=True` allows a closed node back into the queue when a shorter
    g is found (the fix for an inconsistent heuristic).
    """
    order = node_order or (lambda n: 0)
    g = {start: 0}
    parent: dict = {}
    closed: set = set()
    counter = 0
    heap = [(_priority(key, 0, heuristic(start)), order(start), counter, start)]
    in_open = {start}
    trace = []
    reopened: list = []

    while heap:
        _, _, _, current = heapq.heappop(heap)
        if current in closed:
            continue  # stale heap entry (lazy deletion)
        in_open.discard(current)
        if use_closed:
            closed.add(current)

        relaxations = []
        discarded = []
        finished = current == goal

        if not finished:
            for neighbour, cost in neighbors(current):
                tentative = g[current] + cost
                if key == KEY_GREEDY:
                    # pure greedy best-first: first discovery wins, no re-relaxation
                    if neighbour in g or neighbour in closed:
                        continue
                    g[neighbour] = tentative
                    parent[neighbour] = current
                    counter += 1
                    heapq.heappush(heap, (_priority(key, tentative, heuristic(neighbour)), order(neighbour), counter, neighbour))
                    in_open.add(neighbour)
                    relaxations.append((neighbour, tentative))
                    continue

                if tentative >= g.get(neighbour, INF):
                    continue
                if neighbour in closed and not reopen:
                    discarded.append((neighbour, tentative, g[neighbour]))
                    continue
                if neighbour in closed and reopen:
                    closed.discard(neighbour)
                    reopened.append(neighbour)
                g[neighbour] = tentative
                parent[neighbour] = current
                counter += 1
                heapq.heappush(heap, (_priority(key, tentative, heuristic(neighbour)), order(neighbour), counter, neighbour))
                in_open.add(neighbour)
                relaxations.append((neighbour, tentative))

        open_snapshot = sorted(
            {node for _, _, _, node in heap if node not in closed},
            key=lambda n: (_priority(key, g[n], heuristic(n)), order(n)),
        )
        trace.append(
            {
                "current": current,
                "g": g[current],
                "h": heuristic(current),
                "f": g[current] + heuristic(current),
                "priority": _priority(key, g[current], heuristic(current)),
                "closed": frozenset(closed),
                "open": open_snapshot,
                "open_info": {n: (g[n], heuristic(n)) for n in open_snapshot},
                "relaxations": relaxations,
                "discarded": discarded,
                "finished": finished,
            }
        )
        if finished:
            break

    path = []
    if goal in g:
        node = goal
        while True:
            path.append(node)
            if node == start:
                break
            node = parent[node]
        path.reverse()

    return {
        "trace": trace,
        "path": path,
        "cost": g.get(goal, INF),
        "g": g,
        "parent": parent,
        "expanded": [entry["current"] for entry in trace],
        "reopened": reopened,
    }


# --------------------------------------------------------------------------
# grid world
# --------------------------------------------------------------------------

MAZE = [
    "..........",
    "....#####.",
    "....#.....",
    "....#.###.",
    ".####..#..",
    "......##..",
    ".####..#..",
    "....#..#..",
    "###.#..#..",
    "......#...",
]

GRID_START = (0, 0)
GRID_GOAL = (9, 9)

STEPS8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def grid_neighbors(cell):
    r, c = cell
    result = []
    for dr, dc in STEPS8:
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(MAZE) and 0 <= nc < len(MAZE[0]) and MAZE[nr][nc] != "#":
            result.append(((nr, nc), 1))
    return result


def chebyshev(cell, goal=GRID_GOAL) -> int:
    return max(abs(cell[0] - goal[0]), abs(cell[1] - goal[1]))


def manhattan(cell, goal=GRID_GOAL) -> int:
    return abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])


def true_distances(goal=GRID_GOAL) -> dict:
    """Exact remaining cost h* for every free cell, by backward BFS."""
    dist = {goal: 0}
    queue = [goal]
    while queue:
        nxt = []
        for cell in queue:
            for neighbour, _ in grid_neighbors(cell):
                if neighbour not in dist:
                    dist[neighbour] = dist[cell] + 1
                    nxt.append(neighbour)
        queue = nxt
    return dist


CELL = 30
CELL_GAP = 3
GRID_ORIGIN = (58, 196)


def cell_box(cell) -> tuple[int, int, int, int]:
    r, c = cell
    x = GRID_ORIGIN[0] + c * (CELL + CELL_GAP)
    y = GRID_ORIGIN[1] + r * (CELL + CELL_GAP)
    return (x, y, x + CELL, y + CELL)


def draw_grid(draw: ImageDraw.ImageDraw, state: dict) -> None:
    closed = state.get("closed", frozenset())
    open_set = set(state.get("open", []))
    current = state.get("current")
    path = set(state.get("path", []))
    labels = state.get("labels", {})
    flagged = set(state.get("flagged", []))

    for r, row in enumerate(MAZE):
        for c, value in enumerate(row):
            cell = (r, c)
            box = cell_box(cell)
            if value == "#":
                draw.rounded_rectangle(box, radius=5, fill=COLORS["wall"])
                continue

            fill, outline, width = COLORS["paper"], COLORS["line"], 1
            if cell in closed:
                fill, outline, width = COLORS["blue_soft"], COLORS["blue"], 1
            if cell in open_set:
                fill, outline, width = COLORS["amber_soft"], COLORS["amber"], 2
            if cell in path:
                fill, outline, width = COLORS["green_soft"], COLORS["green"], 2
            if cell in flagged:
                fill, outline, width = COLORS["red_soft"], COLORS["red"], 3
            if cell == current:
                fill, outline, width = COLORS["teal_soft"], COLORS["teal"], 4

            draw.rounded_rectangle(box, radius=5, fill=fill, outline=outline, width=width)
            label = labels.get(cell)
            if label is not None:
                draw_fitted_text(
                    draw,
                    (box[0] + 1, box[1], box[2] - 1, box[3]),
                    str(label),
                    size=15,
                    min_size=10,
                    color=COLORS["ink"],
                    bold=True,
                    mono=True,
                    align="center",
                )

    route = state.get("path_cells", [])
    if len(route) > 1:
        points = []
        for cell in route:
            box = cell_box(cell)
            points.append(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2))
        draw.line(points, fill=COLORS["green"], width=5, joint="curve")
        for point in (points[0], points[-1]):
            draw.ellipse((point[0] - 5, point[1] - 5, point[0] + 5, point[1] + 5), fill=COLORS["green"])

    for cell, text, color in ((GRID_START, "S", COLORS["teal"]), (GRID_GOAL, "G", COLORS["red"])):
        box = cell_box(cell)
        if cell in labels:
            continue
        draw_fitted_text(draw, box, text, size=18, color=color, bold=True, align="center")


def draw_legend(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], items: list[tuple[str, str]]) -> None:
    x1, y1, x2, y2 = box
    swatch = 15
    step = (x2 - x1) / max(len(items), 1)
    for index, (label, tone) in enumerate(items):
        fill, accent = tone_colors(tone)
        left = x1 + index * step
        draw.rounded_rectangle((left, y1 + 4, left + swatch, y1 + 4 + swatch), radius=3, fill=fill, outline=accent, width=2)
        draw_fitted_text(draw, (left + swatch + 7, y1, left + step - 6, y2), label, size=14, color=COLORS["muted"])


# --------------------------------------------------------------------------
# node-link world
# --------------------------------------------------------------------------

NODE_RADIUS = 34


def draw_graph(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    positions = spec["positions"]
    highlight_edges = dict(state.get("edge_tone", {}))
    edge_labels = state.get("edge_labels", {})
    node_tone = state.get("node_tone", {})
    node_sub = state.get("node_sub", {})

    for (u, v), cost in spec["edges"].items():
        tone = highlight_edges.get((u, v), "neutral")
        fill, accent = tone_colors(tone)
        colour = COLORS["line"] if tone == "neutral" else accent
        width = 3 if tone == "neutral" else 5
        mid = draw_arrow(
            draw,
            positions[u],
            positions[v],
            fill=colour,
            width=width,
            trim_start=NODE_RADIUS + 3,
            trim_end=NODE_RADIUS + 7,
        )
        label = edge_labels.get((u, v), str(cost))
        label_font = font(19, bold=True, mono=True)
        text_box = draw.textbbox((0, 0), label, font=label_font)
        half_w = (text_box[2] - text_box[0]) / 2 + 9
        half_h = (text_box[3] - text_box[1]) / 2 + 7
        offset = spec.get("label_offsets", {}).get((u, v), (0, 0))
        cx, cy = mid[0] + offset[0], mid[1] + offset[1]
        draw.rounded_rectangle(
            (cx - half_w, cy - half_h, cx + half_w, cy + half_h),
            radius=6,
            fill=COLORS["paper"],
            outline=colour if tone != "neutral" else COLORS["line"],
            width=2,
        )
        draw_fitted_text(
            draw,
            (cx - half_w, cy - half_h, cx + half_w, cy + half_h),
            label,
            size=19,
            color=COLORS["ink"] if tone == "neutral" else accent,
            bold=True,
            mono=True,
            align="center",
        )

    for node, (x, y) in positions.items():
        tone = node_tone.get(node, "neutral")
        fill, accent = tone_colors(tone)
        draw.ellipse(
            (x - NODE_RADIUS, y - NODE_RADIUS, x + NODE_RADIUS, y + NODE_RADIUS),
            fill=fill,
            outline=accent,
            width=4 if tone != "neutral" else 2,
        )
        draw_fitted_text(
            draw,
            (x - NODE_RADIUS, y - NODE_RADIUS, x + NODE_RADIUS, y + NODE_RADIUS - 4),
            str(node),
            size=26,
            color=COLORS["ink"],
            bold=True,
            align="center",
        )
        sub = node_sub.get(node)
        if sub:
            draw.rounded_rectangle(
                (x - NODE_RADIUS - 22, y + NODE_RADIUS + 3, x + NODE_RADIUS + 22, y + NODE_RADIUS + 26),
                radius=5,
                fill=COLORS["paper"],
            )
            draw_fitted_text(
                draw,
                (x - NODE_RADIUS - 24, y + NODE_RADIUS + 3, x + NODE_RADIUS + 24, y + NODE_RADIUS + 26),
                sub,
                size=16,
                min_size=11,
                color=accent if tone != "neutral" else COLORS["muted"],
                bold=True,
                mono=is_ascii(sub),
                align="center",
            )


# --------------------------------------------------------------------------
# frame chrome
# --------------------------------------------------------------------------


def render_frame(spec: dict, state: dict, step: int, total: int) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), COLORS["paper"])
    draw = ImageDraw.Draw(image)

    draw_fitted_text(draw, (58, 26, 760, 54), "A* · 逐帧推导", size=17, color=COLORS["teal"], bold=True)
    draw_fitted_text(draw, (58, 56, 990, 102), spec["title"], size=34, min_size=24, color=COLORS["ink"], bold=True)
    draw.rounded_rectangle((1020, 40, 1142, 84), radius=8, fill=COLORS["soft"])
    draw_fitted_text(
        draw,
        (1020, 40, 1142, 84),
        f"{step} / {total}",
        size=20,
        color=COLORS["muted"],
        bold=True,
        mono=True,
        align="center",
    )

    banner = state.get("rule", spec["rule"])
    fill, accent = tone_colors(state.get("rule_tone", "match"))
    draw.rounded_rectangle((58, 120, 1142, 172), radius=8, fill=fill)
    draw_fitted_text(draw, (76, 120, 1124, 172), banner, size=21, min_size=15, color=accent, bold=True, align="center")

    spec["draw_body"](draw, spec, state)

    draw.line((58, 556, 1142, 556), fill=COLORS["line"], width=2)
    draw_fitted_text(
        draw,
        (58, 568, 1142, 612),
        state["note"],
        size=20,
        min_size=14,
        color=COLORS["muted"],
        align="center",
    )
    return image


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

    Two traps this avoids. Deriving the palette from frames[0] alone drops any
    accent colour that only appears later — a red "this is the wrong answer"
    frame gets remapped to the nearest grey, silently deleting the signal. And
    a purely adaptive palette drops accents that cover only a few dozen pixels
    (a single small glyph), because they never earn a slot on pixel count.
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
    states = spec["states"]
    frames = [render_frame(spec, state, index + 1, len(states)) for index, state in enumerate(states)]
    palette = build_palette(frames)
    quantized = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    durations = [state.get("duration", 1100) for state in states]
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
            for accent in {tone_colors(t)[1] for t in ("valid", "invalid", "waiting", "match", "review")}:
                if rgb(accent) in source:
                    assert rgb(accent) in rendered, (
                        f"{spec['slug']} 第 {index + 1} 帧的强调色 {accent} 被调色板丢弃"
                    )

    return {
        "file": str(output_path.relative_to(ROOT)),
        "frames": len(frames),
        "size": [WIDTH, HEIGHT],
        "bytes": output_path.stat().st_size,
        "rule": spec["rule"],
        "facts": spec["facts"],
    }


# --------------------------------------------------------------------------
# scene 1 — A* 在网格上的扩展过程（LC 1091）
# --------------------------------------------------------------------------


def grid_body(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    draw_grid(draw, state)
    draw_legend(
        draw,
        (58, 528, 415, 550),
        [("已确定", "match"), ("待扩展", "waiting"), ("当前", "valid")],
    )

    panel_left = 448
    if "open_rows" in state:
        draw_table(
            draw,
            (panel_left, 196, 800, 462),
            "优先队列（按 f 升序）",
            ["节点", "g", "h", "f"],
            state["open_rows"],
            widths=[1.5, 1, 1, 1],
            empty_note="队列已空",
        )
    for index, (label, value, tone) in enumerate(state.get("cards", [])):
        top = 196 + index * 92
        draw_status_card(draw, (824, top, 1142, top + 78), label, value, tone=tone)
    if "footer" in state:
        draw_status_card(draw, (panel_left, 474, 800, 550), *state["footer"][:2], tone=state["footer"][2])


def build_grid_expansion() -> dict:
    exact = true_distances()
    result = search(grid_neighbors, GRID_START, GRID_GOAL, chebyshev, key=KEY_ASTAR)
    optimal = search(grid_neighbors, GRID_START, GRID_GOAL, lambda c: 0, key=KEY_DIJKSTRA)

    # ground truth: A* with a consistent heuristic must match Dijkstra's cost
    assert result["cost"] == optimal["cost"] == exact[GRID_START], "A* 未取得最优解"
    assert all(chebyshev(cell) <= exact[cell] for cell in exact), "切比雪夫距离在此网格上不可采纳"
    for cell in exact:
        for neighbour, cost in grid_neighbors(cell):
            assert chebyshev(cell) <= cost + chebyshev(neighbour), "切比雪夫距离不一致"
    assert len(result["expanded"]) < len(optimal["expanded"]), "A* 并未比 Dijkstra 少扩展节点"

    trace = result["trace"]
    # every pop is interesting, but 35 frames makes a 20-second GIF: keep the
    # opening moves, then sample, and always keep the final frame.
    keep = {i for i in range(len(trace)) if i < 6 or i % 3 == 0 or i == len(trace) - 1}
    states = []
    for index, entry in enumerate(trace):
        if index not in keep:
            continue
        current = entry["current"]
        labels = {cell: entry["open_info"][cell][0] + entry["open_info"][cell][1] for cell in entry["open"]}
        labels[current] = entry["f"]
        rows = [
            (
                [f"({n[0]},{n[1]})", str(entry["open_info"][n][0]), str(entry["open_info"][n][1]), str(sum(entry["open_info"][n]))],
                "waiting",
            )
            for n in entry["open"][:6]
        ]
        finished = entry["finished"]
        states.append(
            {
                "current": current,
                "closed": entry["closed"] - {current},
                "open": entry["open"],
                "labels": labels,
                "path": set(result["path"]) if finished else set(),
                "path_cells": result["path"] if finished else [],
                "open_rows": rows,
                "cards": [
                    ("弹出节点", f"({current[0]}, {current[1]})", "valid" if not finished else "match"),
                    ("f = g + h", f"{entry['g']} + {entry['h']} = {entry['f']}", "neutral"),
                    ("已确定 / 已扩展", f"{len(entry['closed'])} 个", "match"),
                ],
                "footer": (
                    "本帧动作",
                    f"松弛 {len(entry['relaxations'])} 个邻居" if not finished else f"到达终点，代价 {entry['g']}",
                    "waiting" if not finished else "match",
                ),
                "note": (
                    f"弹出 f 最小的节点并定型；A* 共扩展 {len(result['expanded'])} 个格子，Dijkstra 需要 {len(optimal['expanded'])} 个。"
                    if finished
                    else f"优先队列按 f = g + h 取最小值；h 把搜索推向右下角，而不是四面均匀铺开。"
                ),
                "duration": 3200 if finished else 620,
            }
        )

    return {
        "slug": "astar-grid-expansion",
        "title": "LC 1091 · A* 在八连通网格上的扩展",
        "rule": "八连通、单位权；h = 切比雪夫距离 max(|dr|, |dc|)，一步至多让 h 下降 1，因此一致",
        "draw_body": grid_body,
        "states": states,
        "facts": {
            "astar_cost": result["cost"],
            "dijkstra_cost": optimal["cost"],
            "true_cost": exact[GRID_START],
            "astar_expanded": len(result["expanded"]),
            "dijkstra_expanded": len(optimal["expanded"]),
        },
    }


# --------------------------------------------------------------------------
# scene 2 — 排序键决定算法：Dijkstra / A* / 贪心最佳优先
# --------------------------------------------------------------------------


def build_algorithm_family() -> dict:
    exact = true_distances()
    runs = [
        ("Dijkstra", "排序键 = g", KEY_DIJKSTRA, lambda c: 0, "match"),
        ("A*", "排序键 = g + h", KEY_ASTAR, chebyshev, "valid"),
        ("贪心最佳优先", "排序键 = h", KEY_GREEDY, chebyshev, "invalid"),
    ]
    outcomes = {}
    for name, _, key, heuristic, _ in runs:
        outcomes[name] = search(grid_neighbors, GRID_START, GRID_GOAL, heuristic, key=key)

    optimal_cost = exact[GRID_START]
    assert outcomes["Dijkstra"]["cost"] == optimal_cost
    assert outcomes["A*"]["cost"] == optimal_cost
    assert outcomes["A*"]["cost"] <= outcomes["贪心最佳优先"]["cost"]
    assert len(outcomes["A*"]["expanded"]) < len(outcomes["Dijkstra"]["expanded"])
    assert len(outcomes["贪心最佳优先"]["expanded"]) < len(outcomes["A*"]["expanded"])

    states = []
    for name, key_text, _, _, tone in runs:
        outcome = outcomes[name]
        expanded = outcome["expanded"]
        optimal_flag = outcome["cost"] == optimal_cost
        for fraction in (0.45, 1.0):
            cut = max(1, round(len(expanded) * fraction))
            shown = set(expanded[:cut])
            done = fraction == 1.0
            states.append(
                {
                    "rule": f"{name}：{key_text}",
                    "rule_tone": tone,
                    "current": expanded[cut - 1],
                    "closed": shown,
                    "open": [],
                    "labels": {},
                    "path": set(outcome["path"]) if done else set(),
                    "path_cells": outcome["path"] if done else [],
                    "cards": [
                        ("排序键", key_text, tone),
                        ("已扩展节点", f"{len(shown)} 个" + ("" if done else " …"), "neutral"),
                        (
                            "路径代价",
                            (f"{outcome['cost']}（最优）" if optimal_flag else f"{outcome['cost']}（次优，最优 {optimal_cost}）") if done else "搜索中",
                            ("match" if optimal_flag else "invalid") if done else "neutral",
                        ),
                    ],
                    "footer": (
                        "结论",
                        {
                            "Dijkstra": "无方向，四面铺开",
                            "A*": "有方向，且仍然最优",
                            "贪心最佳优先": "最快，但不保证最优",
                        }[name],
                        tone,
                    ),
                    "note": {
                        "Dijkstra": "把 h 关掉，A* 就退回 Dijkstra：它按到起点的距离一圈一圈铺开，扩展了最多的格子。",
                        "A*": "加上一致的 h 之后，搜索被推向终点；扩展数下降，但答案仍与 Dijkstra 一致。",
                        "贪心最佳优先": "丢掉 g 只看 h，扩展数最少，但它不再衡量已经走过的代价，答案可能次优。",
                    }[name],
                    "duration": 2600 if done else 1400,
                }
            )

    summary_rows = [
        (
            [name, str(len(outcomes[name]["expanded"])), str(outcomes[name]["cost"]), "是" if outcomes[name]["cost"] == optimal_cost else "否"],
            "match" if outcomes[name]["cost"] == optimal_cost else "invalid",
        )
        for name, _, _, _, _ in runs
    ]
    states.append(
        {
            "rule": "同一张图、同一份代码，只换优先队列的排序键",
            "rule_tone": "review",
            "current": None,
            "closed": set(outcomes["A*"]["expanded"]),
            "open": [],
            "labels": {},
            "path": set(outcomes["A*"]["path"]),
            "path_cells": outcomes["A*"]["path"],
            "open_rows": summary_rows,
            "cards": [
                ("最优代价", str(optimal_cost), "match"),
                ("A* 少扩展", f"{len(outcomes['Dijkstra']['expanded']) - len(outcomes['A*']['expanded'])} 个格子", "valid"),
                ("贪心代价", f"{outcomes['贪心最佳优先']['cost']} > {optimal_cost}", "invalid"),
            ],
            "note": "A* 不是孤立技巧，而是 Dijkstra 上的一个旋钮：关掉 h 是 Dijkstra，关掉 g 是贪心最佳优先。",
            "duration": 4000,
        }
    )
    states[-1]["open_rows"] = summary_rows
    return {
        "slug": "search-family-sort-key",
        "title": "排序键决定算法：Dijkstra / A* / 贪心",
        "rule": "同一张图、同一份代码，只换优先队列的排序键",
        "draw_body": lambda draw, spec, state: family_body(draw, spec, state),
        "states": states,
        "facts": {name: {"expanded": len(outcomes[name]["expanded"]), "cost": outcomes[name]["cost"]} for name in outcomes},
    }


def family_body(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    draw_grid(draw, state)
    draw_legend(draw, (58, 528, 415, 550), [("已扩展", "match"), ("最终路径", "valid")])
    if "open_rows" in state:
        draw_table(
            draw,
            (448, 196, 800, 462),
            "三种排序键的对比",
            ["算法", "扩展", "代价", "最优"],
            state["open_rows"],
            widths=[1.9, 1, 1, 1],
        )
    for index, (label, value, tone) in enumerate(state.get("cards", [])):
        top = 196 + index * 92
        draw_status_card(draw, (824, top, 1142, top + 78), label, value, tone=tone)
    if "footer" in state:
        draw_status_card(draw, (448, 474, 800, 550), *state["footer"][:2], tone=state["footer"][2])


# --------------------------------------------------------------------------
# scene 3 — 用松弛问题构造下界；曼哈顿距离在八连通网格上高估
# --------------------------------------------------------------------------


def build_lower_bound() -> dict:
    exact = true_distances()
    free = sorted(exact)

    chebyshev_ok = [cell for cell in free if chebyshev(cell) <= exact[cell]]
    manhattan_bad = [cell for cell in free if manhattan(cell) > exact[cell]]
    assert len(chebyshev_ok) == len(free), "切比雪夫距离必须处处不高估"
    assert manhattan_bad, "本例应存在曼哈顿距离高估的格子"

    base = {
        "current": None,
        "open": [],
        "path": set(),
    }
    states = [
        {
            **base,
            "closed": set(),
            "labels": {cell: exact[cell] for cell in free},
            "rule": "第一步：真实剩余代价 h*（对每个格子做一次反向 BFS 得到）",
            "rule_tone": "match",
            "cards": [("含义", "格子里的数 = h*", "match"), ("障碍", "必须绕行", "neutral"), ("起点 h*", str(exact[GRID_START]), "match")],
            "note": "h* 是我们要逼近但不能超过的天花板；真正做题时当然算不出它，所以才需要构造下界。",
            "duration": 3000,
        },
        {
            **base,
            "closed": set(),
            "labels": {cell: chebyshev(cell) for cell in free},
            "rule": "第二步：删掉障碍这个约束 → 松弛问题的最优解就是切比雪夫距离",
            "rule_tone": "valid",
            "cards": [("松弛掉", "障碍物", "valid"), ("得到", "max(|dr|, |dc|)", "valid"), ("起点 h", str(chebyshev(GRID_START)), "valid")],
            "note": "原问题的任何合法路径在松弛问题里也合法，所以松弛问题的最优值不可能更大——这就是可采纳性的来源。",
            "duration": 3000,
        },
        {
            **base,
            "closed": set(free),
            "labels": {cell: exact[cell] - chebyshev(cell) for cell in free},
            "rule": "逐格检查 h* − h ≥ 0：切比雪夫距离处处不高估，可采纳 √",
            "rule_tone": "match",
            "cards": [
                ("检查格子", f"{len(free)} 个", "match"),
                ("h > h* 的格子", "0 个", "match"),
                ("结论", "可采纳且一致", "match"),
            ],
            "note": "差值处处非负。一步至多让切比雪夫距离下降 1，等于单步代价，所以它同时也是一致的。",
            "duration": 3400,
        },
        {
            **base,
            "closed": set(),
            "labels": {cell: manhattan(cell) for cell in free},
            "flagged": set(manhattan_bad),
            "rule": "换成曼哈顿距离：斜着走一步能让它下降 2，超过单步代价 1",
            "rule_tone": "invalid",
            "cards": [("换用", "|dr| + |dc|", "invalid"), ("一步下降", "最多 2", "invalid"), ("单步代价", "1", "neutral")],
            "note": "红框是曼哈顿距离已经超过真实剩余代价的格子——它在八连通网格上高估了。",
            "duration": 3000,
        },
        {
            **base,
            "closed": set(),
            "labels": {cell: manhattan(cell) - exact[cell] for cell in manhattan_bad},
            "flagged": set(manhattan_bad),
            "rule": f"高估量 h − h*：{len(manhattan_bad)} 个格子为正，可采纳性被破坏 ×",
            "rule_tone": "invalid",
            "cards": [
                ("高估的格子", f"{len(manhattan_bad)} / {len(free)}", "invalid"),
                ("最大高估量", str(max(manhattan(c) - exact[c] for c in manhattan_bad)), "invalid"),
                ("后果", "可能给出次优解", "invalid"),
            ],
            "note": "估计得更准和估计得更大是两回事。任何让 h 越过 h* 的改动，都会直接毁掉最优性保证。",
            "duration": 4000,
        },
    ]
    return {
        "slug": "heuristic-lower-bound",
        "title": "用松弛问题构造 h：可采纳意味着不高估",
        "rule": "删掉一部分约束得到松弛问题，它的最优代价就是一个可采纳的下界",
        "draw_body": lower_bound_body,
        "states": states,
        "facts": {
            "free_cells": len(free),
            "manhattan_overestimates": len(manhattan_bad),
            "max_overestimate": max(manhattan(c) - exact[c] for c in manhattan_bad),
        },
    }


def lower_bound_body(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    draw_grid(draw, state)
    draw_legend(draw, (58, 528, 415, 550), [("自由格", "neutral"), ("高估", "invalid")])
    for index, (label, value, tone) in enumerate(state.get("cards", [])):
        top = 200 + index * 108
        draw_status_card(draw, (460, top, 1142, top + 94), label, value, tone=tone)


# --------------------------------------------------------------------------
# scene 4 — 势函数重加权：A* 就是重加权后的 Dijkstra
# --------------------------------------------------------------------------

REWEIGHT_EDGES = {
    ("S", "A"): 7,
    ("S", "B"): 3,
    ("B", "A"): 2,
    ("B", "C"): 5,
    ("C", "G"): 4,
    ("A", "G"): 6,
}
REWEIGHT_H = {"S": 9, "A": 4, "B": 6, "C": 3, "G": 0}
REWEIGHT_POS = {"S": (150, 372), "A": (372, 246), "B": (372, 498), "C": (566, 498), "G": (688, 372)}


def graph_neighbors(edges):
    adjacency: dict = {}
    for (u, v), cost in edges.items():
        adjacency.setdefault(u, []).append((v, cost))
        adjacency.setdefault(v, [])
    return lambda node: adjacency.get(node, [])


def exact_remaining(edges, goal) -> dict:
    """h* for every node, by Dijkstra on the reversed graph."""
    reverse: dict = {}
    for (u, v), cost in edges.items():
        reverse.setdefault(v, []).append((u, cost))
        reverse.setdefault(u, [])
    dist = {goal: 0}
    heap = [(0, goal)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, INF):
            continue
        for previous, cost in reverse.get(node, []):
            if d + cost < dist.get(previous, INF):
                dist[previous] = d + cost
                heapq.heappush(heap, (d + cost, previous))
    return dist


def build_reweighting() -> dict:
    edges = REWEIGHT_EDGES
    h = REWEIGHT_H
    exact = exact_remaining(edges, "G")

    for node, value in h.items():
        assert value <= exact[node], f"h({node}) 高估了"
    assert h["G"] == 0

    reweighted = {(u, v): cost - h[u] + h[v] for (u, v), cost in edges.items()}
    for (u, v), value in reweighted.items():
        assert value >= 0, f"重加权后 {u}->{v} 为负，h 不一致"

    astar = search(graph_neighbors(edges), "S", "G", lambda n: h[n], key=KEY_ASTAR, node_order=lambda n: n)
    dijkstra_reweighted = search(
        graph_neighbors(reweighted), "S", "G", lambda n: 0, key=KEY_DIJKSTRA, node_order=lambda n: n
    )
    # the whole point: identical pop order, and f - h(s) == g'
    assert astar["expanded"] == dijkstra_reweighted["expanded"], "两者扩展顺序不一致"
    assert astar["path"] == dijkstra_reweighted["path"]
    assert astar["cost"] == exact["S"]
    for node in dijkstra_reweighted["g"]:
        assert astar["g"][node] + h[node] - h["S"] == dijkstra_reweighted["g"][node]

    order_text = " → ".join(astar["expanded"])

    states = [
        {
            "node_sub": {node: f"h={h[node]}" for node in h},
            "node_tone": {"S": "valid", "G": "match"},
            "rows": [([f"{u}→{v}", str(cost), str(h[u]), str(h[v]), "?"], "neutral") for (u, v), cost in edges.items()],
            "rule": "原图：边权 cost(u,v)，节点上标的是启发值 h",
            "rule_tone": "match",
            "note": "先确认 h 可采纳：每个 h 都不超过该点到 G 的真实剩余代价 h*。",
            "duration": 3000,
        },
    ]
    for index, ((u, v), cost) in enumerate(edges.items()):
        value = reweighted[(u, v)]
        states.append(
            {
                "node_sub": {node: f"h={h[node]}" for node in h},
                "node_tone": {u: "valid", v: "waiting"},
                "edge_tone": {(u, v): "valid"},
                "edge_labels": {(u, v): f"{cost}→{value}"},
                "rows": [
                    (
                        [f"{a}→{b}", str(c), str(h[a]), str(h[b]), str(reweighted[(a, b)]) if i <= index else "?"],
                        "valid" if i == index else ("neutral" if i > index else "match"),
                    )
                    for i, ((a, b), c) in enumerate(edges.items())
                ],
                "rule": f"cost'({u},{v}) = {cost} − h({u})={h[u]} + h({v})={h[v]} = {value}",
                "rule_tone": "valid",
                "note": "势函数重加权：把 h 从起点扣掉、在终点加回；这正是 Johnson 算法用的同一个变换。",
                "duration": 1500,
            }
        )

    states.append(
        {
            "node_sub": {node: f"h={h[node]}" for node in h},
            "node_tone": {node: "match" for node in h},
            "edge_tone": {edge: "match" for edge in edges},
            "edge_labels": {edge: str(value) for edge, value in reweighted.items()},
            "rows": [([f"{u}→{v}", str(cost), str(h[u]), str(h[v]), str(reweighted[(u, v)])], "match") for (u, v), cost in edges.items()],
            "rule": "六条边重加权后全部 ≥ 0 —— 这正是一致性 h(u) ≤ cost(u,v) + h(v) 的等价写法",
            "rule_tone": "match",
            "note": "一致性不是一条要背的定义，它就是「重加权之后边权仍然非负」。",
            "duration": 3400,
        }
    )
    states.append(
        {
            "node_sub": {node: f"g={astar['g'].get(node, '-')}" for node in h},
            "node_tone": {node: "match" for node in astar["path"]},
            "edge_tone": {(a, b): "match" for a, b in zip(astar["path"], astar["path"][1:])},
            "edge_labels": {edge: str(value) for edge, value in reweighted.items()},
            "rows": [
                ([node, str(astar["g"][node]), str(h[node]), str(astar["g"][node] + h[node]), str(dijkstra_reweighted["g"][node])], "match")
                for node in astar["expanded"]
            ],
            "headers": ["节点", "g", "h", "f", "g'"],
            "rule": f"A* 在原图的扩展顺序 = Dijkstra 在新图的扩展顺序：{order_text}",
            "rule_tone": "review",
            "note": f"因为 g'(v) = f(v) − h(S)，两者只差一个常数。最优路径 {' → '.join(astar['path'])}，代价 {astar['cost']}。",
            "duration": 4200,
        }
    )

    return {
        "slug": "potential-reweighting",
        "positions": REWEIGHT_POS,
        "edges": edges,
        "label_offsets": {("S", "A"): (0, -4), ("S", "B"): (0, 4)},
        "title": "A* 就是重加权之后的 Dijkstra",
        "rule": "cost'(u,v) = cost(u,v) − h(u) + h(v)：一致等价于所有 cost' ≥ 0",
        "draw_body": reweight_body,
        "states": states,
        "facts": {
            "reweighted": {f"{u}->{v}": value for (u, v), value in reweighted.items()},
            "astar_order": astar["expanded"],
            "reweighted_dijkstra_order": dijkstra_reweighted["expanded"],
            "optimal_path": astar["path"],
            "optimal_cost": astar["cost"],
        },
    }


def reweight_body(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    draw_graph(draw, spec, state)
    draw_table(
        draw,
        (762, 196, 1142, 546),
        "重加权明细",
        state.get("headers", ["边", "cost", "h(u)", "h(v)", "cost'"]),
        state["rows"],
        widths=[1.5, 1, 1, 1, 1.1],
    )


# --------------------------------------------------------------------------
# scene 5 — 可采纳但不一致：closed 集合锁死次优解
# --------------------------------------------------------------------------

COUNTER_EDGES = {("S", "A"): 3, ("S", "B"): 1, ("B", "A"): 1, ("A", "G"): 2}
COUNTER_H = {"S": 0, "A": 0, "B": 3, "G": 0}
COUNTER_POS = {"S": (168, 372), "A": (416, 244), "B": (416, 500), "G": (664, 372)}


def build_counterexample() -> dict:
    edges = COUNTER_EDGES
    h = COUNTER_H
    exact = exact_remaining(edges, "G")

    # the heuristic is admissible …
    for node, value in h.items():
        assert value <= exact[node], f"h({node})={value} 超过了 h*={exact[node]}"
    # … but inconsistent exactly on edge (B, A)
    violations = [(u, v) for (u, v), cost in edges.items() if h[u] > cost + h[v]]
    assert violations == [("B", "A")], f"预期只有 (B,A) 违反一致性，实际 {violations}"

    reweighted = {(u, v): cost - h[u] + h[v] for (u, v), cost in edges.items()}
    assert reweighted[("B", "A")] == -2

    broken = search(graph_neighbors(edges), "S", "G", lambda n: h[n], key=KEY_ASTAR, node_order=lambda n: n)
    fixed = search(graph_neighbors(edges), "S", "G", lambda n: h[n], key=KEY_ASTAR, reopen=True, node_order=lambda n: n)
    truth = search(graph_neighbors(edges), "S", "G", lambda n: 0, key=KEY_DIJKSTRA, node_order=lambda n: n)

    assert truth["cost"] == 4 and truth["path"] == ["S", "B", "A", "G"]
    assert broken["cost"] == 5, f"反例未复现，A* 得到 {broken['cost']}"
    assert fixed["cost"] == 4, "允许 reopening 后应恢复最优"
    assert fixed["reopened"] == ["A"]
    # the discard must actually happen while expanding B
    discard_events = [(entry["current"], entry["discarded"]) for entry in broken["trace"] if entry["discarded"]]
    assert discard_events and discard_events[0][0] == "B" and discard_events[0][1][0][0] == "A"

    def heap_rows(entry, extra=None):
        rows = [([node, str(entry["open_info"][node][0]), str(entry["open_info"][node][1]), str(sum(entry["open_info"][node]))], "waiting") for node in entry["open"]]
        return rows + (extra or [])

    states = [
        {
            "node_sub": {node: f"h={h[node]}" for node in h},
            "node_tone": {"S": "valid", "G": "match"},
            "rows": [([node, str(h[node]), str(exact[node]), "√"], "match") for node in ("S", "A", "B", "G")],
            "headers": ["节点", "h", "h*", "不高估"],
            "rule": "这个 h 每一项都不超过 h*，因此它是可采纳的",
            "rule_tone": "match",
            "note": "很多资料到这里就停了——但带 closed 集合的图搜索需要的其实是更强的一致性。",
            "duration": 3200,
        },
        {
            "node_sub": {node: f"h={h[node]}" for node in h},
            "node_tone": {"B": "invalid", "A": "waiting"},
            "edge_tone": {("B", "A"): "invalid"},
            "rows": [
                ([f"{u}→{v}", str(cost), f"{h[u]}≤{cost}+{h[v]}", "√" if h[u] <= cost + h[v] else "×"], "invalid" if (u, v) in violations else "neutral")
                for (u, v), cost in edges.items()
            ],
            "headers": ["边", "cost", "一致性检查", ""],
            "rule": "但在边 (B,A) 上：h(B)=3 > cost=1 + h(A)=0，因此不一致",
            "rule_tone": "invalid",
            "note": f"等价地说，重加权后 cost'(B,A) = 1 − 3 + 0 = {reweighted[('B', 'A')]}，新图里出现了一条负权边。",
            "duration": 3400,
        },
    ]

    narration = {
        "S": ("弹出 S", "生成 A(g=3, f=3)、B(g=1, f=4)", "valid", "起点出队；注意 f(A)=3 小于 f(B)=4，因为 h(B) 被高估到了 3。"),
        "A": ("弹出 A", "g(A) 定型为 3，加入 closed", "waiting", "A 第一次被弹出时 g=3，但真正的最短是经 B 的 g=2——此刻算法还不知道。"),
        "B": ("弹出 B", "经 B 到 A 只要 g=2，却被 closed 拦下", "invalid", "这就是出错的一瞬间：更优的 g 被 closed 集合直接丢弃，无法回头。"),
        "G": ("弹出 G", "返回 5", "invalid", "终点出队，算法返回 5；而真正的最优是 S→B→A→G，代价 4。"),
    }
    for entry in broken["trace"]:
        node = entry["current"]
        label, action, tone, note = narration[node]
        extra = []
        if entry["discarded"]:
            target, better, kept = entry["discarded"][0]
            extra = [([f"{target}(丢弃)", str(better), str(h[target]), f"已定型{kept}"], "invalid")]
        states.append(
            {
                "node_sub": {n: (f"g={broken['g'][n]}" if n in broken["g"] else "—") for n in h},
                "node_tone": {
                    **{n: "match" for n in entry["closed"] if n != node},
                    **{n: "waiting" for n in entry["open"]},
                    node: tone,
                },
                "edge_tone": {("B", "A"): "invalid"} if entry["discarded"] else {},
                "rows": heap_rows(entry, extra),
                "headers": ["优先队列", "g", "h", "f"],
                "rule": f"{label}（f={entry['f']}）：{action}",
                "rule_tone": tone,
                "note": note,
                "duration": 3000 if entry["discarded"] else 2200,
            }
        )

    states.append(
        {
            "node_sub": {n: f"g={broken['g'][n]}" for n in broken["g"]},
            "node_tone": {n: "invalid" for n in broken["path"]},
            "edge_tone": {(a, b): "invalid" for a, b in zip(broken["path"], broken["path"][1:])},
            "rows": [
                (["带 closed", " → ".join(broken["path"]), str(broken["cost"]), "×"], "invalid"),
                (["真实最优", " → ".join(truth["path"]), str(truth["cost"]), "√"], "match"),
                (["reopening", " → ".join(fixed["path"]), str(fixed["cost"]), "√"], "match"),
            ],
            "headers": ["做法", "路径", "代价", ""],
            "widths": [1.3, 2.1, 0.8, 0.6],
            "rule": f"A* 返回 {broken['cost']}，最优是 {truth['cost']} —— 可采纳但不一致，closed 集合锁死了次优解",
            "rule_tone": "invalid",
            "note": "两种修法：换一个一致的 h（首选），或允许 reopening 把 A 重新放回队列，代价是可能反复扩展。",
            "duration": 4600,
        }
    )

    return {
        "slug": "inconsistent-heuristic-counterexample",
        "positions": COUNTER_POS,
        "edges": edges,
        "label_offsets": {},
        "title": "可采纳但不一致：closed 集合锁死次优解",
        "rule": "S→A=3, S→B=1, B→A=1, A→G=2；h(S)=0, h(A)=0, h(B)=3, h(G)=0",
        "draw_body": counterexample_body,
        "states": states,
        "facts": {
            "admissible": True,
            "inconsistent_edges": [f"{u}->{v}" for u, v in violations],
            "reweighted_BA": reweighted[("B", "A")],
            "astar_cost": broken["cost"],
            "optimal_cost": truth["cost"],
            "astar_path": broken["path"],
            "optimal_path": truth["path"],
            "reopen_cost": fixed["cost"],
            "reopened": fixed["reopened"],
        },
    }


def counterexample_body(draw: ImageDraw.ImageDraw, spec: dict, state: dict) -> None:
    draw_graph(draw, spec, state)
    draw_table(
        draw,
        (762, 196, 1142, 546),
        "状态",
        state.get("headers", ["", "", "", ""]),
        state["rows"],
        widths=state.get("widths", [1.7, 1, 1, 1]),
        empty_note="队列已空",
    )


# --------------------------------------------------------------------------


BUILDERS = [
    build_grid_expansion,
    build_algorithm_family,
    build_lower_bound,
    build_reweighting,
    build_counterexample,
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = [save_gif(builder()) for builder in BUILDERS]
    (QA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
