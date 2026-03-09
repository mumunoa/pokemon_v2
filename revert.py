import re

with open('mockup/style.css', 'r') as f:
    css = f.read()

# Revert variables to pixels
css = css.replace('var(--cw-base)', '60px')
css = css.replace('var(--cw-active)', '80px')
css = css.replace('var(--cw-hand)', '100px')

css = css.replace('height: var(--hand-area-h);\n  min-height: var(--hand-area-h);', 'height: 120px;\n  min-height: 120px;')
css = css.replace('height: var(--hand-area-h);\n    min-height: var(--hand-area-h);', 'height: 160px;\n    min-height: 160px;')
css = css.replace('var(--hand-area-h)', '120px')

# Remove variable declarations
css = re.sub(r'\s*--cw-base:.*?\n', '\n', css)
css = re.sub(r'\s*--cw-active:.*?\n', '\n', css)
css = re.sub(r'\s*--cw-hand:.*?\n', '\n', css)
css = re.sub(r'\s*--hand-area-h:.*?\n', '\n', css)

# Revert battle-arena
css = css.replace('overflow: hidden;\n  /* Scrollbar styling */', 'overflow-y: auto;\n  /* Scrollbar styling */')

# Revert field min-height
css = css.replace('min-height: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  gap: 10px;\n  border-radius: 16px;', 'min-height: min-content;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  gap: 10px;\n  border-radius: 16px;')

with open('mockup/style.css', 'w') as f:
    f.write(css)

