import { describe, expect, it } from "vitest";
import { dayKind, join, presets, shiftDate, splitDuration, windowMinutes } from "@/domain/lost-window";

describe("shiftDate", () => {
  it("soma e subtrai dias, mudando de mês e ano", () => {
    expect(shiftDate("2026-10-17", -1)).toBe("2026-10-16");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("windowMinutes", () => {
  it("calcula a duração entre os extremos", () => {
    expect(windowMinutes("2026-10-17T09:00", "2026-10-17T12:30")).toBe(210);
    expect(windowMinutes("2026-10-16T20:00", "2026-10-17T08:00")).toBe(720);
  });

  it("é negativa quando os extremos estão trocados e null quando inválida", () => {
    expect(windowMinutes("2026-10-17T12:00", "2026-10-17T09:00")).toBe(-180);
    expect(windowMinutes("", "2026-10-17T09:00")).toBeNull();
  });
});

describe("presets", () => {
  it("cria atalhos relativos a agora, arredondados aos 15 minutos", () => {
    const p = Object.fromEntries(presets("2026-10-17T14:37").map((x) => [x.key, x]));
    expect(p.lastHour).toEqual({ key: "lastHour", from: "2026-10-17T13:30", to: "2026-10-17T14:37" });
    expect(p.last3Hours.from).toBe("2026-10-17T11:30");
    expect(p.today).toEqual({ key: "today", from: "2026-10-17T08:00", to: "2026-10-17T14:37" });
    expect(p.yesterday).toEqual({ key: "yesterday", from: "2026-10-16T08:00", to: "2026-10-16T20:00" });
  });

  it("não oferece 'Hoje' antes das 08:00 e atravessa a meia-noite", () => {
    const list = presets("2026-10-17T00:30");
    expect(list.map((x) => x.key)).toEqual(["lastHour", "last3Hours", "yesterday"]);
    expect(list[0].from).toBe("2026-10-16T23:30");
  });
});

describe("dayKind", () => {
  it("identifica hoje, ontem e outros dias", () => {
    expect(dayKind("2026-10-17", "2026-10-17")).toBe("today");
    expect(dayKind("2026-10-16", "2026-10-17")).toBe("yesterday");
    expect(dayKind("2026-10-10", "2026-10-17")).toBe("other");
  });
});

describe("splitDuration e join", () => {
  it("divide minutos em dias, horas e minutos", () => {
    expect(splitDuration(210)).toEqual({ days: 0, hours: 3, minutes: 30 });
    expect(splitDuration(1500)).toEqual({ days: 1, hours: 1, minutes: 0 });
    expect(splitDuration(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it("junta data e hora", () => {
    expect(join("2026-10-17", "09:05")).toBe("2026-10-17T09:05");
    expect(join("2026-10-17", "")).toBe("2026-10-17T00:00");
  });
});
