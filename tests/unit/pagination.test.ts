import { describe, expect, it } from "vitest";
import { pageNumbers } from "@/domain/pagination";

describe("pageNumbers", () => {
  it("mostra tudo quando há poucas páginas", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(1, 0)).toEqual([1]);
    expect(pageNumbers(2, 3)).toEqual([1, 2, 3]);
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("usa reticências para saltos maiores do que uma página", () => {
    expect(pageNumbers(5, 12)).toEqual([1, "…", 4, 5, 6, "…", 12]);
    expect(pageNumbers(1, 12)).toEqual([1, 2, "…", 12]);
    expect(pageNumbers(12, 12)).toEqual([1, "…", 11, 12]);
  });

  it("não usa reticências para esconder uma única página", () => {
    expect(pageNumbers(4, 12)).toEqual([1, 2, 3, 4, 5, "…", 12]);
  });
});
