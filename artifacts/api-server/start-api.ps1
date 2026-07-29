$env:NODE_ENV = "development"
$env:PORT = "8080"
$env:GROQ_API_KEY = ""  # Set your Groq API key
$env:GEMINI_API_KEY = ""  # Set your Gemini API key

node --enable-source-maps ./dist/index.mjs
