"use client";
import { useState } from "react";
import { useApi } from "../../context/api-context";

export default function FieldworkPage() {
  const { get, post } = useApi();
  const [hours, setHours] = useState("");
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: "var(--display)", color: "var(--ink)" }}>Fieldwork</h1>
      <p style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>Loading...</p>
    </div>
  );
}
