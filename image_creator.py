import os
import requests
import replicate

# Load the API token
api_token = os.getenv("LAB_DISCO_API_KEY")
api = replicate.Client(api_token=api_token)

# Define the prompt
prompt = "Abstract curvilinear intertwined circles in charcoal drawing texture"

# Input parameters for the model
input = {
    "prompt": prompt
}

# Run the Replicate model
output = api.run(
    "stability-ai/stable-diffusion-3.5-large",
    input=input
)

# Save the output images
for index, item in enumerate(output):
    # Assuming the output is a URL, download the image content
    response = requests.get(item)
    if response.status_code == 200:
        with open(f"./images/output_{index}.webp", "wb") as file:
            file.write(response.content)
        print(f"Image saved as output_{index}.webp")
    else:
        print(f"Failed to download image at {item}")
