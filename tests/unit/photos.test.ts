import { describe, expect, it } from "vitest";
import { checkPhotoFile, clampRect, maskInCrop, outputSize, parsePhotoIds, PHOTO_LIMITS } from "@/domain/photos";

describe("checkPhotoFile", () => {
  it("aceita JPEG, PNG e WebP até 5 MB", () => {
    expect(checkPhotoFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(checkPhotoFile({ type: "image/png", size: PHOTO_LIMITS.maxBytes })).toBeNull();
    expect(checkPhotoFile({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("rejeita outros tipos e ficheiros grandes", () => {
    expect(checkPhotoFile({ type: "image/gif", size: 10 })).toBe("badType");
    expect(checkPhotoFile({ type: "application/pdf", size: 10 })).toBe("badType");
    expect(checkPhotoFile({ type: "image/jpeg", size: PHOTO_LIMITS.maxBytes + 1 })).toBe("tooLarge");
  });
});

describe("parsePhotoIds", () => {
  it("separa, limpa e remove repetidos", () => {
    expect(parsePhotoIds("cmabc123456, cmdef654321,cmabc123456,,")).toEqual(["cmabc123456", "cmdef654321"]);
  });

  it("ignora valores inválidos", () => {
    expect(parsePhotoIds(undefined)).toEqual([]);
    expect(parsePhotoIds("../etc/passwd,abc")).toEqual([]);
  });
});

describe("clampRect", () => {
  it("mantém o retângulo dentro da imagem", () => {
    expect(clampRect({ x: 0.9, y: -0.2, w: 0.3, h: 0.5 })).toEqual({ x: 0.7, y: 0, w: 0.3, h: 0.5 });
  });

  it("aplica um tamanho mínimo e máximo", () => {
    expect(clampRect({ x: 0, y: 0, w: 0, h: 2 })).toEqual({ x: 0, y: 0, w: 0.05, h: 1 });
  });
});

describe("maskInCrop", () => {
  const crop = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

  it("converte a tapagem para píxeis do recorte", () => {
    expect(maskInCrop({ x: 0.25, y: 0.25, w: 0.25, h: 0.25 }, crop, 1000, 1000)).toEqual({ x: 0, y: 0, w: 501, h: 501 });
  });

  it("corta a tapagem que sai do recorte", () => {
    expect(maskInCrop({ x: 0, y: 0, w: 0.5, h: 0.5 }, crop, 1000, 1000)).toEqual({ x: 0, y: 0, w: 501, h: 501 });
  });

  it("ignora tapagens fora do recorte", () => {
    expect(maskInCrop({ x: 0, y: 0, w: 0.2, h: 0.2 }, crop, 1000, 1000)).toBeNull();
  });
});

describe("outputSize", () => {
  it("usa o tamanho do recorte quando cabe", () => {
    expect(outputSize(1200, 800, { x: 0, y: 0, w: 1, h: 1 })).toEqual({ width: 1200, height: 800 });
  });

  it("reduz mantendo a proporção", () => {
    expect(outputSize(4000, 3000, { x: 0, y: 0, w: 1, h: 1 })).toEqual({ width: 2000, height: 1500 });
    expect(outputSize(4000, 3000, { x: 0, y: 0, w: 0.5, h: 1 })).toEqual({ width: 1333, height: 2000 });
  });
});
