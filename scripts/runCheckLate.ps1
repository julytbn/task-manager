# PowerShell script to call the check-late endpoint (for use with Task Scheduler)
# Usage: set environment variable CHECK_LATE_SECRET and run this script

$secret = $env:CHECK_LATE_SECRET
if ([string]::IsNullOrEmpty($secret)) {
  Write-Error "CHECK_LATE_SECRET not set. Set it and retry."
  exit 1
}

$url = "http://localhost:3000/api/paiements/check-late"

try {
  $resp = Invoke-RestMethod -Uri $url -Method GET -Headers @{ 'x-internal-secret' = $secret }
  $json = $resp | ConvertTo-Json -Depth 5
  $out = "$env:TEMP\check-late-result.json"
  $json | Out-File -FilePath $out -Encoding UTF8
  Write-Output "Run finished. Output saved to $out"
  Write-Output $json
} catch {
  Write-Error "Request failed: $_"
  exit 2
}
