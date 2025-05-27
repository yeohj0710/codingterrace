"use client";

import { useEffect, useRef, useState } from "react";

type Bar = { t: number; o: number; h: number; l: number; c: number };
type Suggestion = { symbol: string; name: string };
type Anchor = { idx: number; y: number };
type ExtendedLine = { start: Anchor; end: Anchor };

export default function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("AAPL");
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rawData, setRawData] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewCount, setViewCount] = useState(30);
  const [viewStart, setViewStart] = useState(0);
  const [yDomain, setYDomain] = useState<{ min: number; max: number } | null>(
    null
  );
  const [tempAnchor, setTempAnchor] = useState<Anchor | null>(null);
  const [extendedLines, setExtendedLines] = useState<ExtendedLine[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(
    null
  );
  const [draggingLineIndex, setDraggingLineIndex] = useState<number | null>(
    null
  );
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const lineDragStartMouse = useRef<{ x: number; y: number } | null>(null);
  const lineOriginal = useRef<ExtendedLine | null>(null);

  const handleLineMouseDown = (e: MouseEvent) => {
    if (
      selectedLineIndex == null ||
      canvasRef.current!.style.cursor !== "pointer"
    )
      return;
    setDraggingLineIndex(selectedLineIndex);
    lineDragStartMouse.current = { x: e.clientX, y: e.clientY };
    lineOriginal.current = extendedLines[selectedLineIndex];
  };

  const handleLineMouseMove = (e: MouseEvent) => {
    if (draggingLineIndex == null) return;
    const start = lineDragStartMouse.current;
    const orig = lineOriginal.current;
    if (!start || !orig) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pad = { top: 20, right: 60, bottom: 46, left: 20 };

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    const plotW = rect.width - pad.left - pad.right;
    const pxToBar = viewCount / plotW;
    const dIdx = dx * pxToBar;

    const plotH = rect.height - pad.top - pad.bottom;
    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h),
      lows = data.map((d) => d.l);
    const aMax = Math.max(...highs),
      aMin = Math.min(...lows);
    const yMin = yDomain?.min ?? aMin,
      yMax = yDomain?.max ?? aMax;
    const pxToPr = (yMax - yMin) / plotH;
    const dPrice = dy * pxToPr;

    setExtendedLines((lines) =>
      lines.map((ln, i) =>
        i === draggingLineIndex
          ? {
              start: { idx: orig.start.idx + dIdx, y: orig.start.y - dPrice },
              end: { idx: orig.end.idx + dIdx, y: orig.end.y - dPrice },
            }
          : ln
      )
    );
  };

  const handleLineMouseUp = () => {
    setDraggingLineIndex(null);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tempAnchor) {
        setTempAnchor(null);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [tempAnchor]);

  const handleMouseHover = (e: MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    mousePosRef.current = pos;
    let onLine = false;
    const pad = { top: 20, right: 60, bottom: 46, left: 20 };
    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h),
      lows = data.map((d) => d.l);
    const actualMax = Math.max(...highs),
      actualMin = Math.min(...lows);
    const yMin = yDomain?.min ?? actualMin;
    const yMax = yDomain?.max ?? actualMax;
    if (pos) {
      extendedLines.forEach((line) => {
        const cellW = (rect.width - pad.left - pad.right) / viewCount;
        const x1 = pad.left + (line.start.idx - viewStart) * cellW + cellW / 2;
        const y1 =
          pad.top +
          (yMax - line.start.y) *
            ((rect.height - pad.top - pad.bottom) / (yMax - yMin));
        const x2 = pad.left + (line.end.idx - viewStart) * cellW + cellW / 2;
        const y2 =
          pad.top +
          (yMax - line.end.y) *
            ((rect.height - pad.top - pad.bottom) / (yMax - yMin));
        const dist =
          Math.abs((y2 - y1) * pos.x - (x2 - x1) * pos.y + x2 * y1 - y2 * x1) /
          Math.hypot(y2 - y1, x2 - x1);
        if (dist < 5) onLine = true;
      });
    }
    canvas.style.cursor = onLine ? "pointer" : "default";
    draw();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = suggestions[selectedIndex] || null;
      if (sel) {
        setInput(sel.symbol);
        setSuggestions([]);
        loadData(sel.symbol);
      } else {
        setSuggestions([]);
        loadData(input);
      }
    }
  };

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartView = useRef(0);
  const dragStartYDomain = useRef<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });
  const [fetchingOlder, setFetchingOlder] = useState(false);

  const panStep = 5;
  const zoomFactor = 0.9;
  const toEpoch = (d: Date) => Math.floor(d.getTime() / 1000);

  const loadData = async (symbol: string) => {
    if (!symbol.trim()) return;
    setIsLoading(true);

    const now = new Date();
    const period1 = 0;
    const period2 = toEpoch(now);

    const res = await fetch(
      `/api/yahoo?symbol=${symbol}&period1=${period1}&period2=${period2}&interval=1d`
    );
    const j = await res.json();
    const result = j.chart?.result?.[0];
    if (!result || !result.timestamp?.length) {
      alert("검색 결과가 없습니다.");
      setIsLoading(false);
      return;
    }

    const { timestamp, indicators, meta } = result;
    const quote = indicators.quote[0];
    const bars: Bar[] = timestamp
      .map((t: number, i: number) => ({
        t: t * 1000,
        o: quote.open[i],
        h: quote.high[i],
        l: quote.low[i],
        c: quote.close[i],
      }))
      .filter(
        (b: any) => b.o != null && b.h != null && b.l != null && b.c != null
      );

    setRawData(bars);
    setTicker(symbol);
    const YEAR_COUNT = 251;
    const count = Math.min(bars.length, YEAR_COUNT);
    setViewCount(count);
    setViewStart(Math.max(0, bars.length - count));
    setYDomain(null);
    setCompanyName(meta.longName || meta.shortName || meta.symbol || "");
    setIsLoading(false);
  };

  useEffect(() => {
    loadData("AAPL");
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOlder = async () => {
    if (fetchingOlder || !rawData.length) return;
    setFetchingOlder(true);

    const oldestMs = rawData[0].t;
    const endSec = Math.floor(oldestMs / 1000) - 86400;

    const res = await fetch(
      `/api/yahoo?symbol=${ticker}&period1=0&period2=${endSec}&interval=1d`
    );
    const j = await res.json();
    const result = j.chart?.result?.[0];
    if (result?.timestamp) {
      const { timestamp, indicators } = result;
      const quote = indicators.quote[0];
      const older: Bar[] = timestamp
        .map((t: number, i: number) => ({
          t: t * 1000,
          o: quote.open[i],
          h: quote.high[i],
          l: quote.low[i],
          c: quote.close[i],
        }))
        .filter(
          (b: any) => b.o != null && b.h != null && b.l != null && b.c != null
        );
      setRawData((prev) => [...older, ...prev]);
      setViewStart((vs) => vs + older.length);
    }

    setFetchingOlder(false);
  };

  const handleCanvasClick = (e: MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pad = { top: 20, right: 60, bottom: 46, left: 20 };
    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h),
      lows = data.map((d) => d.l);
    const actualMax = Math.max(...highs),
      actualMin = Math.min(...lows);
    const yMin = yDomain?.min ?? actualMin;
    const yMax = yDomain?.max ?? actualMax;
    const hitIndex = extendedLines.findIndex((line) => {
      const cellW = (rect.width - pad.left - pad.right) / viewCount;
      const x1 = pad.left + (line.start.idx - viewStart) * cellW + cellW / 2;
      const y1 =
        pad.top +
        (yMax - line.start.y) *
          ((rect.height - pad.top - pad.bottom) / (yMax - yMin));
      const x2 = pad.left + (line.end.idx - viewStart) * cellW + cellW / 2;
      const y2 =
        pad.top +
        (yMax - line.end.y) *
          ((rect.height - pad.top - pad.bottom) / (yMax - yMin));
      const dist =
        Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
        Math.hypot(y2 - y1, x2 - x1);
      return dist < 5;
    });
    if (hitIndex === selectedLineIndex) {
      setSelectedLineIndex(null);
      return;
    }
    if (hitIndex < 0 && selectedLineIndex != null) {
      setSelectedLineIndex(null);
      return;
    }
    if (hitIndex >= 0) {
      setSelectedLineIndex(hitIndex);
      return;
    }
    if (!e.shiftKey) return;
    const xClick = e.clientX - rect.left;
    const yClick = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const yScale = (h - pad.top - pad.bottom) / (yMax - yMin);
    const cellW = (w - pad.left - pad.right) / data.length;
    const mouseX = xClick;
    const rel = xClick - pad.left;
    const raw = rel / cellW - 0.5;
    const idxInView = Math.min(data.length - 1, Math.max(0, Math.round(raw)));
    const bar = data[idxInView];
    const priceAtClick = yMax - (yClick - pad.top) / yScale;
    const yVal = priceAtClick > (bar.h + bar.l) / 2 ? bar.h : bar.l;
    const globalIdx = viewStart + idxInView;
    const anchor = { idx: globalIdx, y: yVal };
    if (!tempAnchor) {
      setTempAnchor(anchor);
    } else {
      setExtendedLines((lines) => [
        ...lines,
        { start: tempAnchor, end: anchor },
      ]);
      setTempAnchor(null);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !rawData.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h);
    const lows = data.map((d) => d.l);
    const actualMax = Math.max(...highs);
    const actualMin = Math.min(...lows);
    const yMin = yDomain?.min ?? actualMin;
    const yMax = yDomain?.max ?? actualMax;
    ctx.font = "12px sans-serif";
    const yLabels = Array.from({ length: 6 }, (_, i) => {
      const v = yMax - (i * (yMax - yMin)) / 5;
      return v.toFixed(2);
    });
    const labelW = Math.max(...yLabels.map((t) => ctx.measureText(t).width));
    const pad = { top: 20, right: labelW + 15, bottom: 46, left: 20 };
    const yScale = (h - pad.top - pad.bottom) / (yMax - yMin);
    const cellW = (w - pad.left - pad.right) / data.length;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i * (h - pad.top - pad.bottom)) / 5;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
    }
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      pad.left,
      pad.top,
      w - pad.left - pad.right,
      h - pad.top - pad.bottom
    );
    ctx.clip();
    data.forEach((d, i) => {
      const x = pad.left + i * cellW + cellW / 2;
      const openY = pad.top + (yMax - d.o) * yScale;
      const closeY = pad.top + (yMax - d.c) * yScale;
      const highY = pad.top + (yMax - d.h) * yScale;
      const lowY = pad.top + (yMax - d.l) * yScale;
      const color = d.c >= d.o ? "#4caf50" : "#f44336";
      const bw = cellW * 0.6;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(
        x - bw / 2,
        Math.min(openY, closeY),
        bw,
        Math.max(1, Math.abs(closeY - openY))
      );
    });
    extendedLines.forEach((line, i) => {
      const x1 = pad.left + (line.start.idx - viewStart) * cellW + cellW / 2;
      const y1 = pad.top + (yMax - line.start.y) * yScale;
      const x2 = pad.left + (line.end.idx - viewStart) * cellW + cellW / 2;
      const y2 = pad.top + (yMax - line.end.y) * yScale;
      const slope = (y2 - y1) / (x2 - x1);
      const startX = pad.left;
      const endX = w - pad.right;
      const startY = y1 + slope * (startX - x1);
      const endY = y1 + slope * (endX - x1);
      ctx.strokeStyle = i === selectedLineIndex ? "#0033cc" : "#2196f3";
      ctx.lineWidth = i === selectedLineIndex ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
    if (tempAnchor && mousePosRef.current) {
      const ax = pad.left + (tempAnchor.idx - viewStart) * cellW + cellW / 2;
      const ay = pad.top + (yMax - tempAnchor.y) * yScale;
      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;
      const slope = (my - ay) / (mx - ax);
      const sx = pad.left;
      const ex = w - pad.right;
      const sy = ay + slope * (sx - ax);
      const ey = ay + slope * (ex - ax);
      ctx.strokeStyle = "#2196f3";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.moveTo(w - pad.right, pad.top);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const labelX = w - pad.right + 5;
    for (let i = 0; i <= 5; i++) {
      const v = yMax - (i * (yMax - yMin)) / 5;
      const y = pad.top + (i * (h - pad.top - pad.bottom)) / 5;
      ctx.fillText(v.toFixed(2), labelX, y);
    }
    ctx.textAlign = "center";
    data.forEach((d, idx) => {
      const step = Math.max(1, Math.floor(data.length / 5));
      if (idx % step !== 0 && idx !== data.length - 1) return;
      const date = new Date(d.t);
      const x = pad.left + idx * cellW + cellW / 2;
      ctx.textBaseline = "top";
      ctx.fillText(
        `${date.getMonth() + 1}/${date.getDate()}`,
        x,
        h - pad.bottom + 2
      );
      ctx.fillText(`${date.getFullYear()}`, x, h - pad.bottom + 18);
    });
    if (mousePosRef.current) {
      const { x, y } = mousePosRef.current;
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const yAxisPad = 60;
    const step = 5;
    const minCnt = 5;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX < 0) {
        if (viewStart === 0) fetchOlder();
        else setViewStart((vs) => Math.max(0, vs - step));
      } else {
        setViewStart((vs) => Math.min(rawData.length - viewCount, vs + step));
      }
      return;
    }

    if (x >= rect.width - yAxisPad) {
      const data = rawData.slice(viewStart, viewStart + viewCount);
      const highs = data.map((d) => d.h),
        lows = data.map((d) => d.l);
      const aMax = Math.max(...highs),
        aMin = Math.min(...lows);
      const curMin = yDomain?.min ?? aMin;
      const curMax = yDomain?.max ?? aMax;
      const center = (curMin + curMax) / 2;
      const f = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
      const half = ((curMax - curMin) / 2) * f;
      setYDomain({ min: center - half, max: center + half });
      return;
    }

    if (e.deltaY < 0) {
      if (viewStart === 0) fetchOlder();
      else setViewStart((vs) => Math.max(0, vs - step));
      setViewCount((vc) => Math.min(rawData.length, vc + step));
    } else {
      if (viewCount > minCnt) {
        setViewStart((vs) => Math.min(rawData.length - minCnt, vs + step));
        setViewCount((vc) => Math.max(minCnt, vc - step));
      }
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartView.current = viewStart;
    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h),
      lows = data.map((d) => d.l);
    const aMax = Math.max(...highs),
      aMin = Math.min(...lows);
    dragStartYDomain.current = yDomain
      ? { ...yDomain }
      : { min: aMin, max: aMax };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingLineIndex !== null) return;
    if (!isDragging.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width,
      h = rect.height;
    const pad = { top: 20, right: 60, bottom: 30, left: 20 };
    const cellW = (w - pad.left - pad.right) / viewCount;
    const dx = e.clientX - dragStartX.current;
    const dBars = Math.round(-dx / cellW);
    const maxStart = rawData.length - viewCount;
    setViewStart(
      Math.min(Math.max(0, dragStartView.current + dBars), maxStart)
    );
    const dy = e.clientY - dragStartY.current;
    const yRange = dragStartYDomain.current.max - dragStartYDomain.current.min;
    const pricePerPx = yRange / (h - pad.top - pad.bottom);
    const offset = dy * pricePerPx;
    setYDomain({
      min: dragStartYDomain.current.min + offset,
      max: dragStartYDomain.current.max + offset,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    draw();
  }, [rawData, viewStart, viewCount, yDomain, extendedLines, tempAnchor]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseHover);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", draw);
    const handleKey = (e: KeyboardEvent) => {
      if (selectedLineIndex == null) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        setExtendedLines((lines) =>
          lines.filter((_, i) => i !== selectedLineIndex)
        );
        setSelectedLineIndex(null);
      }
      if (e.key === "c" && e.ctrlKey) {
        const L = extendedLines[selectedLineIndex]!;
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const pad = { top: 20, bottom: 46 };
        const plotH = rect.height - pad.top - pad.bottom;
        const data = rawData.slice(viewStart, viewStart + viewCount);
        const highs = data.map((d) => d.h),
          lows = data.map((d) => d.l);
        const aMax = Math.max(...highs),
          aMin = Math.min(...lows);
        const curMin = yDomain?.min ?? aMin,
          curMax = yDomain?.max ?? aMax;
        const priceRange = curMax - curMin;
        const offset = priceRange * 0.1;
        setExtendedLines((lines) => [
          ...lines,
          {
            start: { idx: L.start.idx, y: L.start.y + offset },
            end: { idx: L.end.idx, y: L.end.y + offset },
          },
        ]);
      }
    };
    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("mousedown", handleLineMouseDown);
    window.addEventListener("mousemove", handleLineMouseMove);
    window.addEventListener("mouseup", handleLineMouseUp);
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseHover);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", draw);
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("mousedown", handleLineMouseDown);
      window.removeEventListener("mousemove", handleLineMouseMove);
      window.removeEventListener("mouseup", handleLineMouseUp);
    };
  }, [
    rawData,
    viewStart,
    viewCount,
    yDomain,
    extendedLines,
    tempAnchor,
    selectedLineIndex,
    draggingLineIndex,
  ]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSuggestions([]);
        loadData(input);
      }}
      className="w-full sm:w-[640px] xl:w-1/2"
    >
      <div ref={containerRef} className="mb-6">
        <div className="flex gap-3 px-4 sm:px-0">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={onKeyDown}
              className="h-9 w-full p-2 border border-gray-300 rounded-lg"
              placeholder="검색할 티커 입력"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-auto bg-white border border-gray-200 rounded-lg shadow z-10">
                {suggestions.map((s, i) => (
                  <li
                    key={s.symbol}
                    className={`px-3 py-1 cursor-pointer ${
                      i === selectedIndex ? "bg-gray-100" : ""
                    }`}
                    onMouseDown={() => {
                      setInput(s.symbol);
                      setSuggestions([]);
                      loadData(s.symbol);
                    }}
                  >
                    {s.symbol} - {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-16 h-9 px-4 py-2 rounded-lg text-white bg-green-400 flex items-center justify-center ${
              isLoading ? "cursor-not-allowed" : "hover:bg-green-500"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              "조회"
            )}
          </button>
        </div>
      </div>
      {companyName && (
        <div className="text-center text-xl font-semibold mb-4">
          {companyName}
        </div>
      )}
      <div className="px-2 sm:px-0">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-200 w-full h-[50vh] sm:w-[max(640px,80vw)] sm:h-[max(500px,80vw*0.5)] relative left-1/2 -translate-x-1/2 bg-white rounded-lg"
        />
      </div>
    </form>
  );
}
