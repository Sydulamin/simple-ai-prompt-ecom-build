import PDFDocument from 'pdfkit';
import { OrderModel } from '../models/orderModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  brand:      '#0ea5e9',
  brandDark:  '#0369a1',
  brandLight: '#e0f2fe',
  dark:       '#0f172a',
  mid:        '#334155',
  muted:      '#64748b',
  faint:      '#94a3b8',
  hairline:   '#e2e8f0',
  bg:         '#f8fafc',
  rowAlt:     '#f1f5f9',
  white:      '#ffffff',
  green:      '#16a34a',
  red:        '#dc2626',
  amber:      '#d97706',
  indigo:     '#6366f1',
};

// ── Format helpers ─────────────────────────────────────────────────────────────
const money = (v) =>
  `BDT ${parseFloat(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

const date = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const statusPalette = (s) => ({
  pending:    C.amber,
  processing: C.brand,
  shipped:    C.indigo,
  delivered:  C.green,
  cancelled:  C.red,
  refunded:   C.muted,
}[s] ?? C.muted);

const payPalette = (s) => ({
  paid:     C.green,
  pending:  C.amber,
  failed:   C.red,
  refunded: C.muted,
}[s] ?? C.muted);

// ── PDFKit drawing primitives ─────────────────────────────────────────────────
/**
 * Filled + optionally stroked rounded rect.
 * Passing null for fill or stroke skips that paint op.
 */
function rRect(doc, x, y, w, h, r, fill, stroke) {
  doc.save();
  doc.roundedRect(x, y, w, h, r);
  if (fill && stroke) {
    doc.fillColor(fill).strokeColor(stroke).fillAndStroke();
  } else if (fill) {
    doc.fillColor(fill).fill();
  } else if (stroke) {
    doc.strokeColor(stroke).stroke();
  }
  doc.restore();
}

/** Horizontal rule */
function hRule(doc, y, x1, x2, color = C.hairline, lw = 0.5) {
  doc.save().moveTo(x1, y).lineTo(x2, y)
    .lineWidth(lw).strokeColor(color).stroke().restore();
}

/** Single-line text, no side effects on doc cursor */
function txt(doc, str, x, y, opts = {}) {
  doc.save();
  if (opts.font)      doc.font(opts.font);
  if (opts.size)      doc.fontSize(opts.size);
  if (opts.color)     doc.fillColor(opts.color);
  if (opts.opacity)   doc.opacity(opts.opacity);

  doc.text(String(str ?? ''), x, y, {
    lineBreak:  false,
    width:      opts.w ?? undefined,
    align:      opts.align ?? 'left',
    ...opts.extra,
  });
  doc.restore();
}

// ═════════════════════════════════════════════════════════════════════════════
export const downloadInvoice = asyncHandler(async (req, res) => {

  const order = await OrderModel.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (req.user?.role !== 'admin' && order.user_id !== req.user?.id) {
    res.status(403); throw new Error('Not authorized');
  }

  // ── Document ──────────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'A4', margin: 0, bufferPages: true,
    info: { Title: `Invoice ${order.order_number}`, Author: 'ShopWave' },
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="ShopWave-${order.order_number}.pdf"`);
  doc.pipe(res);

  // ── Page geometry ─────────────────────────────────────────────────────────
  const PW  = 595.28;          // A4 width  (pt)
  const PH  = 841.89;          // A4 height (pt)
  const L   = 44;              // left margin
  const R   = PW - 44;         // right edge (used for width calc)
  const CW  = R - L;           // content width  = 507.28

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1 ── HEADER  (y: 0 → 128)
  // ──────────────────────────────────────────────────────────────────────────
  const HDR = 128;

  // base
  doc.rect(0, 0, PW, HDR).fill(C.dark);
  // right accent block
  doc.rect(PW - 200, 0, 200, HDR).fill(C.brandDark);
  // diagonal slice
  doc.save().polygon([PW - 250, 0], [PW - 200, 0], [PW - 250, HDR])
    .fill(C.brandDark).restore();

  // brand icon box  40×40 at (L, 26)
  rRect(doc, L, 26, 40, 40, 9, C.brand);
  txt(doc, 'S', L + 12, 33, { font: 'Helvetica-Bold', size: 20, color: C.white });

  // brand name & tagline
  txt(doc, 'ShopWave',           L + 52, 30, { font: 'Helvetica-Bold', size: 21, color: C.white });
  txt(doc, 'FRESH FINDS · FAST DELIVERY', L + 52, 53, { font: 'Helvetica', size: 7.5, color: C.brand });

  // contact row  y=72
  const contacts = ['support@shopwave.com', '+880 1700-000000', 'Dhaka, Bangladesh'];
  let cx = L;
  contacts.forEach((c) => {
    const cw = doc.widthOfString(c, { fontSize: 7 }) + 14;
    rRect(doc, cx, 72, cw, 15, 3, null, C.faint);
    doc.save().opacity(0.7);
    txt(doc, c, cx + 7, 75.5, { size: 7, color: C.faint });
    doc.restore();
    cx += cw + 6;
  });

  // "INVOICE" label — right-aligned inside PW - 10 (right edge) from x=0
  txt(doc, 'INVOICE', 0, 26, { font: 'Helvetica-Bold', size: 34, color: C.white,
    w: PW - 14, align: 'right' });
  txt(doc, `#${order.order_number}`, 0, 68, { font: 'Helvetica', size: 10.5, color: C.brandLight,
    w: PW - 14, align: 'right' });
  txt(doc, date(order.created_at), 0, 84, { font: 'Helvetica', size: 8, color: C.faint,
    w: PW - 14, align: 'right' });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2 ── STATUS BAR  (y: 128 → 166)
  // ──────────────────────────────────────────────────────────────────────────
  const SB_Y  = HDR;
  const SB_H  = 36;

  doc.rect(0, SB_Y, PW, SB_H).fill(C.bg);
  hRule(doc, SB_Y + SB_H, 0, PW, C.hairline);

  // helper: draw one pill, return its width so next pill can follow
  function pill(label, color, px, py) {
    const tw  = doc.widthOfString(label, { fontSize: 7.5 }) + 20;
    const ph2 = 18;
    const ry  = py + (SB_H - ph2) / 2;                // vertically centred
    // semi-transparent fill
    doc.save().roundedRect(px, ry, tw, ph2, 4)
      .fillColor(color).opacity(0.12).fill().restore();
    rRect(doc, px, ry, tw, ph2, 4, null, color);
    doc.save().lineWidth(0.8).restore();                // fix stroke width
    txt(doc, label, px + 10, ry + 4.5, { font: 'Helvetica-Bold', size: 7.5, color });
    return tw + 8;
  }

  let px2 = L;
  px2 += pill(order.status.toUpperCase(), statusPalette(order.status), px2, SB_Y);
  px2 += pill(`PAYMENT: ${order.payment_status.toUpperCase()}`, payPalette(order.payment_status), px2, SB_Y);
  pill(`METHOD: ${order.payment_method.toUpperCase()}`, C.muted, px2, SB_Y);

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3 ── INFO BOXES  (y: 166+16 → +90)
  // ──────────────────────────────────────────────────────────────────────────
  const IB_Y  = SB_Y + SB_H + 16;   // 220
  const IB_H  = 92;
  const GAP   = 10;
  const IB_W  = (CW - GAP * 2) / 3; // ~162.4

  function infoBox(title, rows, bx) {
    // card
    rRect(doc, bx, IB_Y, IB_W, IB_H, 7, C.bg, C.hairline);
    // header strip (dark, square bottom)
    doc.rect(bx, IB_Y, IB_W, 24).fill(C.dark);
    // mask corners on bottom of header strip
    doc.rect(bx, IB_Y + 16, IB_W, 8).fill(C.dark);
    txt(doc, title, bx + 10, IB_Y + 7, { font: 'Helvetica-Bold', size: 7.5, color: C.white });

    let ry = IB_Y + 30;
    rows.forEach(({ text, bold, color: col }) => {
      if (!text) { ry += 5; return; }
      txt(doc, text, bx + 10, ry, {
        font:  bold ? 'Helvetica-Bold' : 'Helvetica',
        size:  bold ? 8.5 : 7.5,
        color: col ?? (bold ? C.dark : C.muted),
        w:     IB_W - 20,
      });
      ry += bold ? 13 : 11;
    });
  }

  infoBox('BILL TO', [
    { text: order.shipping_name,    bold: true },
    { text: order.shipping_phone },
    { text: order.shipping_address },
    { text: `${order.shipping_city}${order.shipping_zip ? `, ${order.shipping_zip}` : ''}` },
  ], L);

  infoBox('SHIP TO', [
    { text: order.shipping_name,    bold: true },
    { text: order.shipping_address },
    { text: order.shipping_city },
    { text: order.shipping_zip || '—' },
  ], L + IB_W + GAP);

  infoBox('ORDER DETAILS', [
    { text: order.order_number,                         bold: true },
    { text: `Date:   ${date(order.created_at)}` },
    { text: `Items:  ${(order.items || []).length}` },
    { text: `Via:    ${order.payment_method.toUpperCase()}` },
  ], L + (IB_W + GAP) * 2);

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4 ── ITEMS TABLE  (y: IB_Y + IB_H + 20)
  // ──────────────────────────────────────────────────────────────────────────
  const TB_Y   = IB_Y + IB_H + 20;  // top of heading
  const TH_Y   = TB_Y + 18;          // table header row top
  const TH_H   = 22;                 // header row height
  const ROW_H  = 28;                 // item row height

  // Heading
  txt(doc, 'Order Items', L, TB_Y, { font: 'Helvetica-Bold', size: 11, color: C.dark });
  // underline accent
  doc.save().moveTo(L, TB_Y + 14).lineTo(L + 76, TB_Y + 14)
    .lineWidth(2.5).strokeColor(C.brand).stroke().restore();

  // Table header background
  doc.rect(L, TH_Y, CW, TH_H).fill(C.dark);

  // ── Column definitions  (x relative to L, w, align) ──
  // Total content width = CW = 507.28
  // #(20) + Product(195) + SKU(72) + Qty(42) + Unit(84) + Total(84) = 497 + spacing
  const COLS = [
    { lbl: '#',          rx: 8,   w: 20,  align: 'center' },
    { lbl: 'PRODUCT',    rx: 32,  w: 190, align: 'left'   },
    { lbl: 'SKU',        rx: 226, w: 72,  align: 'left'   },
    { lbl: 'QTY',        rx: 302, w: 46,  align: 'center' },
    { lbl: 'UNIT PRICE', rx: 352, w: 76,  align: 'right'  },
    { lbl: 'TOTAL',      rx: 432, w: 75,  align: 'right'  },
  ];

  // Header labels
  COLS.forEach(({ lbl, rx, w, align }) => {
    txt(doc, lbl, L + rx, TH_Y + 7, { font: 'Helvetica-Bold', size: 7, color: C.faint, w, align });
  });

  // Item rows
  let rowY = TH_Y + TH_H;
  const items = order.items || [];

  items.forEach((item, i) => {
    const alt = i % 2 === 1;
    doc.rect(L, rowY, CW, ROW_H).fill(alt ? C.rowAlt : C.white);
    hRule(doc, rowY + ROW_H, L, L + CW, C.hairline, 0.3);

    const cy = rowY + ROW_H / 2;   // vertical centre of row

    // # number
    txt(doc, i + 1, L + COLS[0].rx, cy - 4, { size: 7.5, color: C.faint, w: COLS[0].w, align: 'center' });

    // Product name  (top-aligned within row)
    const name = item.product_name.length > 36
      ? item.product_name.slice(0, 33) + '…'
      : item.product_name;
    txt(doc, name,  L + COLS[1].rx, rowY + 6, { font: 'Helvetica-Bold', size: 8.5, color: C.dark,  w: COLS[1].w });
    if (item.product_sku) {
      txt(doc, item.product_sku, L + COLS[1].rx, rowY + 17, { size: 6.5, color: C.faint, w: COLS[1].w });
    }

    // SKU col (secondary)
    if (item.product_sku) {
      txt(doc, item.product_sku, L + COLS[2].rx, cy - 4, { size: 7, color: C.muted, w: COLS[2].w });
    }

    // Qty badge
    const badgeW = 22;
    const badgeX = L + COLS[3].rx + (COLS[3].w - badgeW) / 2;
    const badgeY = cy - 7;
    rRect(doc, badgeX, badgeY, badgeW, 14, 3, C.brandLight);
    txt(doc, item.quantity, badgeX, badgeY + 3, { font: 'Helvetica-Bold', size: 7.5, color: C.brandDark, w: badgeW, align: 'center' });

    // Unit price
    txt(doc, money(item.unit_price), L + COLS[4].rx, cy - 4,
      { size: 8, color: C.mid, w: COLS[4].w, align: 'right' });

    // Line total (bolder)
    txt(doc, money(item.total_price), L + COLS[5].rx, cy - 4,
      { font: 'Helvetica-Bold', size: 8.5, color: C.dark, w: COLS[5].w, align: 'right' });

    rowY += ROW_H;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5 ── TOTALS + NOTE  (below table, 2-col)
  // ──────────────────────────────────────────────────────────────────────────
  const BOT_Y  = rowY + 20;
  const NOTE_W = CW * 0.54;           // ~273.9
  const SUM_W  = CW - NOTE_W - 10;    // ~223.4
  const SUM_X  = L + NOTE_W + 10;     // right summary box x
  const BOX_H  = 118;

  // ── Note box (left) ───────────────────────────────────────────────────────
  rRect(doc, L, BOT_Y, NOTE_W, BOX_H, 7, C.bg, C.hairline);

  txt(doc, 'Thank you for your order!', L + 12, BOT_Y + 13,
    { font: 'Helvetica-Bold', size: 9, color: C.dark });

  const noteLines = [
    'We appreciate your business.',
    'This invoice is proof of purchase.',
    '',
    'Questions? Contact us:',
    'support@shopwave.com',
    '+880 1700-000000',
  ];
  let ny = BOT_Y + 28;
  noteLines.forEach((ln) => {
    if (ln === '') { ny += 5; return; }
    txt(doc, ln, L + 12, ny, { size: 7.5, color: C.muted, w: NOTE_W - 24 });
    ny += 11;
  });

  // Reference strip at bottom of note box
  const refY = BOT_Y + BOX_H - 26;
  doc.rect(L + 8, refY, NOTE_W - 16, 18).fill(C.dark);
  txt(doc, 'REF', L + 16, refY + 4.5, { font: 'Helvetica-Bold', size: 6.5, color: C.faint });
  txt(doc, order.order_number, L + 36, refY + 4.5, { font: 'Helvetica-Bold', size: 6.5, color: C.brand });
  txt(doc, `  ·  ${date(order.created_at)}`, L + 36 + doc.widthOfString(order.order_number, { fontSize: 6.5 }), refY + 4.5,
    { size: 6.5, color: C.faint });

  // ── Summary box (right) ───────────────────────────────────────────────────
  rRect(doc, SUM_X, BOT_Y, SUM_W, BOX_H, 7, C.bg, C.hairline);

  const subtotal = parseFloat(order.subtotal       || 0);
  const shipping = parseFloat(order.shipping_charge || 0);
  const discount = parseFloat(order.discount        || 0);
  const total    = parseFloat(order.total            || 0);

  // each row: label left, value right-aligned inside box
  function sumRow(label, value, sy, opts = {}) {
    txt(doc, label, SUM_X + 12, sy,
      { font: opts.bold ? 'Helvetica-Bold' : 'Helvetica',
        size: opts.size ?? 8, color: opts.color ?? C.muted });
    txt(doc, value, SUM_X, sy,
      { font: opts.bold ? 'Helvetica-Bold' : 'Helvetica',
        size: opts.size ?? 8, color: opts.color ?? C.mid,
        w: SUM_W - 12, align: 'right' });
  }

  let sy = BOT_Y + 14;
  sumRow('Subtotal',  money(subtotal), sy);                       sy += 17;
  sumRow('Shipping',  shipping === 0 ? 'FREE' : money(shipping), sy,
    { color: shipping === 0 ? C.green : C.muted });               sy += 17;
  if (discount > 0) {
    sumRow('Discount', `− ${money(discount)}`, sy, { color: C.green }); sy += 17;
  }

  hRule(doc, sy + 2, SUM_X + 10, SUM_X + SUM_W - 10, C.hairline);
  sy += 12;

  // Grand total pill — fills to bottom of box
  const gtH = BOX_H - (sy - BOT_Y) - 10;
  rRect(doc, SUM_X + 8, sy, SUM_W - 16, gtH, 6, C.brand);
  // label centred vertically
  const gtMid = sy + gtH / 2;
  txt(doc, 'GRAND TOTAL', SUM_X + 18, gtMid - 11,
    { font: 'Helvetica-Bold', size: 7.5, color: C.white });
  txt(doc, money(total), SUM_X + 8, gtMid - 3,
    { font: 'Helvetica-Bold', size: 14, color: C.white, w: SUM_W - 24, align: 'right' });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6 ── FOOTER  (bottom 50pt)
  // ──────────────────────────────────────────────────────────────────────────
  const FT_Y = PH - 50;

  hRule(doc, FT_Y, 0, PW, C.hairline, 0.5);
  doc.rect(0, FT_Y, PW, 50).fill(C.bg);

  // brand (left)
  txt(doc, 'ShopWave', L, FT_Y + 10, { font: 'Helvetica-Bold', size: 8.5, color: C.dark });
  txt(doc, 'Fresh Finds · Fast Delivery · Bangladesh', L, FT_Y + 23,
    { size: 7, color: C.muted });

  // legal note (centre)
  txt(doc, 'Computer-generated invoice — no signature required.',
    0, FT_Y + 18, { size: 7, color: C.faint, w: PW, align: 'center' });

  // page + date (right)
  txt(doc, 'Page 1 of 1',        0, FT_Y + 10, { size: 7, color: C.faint, w: PW - L, align: 'right' });
  txt(doc, `Generated ${date(new Date())}`, 0, FT_Y + 23,
    { size: 6.5, color: C.faint, w: PW - L, align: 'right' });

  // bottom brand bar
  doc.rect(0, PH - 4, PW, 4).fill(C.brand);

  doc.end();
});
