$env:PORT="8080"
$env:NODE_ENV="development"
if (-not $env:GROQ_API_KEY) { $env:GROQ_API_KEY = Read-Host "Enter GROQ_API_KEY" }
Set-Location "C:\Users\Dell\Desktop\Edu-Platform-Pro\artifacts\api-server"
node --enable-source-maps ./dist/index.mjs
