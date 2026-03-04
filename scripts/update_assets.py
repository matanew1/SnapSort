import os
from PIL import Image

def resize_image(input_path, output_path, size):
    with Image.open(input_path) as img:
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path)
        print(f"Generated {output_path} with size {size}")

def update_assets():
    icon_new = "/home/ubuntu/SnapSort/assets/images/icon_new.png"
    splash_new = "/home/ubuntu/SnapSort/assets/images/splash_new.png"
    
    # 1. Update Core Images
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/icon.png", (1024, 1024))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/favicon.png", (48, 48))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/android-icon-foreground.png", (1024, 1024))
    # For background, we'll just use a solid dark color or a resized version
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/android-icon-background.png", (1024, 1024))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/android-icon-monochrome.png", (1024, 1024))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/images/splash-icon.png", (1024, 1024))

    # 2. Update Web Assets
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/web/apple-touch-icon.png", (180, 180))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/web/icon-192.png", (192, 192))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/web/icon-192-maskable.png", (192, 192))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/web/icon-512.png", (512, 512))
    resize_image(icon_new, "/home/ubuntu/SnapSort/assets/web/icon-512-maskable.png", (512, 512))
    # Convert PNG to ICO for favicon.ico
    with Image.open(icon_new) as img:
        img.save("/home/ubuntu/SnapSort/assets/web/favicon.ico", format="ICO", sizes=[(32, 32)])

    # 3. Update Android Res
    android_res_path = "/home/ubuntu/SnapSort/assets/android/res"
    sizes = {
        "mipmap-mdpi": (48, 48),
        "mipmap-hdpi": (72, 72),
        "mipmap-xhdpi": (96, 96),
        "mipmap-xxhdpi": (144, 144),
        "mipmap-xxxhdpi": (192, 192)
    }
    for folder, size in sizes.items():
        folder_path = os.path.join(android_res_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        resize_image(icon_new, os.path.join(folder_path, "ic_launcher.png"), size)
        resize_image(icon_new, os.path.join(folder_path, "ic_launcher_foreground.png"), size)
        resize_image(icon_new, os.path.join(folder_path, "ic_launcher_background.png"), size)
        resize_image(icon_new, os.path.join(folder_path, "ic_launcher_monochrome.png"), size)

    # 4. Update iOS Assets
    ios_path = "/home/ubuntu/SnapSort/assets/ios"
    # We'll just update a few key ones or all of them with the same icon for now
    for filename in os.listdir(ios_path):
        if filename.endswith(".png"):
            # Get current size to match
            file_path = os.path.join(ios_path, filename)
            with Image.open(file_path) as img:
                current_size = img.size
            resize_image(icon_new, file_path, current_size)

if __name__ == "__main__":
    update_assets()
