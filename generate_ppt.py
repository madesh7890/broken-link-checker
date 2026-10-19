"""
Broken Link Checker - Professional PPT Generator
20 slides with cybersecurity theme
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from pptx.oxml.ns import qn
from pptx.enum.dml import MSO_THEME_COLOR
import copy
from lxml import etree
import sys

# ─── Color Palette (Cybersecurity Dark Theme) ───
BG_DARK      = RGBColor(0x0A, 0x0E, 0x27)   # Deep navy
BG_CARD      = RGBColor(0x0D, 0x1B, 0x3E)   # Card bg
CYAN         = RGBColor(0x00, 0xD4, 0xFF)   # Neon cyan
CYAN_DARK    = RGBColor(0x00, 0x8B, 0xB4)
GREEN        = RGBColor(0x00, 0xFF, 0x88)   # Neon green
ORANGE       = RGBColor(0xFF, 0x7A, 0x00)
RED          = RGBColor(0xFF, 0x3A, 0x3A)
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
GRAY         = RGBColor(0xA0, 0xAD, 0xC8)
YELLOW       = RGBColor(0xFF, 0xD7, 0x00)
PURPLE       = RGBColor(0xA0, 0x4F, 0xFF)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]  # completely blank


# ══════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════

def add_slide():
    return prs.slides.add_slide(BLANK)

def bg(slide, color=BG_DARK):
    """Fill slide background with solid color."""
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def rect(slide, x, y, w, h, fill_color=None, border_color=None, border_width=Pt(1), radius=False):
    """Add a rectangle shape."""
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        Inches(x), Inches(y), Inches(w), Inches(h)
    )
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = border_width
    else:
        shape.line.fill.background()
    return shape

def txt(slide, text, x, y, w, h, size=18, bold=False, color=WHITE,
        align=PP_ALIGN.LEFT, italic=False, wrap=True):
    """Add a text box."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return tb

