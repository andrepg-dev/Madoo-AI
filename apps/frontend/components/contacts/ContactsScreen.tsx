"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  Input,
  Tag,
  type BadgeTone,
} from "@madoo/ui";
import { MOCK_CONTACTS, SEGMENTS } from "@/lib/data";

type ContactStatus = "active" | "unsubscribed" | "bounced";

const STATUS_TONE: Record<ContactStatus, BadgeTone> = {
  active: "success",
  unsubscribed: "neutral",
  bounced: "danger",
};

export function ContactsScreen() {
  const [activeSegment, setActiveSegment] = useState("All contacts");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = MOCK_CONTACTS.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <aside
        style={{
          width: 240,
          borderRight: "1px solid var(--border)",
          padding: "20px 14px",
          background: "var(--surface)",
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px 12px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--ink-faint)" }}>
            SEGMENTS
          </div>
          <IconButton variant="soft" size="sm" aria-label="New segment">
            <Icon name="plus" size={12} />
          </IconButton>
        </div>
        {SEGMENTS.map((s) => {
          const active = activeSegment === s.name;
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSegment(s.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                borderRadius: 7,
                border: "none",
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-soft)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                fontWeight: active ? 600 : 500,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.accent, flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.count.toLocaleString()}
              </span>
            </button>
          );
        })}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: "var(--accent-soft)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent-deep)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="sparkle" size={12} /> Smart segment
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--accent-deep)",
              opacity: 0.85,
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            Describe a group in plain words and AI builds the filter.
          </div>
          <Button variant="accent" size="sm" style={{ marginTop: 8 }}>
            Try it →
          </Button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            padding: "24px 32px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h1
                className="serif"
                style={{ fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: -0.4 }}
              >
                {activeSegment}
              </h1>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                {SEGMENTS.find((s) => s.name === activeSegment)?.count.toLocaleString()} contacts · updated 2 min ago
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="md">
                Import CSV
              </Button>
              <Button variant="primary" size="md" leftIcon={<Icon name="plus" size={12} />}>
                Add contact
              </Button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts…"
                variant="filled"
                inputSize="sm"
                startAdornment={<Icon name="search" size={13} />}
                aria-label="Search contacts"
              />
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Icon name="sliders" size={12} />}>
              Filter
            </Button>
            {selected.size > 0 && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  color: "var(--ink-soft)",
                }}
              >
                <span>{selected.size} selected</span>
                <Button variant="secondary" size="sm">
                  Add tag
                </Button>
                <Button variant="primary" size="sm">
                  Send campaign →
                </Button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  position: "sticky",
                  top: 0,
                  background: "var(--surface)",
                  zIndex: 1,
                }}
              >
                <th style={{ padding: "10px 16px 10px 32px", textAlign: "left", width: 30 }}>
                  <Checkbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all contacts"
                  />
                </th>
                {["Name", "Tags", "Joined", "Engagement", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink-faint)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid var(--border-soft)",
                    background: selected.has(c.id) ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <td style={{ padding: "12px 16px 12px 32px" }}>
                    <Checkbox
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      aria-label={`Select ${c.name}`}
                    />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{c.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {c.tags.map((tag) => (
                        <Tag key={tag} tone="neutral" size="sm" sans>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>{c.joined}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 60,
                          height: 4,
                          background: "var(--border)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, c.opens * 1.5)}%`,
                            height: "100%",
                            background: c.opens > 30 ? "var(--accent)" : c.opens > 10 ? "#D6B98A" : "#C4B5A0",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-faint)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {c.opens} opens
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge tone={STATUS_TONE[c.status as ContactStatus]} dot>
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
