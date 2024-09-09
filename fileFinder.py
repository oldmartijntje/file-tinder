import os
import json

def load_settings(settings_path):
    try:
        with open(settings_path, 'r') as settings_file:
            settings = json.load(settings_file)
            return settings
    except FileNotFoundError:
        print(f"Settings file not found: {settings_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from settings file: {settings_path}")
        return None

# Define the path to the folder you want to search
id = 0
settings = load_settings('settings.json')
base_directories = settings['startingPaths']
ignorePaths = settings['ignorePaths']
ignoreHiddenFiles = settings['ignoreHiddenFiles']

# Define common image file extensions
image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp']

# List to store found images with their names and paths
image_data = []

# Walk through the directory and subdirectories
for base_directory in base_directories:
    for dirpath, dirnames, filenames in os.walk(base_directory):
        if any(ignorePath in dirpath for ignorePath in ignorePaths):
            continue
        for param in dirpath.split('\\'):
            if param in ignorePaths:
                continue
        
        if ignoreHiddenFiles:
            foundHidden = False
            for param in dirpath.split('\\'):
                if param.startswith('.'):
                    foundHidden = True
                    break     
            if foundHidden:
                continue   


        for filename in filenames:
            # Check if the file has an image extension
            if any(filename.lower().endswith(ext) for ext in image_extensions):
                if filename.startswith('.') and ignoreHiddenFiles:
                    continue
                image_data.append({
                    "name": filename,
                    "path": dirpath,
                    "id": id
                })
                id += 1
                print(f"Found image: {dirpath}\\{filename}")

# Define the JavaScript file output path
output_file = 'image_data.js'

# Write the data to a JavaScript file
with open(output_file, 'w') as js_file:
    js_file.write('const imageData = ')
    json.dump(image_data, js_file, indent=4)
    js_file.write(';')

print(f"Image data exported to {output_file}")
