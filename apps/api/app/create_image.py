from PIL import Image, ImageDraw
import os

def create_image():
    # Ensure directory exists
    os.makedirs('app', exist_ok=True)
    img = Image.new('RGB', (200, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Hello World", fill=(0, 0, 0))
    # Save to current directory (which corresponds to /app/app inside container if run from /app)
    # But we are running from /app in container?
    # Let's save to absolute path just in case or just filename
    img.save("test_ocr.png")
    print("Created test_ocr.png")

if __name__ == "__main__":
    create_image()
