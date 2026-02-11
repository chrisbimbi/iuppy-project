import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

URL = "https://staffbase.com/en/"
OUTPUT_DIR = "staffbase_reference_images"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
}

try:
    response = requests.get(URL, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    
    images = soup.find_all("img")
    
    print(f"Found {len(images)} images.")
    
    count = 0
    for img in images:
        src = img.get("src")
        if not src:
            continue
            
        # Handle lazy loading or distinct attributes if needed
        if "data-src" in img.attrs:
            src = img["data-src"]

        full_url = urljoin(URL, src)
        
        try:
            img_data = requests.get(full_url, headers=headers).content
            filename = os.path.join(OUTPUT_DIR, f"image_{count}.jpg")
            
            # Simple filter: only keep decent sized layout images (skip tiny icons)
            if len(img_data) > 20000: 
                with open(filename, "wb") as f:
                    f.write(img_data)
                print(f"Downloaded {filename}")
                count += 1
                if count >= 5: break # Just get the top 5 distinct ones for analysis
        except Exception as e:
            print(f"Failed to download {full_url}: {e}")

except Exception as e:
    print(f"Error scraping: {e}")
