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

const FB_PATH =
  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z";
const TT_PATH =
  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V8.9a6.34 6.34 0 0 0-3.38.97 6.34 6.34 0 1 0 9.72 5.43V8.8a8.21 8.21 0 0 0 4.77 1.52V6.86a4.85 4.85 0 0 1-1.00-.17z";

// Round icon badge: white circle with a dark glyph inside.
function drawSocialIcon(
  ctx: CanvasRenderingContext2D,
  kind: "ig" | "fb" | "tt",
  cx: number,
  cy: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const g = size * 0.52; // glyph size
  ctx.translate(cx - g / 2, cy - g / 2);
  const k = g / 24;
  ctx.scale(k, k);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  if (kind === "fb") {
    ctx.fill(new Path2D(FB_PATH));
  } else if (kind === "tt") {
    ctx.fill(new Path2D(TT_PATH));
  } else {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(2.5, 2.5, 19, 19, 5.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 12, 4.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(17.6, 6.4, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Draws text with extra letter spacing (centered at x).
function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  const anyCtx = ctx as any;
  if ("letterSpacing" in anyCtx) {
    anyCtx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x + spacing / 2, y);
    anyCtx.letterSpacing = "0px";
  } else {
    ctx.fillText(text, x, y);
  }
}

// Canvas is 9:16 (1080x1920): WhatsApp Status, Instagram/Facebook Stories,
// TikTok. ALL content sits inside the centre 4:5 band (y 285-1635) so that a
// feed post (Instagram 4:5 / Facebook) centre-cropped from it loses nothing,
// and so story apps' top/bottom buttons never cover anything important.
export async function buildShareImage(shoe: ShareableShoe): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  const FONT = "Arial, Helvetica, sans-serif";

  // ---- Background: clean white with a faint brand pattern ----
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.rotate(-0.35);
  ctx.fillStyle = "rgba(0,0,0,0.035)";
  ctx.font = `800 44px ${FONT}`;
  for (let row = -4; row < 30; row++) {
    for (let col = -2; col < 6; col++) {
      ctx.fillText("KSH", col * 340 + (row % 2) * 170, row * 110);
    }
  }
  ctx.restore();

  // ---- Header ----
  ctx.fillStyle = "#000000";
  ctx.font = `900 48px ${FONT}`;
  spacedText(ctx, "KIGALI SHOES HUB", W / 2, 345, 6);
  ctx.fillStyle = "#64748b";
  ctx.font = `700 22px ${FONT}`;
  spacedText(ctx, "OFFICIAL FOOTWEAR STORE", W / 2, 382, 7);

  // ---- Photo card ----
  const cx = 90, cy = 415, cw = W - 180, ch = 700;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 48);
  ctx.fill();
  ctx.restore();

  const img = await loadImage(shoe.image_url);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 48);
  ctx.clip();
  const scale = Math.max(cw / img.width, ch / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
  ctx.restore();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 48);
  ctx.stroke();

  // "NEW IN STOCK": the only colour accent
  ctx.save();
  ctx.translate(cx + 32, cy + 30);
  ctx.rotate(-0.05);
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.roundRect(0, 0, 320, 68, 34);
  ctx.fill();
  ctx.fillStyle = "#052e16";
  ctx.font = `900 30px ${FONT}`;
  spacedText(ctx, "NEW IN STOCK", 160, 45, 3);
  ctx.restore();

  // ---- Product name ----
  let y = cy + ch + 62;
  if (shoe.brand) {
    ctx.fillStyle = "#64748b";
    ctx.font = `700 24px ${FONT}`;
    spacedText(ctx, shoe.brand.toUpperCase(), W / 2, y, 6);
  }
  y += 56;
  ctx.fillStyle = "#000000";
  ctx.font = `800 54px ${FONT}`;
  const lines = wrapText(ctx, shoe.name, W - 180, 2);
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += 64;
  }

  // ---- Call to action + website (no price: drives visits to the site) ----
  const ctaY = 1330;
  const ctaW = 860, ctaH = 98;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect((W - ctaW) / 2, ctaY, ctaW, ctaH, 49);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText("CHECK PRICE & ORDER ON OUR WEBSITE", W / 2, ctaY + 62);

  ctx.fillStyle = "#000000";
  ctx.font = `900 46px ${FONT}`;
  ctx.fillText("kigalishoeshub.com", W / 2, ctaY + ctaH + 62);

  ctx.fillStyle = "#475569";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("Delivered across Rwanda & worldwide", W / 2, ctaY + ctaH + 112);

  // ---- Social icons + handle ----
  const iconSize = 48, gap = 20;
  ctx.font = `600 28px ${FONT}`;
  const handle = "kigali.shoes.hub";
  const hw = ctx.measureText(handle).width;
  const totalW = iconSize * 3 + gap * 3 + hw;
  let ix = (W - totalW) / 2 + iconSize / 2;
  const iy = 1597;
  (["ig", "fb", "tt"] as const).forEach((k) => {
    drawSocialIcon(ctx, k, ix, iy, iconSize);
    ix += iconSize + gap;
  });
  ctx.fillStyle = "#334155";
  ctx.textAlign = "left";
  ctx.fillText(handle, ix - iconSize / 2 + gap / 2, iy + 10);
  ctx.textAlign = "center";

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
  const text = `${shoe.name} | Check price & order on Kigali Shoes Hub. Delivered across Rwanda & worldwide.`;

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