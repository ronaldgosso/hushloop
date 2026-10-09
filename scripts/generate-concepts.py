import math
import os

os.makedirs('assets/branding', exist_ok=True)

# -------------------------------------------------------------
# Concept A: "The Focus Aperture" (Concentric Loop & Focal Core)
# -------------------------------------------------------------
# Continuous loop with 28px width, center circle target (r=30).
svg_a = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>FocusDeck — The Focus Aperture</title>
  <path fill-rule="evenodd" d="M 128 28 C 72.772 28 28 72.772 28 128 C 28 183.228 72.772 228 128 228 C 183.228 228 228 183.228 228 128 C 228 102.391 218.361 79.034 202.492 61.353 C 196.538 54.717 186.425 54.195 179.789 60.149 C 173.153 66.103 172.631 76.216 178.585 82.852 C 190.627 96.269 198 111.282 198 128 C 198 166.66 166.66 198 128 198 C 89.34 198 58 166.66 58 128 C 58 89.34 89.34 58 128 58 C 146.732 58 163.766 65.378 176.326 77.425 C 182.68 83.518 192.793 83.221 198.886 76.867 C 204.979 70.513 204.682 60.4 198.328 54.307 C 179.358 36.113 154.912 28 128 28 Z" fill="#000000"/>
  <circle cx="128" cy="128" r="30" fill="#000000"/>
</svg>'''

with open('assets/branding/concept-a.svg', 'w') as f:
    f.write(svg_a)

# -------------------------------------------------------------
# Concept B: The Sonic Shutter (Acoustic Silence + Forward Flow)
# Balanced geometry: Pillar (width 32, height 160), Wedge (width 100, height 160)
svg_b = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>FocusDeck — The Sonic Shutter</title>
  <!-- Left Pillar (Silence / Active Shield) -->
  <rect x="46" y="48" width="32" height="160" rx="16" fill="#000000"/>
  <!-- Right Forward Flow Wedge -->
  <path d="M 106 64 C 106 50 122 41 134 48 L 202 88 C 214 95 214 113 202 120 L 134 160 C 122 167 106 158 106 144 Z" fill="#000000" transform="matrix(1 0 0 1.5 0 -48)"/>
</svg>'''

with open('assets/branding/concept-b.svg', 'w') as f:
    f.write(svg_b)

# Concept C: The Chrono Deck (270° Pomodoro Gauge & Centered Flow Core)
# Symmetrical concentric arc + pure equilateral triangle at exact 30/90/150 degrees
svg_c = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>FocusDeck — The Chrono Deck</title>
  <!-- Symmetrical 270-degree Focus Gauge Arc -->
  <path fill-rule="evenodd" d="M 58 198 C 19 159 19 97 58 58 C 97 19 159 19 198 58 C 204 64 204 74 198 80 C 192 86 182 86 176 80 C 147 51 99 51 80 80 C 51 109 51 147 80 176 C 86 182 86 192 80 198 C 74 204 64 204 58 198 Z" fill="#000000"/>
  <!-- Equilateral triangle (height 68, width 60, clean 30 deg slope) -->
  <path d="M 115 94 C 115 85 125 79 133 83 L 175 107 C 183 111 183 123 175 127 L 133 151 C 125 155 115 149 115 140 Z" fill="#000000"/>
</svg>'''

with open('assets/branding/concept-c.svg', 'w') as f:
    f.write(svg_c)

# -------------------------------------------------------------
# Horizontal Lockups (Symbol + Precision Geometric Wordmark)
# -------------------------------------------------------------
# Height 256, width 800. Symbol on left (256x256), Wordmark on right.
import re

def make_lockup(raw_svg, out_path, mark_title):
    inner = re.sub(r'<svg[^>]*>', '', raw_svg)
    inner = inner.replace('</svg>', '')
    inner = re.sub(r'<title>.*?</title>', '', inner)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 256" width="800" height="256">
  <title>{mark_title} Lockup</title>
  <!-- Symbol scaled and placed at x=40, y=16 (224x224) -->
  <g transform="matrix(0.875 0 0 0.875 40 16)">
    {inner.strip()}
  </g>
  <!-- Wordmark 'FocusDeck' with modern geometric styling -->
  <text x="272" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="82" font-weight="800" letter-spacing="-0.03em" fill="#000000">Focus<tspan font-weight="300" fill="#444444">Deck</tspan></text>
</svg>'''
    with open(out_path, 'w') as f:
        f.write(svg)

# Extract inner contents for lockups
make_lockup(svg_a, 'assets/branding/lockup-a.svg', 'FocusDeck Concept A')
make_lockup(svg_b, 'assets/branding/lockup-b.svg', 'FocusDeck Concept B')
make_lockup(svg_c, 'assets/branding/lockup-c.svg', 'FocusDeck Concept C')

print("Generated all concepts and lockups successfully.")
