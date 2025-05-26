"use client";

import { useEffect, useRef, useState } from "react";

type Bar = { t: number; o: number; h: number; l: number; c: number };
type Suggestion = { symbol: string; name: string };

export default function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rawData, setRawData] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewCount, setViewCount] = useState(30);
  const [viewStart, setViewStart] = useState(0);
  const [yDomain, setYDomain] = useState<{ min: number; max: number } | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
    setViewCount(30);
    setViewStart(Math.max(0, bars.length - 30));
    setYDomain(null);
    setCompanyName(meta.longName || meta.shortName || meta.symbol || "");
    setIsLoading(false);
  };

  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/autocomplete?query=${encodeURIComponent(input)}`
      );
      const j = await res.json();
      const list = j.quotes || [];
      setSuggestions(
        list.map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || "",
        }))
      );
      setSelectedIndex(-1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

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

    const pad = {
      top: 20,
      right: labelW + 15,
      bottom: 46,
      left: 20,
    };

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
    canvasRef.current!.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: MouseEvent) => {
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
    canvasRef.current!.style.cursor = "grab";
  };

  useEffect(() => {
    draw();
  }, [rawData, viewStart, viewCount, yDomain]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", draw);
    canvas.style.cursor = "grab";
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", draw);
    };
  }, [rawData, viewStart, viewCount, yDomain]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSuggestions([]);
        loadData(input);
      }}
      className="w-full sm:w-[640px] xl:w-1/2 mb-12"
    >
      <div ref={containerRef} className="mb-6">
        <div className="flex gap-3">
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
      <canvas
        ref={canvasRef}
        className="w-[max(640px,80vw)] h-[max(500px,80vw*0.5)] relative left-1/2 -translate-x-1/2 bg-white rounded-lg shadow"
      />
    </form>
  );
}
