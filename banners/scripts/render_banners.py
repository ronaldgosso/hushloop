import subprocess
import os

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cwd = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

banners = [
    # Dark OLED Banners
    ("banner-1-flagship.html", "banner-1-flagship.png", (1080, 1920)),
    ("banner-2-soundscape.html", "banner-2-soundscape.png", (1080, 1920)),
    ("banner-3-silencer.html", "banner-3-silencer.png", (1080, 1920)),
    ("banner-4-social-feed.html", "banner-4-social-feed.png", (1080, 1350)),
    # Light Eco-Print Banners
    ("banner-light-1-flagship.html", "banner-light-1-flagship.png", (1080, 1920)),
    ("banner-light-2-soundscape.html", "banner-light-2-soundscape.png", (1080, 1920)),
    ("banner-light-3-silencer.html", "banner-light-3-silencer.png", (1080, 1920)),
    ("banner-light-4-flyer.html", "banner-light-4-flyer.png", (1080, 1350)),
]

for html_file, png_file, (width, height) in banners:
    html_path = os.path.join(cwd, html_file)
    png_path = os.path.join(cwd, png_file)
    file_url = "file:///" + html_path.replace("\\", "/")
    
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        f"--screenshot={png_path}",
        f"--window-size={width},{height}",
        "--hide-scrollbars",
        "--virtual-time-budget=3000",
        file_url
    ]
    print(f"Rendering {html_file} -> {png_file} ({width}x{height})...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Successfully generated {png_file}")
    else:
        print(f"Error generating {png_file}: {res.stderr}")

print("All banners processed!")
