import math
import os

os.makedirs('assets/branding', exist_ok=True)

# -------------------------------------------------------------
# HushLoop Concept 1: "The Infinite Hush" (Mobius Flow / H + L loop)
# -------------------------------------------------------------
svg_hushloop_1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>HushLoop — The Infinite Hush</title>
  <!-- Continuous infinity loop with 28px uniform line weight -->
  <path fill-rule="evenodd" d="M 80 84 C 55.7 84 36 103.7 36 128 C 36 152.3 55.7 172 80 172 C 102.5 172 120.3 155.2 128 139.8 C 135.7 155.2 153.5 172 176 172 C 200.3 172 220 152.3 220 128 C 220 103.7 200.3 84 176 84 C 153.5 84 135.7 100.8 128 116.2 C 120.3 100.8 102.5 84 80 84 Z M 80 112 C 71.2 112 64 119.2 64 128 C 64 136.8 71.2 144 80 144 C 91.5 144 102.8 134.4 108.6 128 C 102.8 121.6 91.5 112 80 112 Z M 176 112 C 164.5 112 153.2 121.6 147.4 128 C 153.2 134.4 164.5 144 176 144 C 184.8 144 192 136.8 192 128 C 192 119.2 184.8 112 176 112 Z" fill="#000000"/>
</svg>'''

# -------------------------------------------------------------
# HushLoop Concept 2: "The Hush Wave Loop" (Acoustic Wave into Silent Orbit)
# -------------------------------------------------------------
svg_hushloop_2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>HushLoop — The Acoustic Loop</title>
  <!-- Outer unbroken focus ring -->
  <path fill-rule="evenodd" d="M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.02 74.98 224 128 224 C 181.02 224 224 181.02 224 128 C 224 74.98 181.02 32 128 32 Z M 128 60 C 165.55 60 196 90.45 196 128 C 196 165.55 165.55 196 128 196 C 90.45 196 60 165.55 60 128 C 60 90.45 90.45 60 128 60 Z" fill="#000000"/>
  <!-- Central Sound-Damping Bar (Hush line): vertical pill attenuating sound -->
  <rect x="96" y="96" width="18" height="64" rx="9" fill="#000000"/>
  <rect x="122" y="80" width="18" height="96" rx="9" fill="#000000"/>
  <rect x="148" y="104" width="18" height="48" rx="9" fill="#000000"/>
</svg>'''

# -------------------------------------------------------------
# HushLoop Concept 3: "The H-L Monogram Ribbon"
# -------------------------------------------------------------
svg_hushloop_3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>HushLoop — H-L Monogram Loop</title>
  <!-- Left tall stem of 'h' (Hush) connected through a circular arch into an 'L' foot (Loop) -->
  <path fill-rule="evenodd" d="M 64 48 C 64 37 73 28 84 28 C 95 28 104 37 104 48 L 104 104 C 114 92 129 84 146 84 C 178 84 204 110 204 142 L 204 184 C 204 195 195 204 184 204 L 104 204 C 82 204 64 186 64 164 L 64 48 Z M 104 146 L 104 164 C 104 168 107 172 112 172 L 164 172 L 164 142 C 164 132 156 124 146 124 C 136 124 128 132 128 142 L 128 146 L 104 146 Z" fill="#000000"/>
</svg>'''

with open('assets/branding/concept-hushloop-1.svg', 'w') as f:
    f.write(svg_hushloop_1)
with open('assets/branding/concept-hushloop-2.svg', 'w') as f:
    f.write(svg_hushloop_2)
with open('assets/branding/concept-hushloop-3.svg', 'w') as f:
    f.write(svg_hushloop_3)

import re

# Lockup generator with wordmark 'HushLoop'
def make_hushloop_lockup(raw_svg, out_path, mark_title):
    inner = re.sub(r'<svg[^>]*>', '', raw_svg)
    inner = inner.replace('</svg>', '')
    inner = re.sub(r'<title>.*?</title>', '', inner)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 256" width="800" height="256">
  <title>{mark_title} Lockup</title>
  <g transform="matrix(0.875 0 0 0.875 40 16)">
    {inner.strip()}
  </g>
  <text x="272" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="82" font-weight="800" letter-spacing="-0.03em" fill="#000000">Hush<tspan font-weight="300" fill="#444444">Loop</tspan></text>
</svg>'''
    with open(out_path, 'w') as f:
        f.write(svg)

make_hushloop_lockup(svg_hushloop_1, 'assets/branding/lockup-hushloop-1.svg', 'HushLoop Concept 1')
make_hushloop_lockup(svg_hushloop_2, 'assets/branding/lockup-hushloop-2.svg', 'HushLoop Concept 2')
make_hushloop_lockup(svg_hushloop_3, 'assets/branding/lockup-hushloop-3.svg', 'HushLoop Concept 3')

print("Generated HushLoop concepts successfully.")
