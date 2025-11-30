<#
PowerShell API Test Script for HealthChain Backend

Usage:
1. Open PowerShell in the project folder (backend).
2. If script execution is blocked, run (as Admin):
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
3. Run:
   ./test_api.ps1

This script will:
- Send OTP to the specified phone (demo backend returns the OTP in response)
- Prompt you to enter the OTP
- Verify the OTP and store the JWT token in $token
- Save a sample medical record using the token
- Call the AI diagnosis endpoint using the token

Edit $phone variable below to test other numbers.
#>

# Config
$apiBase = 'http://localhost:4000'
$phone = '+919876543210'
$name = 'Test User'

function SafeInvoke($uri, $method, $body, $headers) {
    try {
        if ($null -ne $headers) {
            return Invoke-RestMethod -Uri $uri -Method $method -Headers $headers -Body $body -ContentType 'application/json'
        } else {
            return Invoke-RestMethod -Uri $uri -Method $method -Body $body -ContentType 'application/json'
        }
    } catch {
        Write-Error "Request to $uri failed: $($_.Exception.Message)"
        return $null
    }
}

Write-Host "[1/4] Sending OTP to $phone..." -ForegroundColor Cyan
$body = @{ phone = $phone; name = $name } | ConvertTo-Json
$resp = SafeInvoke "$apiBase/auth/send-otp" 'Post' $body $null
if ($null -eq $resp) { Write-Error 'Failed to send OTP. Aborting.'; exit 1 }
Write-Host "Response:`n$($resp | ConvertTo-Json -Depth 5)" -ForegroundColor Green

# If backend returns OTP in demo mode, show it
if ($resp.otp) {
    Write-Host "Demo OTP returned by server: $($resp.otp)" -ForegroundColor Yellow
}

$otp = Read-Host -Prompt 'Enter OTP (or paste demo OTP)'

Write-Host "[2/4] Verifying OTP..." -ForegroundColor Cyan
$body = @{ phone = $phone; otp = $otp; name = $name } | ConvertTo-Json
$resp = SafeInvoke "$apiBase/auth/verify-otp" 'Post' $body $null
if ($null -eq $resp -or -not $resp.token) { Write-Error 'OTP verification failed. Aborting.'; exit 1 }
$token = $resp.token
Write-Host "Received JWT token (truncated): $($token.Substring(0,60))..." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

Write-Host "[3/4] Saving sample medical record..." -ForegroundColor Cyan
$recordBody = @{ data = @{ type = 'blood_test'; date = (Get-Date).ToString('o'); results = @{ glucose = 95; hemoglobin = 13.5 } } } | ConvertTo-Json -Depth 5
$resp = SafeInvoke "$apiBase/patient/records/add" 'Post' $recordBody $headers
if ($null -eq $resp) { Write-Error 'Failed to save record'; } else { Write-Host "Saved record:`n$($resp | ConvertTo-Json -Depth 5)" -ForegroundColor Green }

Write-Host "[4/4] Calling AI diagnosis endpoint..." -ForegroundColor Cyan
$aiBody = @{ symptoms = 'chest pain and shortness of breath' } | ConvertTo-Json
$resp = SafeInvoke "$apiBase/ai/diagnose" 'Post' $aiBody $headers
if ($null -eq $resp) { Write-Error 'AI diagnose failed'; } else { Write-Host "AI response:`n$($resp | ConvertTo-Json -Depth 5)" -ForegroundColor Green }

Write-Host 'All tests completed.' -ForegroundColor Magenta
