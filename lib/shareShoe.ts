// Client-side helper: builds a branded share picture (1080x1920, perfect for
// WhatsApp Status / Instagram Story) and shares it using the phone's native
// share sheet. Falls back to download + link copy on devices without it.

export type ShareableShoe = {
  id: string | number;
  name: string;
  price_rwf?: number | null;
  image_url: string;
  brand?: string | null;
};

const SITE_URL = "https://www.kigalishoeshub.com";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // needed so the canvas can be exported
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

export async function buildShareImage(shoe: ShareableShoe): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KIGALI SHOES HUB", W / 2, 140);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 30px Arial, Helvetica, sans-serif";
  ctx.fillText("Quality footwear delivered in Rwanda", W / 2, 192);

  // Photo card (cover-fit, rounded)
  const cx = 60, cy = 250, cw = W - 120, ch = 1000;
  const img = await loadImage(shoe.image_url);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 40);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx, cy, cw, ch);
  const scale = Math.max(cw / img.width, ch / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
  ctx.restore();

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px Arial, Helvetica, sans-serif";
  const lines = wrapText(ctx, shoe.name, W - 140, 2);
  let y = cy + ch + 110;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += 78;
  }

  // Price pill
  const price =
    shoe.price_rwf != null ? `RWF ${Number(shoe.price_rwf).toLocaleString()}` : "";
  if (price) {
    ctx.font = "900 72px Arial, Helvetica, sans-serif";
    const pw = ctx.measureText(price).width + 100;
    const px = (W - pw) / 2;
    y += 10;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.roundRect(px, y, pw, 110, 55);
    ctx.fill();
    ctx.fillStyle = "#052e16";
    ctx.fillText(price, W / 2, y + 78);
    y += 110;
  }

  // Footer / call to action
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 38px Arial, Helvetica, sans-serif";
  ctx.fillText("Order now at", W / 2, H - 170);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px Arial, Helvetica, sans-serif";
  ctx.fillText("www.kigalishoeshub.com", W / 2, H - 100);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png"
    );
  });
}

export function shoeLink(shoe: ShareableShoe) {
  return `${SITE_URL}/?shoe=${encodeURIComponent(String(shoe.id))}`;
}

export type ShareResult = "shared" | "downloaded" | "link-shared" | "copied" | "cancelled";

export async function shareShoe(shoe: ShareableShoe): Promise<ShareResult> {
  const url = shoeLink(shoe);
  const text = `${shoe.name}${
    shoe.price_rwf != null ? ` - RWF ${Number(shoe.price_rwf).toLocaleString()}` : ""
  } | Kigali Shoes Hub`;

  let blob: Blob | null = null;
  try {
    blob = await buildShareImage(shoe);
  } catch (e) {
    console.error("Share image failed, sharing link only", e);
  }

  const nav: any = typeof navigator !== "undefined" ? navigator : null;

  // 1) Native share sheet WITH the picture (phones) -> WhatsApp Status etc.
  if (blob && nav?.canShare && nav?.share) {
    const file = new File([blob], `${shoe.name.replace(/[^a-z0-9]+/gi, "-")}.png`, {
      type: "image/png",
    });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: shoe.name, text: `${text}\n${url}` });
        return "shared";
      } catch (e: any) {
        if (e?.name === "AbortError") return "cancelled";
      }
    }
  }

  // 2) Native share of the link only
  if (nav?.share) {
    try {
      await nav.share({ title: shoe.name, text, url });
      return "link-shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }

  // 3) Desktop: download the picture and copy the link
  if (blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${shoe.name.replace(/[^a-z0-9]+/gi, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    try { await nav?.clipboard?.writeText(url); } catch {}
    return "downloaded";
  }
  try {
    await nav?.clipboard?.writeText(url);
    return "copied";
  } catch {
    return "cancelled";
  }
}