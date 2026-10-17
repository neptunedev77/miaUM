import { describe, expect, it } from "vitest";
import { displayName, isAllowedEmail, normalizeEmail } from "@/domain/email";

describe("normalizeEmail", () => {
  it("remove espaços e passa a minúsculas", () => {
    expect(normalizeEmail("  Ana@Example.TEST ")).toBe("ana@example.test");
  });
});

describe("isAllowedEmail", () => {
  const domains = ["example.test", "alunos.example.test"];

  it("aceita domínios permitidos, ignorando maiúsculas", () => {
    expect(isAllowedEmail("ana@example.test", domains)).toBe(true);
    expect(isAllowedEmail("ANA@EXAMPLE.TEST", domains)).toBe(true);
  });

  it("aceita subdomínios de um domínio permitido", () => {
    expect(isAllowedEmail("a1@alunos.example.test", ["example.test"])).toBe(true);
  });

  it("rejeita outros domínios e imitações", () => {
    expect(isAllowedEmail("ana@gmail.com", domains)).toBe(false);
    expect(isAllowedEmail("ana@notexample.test", domains)).toBe(false);
    expect(isAllowedEmail("ana@example.test.evil.com", domains)).toBe(false);
  });

  it("rejeita emails mal formados", () => {
    expect(isAllowedEmail("", domains)).toBe(false);
    expect(isAllowedEmail("@example.test", domains)).toBe(false);
    expect(isAllowedEmail("ana@", domains)).toBe(false);
    expect(isAllowedEmail("ana", domains)).toBe(false);
  });

  it("rejeita tudo quando a lista está vazia", () => {
    expect(isAllowedEmail("ana@example.test", [])).toBe(false);
    expect(isAllowedEmail("ana@example.test", [""])).toBe(false);
  });
});

describe("displayName", () => {
  it("usa o primeiro nome", () => {
    expect(displayName("Ana Maria", "ana@example.test")).toBe("Ana");
  });

  it("usa a parte local do email quando não há nome", () => {
    expect(displayName(null, "ana.silva@example.test")).toBe("ana.silva");
    expect(displayName("  ", "ana@example.test")).toBe("ana");
  });

  it("devolve '?' sem nome nem email", () => {
    expect(displayName(null, null)).toBe("?");
  });
});
