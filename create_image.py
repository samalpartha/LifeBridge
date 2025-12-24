from PIL import Image, ImageDraw

def create_image():
    img = Image.new('RGB', (200, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Hello World", fill=(0, 0, 0))
    img.save("test_ocr.png")
    print("Created test_ocr.png")

if __name__ == "__main__":
    create_image()
