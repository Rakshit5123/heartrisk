"use client";
import { useEffect, useState } from "react";
import LandingView from "../components/LandingView";
import { getMetrics } from "../lib/api";

export default function Home() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { getMetrics().then(setMetrics).catch(() => {}); }, []);  // the page still works if the API is down
  return <LandingView metrics={metrics} />;
}
