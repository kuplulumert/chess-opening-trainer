import { useEffect, useState } from "react";

// TEMPORARY on-device diagnostics for the "taps land a square too low"
// bug on iOS, which can't be reproduced in a desktop browser. Toggled by
// tapping the opening name 5 times; persisted so it survives the board's
// remount on every line change. Delete once the bug is understood.
//
// What it shows on every pointerdown:
//   red dot      — where WebKit says the pointer is (clientX/Y)
//   blue outline — layout rect of the square the event *targeted*
//   panel        — the numbers behind both, plus viewport/scroll state
// If the red dot sits under the finger but the blue outline is one square
// below the painted one, painting and layout have drifted apart. If the
// red dot itself is a square below the finger, the coordinates coming out
// of the webview are off.

interface Sample {
  lines: string[];
  point: { x: number; y: number };
  rect: DOMRect | null;
}

function squareOf(el: Element | null): string {
  return el?.closest?.("[data-square]")?.getAttribute("data-square") ?? "-";
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function TouchDebug() {
  const [sample, setSample] = useState<Sample | null>(null);

  useEffect(() => {
    // Resolves env(safe-area-inset-top) to a number we can print.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const targetSquare = target?.closest?.("[data-square]") ?? null;
      const rect = targetSquare?.getBoundingClientRect() ?? null;
      const fromPoint = document.elementFromPoint(e.clientX, e.clientY);
      const board = document.querySelector(".board-wrap")?.getBoundingClientRect() ?? null;
      const tabs = document.querySelector(".view-switcher")?.getBoundingClientRect() ?? null;
      const body = document.body.getBoundingClientRect();
      const vv = window.visualViewport;
      const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0;

      const lines = [
        `target=${squareOf(target)} fromPoint=${squareOf(fromPoint)} type=${e.pointerType}`,
        `client=${r1(e.clientX)},${r1(e.clientY)} page=${r1(e.pageX)},${r1(e.pageY)} screen=${r1(e.screenX)},${r1(e.screenY)}`,
        rect
          ? `sqRect top=${r1(rect.top)} bottom=${r1(rect.bottom)} h=${r1(rect.height)} left=${r1(rect.left)}`
          : "sqRect: (not a square)",
        board
          ? `board top=${r1(board.top)} h=${r1(board.height)} sq=${r1(board.height / 8)}`
          : "board: -",
        `scrollY=${r1(window.scrollY)} bodyTop=${r1(body.top)} tabsTop=${tabs ? r1(tabs.top) : "-"} tabsH=${tabs ? r1(tabs.height) : "-"}`,
        vv
          ? `vv offsetTop=${r1(vv.offsetTop)} pageTop=${r1(vv.pageTop)} scale=${r1(vv.scale)} h=${r1(vv.height)}`
          : "visualViewport: n/a",
        `innerH=${window.innerHeight} clientH=${document.documentElement.clientHeight} outerH=${window.outerHeight} dpr=${window.devicePixelRatio} safeTop=${r1(safeTop)}`,
      ];
      setSample({ lines, point: { x: e.clientX, y: e.clientY }, rect });
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      probe.remove();
    };
  }, []);

  const overlay: React.CSSProperties = { position: "fixed", pointerEvents: "none", zIndex: 9999 };

  return (
    <>
      {sample && (
        <div
          style={{
            ...overlay,
            left: sample.point.x - 5,
            top: sample.point.y - 5,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "red",
            boxShadow: "0 0 0 2px #fff",
          }}
        />
      )}
      {sample?.rect && (
        <div
          style={{
            ...overlay,
            left: sample.rect.left,
            top: sample.rect.top,
            width: sample.rect.width,
            height: sample.rect.height,
            border: "3px solid #2d7dff",
            boxSizing: "border-box",
          }}
        />
      )}
      <div
        style={{
          ...overlay,
          left: 0,
          right: 0,
          bottom: 0,
          padding: "8px 10px max(8px, env(safe-area-inset-bottom))",
          background: "rgba(0, 0, 0, 0.85)",
          color: "#fff",
          font: "11px/1.45 ui-monospace, Menlo, monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {sample ? sample.lines.join("\n") : "touch debug on — tap a square"}
      </div>
    </>
  );
}
