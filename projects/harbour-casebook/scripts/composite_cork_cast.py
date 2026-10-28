from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import os

def create_mini_polaroid(img_path, width=72, height=92, angle=0):
    img = Image.open(img_path).convert('RGB')
    # Convert to vintage black-and-white / sepia
    gray = img.convert('L')
    # Warm sepia tone
    sepia = Image.merge('RGB', [
        gray.point(lambda p: min(255, int(p * 1.1 + 18))),
        gray.point(lambda p: min(255, int(p * 0.98 + 10))),
        gray.point(lambda p: min(255, int(p * 0.82 + 2)))
    ])
    
    # Scale to inner photo size
    photo_w = width - 12
    photo_h = height - 26
    scaled_photo = sepia.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
    
    # Create polaroid backing
    card = Image.new('RGBA', (width, height), (245, 238, 224, 255))
    card.paste(scaled_photo, (6, 6))
    
    # Draw tiny red pushpin at top center
    draw = ImageDraw.Draw(card)
    draw.ellipse((width//2 - 4, 1, width//2 + 4, 9), fill=(168, 48, 36, 255), outline=(90, 20, 15, 255))
    draw.ellipse((width//2 - 2, 3, width//2 + 1, 6), fill=(240, 120, 100, 255)) # pin highlight
    
    # Add subtle aged border
    draw.rectangle([0, 0, width-1, height-1], outline=(180, 165, 145, 200), width=1)
    
    if angle != 0:
        card = card.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    return card

def main():
    hub_path = "assets/art/desk_hub.webp"
    if not os.path.exists(hub_path):
        print("Missing desk_hub.webp")
        return
        
    hub = Image.open(hub_path).convert('RGBA')
    
    # Load 4 Case 1 Chinese cast portraits
    p1 = create_mini_polaroid("assets/portraits/chan_tak_sang.webp", width=74, height=94, angle=-3)
    p2 = create_mini_polaroid("assets/portraits/ho_bing.webp", width=72, height=92, angle=2)
    p3 = create_mini_polaroid("assets/portraits/pak_lan.webp", width=72, height=92, angle=-2)
    p4 = create_mini_polaroid("assets/portraits/leung_ah_sei.webp", width=74, height=94, angle=4)
    
    # Positions on the corkboard in desk_hub (x in 50..260, y in 310..550)
    # Arrange in a 2x2 grid pinned on the corkboard
    positions = [
        (p1, (58, 335)),
        (p2, (158, 330)),
        (p3, (54, 445)),
        (p4, (160, 440)),
    ]
    
    for polaroid, (x, y) in positions:
        # Create subtle drop shadow
        shadow = Image.new('RGBA', polaroid.size, (0, 0, 0, 120))
        shadow = shadow.filter(ImageFilter.GaussianBlur(3))
        hub.paste(shadow, (x + 3, y + 4), shadow)
        hub.paste(polaroid, (x, y), polaroid)
        
    # Apply warm desk lamp ambient grading over the corkboard area
    # Re-save desk_hub.webp and desk_hub.jpg
    hub_rgb = hub.convert('RGB')
    hub_rgb.save("assets/art/desk_hub.webp", "WEBP", quality=92)
    hub_rgb.save("assets/art/desk_hub.jpg", "JPEG", quality=92)
    print("Successfully updated desk_hub.webp corkboard photos with 1962 Macau Chinese cast!")

if __name__ == '__main__':
    main()
