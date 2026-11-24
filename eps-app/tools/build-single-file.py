"""Assemble l'application en une seule page HTML (CSS et JS intégrés), sans balises
<html>/<head>/<body>, pour la publier comme page hébergée.
Usage : python3 tools/build-single-file.py <fichier-de-sortie.html>"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/styles.css").read_text(encoding="utf-8")
scripts = re.findall(r'<script src="([^"]+)"></script>', html)
body = re.search(r"<body>(.*?)\n\s*<script", html, re.S).group(1)
title = re.search(r"<title>(.*?)</title>", html).group(1)
desc = re.search(r'<meta name="description" content="([^"]*)">', html).group(1)
icon = re.search(r'<link rel="icon" href="([^"]+)">', html).group(1)
js = "\n".join(
    f"/* ---- {s} ---- */\n" + (root / s).read_text(encoding="utf-8").replace("</script", "<\\/script")
    for s in scripts
)
out = f"""<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{icon}">
<style>
:root {{ color-scheme: light; }}
{css}
</style>
{body.strip()}
<script>
{js}
</script>
"""
Path(sys.argv[1]).write_text(out, encoding="utf-8")
print(f"{sys.argv[1]}: {len(out) // 1024} Ko, {len(scripts)} scripts")
