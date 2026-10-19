"""
Broken Link Checker — SIMPLE CONCEPT PPT
One big idea per slide · Less text · More visual
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from lxml import etree

# ── Colors ──
DARK   = RGBColor(0x0D, 0x0F, 0x1A)
CARD   = RGBColor(0x12, 0x1B, 0x35)
CYAN   = RGBColor(0x00, 0xD4, 0xFF)
GREEN  = RGBColor(0x00, 0xE8, 0x76)
RED    = RGBColor(0xFF, 0x3B, 0x3B)
ORANGE = RGBColor(0xFF, 0x8C, 0x00)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
GRAY   = RGBColor(0x8A, 0x99, 0xB8)
YELLOW = RGBColor(0xFF, 0xD7, 0x00)
PURPLE = RGBColor(0xA0, 0x55, 0xFF)
NAVY   = RGBColor(0x07, 0x12, 0x2E)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# ══ Helpers ══════════════════════════════════════

def slide():
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = DARK
    try:
        trans = etree.fromstring(
            '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
            ' spd="med"><p:push dir="l"/></p:transition>')
        s._element.append(trans)
    except: pass
    return s

def box(s, x, y, w, h, fill=None, border=None, bw=Pt(1.5)):
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid() if fill else sh.fill.background()
    if fill: sh.fill.fore_color.rgb = fill
    if border:
        sh.line.color.rgb = border
        sh.line.width = bw
    else:
        sh.line.fill.background()
    return sh

def t(s, text, x, y, w, h, size=18, bold=False, color=WHITE,
      align=PP_ALIGN.CENTER, italic=False):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    return tb

def line(s, x, y, w, h=0.05, color=CYAN):
    box(s, x, y, w, h, fill=color)

def arrow(s, x, y, direction="right", color=CYAN):
    sym = {"right": "  ▶  ", "down": "  ▼  ", "left": "  ◀  "}[direction]
    t(s, sym, x, y, 0.6, 0.4, size=18, color=color, bold=True)

# ══════════════════════════════════════════════════════════
# SLIDE 1 — TITLE
# ══════════════════════════════════════════════════════════
s = slide()
line(s, 0, 0, 13.33, 0.07, CYAN)
line(s, 0, 7.43, 13.33, 0.07, CYAN)

box(s, 1.5, 1.0, 10.33, 5.5, fill=CARD)
line(s, 1.5, 1.0, 10.33, 0.07, CYAN)
line(s, 1.5, 6.43, 10.33, 0.07, CYAN)

t(s, "🔗", 5.6, 1.3, 2.1, 1.4, size=72)
t(s, "BROKEN LINK CHECKER", 1.6, 2.7, 10.1, 1.0,
  size=40, bold=True, color=CYAN)
t(s, "Cyber Security Web Application", 2, 3.65, 9.33, 0.65,
  size=22, color=WHITE)
t(s, "React  ·  Flask  ·  MongoDB  ·  Vercel", 2.5, 4.3, 8.33, 0.5,
  size=15, color=GRAY, italic=True)
t(s, "🌐  broken-link-checker-rho.vercel.app", 2.5, 5.0, 8.33, 0.55,
  size=14, color=GREEN, italic=True)


# ══════════════════════════════════════════════════════════
# SLIDE 2 — THE PROBLEM (simple story)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "The Problem", 0.5, 0.25, 12.33, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

problems = [
    ("💀", "Broken Links",   "Websites have dead URLs\nthat give 404 errors",      RED),
    ("🎣", "Phishing",       "Hackers create fake websites\nto steal your data",   ORANGE),
    ("📱", "Malicious APKs", "Android apps that look real\nbut contain malware",   YELLOW),
    ("📷", "Fake QR Codes",  "QR codes that redirect you\nto dangerous sites",     PURPLE),
]
for i, (icon, title, desc, col) in enumerate(problems):
    x = 0.4 + i * 3.2
    box(s, x, 1.3, 2.9, 5.5, fill=CARD, border=col, bw=Pt(2))
    t(s, icon,  x,    1.45, 2.9, 1.3, size=52)
    t(s, title, x+0.1, 2.8, 2.7, 0.6, size=17, bold=True, color=col)
    t(s, desc,  x+0.1, 3.45, 2.7, 1.2, size=14, color=GRAY)

t(s, "One platform to solve ALL of these  →",
  1.5, 6.7, 9, 0.55, size=16, bold=True, color=YELLOW, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════
# SLIDE 3 — WHAT IS IT? (simple definition)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "What is Broken Link Checker?", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

# Big center statement
box(s, 1, 1.3, 11.33, 2.0, fill=CARD, border=CYAN, bw=Pt(2))
t(s, "A website where you can paste any URL,\nupload any APK or scan any QR code —\nand instantly know if it is SAFE or DANGEROUS.",
  1.3, 1.4, 10.8, 1.8, size=19, color=WHITE, align=PP_ALIGN.CENTER)

# 3 simple pillars
pillars = [
    ("🔍\nScan", "Check any URL\nor file", CYAN),
    ("🧠\nAnalyze", "Our system checks\n5+ security layers", GREEN),
    ("📋\nReport", "Get clear SAFE /\nUNSAFE verdict", ORANGE),
]
for i, (icon, desc, col) in enumerate(pillars):
    x = 1.0 + i * 3.9
    box(s, x, 3.7, 3.5, 2.9, fill=CARD, border=col, bw=Pt(2))
    t(s, icon, x+0.2, 3.85, 3.1, 1.3, size=32, color=col)
    t(s, desc, x+0.15, 5.15, 3.2, 1.2, size=15, color=GRAY)
    if i < 2:
        t(s, "▶", x+3.5, 4.8, 0.5, 0.5, size=22, color=col, bold=True)


# ══════════════════════════════════════════════════════════
# SLIDE 4 — HOW IT WORKS (simple 3-step)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "How Does It Work?", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

steps = [
    ("1️⃣", "You\nInput", "Paste a URL\nUpload APK\nScan QR Code", CYAN),
    ("2️⃣", "We\nCheck", "HTTP Status\nVirusTotal\nGoogle Safe Browsing\nWHOIS Age", GREEN),
    ("3️⃣", "You\nGet", "SAFE ✅\nUNSAFE 🔴\nBROKEN 💀\nSUSPICIOUS ⚠️", ORANGE),
]
for i, (num, title, desc, col) in enumerate(steps):
    x = 0.5 + i * 4.25
    box(s, x, 1.35, 3.8, 5.5, fill=CARD, border=col, bw=Pt(2.5))
    t(s, num,   x+1.2, 1.5,  1.4, 1.0, size=40)
    t(s, title, x+0.2, 2.5,  3.4, 0.9, size=24, bold=True, color=col)
    t(s, desc,  x+0.2, 3.45, 3.4, 3.2, size=15, color=GRAY)
    if i < 2:
        t(s, "▶", x+3.8, 3.8, 0.6, 0.6, size=28, color=col)


# ══════════════════════════════════════════════════════════
# SLIDE 5 — LINK CHECKER (visual verdict)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 1 — Link Checker", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

t(s, "Paste any URL → get instant security verdict", 0.5, 1.15, 12, 0.5,
  size=17, color=GRAY, align=PP_ALIGN.LEFT)

# URL input mockup
box(s, 0.5, 1.75, 12.33, 0.75, fill=NAVY, border=CYAN, bw=Pt(1.5))
t(s, "🔗   https://example-bank-login.com/verify?id=123456", 0.7, 1.85, 11, 0.55,
  size=15, color=GREEN, align=PP_ALIGN.LEFT, italic=True)

# Checks done
checks = [
    ("🌐  HTTP Status", "404 → BROKEN",     RED),
    ("🔒  SSL Valid",   "No HTTPS → WARN",  ORANGE),
    ("🛡️  VirusTotal",  "3/70 engines flag",RED),
    ("🔍  Safe Browsing","PHISHING found",  RED),
    ("🗓️  Domain Age",   "2 days old!",     RED),
]
for i, (check, result, col) in enumerate(checks):
    x = 0.5 + i * 2.55
    box(s, x, 2.75, 2.3, 1.6, fill=CARD, border=col, bw=Pt(1.5))
    t(s, check,  x+0.1, 2.88, 2.1, 0.55, size=12, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, result, x+0.1, 3.38, 2.1, 0.85, size=12, color=WHITE, align=PP_ALIGN.CENTER)

# Verdict
box(s, 0.5, 4.6, 12.33, 1.3, fill=RGBColor(0x2A,0x05,0x05), border=RED, bw=Pt(2.5))
t(s, "🔴   VERDICT: UNSAFE — Phishing Site Detected!", 0.8, 4.85, 11.8, 0.7,
  size=26, bold=True, color=RED)

# Also show SAFE example small
box(s, 0.5, 6.1, 5.8, 0.8, fill=RGBColor(0x05,0x20,0x05), border=GREEN, bw=Pt(1.5))
t(s, "✅  SAFE  — google.com (29 years old, 0 threats)", 0.7, 6.22, 5.4, 0.55, size=13, color=GREEN, align=PP_ALIGN.LEFT)
box(s, 7.0, 6.1, 5.8, 0.8, fill=RGBColor(0x20,0x20,0x20), border=GRAY, bw=Pt(1.5))
t(s, "💀  BROKEN  — Status 404, page not found", 7.2, 6.22, 5.4, 0.55, size=13, color=GRAY, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 6 — PHISHING ANALYZER
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 2 — Phishing URL Analyzer", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

t(s, "How do we detect phishing? — We check 7 red flags:", 0.5, 1.15, 12, 0.5,
  size=17, color=GRAY, align=PP_ALIGN.LEFT)

flags = [
    ("🔢", "IP in URL",        "http://192.168.1.1/paypal",   RED),
    ("📏", "Very Long URL",    "100+ characters = suspicious", ORANGE),
    ("➕", "Too Many Dots",    "login.bank.secure.evil.com",   ORANGE),
    ("🔤", "Fake Brand Name",  "paypa1.com  g00gle.com",       RED),
    ("🗓️", "Brand New Domain", "Registered < 30 days ago",     RED),
    ("🔗", "URL Shortener",    "bit.ly hides real destination", YELLOW),
    ("🔓", "No HTTPS",         "http:// = data not encrypted",  ORANGE),
]
for i, (icon, name, example, col) in enumerate(flags):
    row = i // 4
    ci  = i % 4
    x = 0.4 + ci * 3.25
    y = 1.85 + row * 2.1
    if i == 4: x = 0.4 + 0 * 3.25
    if i == 5: x = 0.4 + 1 * 3.25
    if i == 6: x = 0.4 + 2 * 3.25
    box(s, x, y, 3.0, 1.85, fill=CARD, border=col, bw=Pt(2))
    t(s, icon,    x+1.1, y+0.08, 0.8,  0.7,  size=26)
    t(s, name,    x+0.1, y+0.75, 2.8,  0.5,  size=14, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, example, x+0.1, y+1.2,  2.8,  0.55, size=11, color=GRAY, align=PP_ALIGN.CENTER, italic=True)


# ══════════════════════════════════════════════════════════
# SLIDE 7 — APK SCANNER (simple)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 3 — Android APK Scanner", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

# Left: simple flow
t(s, "How it works:", 0.5, 1.2, 5, 0.45, size=17, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
flow = [
    ("📤", "Upload .apk file (up to 50MB)"),
    ("📦", "We unzip and read the code"),
    ("🔍", "Scan for 15+ danger patterns"),
    ("📊", "Calculate risk score"),
    ("📋", "Show SAFE or UNSAFE verdict"),
]
for i, (icon, step) in enumerate(flow):
    y = 1.75 + i * 0.95
    box(s, 0.5, y, 5.5, 0.8, fill=CARD, border=CYAN_DARK if i<4 else GREEN, bw=Pt(1.5))
    t(s, icon, 0.6,  y+0.1, 0.7, 0.6, size=22)
    t(s, step, 1.4,  y+0.15, 4.4, 0.5, size=14, color=WHITE, align=PP_ALIGN.LEFT)
    if i < 4:
        t(s, "▼", 1.5, y+0.8, 0.4, 0.25, size=13, color=CYAN)

# Right: what we detect
t(s, "What we detect:", 6.8, 1.2, 6, 0.45, size=17, bold=True, color=ORANGE, align=PP_ALIGN.LEFT)
detects = [
    ("🔑", "Hidden passwords & API keys"),
    ("📞", "Dangerous permissions (Call, SMS)"),
    ("🌐", "Malicious links inside the app"),
    ("🔓", "Weak encryption (MD5, DES)"),
    ("🕵️", "Spyware & keylogger patterns"),
    ("💰", "Premium SMS fraud code"),
    ("🎭", "Overlay / screen recording abuse"),
]
for i, (icon, d) in enumerate(detects):
    y = 1.75 + i * 0.75
    col = RED if i % 2 == 0 else ORANGE
    t(s, f"{icon}  {d}", 6.8, y, 6.2, 0.65, size=14, color=col, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 8 — QR CODE SCANNER
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 4 — QR Code Scanner", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

t(s, "Upload QR image or use Camera — we decode it and tell you what's inside",
  0.5, 1.15, 12.5, 0.5, size=16, color=GRAY, align=PP_ALIGN.LEFT)

qr_types = [
    ("💳", "UPI\nPayment",  "Merchant name,\nUPI ID, Amount,\nMCC Category",  CYAN),
    ("📶", "WiFi\nNetwork", "SSID, Security\ntype, Password\n(hidden)",        GREEN),
    ("👤", "Contact\nvCard","Name, Phone,\nEmail, Website,\nOrganization",    PURPLE),
    ("🔗", "Website\nURL",  "Full security\nscan + WHOIS\ndomain age check",  ORANGE),
    ("📧", "Email\n/ SMS",  "Recipient,\nSubject,\nBody text",                YELLOW),
    ("📍", "GPS\nLocation", "Latitude &\nLongitude,\nMap link",               RED),
]
for i, (icon, name, desc, col) in enumerate(qr_types):
    x = 0.4 + i * 2.15
    box(s, x, 1.8, 1.95, 5.0, fill=CARD, border=col, bw=Pt(2))
    t(s, icon, x+0.4,  1.95, 1.1, 1.0, size=32)
    t(s, name, x+0.05, 2.95, 1.85, 0.8, size=14, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, desc, x+0.05, 3.8,  1.85, 1.8, size=12, color=GRAY, align=PP_ALIGN.CENTER)

box(s, 0.4, 7.0, 12.5, 0.38, fill=RGBColor(0x10,0x10,0x30), border=CYAN, bw=Pt(1))
t(s, "URL type QR code → triggers full live security audit automatically!", 0.6, 7.07, 12, 0.28,
  size=12, color=CYAN, align=PP_ALIGN.CENTER, bold=True)


# ══════════════════════════════════════════════════════════
# SLIDE 9 — WHOIS DOMAIN AGE (simple stat)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 5 — WHOIS Domain Age Checker", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

# Big shocking stat
box(s, 0.5, 1.3, 12.33, 2.0, fill=RGBColor(0x20,0x05,0x05), border=RED, bw=Pt(2.5))
t(s, "🚨  94% of phishing websites are", 0.7, 1.4, 12, 0.7, size=26, bold=True, color=RED)
t(s, "less than 30 days old!", 1.5, 1.97, 12, 0.65, size=32, bold=True, color=YELLOW)

# Two examples
box(s, 0.5, 3.6, 5.9, 2.8, fill=RGBColor(0x03,0x18,0x08), border=GREEN, bw=Pt(2))
t(s, "✅  ESTABLISHED DOMAIN", 0.7, 3.75, 5.5, 0.55, size=15, bold=True, color=GREEN)
t(s, "google.com", 1.0, 4.35, 5.1, 0.65, size=24, bold=True, color=WHITE)
t(s, "Age: 29.1 years old", 1.0, 5.0, 5.1, 0.5, size=16, color=GREEN)
t(s, "Registrar: MarkMonitor Inc.", 1.0, 5.5, 5.1, 0.5, size=14, color=GRAY)

box(s, 7.0, 3.6, 5.9, 2.8, fill=RGBColor(0x20,0x05,0x05), border=RED, bw=Pt(2))
t(s, "🚨  NEWLY REGISTERED = HIGH RISK", 7.2, 3.75, 5.5, 0.55, size=13, bold=True, color=RED)
t(s, "fakepayment123.com", 7.2, 4.35, 5.5, 0.65, size=18, bold=True, color=WHITE)
t(s, "Age: 2 days old", 7.2, 5.0, 5.5, 0.5, size=16, color=RED)
t(s, "→ Automatically flagged DANGEROUS", 7.2, 5.5, 5.5, 0.5, size=13, color=ORANGE)

# Source
t(s, "Data from: VirusTotal API v3  (fast, reliable, global)",
  2, 6.65, 9, 0.55, size=14, color=GRAY, italic=True)


# ══════════════════════════════════════════════════════════
# SLIDE 10 — PDF REPORT
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Feature 6 — One-Click PDF Report", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

# Simple before/after
t(s, "After any scan, click  📄 Export PDF  → get a professional audit report instantly",
  0.5, 1.15, 12.5, 0.55, size=16, color=GRAY, align=PP_ALIGN.LEFT)

# PDF preview mockup
box(s, 0.5, 1.85, 6.5, 5.1, fill=WHITE, border=GRAY, bw=Pt(1))
# Header bar
box(s, 0.5, 1.85, 6.5, 0.75, fill=RGBColor(0x0D,0x1B,0x3E))
t(s, "🔗  BROKEN LINK CHECKER — Audit Report", 0.65, 1.93, 6.1, 0.55, size=12, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
# Content lines
lines_mock = [
    ("Target URL:", "https://example.com/verify"),
    ("Scan Time:", "2026-10-17  20:30:00"),
    ("HTTP Status:", "200 OK"),
    ("SSL Valid:", "Yes"),
    ("VirusTotal:", "0 / 70 engines"),
    ("Domain Age:", "8.3 years old"),
    ("Safe Browsing:", "No threat found"),
    ("VERDICT:", "✅  SAFE"),
]
for i, (k, v) in enumerate(lines_mock):
    y = 2.78 + i * 0.5
    t(s, k, 0.7, y, 2.2, 0.42, size=11, color=RGBColor(0x33,0x33,0x55), bold=True, align=PP_ALIGN.LEFT)
    col_v = GREEN if "SAFE" in v else RGBColor(0x22,0x22,0x44)
    t(s, v, 3.0, y, 3.8, 0.42, size=11, color=col_v, align=PP_ALIGN.LEFT)

# Right: what's included
t(s, "What's inside the PDF:", 7.4, 1.85, 5.5, 0.5, size=17, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
pdf_points = [
    ("📋", "Target URL & scan timestamp"),
    ("🏷️", "Big verdict banner (color coded)"),
    ("📊", "All security check results"),
    ("🌍", "WHOIS domain age & registrar"),
    ("📱", "APK threat list (if APK scan)"),
    ("🖥️", "Generated in browser — no upload!"),
]
for i, (icon, point) in enumerate(pdf_points):
    y = 2.5 + i * 0.78
    box(s, 7.4, y, 5.5, 0.65, fill=CARD, border=CYAN, bw=Pt(1.2))
    t(s, f"{icon}  {point}", 7.6, y+0.12, 5.1, 0.42, size=14, color=WHITE, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 11 — SIMPLE ARCHITECTURE
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "How the App is Built", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

# 3 layers
layers = [
    ("👤  YOU\n(Browser)",    "Open the website\nType URLs, upload files",        PURPLE,  0.5),
    ("⚛️  FRONTEND\n(React)", "Shows the UI\nSends your request to backend",       GREEN,   4.4),
    ("🐍  BACKEND\n(Flask)",  "Processes request\nCalls VirusTotal, Safe Browsing",CYAN,    8.3),
]
for (title, desc, col, x) in layers:
    box(s, x, 1.4, 3.7, 3.8, fill=CARD, border=col, bw=Pt(2.5))
    t(s, title, x+0.15, 1.55, 3.4, 1.4, size=20, bold=True, color=col)
    t(s, desc,  x+0.15, 2.95, 3.4, 1.1, size=14, color=GRAY)

t(s, "▶", 4.15, 2.7, 0.5, 0.55, size=28, color=GREEN, bold=True)
t(s, "▶", 8.05, 2.7, 0.5, 0.55, size=28, color=CYAN,  bold=True)

# Bottom: backend calls
t(s, "Backend calls these APIs:", 0.5, 5.5, 12, 0.45, size=15, bold=True, color=ORANGE, align=PP_ALIGN.LEFT)
apis = [
    ("🔍  VirusTotal", "Checks if URL / domain is malware",    ORANGE),
    ("🛡️  Google Safe Browsing", "Checks for phishing pages",  CYAN),
    ("🌍  WHOIS API", "Checks how old the domain is",          GREEN),
    ("🗄️  MongoDB", "Saves scan results for history",          PURPLE),
]
for i, (api, desc, col) in enumerate(apis):
    x = 0.5 + i * 3.2
    box(s, x, 6.05, 3.0, 1.1, fill=CARD, border=col, bw=Pt(1.5))
    t(s, api,  x+0.1, 6.12, 2.8, 0.45, size=13, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, desc, x+0.1, 6.58, 2.8, 0.45, size=11, color=GRAY, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════
# SLIDE 12 — SECURITY (simple)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "How We Keep It Secure", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

sec = [
    ("🔑", "Login with JWT Token",
     "After login, a secret 24-hour token is issued.\nEvery action requires this token — no token = no access.",
     CYAN),
    ("🔒", "Passwords are Hashed",
     "We never store your real password.\nbcrypt converts it to a random code that can't be reversed.",
     GREEN),
    ("🧱", "SSRF Protection",
     "Hackers can't trick our server to scan\nprivate networks (192.168.x, localhost etc.) — blocked!",
     ORANGE),
    ("🔐", "API Keys are Hidden",
     "VirusTotal & Safe Browsing keys are stored\nin Vercel cloud — never visible to anyone's browser.",
     YELLOW),
]
for i, (icon, title, desc, col) in enumerate(sec):
    row = i // 2
    ci  = i % 2
    x = 0.5 + ci * 6.5
    y = 1.5 + row * 2.7
    box(s, x, y, 6.0, 2.4, fill=CARD, border=col, bw=Pt(2))
    t(s, icon,  x+0.15, y+0.15, 0.9, 0.9, size=34)
    t(s, title, x+1.15, y+0.15, 4.6, 0.7, size=17, bold=True, color=col, align=PP_ALIGN.LEFT)
    t(s, desc,  x+1.15, y+0.85, 4.6, 1.35, size=13, color=GRAY, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 13 — TECH STACK SIMPLE
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Technology Used", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

tech = [
    ("⚛️",  "React",          "Builds the website\ninterface users see",     GREEN),
    ("🐍",  "Python Flask",   "Backend server that\nprocesses all scans",     CYAN),
    ("🍃",  "MongoDB",        "Database that stores\nall scan history",       GREEN),
    ("☁️",  "Vercel",         "Hosts & deploys the\napp to the internet",     PURPLE),
    ("🔍",  "VirusTotal API", "70+ antivirus engines\ncheck every URL/domain",ORANGE),
    ("🛡️",  "Safe Browsing",  "Google's real-time\nphishing detector",        CYAN),
]
for i, (icon, name, desc, col) in enumerate(tech):
    row = i // 3
    ci  = i % 3
    x = 0.5 + ci * 4.25
    y = 1.5 + row * 2.7
    box(s, x, y, 3.9, 2.3, fill=CARD, border=col, bw=Pt(2))
    t(s, icon, x+1.4,  y+0.1,  1.1, 0.9, size=34)
    t(s, name, x+0.15, y+0.95, 3.6, 0.6, size=17, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, desc, x+0.15, y+1.55, 3.6, 0.65, size=12, color=GRAY, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════
# SLIDE 14 — DASHBOARD
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Dashboard — Your Security Overview", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

t(s, "After login, your personal dashboard shows all scan statistics at a glance:",
  0.5, 1.15, 12.5, 0.5, size=16, color=GRAY, align=PP_ALIGN.LEFT)

stats = [
    ("🔗", "Total Links\nScanned",  "All your past URL checks",   CYAN),
    ("✅", "Safe Links",            "Links with no threats found", GREEN),
    ("🔴", "Unsafe Threats",        "Phishing / malware detected", RED),
    ("💀", "Broken Links",          "Dead / 404 pages",            GRAY),
    ("📱", "APK Files\nScanned",    "Android apps analyzed",       ORANGE),
    ("📷", "QR Codes\nScanned",     "QR codes decoded & checked",  PURPLE),
]
for i, (icon, name, desc, col) in enumerate(stats):
    x = 0.5 + (i%3) * 4.2
    y = 1.85 + (i//3) * 2.4
    box(s, x, y, 3.85, 2.05, fill=CARD, border=col, bw=Pt(2.5))
    t(s, icon, x+0.2,  y+0.2, 0.9, 0.9, size=36)
    t(s, name, x+1.25, y+0.2, 2.4, 0.85, size=15, bold=True, color=col, align=PP_ALIGN.LEFT)
    t(s, desc, x+1.25, y+1.05, 2.4, 0.7, size=12, color=GRAY, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 15 — DEPLOYMENT (simple)
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "How We Deploy the App", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

steps = [
    ("💻", "Code in\nVS Code",    "Write React +\nFlask code"),
    ("📤", "Git Push\nto GitHub", "Upload code to\ngithub.com"),
    ("⚡", "Vercel\nDetects It",  "Automatically\nbuilds the app"),
    ("🌍", "Live in\n30 seconds", "App is online\nfor the world!"),
]
for i, (icon, title, desc) in enumerate(steps):
    x = 0.5 + i * 3.1
    box(s, x, 1.5, 2.8, 3.5, fill=CARD, border=CYAN, bw=Pt(2))
    t(s, icon,  x+0.9,  1.65, 1.0, 1.0, size=38)
    t(s, title, x+0.1,  2.7,  2.6, 0.9, size=17, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
    t(s, desc,  x+0.1,  3.6,  2.6, 0.8, size=14, color=GRAY, align=PP_ALIGN.CENTER)
    if i < 3:
        t(s, "▶", x+2.8, 2.8, 0.4, 0.55, size=24, color=GREEN)

box(s, 0.5, 5.3, 12.33, 1.25, fill=RGBColor(0x07,0x10,0x25), border=PURPLE, bw=Pt(2))
t(s, "☁️  Live URL:", 1.0, 5.5, 2.5, 0.55, size=16, bold=True, color=PURPLE, align=PP_ALIGN.LEFT)
t(s, "https://broken-link-checker-rho.vercel.app", 3.6, 5.5, 9, 0.55, size=16, color=GREEN, italic=True, align=PP_ALIGN.LEFT)
t(s, "💻  GitHub:", 1.0, 6.05, 2.5, 0.45, size=14, bold=True, color=PURPLE, align=PP_ALIGN.LEFT)
t(s, "github.com/madesh7890/broken-link-checker", 3.6, 6.05, 9, 0.45, size=14, color=GRAY, italic=True, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 16 — WHAT MAKES IT SPECIAL
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "What Makes This App Special?", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

specials = [
    ("🎯", "All-in-One",
     "Links · APK · QR Codes · WHOIS · PDF\n— one app for everything", CYAN),
    ("⚡", "Instant Results",
     "Scan completes in seconds\nNo waiting, no queues", GREEN),
    ("🔒", "Fully Secure",
     "Your data is safe\nAPI keys never exposed", ORANGE),
    ("📱", "Works Anywhere",
     "Deployed on Vercel\nAccess from any device", PURPLE),
    ("📄", "PDF Export",
     "Professional audit report\nReady to submit to anyone", YELLOW),
    ("🆓", "Free to Use",
     "No payment needed\nJust register and scan!", RED),
]
for i, (icon, title, desc, col) in enumerate(specials):
    x = 0.5 + (i%3) * 4.2
    y = 1.5 + (i//3) * 2.5
    box(s, x, y, 3.85, 2.2, fill=CARD, border=col, bw=Pt(2))
    t(s, icon,  x+0.15, y+0.12, 0.9, 0.85, size=32)
    t(s, title, x+1.15, y+0.15, 2.5, 0.6, size=17, bold=True, color=col, align=PP_ALIGN.LEFT)
    t(s, desc,  x+0.15, y+1.1,  3.55, 0.85, size=13, color=GRAY, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 17 — REAL WORLD USE CASES
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Real World Use Cases", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

cases = [
    ("👨‍💼", "Business Owner",
     "Check if all links on your\nwebsite are working", GREEN),
    ("🎓", "Student / Researcher",
     "Verify a suspicious link\nbefore clicking it", CYAN),
    ("👮", "Cybersecurity Team",
     "Analyze APK files and\nphishing URLs in bulk", ORANGE),
    ("👴", "General Public",
     "Scan a QR code received\nin WhatsApp before paying", RED),
]
for i, (icon, who, use, col) in enumerate(cases):
    x = 0.5 + i * 3.2
    box(s, x, 1.5, 2.95, 5.3, fill=CARD, border=col, bw=Pt(2.5))
    t(s, icon, x+0.95, 1.65, 1.05, 1.0, size=40)
    t(s, who,  x+0.1,  2.72, 2.75, 0.7, size=16, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, use,  x+0.1,  3.5,  2.75, 1.5, size=14, color=GRAY, align=PP_ALIGN.CENTER)

    # Mini scenario
    box(s, x+0.1, 5.0, 2.75, 1.5, fill=RGBColor(0x07,0x0F,0x25), border=col, bw=Pt(1))
    t(s, "Scenario:", x+0.2, 5.08, 2.55, 0.38, size=11, bold=True, color=col, align=PP_ALIGN.LEFT)
    scenarios = [
        "Got 404 on product page?\nPaste → find broken link",
        "Friend sent weird link?\nPaste → SAFE or PHISHING",
        "Client sent .apk file?\nUpload → malware report",
        "Restaurant QR code?\nScan → check before paying",
    ]
    t(s, scenarios[i], x+0.2, 5.5, 2.55, 0.9, size=11, color=GRAY, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 18 — FEATURE SUMMARY SIMPLE
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Complete Feature List", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

features = [
    ("✅", "User Registration & Login",        GREEN),
    ("🔗", "Single & Batch Link Checker",      CYAN),
    ("🎣", "Phishing URL Analyzer",            ORANGE),
    ("📱", "Android APK Scanner (50MB)",        RED),
    ("📷", "QR Code Scanner (7 types)",        PURPLE),
    ("🌍", "WHOIS Domain Age Lookup",           YELLOW),
    ("📄", "One-Click PDF Audit Report",        GREEN),
    ("📊", "Personal Dashboard",                CYAN),
    ("📜", "Full Scan History",                 ORANGE),
    ("🔒", "SSRF Protection",                  RED),
    ("🛡️", "VirusTotal + Safe Browsing APIs",   CYAN),
    ("☁️", "Cloud Deployed (Vercel)",           PURPLE),
]
for i, (icon, feat, col) in enumerate(features):
    x = 0.5 + (i % 3) * 4.25
    y = 1.5 + (i // 3) * 1.5
    box(s, x, y, 4.0, 1.25, fill=CARD, border=col, bw=Pt(1.5))
    t(s, f"{icon}  {feat}", x+0.15, y+0.32, 3.7, 0.6, size=15, bold=True, color=WHITE, align=PP_ALIGN.LEFT)


# ══════════════════════════════════════════════════════════
# SLIDE 19 — FUTURE PLANS
# ══════════════════════════════════════════════════════════
s = slide()
t(s, "Future Plans", 0.5, 0.25, 12, 0.7,
  size=30, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
line(s, 0, 1.0, 13.33, 0.05, CYAN)

futures = [
    ("🌐", "Website Crawler",
     "Automatically scan every link\non an entire website at once",        GREEN),
    ("📧", "Email Alerts",
     "Get notified by email\nwhen an UNSAFE link is detected",             ORANGE),
    ("🗺️", "IP Geolocation Map",
     "Show where the server is\nlocated on a world map",                   CYAN),
    ("🖼️", "Website Screenshot",
     "Take a screenshot of\na suspicious URL safely",                      PURPLE),
    ("🔐", "SSL Deep Inspector",
     "Check certificate expiry,\ncipher strength, issuer details",         YELLOW),
    ("📱", "Mobile App",
     "React Native version\nfor Android & iOS",                            RED),
]
for i, (icon, title, desc, col) in enumerate(futures):
    x = 0.5 + (i%3) * 4.25
    y = 1.5 + (i//3) * 2.6
    box(s, x, y, 4.0, 2.3, fill=CARD, border=col, bw=Pt(2))
    t(s, icon,  x+1.45, y+0.1, 1.1, 1.0, size=36)
    t(s, title, x+0.15, y+1.1, 3.7, 0.6, size=15, bold=True, color=col, align=PP_ALIGN.CENTER)
    t(s, desc,  x+0.15, y+1.7, 3.7, 0.55, size=12, color=GRAY, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════
# SLIDE 20 — THANK YOU
# ══════════════════════════════════════════════════════════
s = slide()
line(s, 0, 0, 13.33, 0.07, CYAN)
line(s, 0, 7.43, 13.33, 0.07, CYAN)

box(s, 1.5, 0.8, 10.33, 5.9, fill=CARD)
line(s, 1.5, 0.8, 10.33, 0.07, CYAN)
line(s, 1.5, 6.63, 10.33, 0.07, CYAN)

t(s, "Thank You!", 2, 1.1, 9.33, 1.1, size=52, bold=True, color=CYAN)
t(s, "BROKEN LINK CHECKER", 2, 2.1, 9.33, 0.75, size=24, bold=True, color=WHITE)

box(s, 2.5, 3.0, 8.33, 0.7, fill=RGBColor(0x05,0x20,0x10), border=GREEN, bw=Pt(1.5))
t(s, "🌐  https://broken-link-checker-rho.vercel.app",
  2.7, 3.1, 7.9, 0.5, size=16, color=GREEN, italic=True)

box(s, 2.5, 3.85, 8.33, 0.7, fill=RGBColor(0x07,0x10,0x25), border=PURPLE, bw=Pt(1.5))
t(s, "💻  github.com/madesh7890/broken-link-checker",
  2.7, 3.95, 7.9, 0.5, size=16, color=PURPLE, italic=True)

t(s, "React  ·  Flask  ·  MongoDB Atlas  ·  Vercel  ·  VirusTotal  ·  Google Safe Browsing",
  1.8, 4.8, 9.73, 0.55, size=13, color=GRAY, italic=True)

t(s, "Questions? 🙋", 4.3, 5.5, 4.73, 0.65, size=22, bold=True, color=YELLOW)


# ══ SAVE ══
out = r"e:\broken_link_checker_simple.pptx"
prs.save(out)
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print(f"[OK] Simple PPT saved -> {out}")
print(f"     Slides: {len(prs.slides)}")
