#!/usr/bin/env python3
"""
Remove alpha channel from app icons
Apple requires app icons to have NO transparency
"""

import os
from PIL import Image

# Directory containing icons
icon_dir = "/Users/caglabuyukkocsutluoglu/Documents/builds/one-sentence-journal/ios/App/App/Assets.xcassets/AppIcon.appiconset"

print("🔧 Removing alpha channel from all app icons...")
print(f"📁 Directory: {icon_dir}\n")

fixed_count = 0
already_ok_count = 0
errors = []

for filename in os.listdir(icon_dir):
    if filename.endswith('.png'):
        filepath = os.path.join(icon_dir, filename)
        
        try:
            # Open image
            img = Image.open(filepath)
            
            # Check if has alpha
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                print(f"✏️  Fixing {filename}...")
                
                # Create RGB image with white background
                if img.mode == 'RGBA':
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    # Paste image on white background using alpha channel as mask
                    background.paste(img, mask=img.split()[3])
                    # Save
                    background.save(filepath, 'PNG', optimize=True)
                elif img.mode == 'LA':
                    # Convert grayscale+alpha to RGB
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    gray = img.convert('L')
                    background.paste(gray)
                    background.save(filepath, 'PNG', optimize=True)
                elif img.mode == 'P':
                    # Convert palette mode with transparency
                    img = img.convert('RGBA')
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                    background.save(filepath, 'PNG', optimize=True)
                    
                fixed_count += 1
            else:
                already_ok_count += 1
                print(f"✅ {filename} (already OK)")
                
        except Exception as e:
            errors.append(f"{filename}: {str(e)}")
            print(f"❌ Error processing {filename}: {e}")

print(f"\n{'='*60}")
print(f"✅ Fixed: {fixed_count} icons")
print(f"✓  Already OK: {already_ok_count} icons")

if errors:
    print(f"❌ Errors: {len(errors)}")
    for error in errors:
        print(f"   - {error}")
else:
    print(f"🎉 All icons processed successfully!")
    
print(f"{'='*60}")
