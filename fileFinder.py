import os
import json

# Define the path to the folder you want to search
base_directory = r'C:\Users'

# Define common image file extensions
image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp']

# List to store found images with their names and paths
image_data = []

# Walk through the directory and subdirectories
for dirpath, dirnames, filenames in os.walk(base_directory):
    for filename in filenames:
        # Check if the file has an image extension
        if any(filename.lower().endswith(ext) for ext in image_extensions):
            if filename.startswith('.'):
                continue
            image_data.append({
                "name": filename,
                "path": dirpath
            })
            print(f"Found image: {dirpath}/{filename}")

# Define the JSON file output path
output_file = 'image_data.json'

# Write the data to a JSON file
with open(output_file, 'w') as json_file:
    json.dump(image_data, json_file, indent=4)

print(f"Image data exported to {output_file}")
