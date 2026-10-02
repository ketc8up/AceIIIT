import re
import base64
import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all base64 images
imgs = re.findall(r'src="data:image/(jpeg|png);base64,([^"]+)"', content)

if len(imgs) >= 2:
    # First is Uman, second is Priyanshu
    uman_data = base64.b64decode(imgs[0][1])
    priyan_data = base64.b64decode(imgs[1][1])
    
    os.makedirs('assets/images', exist_ok=True)
    
    with open('assets/images/uman.jpg', 'wb') as f:
        f.write(uman_data)
        
    with open('assets/images/priyanshu.jpg', 'wb') as f:
        f.write(priyan_data)
        
    print("Successfully extracted images.")
else:
    print(f"Found only {len(imgs)} images.")
