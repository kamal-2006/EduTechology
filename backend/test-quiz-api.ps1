# Test AI Quiz Generation API
# Replace YOUR_TOKEN with your actual JWT token

$token = "YOUR_TOKEN_HERE"

$body = @{
    concepts = "Java loops, for loops, while loops, nested loops"
    paragraph = ""
    numberOfQuestions = 5
    difficulty = "Medium"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Testing AI Quiz Generation..." -ForegroundColor Cyan
Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/generate-quiz" `
                                  -Method Post `
                                  -Headers $headers `
                                  -Body $body

    Write-Host "`nSuccess!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
