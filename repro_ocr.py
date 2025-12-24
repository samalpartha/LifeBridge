import requests
import io
from PIL import Image, ImageDraw

def create_test_image():
    img = Image.new('RGB', (200, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Hello World", fill=(0, 0, 0))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_upload():
    # create a case first
    api_base = "http://localhost:8000"
    print("Creating case...")
    res = requests.post(f"{api_base}/cases", json={"title": "Test OCR", "scenario": "travel"})
    if not res.ok:
        print(f"Failed to create case: {res.text}")
        return
    
    case_id = res.json()["id"]
    print(f"Case created: {case_id}")
    
    # upload image
    print("Uploading image...")
    img_data = create_test_image()
    files = {"file": ("test.png", img_data, "image/png")}
    
    res = requests.post(f"{api_base}/cases/{case_id}/documents", files=files)
    if res.ok:
        print("Upload successful")
        print(res.json())
        
        # Check if text was extracted (response should contain chunk count)
        # We might need to check logs to be sure of the CONTENT of the text
    else:
        print(f"Upload failed: {res.text}")

if __name__ == "__main__":
    test_upload()