def txt_multiline(slide, lines, x, y, w, h, size=16, color=WHITE, bold=False):
    """Add text box with multiple lines (list of strings)."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = line
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return tb

def accent_bar(slide, x=0, y=0, w=13.33, h=0.05, color=CYAN):
    """Thin colored accent bar."""
    return rect(slide, x, y, w, h, fill_color=color)

def header_band(slide, title, subtitle="", title_size=36, sub_size=18):
    """Dark header band with title."""
    rect(slide, 0, 0, 13.33, 1.5, fill_color=BG_CARD)
    accent_bar(slide, 0, 1.45, 13.33, 0.05, CYAN)
    txt(slide, title, 0.4, 0.15, 12, 0.8, size=title_size, bold=True, color=CYAN, align=PP_ALIGN.LEFT)
    if subtitle:
        txt(slide, subtitle, 0.4, 0.85, 12, 0.5, size=sub_size, bold=False, color=GRAY, align=PP_ALIGN.LEFT)

def icon_card(slide, icon, label, desc, x, y, w=2.8, h=1.5, icon_color=CYAN):
    """Small card with icon char, label, desc."""
    rect(slide, x, y, w, h, fill_color=BG_CARD, border_color=CYAN_DARK, border_width=Pt(1))
    txt(slide, icon, x+0.1, y+0.1, 0.7, 0.6, size=22, bold=True, color=icon_color, align=PP_ALIGN.CENTER)
    txt(slide, label, x+0.75, y+0.12, w-0.9, 0.4, size=13, bold=True, color=WHITE)
    txt(slide, desc, x+0.75, y+0.52, w-0.9, 0.85, size=11, color=GRAY)

def flow_box(slide, text, x, y, w=2.2, h=0.6, fill=BG_CARD, border=CYAN, tsize=12, tcolor=WHITE):
    r = rect(slide, x, y, w, h, fill_color=fill, border_color=border, border_width=Pt(1.5))
    txt(slide, text, x+0.05, y+0.08, w-0.1, h-0.1, size=tsize, bold=True, color=tcolor, align=PP_ALIGN.CENTER)

def arrow_down(slide, x, y):
    """Simple down arrow using text."""
    txt(slide, "▼", x, y, 0.4, 0.35, size=16, color=CYAN, align=PP_ALIGN.CENTER)

def arrow_right(slide, x, y):
    txt(slide, "▶", x, y, 0.35, 0.35, size=14, color=CYAN, align=PP_ALIGN.CENTER)

def bullet_list(slide, items, x, y, w, spacing=0.42, size=15, dot_color=CYAN, text_color=WHITE):
    for i, item in enumerate(items):
        txt(slide, "●", x, y + i*spacing, 0.3, 0.4, size=12, color=dot_color, align=PP_ALIGN.CENTER)
        txt(slide, item, x+0.35, y + i*spacing, w-0.35, 0.4, size=size, color=text_color)

def add_transition(slide, transition_type="push"):
    """Add slide transition via XML."""
    # transition XML
    trans_xml = f'<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="med"><p:{transition_type} dir="l"/></p:transition>'
    try:
        trans_el = etree.fromstring(trans_xml)
        slide._element.append(trans_el)
    except:
        pass


# ══════════════════════════════════════════════════════
#  SLIDE 1 — TITLE SLIDE
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
accent_bar(s, 0, 0, 13.33, 0.06, CYAN)
accent_bar(s, 0, 7.44, 13.33, 0.06, CYAN)

# Big centered content
rect(s, 1, 1.2, 11.33, 5, fill_color=BG_CARD)
accent_bar(s, 1, 1.2, 11.33, 0.06, CYAN)
accent_bar(s, 1, 6.14, 11.33, 0.06, CYAN)

txt(s, "🔗", 5.8, 1.6, 1.5, 1.2, size=60, align=PP_ALIGN.CENTER)
txt(s, "BROKEN LINK CHECKER", 1.5, 2.7, 10.3, 1.1, size=44, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
txt(s, "Cyber Security Web Application", 2, 3.7, 9.33, 0.7, size=24, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, "Full Stack  ·  React + Flask + MongoDB  ·  Deployed on Vercel", 2, 4.35, 9.33, 0.6, size=15, color=GRAY, align=PP_ALIGN.CENTER)
txt(s, "🌐  https://broken-link-checker-rho.vercel.app", 2.5, 4.9, 8.33, 0.5, size=13, color=GREEN, align=PP_ALIGN.CENTER, italic=True)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 2 — PROBLEM STATEMENT
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🚨  Problem Statement", "What dangers hide in URLs, Links & Files?")

problems = [
    ("❌  Dead Links", "Websites with broken/404 URLs damage user experience & SEO"),
    ("🎣  Phishing URLs", "Hackers create fake URLs to steal passwords & money"),
    ("📱  Malicious APKs", "Android apps can hide malware, spyware, ransomware"),
    ("📷  Dangerous QR Codes", "QR codes can redirect to phishing sites or trigger UPI fraud"),
    ("🕵️  New Hacker Domains", "Freshly registered domains (< 30 days) = HIGH risk"),
]

for i, (icon_lbl, desc) in enumerate(problems):
    yy = 1.7 + i * 1.0
    rect(s, 0.4, yy, 12.5, 0.82, fill_color=BG_CARD, border_color=RED if i<2 else ORANGE, border_width=Pt(1.5))
    txt(s, icon_lbl, 0.6, yy+0.15, 3.2, 0.5, size=15, bold=True, color=WHITE)
    txt(s, desc, 3.9, yy+0.15, 9, 0.5, size=14, color=GRAY)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 3 — OUR SOLUTION
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "✅  Our Solution", "One platform to detect ALL web threats")

txt(s, "BROKEN LINK CHECKER", 0.4, 1.7, 12.5, 0.7, size=30, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
txt(s, "A full-stack cybersecurity web app that scans URLs, detects phishing,\nanalyzes APK files, reads QR codes — all in one place.", 1, 2.3, 11.33, 0.9, size=16, color=WHITE, align=PP_ALIGN.CENTER)

features = [
    ("🔗", "Link\nChecker"),
    ("🎣", "Phishing\nAnalyzer"),
    ("📱", "APK\nScanner"),
    ("📷", "QR\nScanner"),
    ("🌍", "WHOIS\nLookup"),
    ("📄", "PDF\nReport"),
]
for i, (ic, lbl) in enumerate(features):
    x = 0.4 + i * 2.1
    rect(s, x, 3.4, 1.9, 1.7, fill_color=BG_CARD, border_color=CYAN_DARK, border_width=Pt(1))
    txt(s, ic, x+0.55, 3.55, 0.8, 0.7, size=26, align=PP_ALIGN.CENTER)
    txt(s, lbl, x+0.1, 4.3, 1.7, 0.7, size=12, bold=True, color=CYAN, align=PP_ALIGN.CENTER)

txt(s, "React (Vite)", 0.5, 5.5, 2.5, 0.5, size=13, color=GREEN, bold=True)
txt(s, "Flask (Python)", 3.5, 5.5, 2.5, 0.5, size=13, color=GREEN, bold=True)
txt(s, "MongoDB Atlas", 6.5, 5.5, 2.5, 0.5, size=13, color=GREEN, bold=True)
txt(s, "Vercel Hosting", 9.5, 5.5, 2.5, 0.5, size=13, color=GREEN, bold=True)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 4 — TECH STACK
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🛠️  Technology Stack", "What powers Broken Link Checker?")

stacks = [
    ("⚛️  FRONTEND", [
        "React 18 + Vite",
        "TailwindCSS (Dark UI)",
        "Lucide React (Icons)",
        "Axios (API calls)",
        "html5-qrcode (QR scan)",
        "jsPDF (PDF export)",
    ], 0.3, GREEN),
    ("🐍  BACKEND", [
        "Python Flask",
        "JWT Authentication",
        "Flask-CORS",
        "PyMongo (DB driver)",
        "python-magic (APK)",
        "requests / aiohttp",
    ], 4.55, CYAN),
    ("☁️  CLOUD & APIs", [
        "MongoDB Atlas (DB)",
        "Vercel (Deploy)",
        "VirusTotal v3 API",
        "Google Safe Browsing",
        "WHOIS / RDAP",
        "GitHub (CI/CD)",
    ], 8.8, ORANGE),
]

for title, items, x, col in stacks:
    rect(s, x, 1.6, 4, 5.5, fill_color=BG_CARD, border_color=col, border_width=Pt(2))
    txt(s, title, x+0.15, 1.7, 3.7, 0.5, size=13, bold=True, color=col)
    for j, item in enumerate(items):
        txt(s, f"  ▸  {item}", x+0.15, 2.35 + j*0.52, 3.7, 0.45, size=13, color=WHITE)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 5 — SYSTEM ARCHITECTURE FLOWCHART
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🏗️  System Architecture", "How frontend, backend & APIs connect")

# User
flow_box(s, "👤  USER\n(Browser)", 0.3, 2.0, 2, 1.0, fill=PURPLE, border=PURPLE, tsize=13)
arrow_right(s, 2.35, 2.35)
# Frontend
flow_box(s, "⚛️  React\nFrontend", 2.75, 2.0, 2.0, 1.0, fill=BG_CARD, border=GREEN, tsize=13)
arrow_right(s, 4.8, 2.35)
# Backend
flow_box(s, "🐍  Flask\nBackend", 5.2, 2.0, 2.0, 1.0, fill=BG_CARD, border=CYAN, tsize=13)
arrow_right(s, 7.25, 2.35)
# MongoDB
flow_box(s, "🗄️  MongoDB\nAtlas", 7.65, 2.0, 2.0, 1.0, fill=BG_CARD, border=GREEN, tsize=13)

# Flask -> APIs (downward)
txt(s, "▼", 6.1, 3.1, 0.4, 0.35, size=16, color=CYAN, align=PP_ALIGN.CENTER)
flow_box(s, "🔍 VirusTotal API", 3.5, 3.55, 2.4, 0.65, fill=BG_CARD, border=ORANGE, tsize=12)
flow_box(s, "🛡️ Safe Browsing API", 6.1, 3.55, 2.8, 0.65, fill=BG_CARD, border=RED, tsize=12)
flow_box(s, "🌐 WHOIS / RDAP", 9.1, 3.55, 2.4, 0.65, fill=BG_CARD, border=CYAN, tsize=12)

txt(s, "▼  APIs called by Backend only — Frontend never touches API Keys!", 2.5, 4.45, 10, 0.5, size=13, color=GREEN, bold=True)

# Vercel deploy
rect(s, 0.3, 5.2, 12.5, 0.85, fill_color=RGBColor(0x10,0x10,0x2A), border_color=PURPLE, border_width=Pt(1.5))
txt(s, "☁️  Vercel Hosting — Auto Deploy from GitHub  →  https://broken-link-checker-rho.vercel.app", 0.6, 5.35, 12, 0.55, size=13, color=PURPLE, bold=True, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 6 — USER AUTH FLOW
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🔐  User Authentication Flow", "Secure login with JWT tokens")

steps = [
    ("1️⃣", "Register", "Email + Password\nsaved to MongoDB\n(bcrypt hash)"),
    ("2️⃣", "Login", "Flask verifies\npassword hash"),
    ("3️⃣", "JWT Token", "24h token issued\n& stored in\nbrowser localStorage"),
    ("4️⃣", "API Calls", "Every request sends\nBearer token\nin header"),
    ("5️⃣", "Access", "Backend validates\nJWT → allows\nor denies"),
]
for i, (num, title, desc) in enumerate(steps):
    x = 0.3 + i*2.55
    rect(s, x, 1.7, 2.3, 2.5, fill_color=BG_CARD, border_color=CYAN, border_width=Pt(1.5))
    txt(s, num, x+0.8, 1.85, 0.7, 0.6, size=22, align=PP_ALIGN.CENTER)
    txt(s, title, x+0.1, 2.5, 2.1, 0.5, size=14, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
    txt(s, desc, x+0.1, 3.0, 2.1, 1.1, size=12, color=GRAY, align=PP_ALIGN.CENTER)
    if i < 4:
        txt(s, "▶", x+2.3, 2.6, 0.35, 0.4, size=16, color=GREEN, align=PP_ALIGN.CENTER)

rect(s, 0.3, 4.5, 12.5, 0.8, fill_color=RGBColor(0x05,0x20,0x10), border_color=GREEN, border_width=Pt(1))
txt(s, "🔒  Passwords never stored as plain text  ·  API Keys never sent to browser  ·  All routes protected by JWT", 0.6, 4.65, 12, 0.5, size=13, color=GREEN, bold=True, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 7 — LINK CHECKER FEATURE
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🔗  Link Checker", "Single URL & Batch scan — detect broken or unsafe links")

# Left: what it does
txt(s, "What it checks:", 0.4, 1.65, 5, 0.45, size=16, bold=True, color=CYAN)
bullet_list(s, [
    "HTTP Status Code (200, 301, 404, 500…)",
    "SSL/HTTPS Certificate validity",
    "Google Safe Browsing threat check",
    "VirusTotal domain reputation score",
    "WHOIS Domain Age (new = risky!)",
    "Response time measurement",
], 0.4, 2.15, 5.5, spacing=0.48, size=14)

# Right: Verdict flow
txt(s, "Scan Flow:", 7.2, 1.65, 5.5, 0.45, size=16, bold=True, color=CYAN)
flow_steps = ["Enter URL", "HTTP Check", "SSL Check", "VirusTotal", "Safe Browsing", "VERDICT"]
verdicts = [CYAN, CYAN, GREEN, ORANGE, RED, YELLOW]
for i, (step, col) in enumerate(zip(flow_steps, verdicts)):
    flow_box(s, step, 7.4, 2.15 + i*0.78, 2.5, 0.6, fill=BG_CARD, border=col, tsize=12, tcolor=col)
    if i < 5:
        txt(s, "▼", 8.5, 2.78 + i*0.78, 0.4, 0.25, size=13, color=CYAN, align=PP_ALIGN.CENTER)

# Verdict badges
rect(s, 0.4, 6.1, 2.5, 0.65, fill_color=GREEN, border_color=GREEN, border_width=Pt(0))
txt(s, "✅  SAFE", 0.4, 6.2, 2.5, 0.45, size=14, bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
rect(s, 3.2, 6.1, 2.5, 0.65, fill_color=RED, border_color=RED, border_width=Pt(0))
txt(s, "🔴  UNSAFE", 3.2, 6.2, 2.5, 0.45, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
rect(s, 6.0, 6.1, 2.5, 0.65, fill_color=GRAY, border_color=GRAY, border_width=Pt(0))
txt(s, "💀  BROKEN", 6.0, 6.2, 2.5, 0.45, size=14, bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
rect(s, 8.8, 6.1, 2.5, 0.65, fill_color=ORANGE, border_color=ORANGE, border_width=Pt(0))
txt(s, "⚠️  SUSPICIOUS", 8.8, 6.2, 2.5, 0.45, size=14, bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 8 — PHISHING ANALYZER
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🎣  Phishing / Suspicious URL Analyzer", "AI-style heuristic scoring system")

txt(s, "How phishing URLs are caught:", 0.4, 1.65, 7, 0.45, size=16, bold=True, color=CYAN)
checks = [
    ("🔢  IP Address in URL", "hackers hide behind raw IPs like http://192.168.1.1/bank"),
    ("📏  Long URL (> 75 chars)", "phishing URLs are usually very long to confuse users"),
    ("➕  Excessive Subdomains", "evil.login.bank.secure.com → not the real bank!"),
    ("🔤  Typosquatting", "g00gle.com, paypa1.com — fake versions of real brands"),
    ("🗓️  New Domain (< 30 days)", "WHOIS check — brand new domain = instant HIGH RISK flag"),
    ("🌐  URL Shorteners", "bit.ly, tinyurl — hide real malicious destination"),
    ("🔒  No HTTPS", "http:// sites are unencrypted — dangerous for credentials"),
]
for i, (label, desc) in enumerate(checks):
    y = 2.2 + i*0.69
    col = RED if i in [0,4] else ORANGE if i in [1,2,3] else YELLOW
    rect(s, 0.3, y, 12.5, 0.6, fill_color=BG_CARD, border_color=col, border_width=Pt(1.2))
    txt(s, label, 0.5, y+0.1, 3.5, 0.42, size=13, bold=True, color=col)
    txt(s, desc, 4.0, y+0.1, 8.6, 0.42, size=13, color=GRAY)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 9 — APK SCANNER
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "📱  Android APK Security Scanner", "Upload any .apk file — get full threat analysis")

txt(s, "15+ Threat Vectors Detected:", 0.4, 1.65, 8, 0.45, size=16, bold=True, color=CYAN)
threats = [
    "🔑  Hardcoded API Keys & Passwords",
    "📞  Suspicious Permissions (CALL, SMS, CAMERA)",
    "🌐  Embedded Malicious URLs",
    "💉  SQL Injection Patterns",
    "🔓  Insecure HTTP Endpoints",
    "🕵️  Root Detection Bypass",
    "📦  Known Malware Signatures",
    "🔐  Weak Encryption (MD5, DES)",
    "💰  Premium SMS Fraud code",
    "🎭  Overlay Attack code",
    "📷  Screen Recording abuse",
    "🔄  Auto-start on Boot",
    "📤  Data Exfiltration patterns",
    "🛑  Anti-debug / Anti-emulator",
    "📡  Excessive Network calls",
]
for i, threat in enumerate(threats):
    col_idx = i % 3
    col = [RED, ORANGE, YELLOW][col_idx]
    x = 0.4 + (i // 5) * 4.3
    y = 2.2 + (i % 5) * 0.88
    rect(s, x, y, 4.0, 0.75, fill_color=BG_CARD, border_color=col, border_width=Pt(1))
    txt(s, threat, x+0.1, y+0.15, 3.8, 0.45, size=12, color=WHITE)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 10 — APK FLOW
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "📱  APK Scanner — How it Works", "Step-by-step analysis flow")

apk_steps = [
    ("📤  Upload", "User uploads .apk\nup to 50MB\n(chunked upload)"),
    ("📦  Unzip", "APK is unzipped\nDEX, Manifest,\nassets extracted"),
    ("🔍  Analyze", "15+ threat patterns\nscanned via regex\n& binary search"),
    ("🌐  URL Scan", "Embedded URLs\nfound in DEX code\nchecked live"),
    ("📊  Score", "Risk score\ncalculated\n0-100 scale"),
    ("📄  Report", "SAFE / UNSAFE\nverdict with\nfull PDF export"),
]
for i, (title, desc) in enumerate(apk_steps):
    x = 0.4 + i * 2.1
    rect(s, x, 1.7, 1.9, 2.8, fill_color=BG_CARD, border_color=CYAN, border_width=Pt(1.5))
    txt(s, title, x+0.05, 1.85, 1.8, 0.55, size=13, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
    txt(s, desc, x+0.05, 2.45, 1.8, 2.0, size=11, color=GRAY, align=PP_ALIGN.CENTER)
    if i < 5:
        txt(s, "▶", x+1.9, 2.9, 0.3, 0.35, size=14, color=GREEN, align=PP_ALIGN.CENTER)

rect(s, 0.4, 4.7, 12.5, 0.75, fill_color=RGBColor(0x10,0x20,0x10), border_color=GREEN, border_width=Pt(1))
txt(s, "🛡️  Supports: .apk files · 50MB limit · Chunked upload · No file stored permanently", 0.6, 4.85, 12, 0.45, size=13, color=GREEN, align=PP_ALIGN.CENTER, bold=True)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 11 — QR CODE SCANNER
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "📷  QR Code Security Scanner", "Decode & analyze ANY type of QR code")

txt(s, "Upload image or use Camera — we detect the QR type automatically:", 0.4, 1.65, 12.5, 0.45, size=15, color=GRAY)

qr_types = [
    ("💳  UPI Payment", "Extracts merchant name, UPI ID, amount, MCC category — spots fake payment QRs", CYAN),
    ("📶  WiFi Network", "Shows SSID, security type, password — warns about open/WEP networks", GREEN),
    ("👤  vCard Contact", "Parses name, phone, email, org, website, address", CYAN),
    ("📧  Email / SMS", "Shows recipient, subject, body — detects spam", ORANGE),
    ("📍  Location", "Shows GPS coordinates on map link", GREEN),
    ("🔗  URL", "Triggers FULL security scan + WHOIS domain age check!", RED),
    ("📝  Plain Text", "Displays raw text + keyword risk analysis", GRAY),
]
for i, (typ, desc, col) in enumerate(qr_types):
    row = i // 2
    col_idx = i % 2
    x = 0.4 + col_idx * 6.5
    y = 2.2 + row * 1.05
    if i == 6:
        x = 3.7
    rect(s, x, y, 6.0, 0.9, fill_color=BG_CARD, border_color=col, border_width=Pt(1.5))
    txt(s, typ, x+0.15, y+0.1, 2.5, 0.4, size=13, bold=True, color=col)
    txt(s, desc, x+0.15, y+0.5, 5.7, 0.35, size=11, color=GRAY)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 12 — WHOIS DOMAIN AGE
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🌍  WHOIS / Domain Age Checker", "New domains = Hacker's favorite tool!")

# Big stat
rect(s, 0.4, 1.7, 5.5, 3.5, fill_color=BG_CARD, border_color=RED, border_width=Pt(2))
txt(s, "🚨", 2.2, 1.9, 2, 1.0, size=50, align=PP_ALIGN.CENTER)
txt(s, "94% of phishing sites", 0.6, 2.8, 5, 0.6, size=18, bold=True, color=RED, align=PP_ALIGN.CENTER)
txt(s, "are LESS than 30 days old!", 0.6, 3.35, 5, 0.5, size=16, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, "(Source: APWG Phishing Report)", 0.6, 3.9, 5, 0.4, size=12, color=GRAY, align=PP_ALIGN.CENTER)

txt(s, "What WHOIS tells us:", 6.3, 1.7, 6.5, 0.45, size=16, bold=True, color=CYAN)
whois_info = [
    ("🗓️  Creation Date", "When the domain was first registered"),
    ("🏢  Registrar", "Who registered it (MarkMonitor, GoDaddy…)"),
    ("⏳  Domain Age", "Exact age in years/months/days"),
    ("⚠️  Risk Level", "NEW (<30 days) = HIGH RISK auto-flag"),
    ("🔍  Data Source", "VirusTotal API v3 (primary) + RDAP fallback"),
]
for i, (label, desc) in enumerate(whois_info):
    y = 2.25 + i * 0.88
    rect(s, 6.3, y, 6.6, 0.75, fill_color=BG_CARD, border_color=CYAN_DARK, border_width=Pt(1))
    txt(s, label, 6.5, y+0.1, 2.5, 0.45, size=13, bold=True, color=CYAN)
    txt(s, desc, 9.1, y+0.1, 3.6, 0.45, size=13, color=GRAY)

rect(s, 0.4, 5.45, 12.5, 0.75, fill_color=RGBColor(0x20,0x05,0x05), border_color=RED, border_width=Pt(1))
txt(s, "Example: google.com → 29.1 years old ✅ ESTABLISHED | suspiciousbank123.com → 2 days old 🚨 HIGH RISK", 0.6, 5.6, 12, 0.45, size=13, color=ORANGE, align=PP_ALIGN.CENTER, bold=True)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 13 — VIRUSTOTAL & SAFE BROWSING
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🛡️  External Security APIs", "Industry-grade threat intelligence")

# VT
rect(s, 0.4, 1.65, 5.9, 5.3, fill_color=BG_CARD, border_color=ORANGE, border_width=Pt(2))
txt(s, "🔍  VirusTotal API v3", 0.65, 1.8, 5.4, 0.55, size=18, bold=True, color=ORANGE)
txt(s, "World's largest malware database", 0.65, 2.35, 5.4, 0.4, size=13, color=GRAY)
bullet_list(s, [
    "70+ antivirus engines scan each URL",
    "Domain reputation score",
    "WHOIS creation date & registrar",
    "Sub-domain & IP analysis",
    "Historical malware detections",
], 0.65, 2.85, 5.3, spacing=0.5, size=13)

# GSB
rect(s, 6.9, 1.65, 6.0, 5.3, fill_color=BG_CARD, border_color=CYAN, border_width=Pt(2))
txt(s, "🛡️  Google Safe Browsing", 7.15, 1.8, 5.5, 0.55, size=18, bold=True, color=CYAN)
txt(s, "Real-time threat protection by Google", 7.15, 2.35, 5.5, 0.4, size=13, color=GRAY)
bullet_list(s, [
    "Detects MALWARE hosting sites",
    "Flags PHISHING & deceptive pages",
    "UNWANTED SOFTWARE detection",
    "SOCIAL ENGINEERING attacks",
    "Used by Chrome, Firefox, Safari",
], 7.15, 2.85, 5.7, spacing=0.5, size=13)

rect(s, 0.4, 7.1, 12.5, 0.3, fill_color=CYAN_DARK)
txt(s, "Both APIs called from BACKEND only — API keys are never exposed to the user's browser", 0.6, 7.12, 12, 0.25, size=11, color=BG_DARK, bold=True, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 14 — PDF REPORT
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "📄  One-Click PDF Audit Report", "Professional forensic report — no server needed!")

txt(s, "Export full security audit as PDF directly from browser:", 0.4, 1.65, 12.5, 0.45, size=15, color=GRAY)

# Feature boxes
pdf_features = [
    ("📋  Full Scan Summary", "Target URL, scan time, verdict banner (SAFE/UNSAFE/BROKEN)"),
    ("📊  Metrics Table", "Status code, SSL, domain age, threat score, response time"),
    ("🔍  Threat Matrix", "For APK: all 15 threat vectors with pass/fail status"),
    ("🌍  WHOIS Section", "Domain age, registrar, risk level — all in one document"),
    ("🖥️  Client-side", "Generated by jsPDF in browser — no server upload needed"),
    ("💼  Professional", "Logo header, color-coded verdict, table borders — ready to submit"),
]
for i, (title, desc) in enumerate(pdf_features):
    row = i // 2
    c = i % 2
    x = 0.4 + c * 6.5
    y = 2.2 + row * 1.55
    col = GREEN if i % 3 == 0 else CYAN if i % 3 == 1 else ORANGE
    rect(s, x, y, 6.1, 1.35, fill_color=BG_CARD, border_color=col, border_width=Pt(1.5))
    txt(s, title, x+0.15, y+0.12, 5.8, 0.5, size=14, bold=True, color=col)
    txt(s, desc, x+0.15, y+0.62, 5.8, 0.6, size=13, color=GRAY)

rect(s, 0.4, 6.9, 12.5, 0.45, fill_color=RGBColor(0x05,0x20,0x10), border_color=GREEN)
txt(s, "Available in: Link Checker · Scan Details · APK Scanner · QR Code Scanner", 0.6, 6.98, 12, 0.3, size=12, color=GREEN, align=PP_ALIGN.CENTER, bold=True)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 15 — DASHBOARD
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "📊  Dashboard & Analytics", "Real-time security overview for each user")

metrics = [
    ("🔗", "Total Scans", "All link checks done", CYAN),
    ("✅", "Safe Links", "Clean, accessible URLs", GREEN),
    ("🚨", "Unsafe Threats", "Phishing / malware found", RED),
    ("💀", "Broken Links", "404 / timeout / dead", GRAY),
    ("📱", "APK Scans", "Android apps analyzed", ORANGE),
    ("📷", "QR Scans", "QR codes decoded", PURPLE),
]
for i, (icon, title, desc, col) in enumerate(metrics):
    x = 0.4 + (i % 3) * 4.2
    y = 1.75 + (i // 3) * 2.2
    rect(s, x, y, 3.8, 1.85, fill_color=BG_CARD, border_color=col, border_width=Pt(2))
    txt(s, icon, x+0.2, y+0.2, 0.8, 0.7, size=28, align=PP_ALIGN.CENTER)
    txt(s, title, x+1.1, y+0.22, 2.4, 0.45, size=14, bold=True, color=col)
    txt(s, desc, x+1.1, y+0.72, 2.4, 0.5, size=12, color=GRAY)
    txt(s, "Live Count ↑", x+1.1, y+1.3, 2.4, 0.4, size=12, color=GREEN, italic=True)

rect(s, 0.4, 6.3, 12.5, 0.6, fill_color=BG_CARD, border_color=CYAN_DARK)
txt(s, "📜  Scan History — see all past scans, click any entry to view full forensic details + export PDF", 0.6, 6.42, 12, 0.38, size=13, color=CYAN, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 16 — SECURITY DESIGN
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🔒  Security Design", "How we protect the app & users")

sec_items = [
    ("🧱  SSRF Guard", "Backend blocks private IPs (10.x, 192.168.x, localhost) — hackers can't scan internal networks", RED),
    ("🔑  JWT Auth", "All API routes protected — unauthorized requests get 401 Rejected", CYAN),
    ("🔐  bcrypt Hashing", "Passwords hashed with salt — even if DB is leaked, passwords are safe", GREEN),
    ("🔑  Env Variables", "API keys stored in Vercel env — never in code, never in browser", ORANGE),
    ("🚫  No .env in Git", ".env file in .gitignore — API secrets never committed to GitHub", RED),
    ("⏱️  Rate Limiting", "Scan requests are guarded — prevents API abuse & cost overflow", YELLOW),
]
for i, (title, desc, col) in enumerate(sec_items):
    y = 1.75 + i * 0.88
    rect(s, 0.3, y, 12.5, 0.75, fill_color=BG_CARD, border_color=col, border_width=Pt(1.5))
    txt(s, title, 0.5, y+0.14, 3, 0.45, size=14, bold=True, color=col)
    txt(s, desc, 3.7, y+0.14, 9, 0.45, size=13, color=GRAY)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 17 — DATABASE DESIGN
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🗄️  Database Design — MongoDB Atlas", "Collections & what they store")

collections = [
    ("👤  users", ["_id", "email", "username", "password_hash", "created_at"], GREEN),
    ("🔗  link_scans", ["_id", "user_id", "url", "status_code", "security_verdict", "whois_data", "created_at"], CYAN),
    ("🎣  suspicious_scans", ["_id", "user_id", "url", "risk_level", "risk_factors[]", "whois_data", "created_at"], ORANGE),
    ("📱  apk_scans", ["_id", "user_id", "filename", "verdict", "threat_count", "threats[]", "created_at"], RED),
]
for i, (name, fields, col) in enumerate(collections):
    x = 0.4 + i * 3.2
    rect(s, x, 1.7, 3.0, 5.0, fill_color=BG_CARD, border_color=col, border_width=Pt(2))
    rect(s, x, 1.7, 3.0, 0.55, fill_color=col)
    txt(s, name, x+0.1, 1.78, 2.8, 0.42, size=14, bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
    for j, field in enumerate(fields):
        txt(s, f"  {field}", x+0.1, 2.38 + j*0.58, 2.8, 0.45, size=12, color=WHITE if j%2==0 else GRAY)

rect(s, 0.4, 7.0, 12.5, 0.38, fill_color=BG_CARD, border_color=CYAN_DARK)
txt(s, "Cloud: MongoDB Atlas  ·  Cluster: cluster0.nadpa9b.mongodb.net  ·  DB: broken_link_checker", 0.6, 7.08, 12, 0.25, size=11, color=GRAY, align=PP_ALIGN.CENTER)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 18 — DEPLOYMENT
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "☁️  Deployment Architecture", "GitHub → Vercel auto CI/CD pipeline")

# Flow
deploy_steps = [
    ("💻  Local Dev", "VS Code\nReact + Flask\nVenv"),
    ("📤  Git Push", "git commit\ngit push\norigin main"),
    ("🐙  GitHub", "madesh7890/\nbroken-link-\nchecker"),
    ("⚡  Vercel CI/CD", "Auto build\nDeploy\n~30 seconds"),
    ("🌍  Live App", "https://broken-link-\nchecker-rho.\nvercel.app"),
]
for i, (title, desc) in enumerate(deploy_steps):
    x = 0.4 + i*2.55
    rect(s, x, 1.8, 2.3, 2.2, fill_color=BG_CARD, border_color=CYAN, border_width=Pt(1.5))
    txt(s, title, x+0.05, 1.95, 2.2, 0.55, size=13, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
    txt(s, desc, x+0.05, 2.55, 2.2, 1.35, size=11, color=GRAY, align=PP_ALIGN.CENTER)
    if i < 4:
        txt(s, "▶", x+2.3, 2.7, 0.35, 0.4, size=16, color=GREEN, align=PP_ALIGN.CENTER)

txt(s, "Environment Variables set in Vercel Dashboard (never in code):", 0.4, 4.25, 12.5, 0.45, size=14, bold=True, color=ORANGE)
env_vars = ["MONGO_URI", "MONGO_DB_NAME", "SECRET_KEY", "JWT_SECRET_KEY", "SAFE_BROWSING_API_KEY", "VIRUSTOTAL_API_KEY"]
for i, ev in enumerate(env_vars):
    x = 0.4 + (i % 3) * 4.2
    y = 4.85 + (i // 3) * 0.65
    rect(s, x, y, 3.9, 0.55, fill_color=BG_CARD, border_color=ORANGE, border_width=Pt(1))
    txt(s, f"🔑  {ev}", x+0.15, y+0.1, 3.6, 0.35, size=12, color=ORANGE)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 19 — FULL FEATURE SUMMARY
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
header_band(s, "🏆  Complete Feature Summary", "Everything this app can do")

all_features = [
    ("✅", "User Register / Login", "JWT secure authentication"),
    ("🔗", "Single Link Check", "HTTP + SSL + VirusTotal + Safe Browsing"),
    ("📋", "Batch Link Scan", "Multiple URLs at once"),
    ("🎣", "Phishing Analyzer", "7-point heuristic scoring"),
    ("📱", "APK Scanner", "15+ threat vectors, 50MB"),
    ("📷", "QR Code Scanner", "7 types: UPI, WiFi, vCard, URL…"),
    ("🌍", "WHOIS Lookup", "Domain age via VirusTotal API"),
    ("📄", "PDF Export", "One-click audit report (jsPDF)"),
    ("📊", "Dashboard", "Live scan statistics"),
    ("📜", "Scan History", "All past scans, click for details"),
    ("🔒", "SSRF Guard", "Private IP blocking"),
    ("☁️", "Cloud Deploy", "Vercel + MongoDB Atlas"),
]
for i, (icon, feature, desc) in enumerate(all_features):
    row = i // 3
    col_idx = i % 3
    x = 0.4 + col_idx * 4.3
    y = 1.75 + row * 1.35
    colors = [GREEN, CYAN, ORANGE, RED, PURPLE, YELLOW]
    col = colors[i % len(colors)]
    rect(s, x, y, 4.0, 1.15, fill_color=BG_CARD, border_color=col, border_width=Pt(1.5))
    txt(s, f"{icon}  {feature}", x+0.15, y+0.1, 3.7, 0.45, size=13, bold=True, color=col)
    txt(s, desc, x+0.15, y+0.6, 3.7, 0.45, size=12, color=GRAY)
add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SLIDE 20 — THANK YOU / LIVE DEMO
# ══════════════════════════════════════════════════════
s = add_slide()
bg(s)
accent_bar(s, 0, 0, 13.33, 0.06, CYAN)
accent_bar(s, 0, 7.44, 13.33, 0.06, CYAN)

rect(s, 1, 0.8, 11.33, 5.8, fill_color=BG_CARD)
accent_bar(s, 1, 0.8, 11.33, 0.06, CYAN)
accent_bar(s, 1, 6.54, 11.33, 0.06, CYAN)

txt(s, "🎉  Thank You!", 2, 1.1, 9.33, 1.0, size=48, bold=True, color=CYAN, align=PP_ALIGN.CENTER)
txt(s, "BROKEN LINK CHECKER", 2, 2.0, 9.33, 0.75, size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, "Cyber Security Web Application", 2, 2.7, 9.33, 0.6, size=18, color=GRAY, align=PP_ALIGN.CENTER)

txt(s, "🌐  Live Demo:", 2.5, 3.5, 3, 0.5, size=16, bold=True, color=CYAN)
txt(s, "https://broken-link-checker-rho.vercel.app", 5.0, 3.5, 7, 0.5, size=16, color=GREEN, italic=True)

txt(s, "💻  GitHub:", 2.5, 4.1, 3, 0.5, size=16, bold=True, color=CYAN)
txt(s, "github.com/madesh7890/broken-link-checker", 5.0, 4.1, 7, 0.5, size=16, color=GREEN, italic=True)

txt(s, "📧  Stack:", 2.5, 4.7, 3, 0.5, size=15, bold=True, color=CYAN)
txt(s, "React · Flask · MongoDB Atlas · Vercel · VirusTotal · Google Safe Browsing", 5.0, 4.7, 7.5, 0.5, size=13, color=GRAY)

txt(s, "Questions? 🙋", 4.5, 5.4, 4.5, 0.65, size=20, bold=True, color=YELLOW, align=PP_ALIGN.CENTER)

add_transition(s, "push")


# ══════════════════════════════════════════════════════
#  SAVE
# ══════════════════════════════════════════════════════
out_path = r"e:\broken_link_checker_presentation.pptx"
prs.save(out_path)
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print(f"[OK] PPT saved -> {out_path}")
print(f"     Slides: {len(prs.slides)}")
