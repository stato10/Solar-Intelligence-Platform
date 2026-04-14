try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/sites' -UseBasicParsing -TimeoutSec 5
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output $r.Content
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
