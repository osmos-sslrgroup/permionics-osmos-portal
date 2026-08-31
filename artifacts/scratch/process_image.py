import os
from PIL import Image

def make_transparent_and_crop(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # If the pixel is very close to white, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Find bounding box of non-transparent area
    bbox = img.getbbox()
    if bbox:
        # Crop to bounding box
        img_cropped = img.crop(bbox)
        # Add a tiny padding around it so it doesn't touch the edges (e.g. 5% padding)
        w, h = img_cropped.size
        padding = int(min(w, h) * 0.05)
        new_img = Image.new("RGBA", (w + padding * 2, h + padding * 2), (255, 255, 255, 0))
        new_img.paste(img_cropped, (padding, padding))
        new_img.save(output_path, "PNG")
        print(f"Saved cropped transparent image to {output_path} with size {new_img.size}")
    else:
        img.save(output_path, "PNG")
        print(f"No non-transparent pixels found. Saved full image to {output_path}")

if __name__ == "__main__":
    src = "/Users/lav/Downloads/Permionics-Insights-Hub/attached_assets/osmos_logo_blue.png"
    dest = "/Users/lav/Downloads/Permionics-Insights-Hub/attached_assets/osmos_logo_blue_transparent.png"
    make_transparent_and_crop(src, dest)
