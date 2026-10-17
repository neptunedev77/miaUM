import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { InvalidImageError, processImage } from "@/server/image";

/** JPEG de teste com EXIF (incluindo coordenadas GPS) e orientação "rodada 90°". */
async function photoWithGps(width = 3000, height = 2000) {
  return sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 40 } } })
    .jpeg()
    .withExif({
      IFD0: { Make: "TestPhone", Model: "X1" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "41/1 33/1 40/1", GPSLongitudeRef: "W", GPSLongitude: "8/1 23/1 50/1" },
    })
    // A orientação tem de ser definida assim (o withExif ignora a tag Orientation).
    .withMetadata({ orientation: 6 })
    .toBuffer();
}

describe("processImage", () => {
  it("remove todos os metadados, incluindo o GPS", async () => {
    const input = await photoWithGps();
    expect((await sharp(input).metadata()).exif).toBeDefined(); // o original tem EXIF

    const { full, thumb } = await processImage(input);
    for (const out of [full, thumb]) {
      const meta = await sharp(out).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.exif).toBeUndefined();
      expect(meta.icc).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
      expect(out.includes(Buffer.from("TestPhone"))).toBe(false);
    }
  });

  it("aplica a orientação EXIF e limita o lado maior a 1600 px", async () => {
    // 3000x2000 com Orientation=6 é, na realidade, uma foto vertical 2000x3000.
    const { width, height } = await processImage(await photoWithGps());
    expect(height).toBe(1600);
    expect(width).toBe(1067);
  });

  it("não aumenta imagens pequenas", async () => {
    const small = await sharp({ create: { width: 640, height: 480, channels: 3, background: "#fff" } }).png().toBuffer();
    const { width, height } = await processImage(small);
    expect([width, height]).toEqual([640, 480]);
  });

  it("gera uma miniatura quadrada de 400 px", async () => {
    const { thumb } = await processImage(await photoWithGps());
    const meta = await sharp(thumb).metadata();
    expect([meta.width, meta.height]).toEqual([400, 400]);
  });

  it("rejeita ficheiros que não são imagens ou formatos não aceites", async () => {
    await expect(processImage(Buffer.from("isto não é uma imagem"))).rejects.toBeInstanceOf(InvalidImageError);
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).gif().toBuffer();
    await expect(processImage(gif)).rejects.toBeInstanceOf(InvalidImageError);
  });
});
