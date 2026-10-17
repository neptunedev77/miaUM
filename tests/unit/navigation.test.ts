import { describe, expect, it } from "vitest";
import { firstNameFrom, safeNext } from "@/domain/navigation";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/perdi")).toBe("/perdi");
    expect(safeNext("/anuncios/abc?x=1")).toBe("/anuncios/abc?x=1");
  });

  it("rejeita redirecionamentos externos e valores inválidos", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil", "", null, undefined, 42, "/" + "a".repeat(400)]) {
      expect(safeNext(bad, "/x")).toBe("/x");
    }
  });
});

describe("firstNameFrom", () => {
  it("guarda só o primeiro nome, com maiúscula", () => {
    expect(firstNameFrom("  ana maria  ")).toBe("Ana");
    expect(firstNameFrom("José")).toBe("José");
    expect(firstNameFrom("Ana-Rita")).toBe("Ana-Rita");
    expect(firstNameFrom("D'Artagnan")).toBe("D'Artagnan");
  });

  it("rejeita valores vazios, números, símbolos e nomes demasiado longos", () => {
    for (const bad of ["", "   ", "123", "<script>", "a".repeat(41), null, 5]) {
      expect(firstNameFrom(bad)).toBeNull();
    }
  });
});
