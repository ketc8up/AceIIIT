import re

with open('/home/arco/Documents/AceIIIT/index.html', 'r') as f:
    content = f.read()

# We want to replace the premium-system-section block with the manifesto block
# It starts with <section class="premium-system-section" id="system">
# And ends with </section> before <!-- Phase 5: Trust & Credentials Section -->

start_marker = '<section class="premium-system-section" id="system">'
end_marker = '<!-- Phase 5: Trust & Credentials Section -->'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    manifesto_html = """<!-- Phase 4: Manifesto Section -->
  <section class="manifesto-section" aria-labelledby="manifesto-heading">
    <div class="manifesto-container">
      <p class="manifesto-eyebrow manifesto-reveal manifesto-delay-1">A message to every 95–98 percentiler</p>
      
      <h2 id="manifesto-heading" class="manifesto-headline manifesto-reveal manifesto-delay-2">
        <span>YOU</span>
        <span>FAILED THE</span>
        <span class="struck">RIGHT</span>
        <span>WRONG</span>
        <span>EXAM.</span>
      </h2>
      
      <p class="manifesto-sub manifesto-reveal manifesto-delay-3">
        You didn't fail JEE.<br>
        JEE failed to test <em>YOU.</em>
      </p>
    </div>
  </section>

  """
    
    new_content = content[:start_idx] + manifesto_html + content[end_idx:]
    
    with open('/home/arco/Documents/AceIIIT/index.html', 'w') as f:
        f.write(new_content)
    print("Successfully replaced system section with manifesto section.")
else:
    print("Could not find markers.")
