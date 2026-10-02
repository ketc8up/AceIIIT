import sys

with open('index.html', 'r') as f:
    lines = f.readlines()

new_html = """  <!-- Cinematic Loader -->
  <div id="entry-layer-paper" class="entry-layer paper-layer" style="display: flex; align-items: center; justify-content: center; background-color: var(--paper);">
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
  </div>\n"""

# lines 44 to 112 are indices 43 to 111. Let's just locate the exact start and end.
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "<!-- Layer 2: Ink Layer -->" in line:
        start_idx = i
    if '<button id="entry-skip" class="entry-skip">Skip Intro</button>' in line:
        end_idx = i - 1

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_html] + lines[end_idx+1:]
    with open('index.html', 'w') as f:
        f.writelines(lines)
    print("Replaced successfully")
else:
    print("Could not find bounds")
