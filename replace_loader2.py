import subprocess
import re

# 1. Get the original cinematic loader from git
original_html = subprocess.check_output(['git', 'show', 'HEAD:index.html']).decode('utf-8')

# Extract the cinematic loader part
start_marker = "<!-- Layer 2: Ink Layer -->"
end_marker = '<button id="entry-skip" class="entry-skip">Skip Intro</button>'

start_idx = original_html.find(start_marker)
end_idx = original_html.find(end_marker)

cinematic_loader = original_html[start_idx:end_idx]

svg_loader = """  <!-- SVG Loader -->
  <div id="entry-layer-svg" class="entry-layer svg-layer" style="display: flex; align-items: center; justify-content: center; background-color: var(--paper); z-index: 10000; position: fixed; inset: 0;">
    <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <svg
        viewBox="110 250 880 400"
        class="aceiiit-loader"
        role="img"
        aria-label="Loading"
      >
        <path d="M132 623L152 383H238L260 623H216L211 585H186L178 623Z M187 545H207L197 425Z" pathLength="1" class="ace-part ace-g1" stroke="#000" fill="#000" fill-rule="evenodd" />
        <path d="M335 413C300 413 275 440 275 480V560C275 600 300 625 335 625C370 625 395 605 395 580V545H350V570C350 580 342 585 335 585C328 585 322 580 322 570V470C322 460 328 455 335 455C342 455 350 460 350 470V490H395V460C395 430 370 413 335 413Z" pathLength="1" class="ace-part ace-g1" stroke="#000" fill="#000" fill-rule="evenodd" />
        <path d="M475 413C440 413 415 435 415 470V570C415 605 440 625 475 625C510 625 535 605 535 575V545H490V570C490 580 484 585 475 585C466 585 462 580 462 570V505H535V470C535 435 510 413 475 413Z M462 500V465C462 458 468 453 475 453C482 453 488 458 488 465V500Z" pathLength="1" class="ace-part ace-g1" stroke="#000" fill="#000" fill-rule="evenodd" />
        
        <path d="M555 383H607V623H555Z" pathLength="1" class="ace-part ace-g2" stroke="#C8982D" fill="#C8982D" fill-rule="evenodd" />
        <path d="M618 383H663V623H618Z" pathLength="1" class="ace-part ace-g2" stroke="#C8982D" fill="#C8982D" fill-rule="evenodd" />
        <path d="M683 383H727V623H683Z" pathLength="1" class="ace-part ace-g2" stroke="#C8982D" fill="#C8982D" fill-rule="evenodd" />
        
        <path d="M742 383H847V425H820V623H770V425H742Z" pathLength="1" class="ace-part ace-g3" stroke="#C8982D" fill="#C8982D" fill-rule="evenodd" />
        
        <path d="M800 335C820 322 860 305 900 292C925 292 940 305 938 318C930 340 925 360 920 385C915 405 910 425 898 440H888C888 420 885 410 880 400L868 360C860 350 850 345 830 342C815 342 805 340 800 335Z" pathLength="1" class="ace-part ace-g4" stroke="#E23B3B" fill="#E23B3B" fill-rule="evenodd" />
      </svg>
    </div>
  </div>
"""

# Replace the current index.html loader with BOTH
with open('index.html', 'r') as f:
    content = f.read()

# We need to find the current loader to replace it
curr_start = "<!-- Cinematic Loader -->"
curr_end = '<button id="entry-skip" class="entry-skip">Skip Intro</button>'

idx1 = content.find(curr_start)
idx2 = content.find(curr_end)

if idx1 != -1 and idx2 != -1:
    new_content = content[:idx1] + cinematic_loader + "\n" + svg_loader + "\n  " + content[idx2:]
    with open('index.html', 'w') as f:
        f.write(new_content)
    print("Updated index.html")
else:
    print("Could not find bounds in index.html")

