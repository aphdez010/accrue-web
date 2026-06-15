"use client";
import { useEffect, useState } from "react";
import { useApi } from "../../context/api-context";

export default function FieldworkPage() {
  const { get } = useApi();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const month = new Date().toISOString().slice(0,7);

  useEffect(() => {
    get("/fieldwork?month=" + month)
      .then(r => {
        const list = r?.entries ?? r ?? [];
        setEntries(list);
        setTotal(list.reduce((s, e) => s + Number(e.hours), 0));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: "var(--display)", color: "var(--ink)" }}>Fieldwork</h1>
      <p style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>{entries.length} entries - {total.toFixed(1)} hrs</p>
    </div>
  );
}
