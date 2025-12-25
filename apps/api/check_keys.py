import os

def check_keys():
    hf = os.getenv("HF_TOKEN")
    google = os.getenv("GOOGLE_API_KEY")
    
    print(f"HF_TOKEN: {'Present' if hf else 'Missing'}")
    print(f"GOOGLE_API_KEY: {'Present' if google else 'Missing'}")

if __name__ == "__main__":
    check_keys()
