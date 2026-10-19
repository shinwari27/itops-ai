using namespace System.Net
param($Request, $TriggerMetadata)

function Send-Response($code, $obj) {
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = $code
        Headers    = @{ "Content-Type" = "application/json" }
        Body       = ($obj | ConvertTo-Json -Depth 5)
    })
}

# 1. Read the email (from ?email=... or from the request body)
$email = $Request.Query.email
if (-not $email) { $email = $Request.Body.email }

# 2. Safety: only allow our own company domain
$allowedDomain = "@shinwari260.onmicrosoft.com"
if (-not $email -or -not $email.ToLower().EndsWith($allowedDomain)) {
    Send-Response ([HttpStatusCode]::BadRequest) @{ found = $false; error = "Provide an email ending with $allowedDomain" }
    return
}

try {
    # 3. Get a Graph token using the Function App's managed identity (no password needed)
    $tokenUri = "$($env:IDENTITY_ENDPOINT)?resource=https://graph.microsoft.com&api-version=2019-08-01"
    $token = (Invoke-RestMethod -Uri $tokenUri -Headers @{ "X-IDENTITY-HEADER" = $env:IDENTITY_HEADER }).access_token

    # 4. Ask Graph for the user's details
    $select = 'displayName,userPrincipalName,jobTitle,department,accountEnabled,lastPasswordChangeDateTime'
    $uri = "https://graph.microsoft.com/v1.0/users/$([uri]::EscapeDataString($email))?`$select=$select"
    $u = Invoke-RestMethod -Uri $uri -Headers @{ Authorization = "Bearer $token" }

    Send-Response ([HttpStatusCode]::OK) @{
        found              = $true
        displayName        = $u.displayName
        email              = $u.userPrincipalName
        jobTitle           = $u.jobTitle
        department         = $u.department
        accountEnabled     = $u.accountEnabled
        lastPasswordChange = $u.lastPasswordChangeDateTime
    }
}
catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) {
        Send-Response ([HttpStatusCode]::NotFound) @{ found = $false; error = "User not found" }
        return
    }
    Send-Response ([HttpStatusCode]::InternalServerError) @{ found = $false; error = $_.Exception.Message }
}