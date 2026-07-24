from google import genai

# Initialize the GenAI client using your hackathon project
client = genai.Client(
    vertexai=True,
    project="hack-team-aivanguard",
    location="us-central1"
)

# Call Gemini
response = client.models.generate_content(
    model="gemini-2.5-flash-lite",
    contents="Give me a 1-sentence motivation for our hackathon project!"
)

print("\n--- Gemini Response ---")
print(response.text)