import { describe, expect, it } from "vitest";
import { formatIntervals, intervalsFor, lisbonWeekday } from "@/domain/hours";

describe("lisbonWeekday", () => {
  it("usa o fuso de Lisboa e não o UTC", () => {
    // Domingo 23:30 UTC já é segunda-feira em Lisboa (UTC+1 em horário de verão)
    expect(lisbonWeekday(new Date("2026-10-18T23:30:00Z"))).toBe("mon");
    expect(lisbonWeekday(new Date("2026-10-18T12:00:00Z"))).toBe("sun");
  });

  it("acompanha o fim da hora de verão", () => {
    // Depois de 25/10/2026, Lisboa está em UTC+0
    expect(lisbonWeekday(new Date("2026-11-01T23:30:00Z"))).toBe("sun");
  });
});

describe("intervalsFor", () => {
  const hours = { mon: [["09:00", "12:30"], ["14:00", "17:30"]], sat: [] };

  it("devolve os intervalos do dia", () => {
    expect(intervalsFor(hours, "mon")).toEqual([["09:00", "12:30"], ["14:00", "17:30"]]);
  });

  it("devolve vazio para dias fechados, ausentes ou dados inválidos", () => {
    expect(intervalsFor(hours, "sat")).toEqual([]);
    expect(intervalsFor(hours, "sun")).toEqual([]);
    expect(intervalsFor(null, "mon")).toEqual([]);
    expect(intervalsFor("x", "mon")).toEqual([]);
    expect(intervalsFor({ mon: "09:00" }, "mon")).toEqual([]);
    expect(intervalsFor({ mon: [["09:00"], ["10:00", 11]] }, "mon")).toEqual([]);
  });
});

describe("formatIntervals", () => {
  it("formata os intervalos", () => {
    expect(formatIntervals([["09:00", "12:30"], ["14:00", "17:30"]])).toBe("09:00–12:30 · 14:00–17:30");
  });

  it("devolve null quando está fechado", () => {
    expect(formatIntervals([])).toBeNull();
  });
});
