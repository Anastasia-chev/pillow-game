"""Assemble a truly self-contained game: all faces and the display font are embedded.
Run: python build_game.py
No package install is required to build or play the game.
"""
from pathlib import Path
import base64

root=Path(__file__).parent
html=(root/'game.template.html').read_text()
for token,filename in [('__FONT__','fredoka-semibold.ttf'),('__YANIVO__','yanivo.png'),('__ELISH__','elish.png')]:
    assert html.count(token)==1, f'Expected one {token} placeholder'
    html=html.replace(token,base64.b64encode((root/'assets'/filename).read_bytes()).decode())
license_text=(root/'assets'/'Fredoka-OFL.txt').read_text().replace('--','—')
html=html.replace('</head>',f'<!-- Embedded Fredoka font license\n{license_text}\n-->\n</head>')
for name in ('index.html','Pillow-Panic.html'):
    (root/name).write_text(html)
print(f'Built index.html and Pillow-Panic.html — {len(html.encode())/1024:.0f} KB each, with zero external dependencies.')
