"use client";

import { useEffect, useRef, useState } from "react";

type Bar = { t: number; o: number; h: number; l: number; c: number };

export default function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [input, setInput] = useState("");
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rawData, setRawData] = useState<Bar[]>([]);
  const [viewCount, setViewCount] = useState(30);
  const [viewStart, setViewStart] = useState(0);
  const [yDomain, setYDomain] = useState<{ min: number; max: number } | null>(
    null
  );

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartView = useRef(0);
  const dragStartYDomain = useRef<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });
  const [fetchingOlder, setFetchingOlder] = useState(false);

  const limitDays = 5000;

  const loadData = (symbol: string) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);
    const start = startDate.toISOString().slice(0, 10);
    const end = now.toISOString().slice(0, 10);

    fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${start}/${end}?limit=${limitDays}&apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.results) {
          const bars: Bar[] = j.results.map((b: any) => ({
            t: b.t,
            o: b.o,
            h: b.h,
            l: b.l,
            c: b.c,
          }));
          setRawData(bars);
          setTicker(symbol);
          setViewCount(30);
          setViewStart(Math.max(0, bars.length - 30));
          setYDomain(null);

          fetch(
            `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.results?.name)
                setCompanyName(d.results.name.replace(/ Common Stock$/, ""));
            })
            .catch(() => setCompanyName(""));
        }
      });
  };

  const fetchOlder = () => {
    if (fetchingOlder || rawData.length === 0) return;
    setFetchingOlder(true);
    const oldest = rawData[0].t; // timestamp in ms
    const endDate = new Date(oldest - 24 * 60 * 60 * 1000);
    const startDate = new Date(
      endDate.getTime() - limitDays * 24 * 60 * 60 * 1000
    );
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${start}/${end}?limit=${limitDays}&apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.results) {
          const older: Bar[] = j.results.map((b: any) => ({
            t: b.t,
            o: b.o,
            h: b.h,
            l: b.l,
            c: b.c,
          }));
          setRawData((prev) => [...older, ...prev]);
          setViewStart((vs) => vs + older.length);
        }
      })
      .finally(() => {
        setFetchingOlder(false);
      });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || rawData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width,
      h = rect.height;
    const pad = { top: 20, right: 60, bottom: 30, left: 20 };
    ctx.clearRect(0, 0, w, h);

    const data = rawData.slice(viewStart, viewStart + viewCount);
    const highs = data.map((d) => d.h),
      lows = data.map((d) => d.l);
    const actualMax = Math.max(...highs),
      actualMin = Math.min(...lows);
    const yMin = yDomain?.min ?? actualMin,
      yMax = yDomain?.max ?? actualMax;
    const yScale = (h - pad.top - pad.bottom) / (yMax - yMin);
    const cellW = (w - pad.left - pad.right) / data.length;

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

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#333";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const price = yMax - (i * (yMax - yMin)) / 5;
      const y = pad.top + (i * (h - pad.top - pad.bottom)) / 5;
      ctx.fillText(price.toFixed(2), w - pad.right + 45, y + 4);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor((i * (data.length - 1)) / 4);
      const d = new Date(data[idx].t);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const x = pad.left + idx * cellW + cellW / 2;
      ctx.fillText(label, x, h - pad.bottom + 5);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rightPad = 60;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX < 0) {
        if (viewStart === 0) {
          fetchOlder();
        } else {
          setViewStart((vs) => Math.max(0, vs - 1));
        }
      } else {
        setViewStart((vs) => Math.min(rawData.length - viewCount, vs + 1));
      }
    } else {
      if (x >= rect.width - rightPad) {
        const delta = e.deltaY < 0 ? 0.9 : 1.1;
        const highs = rawData.map((d) => d.h),
          lows = rawData.map((d) => d.l);
        const aMax = Math.max(...highs),
          aMin = Math.min(...lows);
        const curMin = yDomain?.min ?? aMin,
          curMax = yDomain?.max ?? aMax;
        const center = (curMin + curMax) / 2;
        const half = ((curMax - curMin) / 2) * delta;
        setYDomain({ min: center - half, max: center + half });
      } else if (x < rightPad) {
        if (e.deltaY < 0 && viewStart === 0) {
          fetchOlder();
        } else if (e.deltaY < 0) {
          setViewStart((vs) => Math.max(0, vs - 1));
        } else {
          setViewStart((vs) => Math.min(rawData.length - viewCount, vs + 1));
        }
      } else {
        const delta = e.deltaY < 0 ? 0.9 : 1.1;
        if (e.deltaY < 0) {
          setViewCount((vc) => Math.min(rawData.length, vc + 1));
          setViewStart((vs) => Math.max(0, vs - 1));
        } else {
          setViewCount((vc) => Math.max(5, vc - 1));
          setViewStart((vs) => Math.min(rawData.length - viewCount, vs + 1));
        }
      }
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartView.current = viewStart;
    const highs = rawData.map((d) => d.h),
      lows = rawData.map((d) => d.l);
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
        loadData(input);
      }}
      className="w-full sm:w-[640px] xl:w-1/2 mb-12"
    >
      <div className="flex gap-4 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && loadData(input)}
          className="flex-1 p-2 border border-gray-300 rounded"
          placeholder="검색할 티커 입력"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-400 hover:bg-green-500 text-white rounded"
        >
          조회
        </button>
      </div>
      {companyName && (
        <div className="text-xl font-semibold mb-4">{companyName}</div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-[500px] bg-white rounded-lg shadow"
      />
    </form>
  );
}
