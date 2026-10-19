using namespace System.Net

param($Request, $TriggerMetadata)

$body = @{
    status  = "ok"
    service = "itops-ai-func"
    message = "ITOps AI backend is alive"
    time    = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = [HttpStatusCode]::OK
    Headers    = @{ "Content-Type" = "application/json" }
    Body       = $body
})