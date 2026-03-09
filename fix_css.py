import re

with open('mockup/style.css', 'r') as f:
    css = f.read()

# Replace :root
root_repl = """  --card-ratio: 1.4;
  --cw-base: min(12vw, 9vh, 70px);
  --cw-active: min(14vw, 12vh, 90px);
  --cw-hand: min(14vw, 12vh, 90px);
  --hand-area-h: calc(var(--cw-hand) * var(--card-ratio) + 30px);
"""
css = re.sub(r'  --card-ratio: 1\.4;', root_repl, css)

# Replace generic 60px zones
css = css.replace("width: 60px;", "width: var(--cw-base);")
css = css.replace("  height: calc(60px * var(--card-ratio));", "  height: calc(var(--cw-base) * var(--card-ratio));")
css = css.replace("  height: 60px;", "  height: var(--cw-base);")
css = css.replace("calc(60px * var(--card-ratio))", "calc(var(--cw-base) * var(--card-ratio))")
css = css.replace("calc(60px + 30px)", "calc(var(--cw-base) + 30px)")

# Replace 80px zones (Active and Desktop rules)
css = css.replace("width: 80px;", "width: var(--cw-active);")
css = css.replace("  height: calc(80px * var(--card-ratio));", "  height: calc(var(--cw-active) * var(--card-ratio));")
css = css.replace("  height: 80px;", "  height: var(--cw-active);")
css = css.replace("calc(80px * var(--card-ratio))", "calc(var(--cw-active) * var(--card-ratio))")
css = css.replace("calc(80px + 30px)", "calc(var(--cw-active) + 30px)")

# Replace 100px zones (Active / Hand on Desktop rules)
css = css.replace("width: 100px;", "width: var(--cw-hand);")
css = css.replace("  height: calc(100px * var(--card-ratio));", "  height: calc(var(--cw-hand) * var(--card-ratio));")
css = css.replace("  height: 100px;", "  height: var(--cw-hand);")
css = css.replace("calc(100px * var(--card-ratio))", "calc(var(--cw-hand) * var(--card-ratio))")

# Hand area heights
css = re.sub(r'height: 120px;\n\s*min-height: 120px;', 'height: var(--hand-area-h);\n  min-height: var(--hand-area-h);', css)
css = re.sub(r'height: 160px;\n\s*min-height: 160px;', 'height: var(--hand-area-h);\n    min-height: var(--hand-area-h);', css)

# Field min constraints removal so it can scale
css = css.replace("min-height: min-content;", "min-height: 0;")

# Battle arena overflow
css = css.replace("overflow-y: auto;", "overflow: hidden;")

with open('mockup/style.css', 'w') as f:
    f.write(css)
