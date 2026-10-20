using namespace System.Net
param($Request, $TriggerMetadata)

function Send-Response($code, $obj) {
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = $code
        Headers    = @{ "Content-Type" = "application/json" }
        Body       = ($obj | ConvertTo-Json -Depth 5)
    })
}

# 1. Input + safety check
$email = $Request.Query.email
if (-not $email) { $email = $Request.Body.email }
$allowedDomain = "@shinwari260.onmicrosoft.com"
if (-not $email -or -not $email.ToLower().EndsWith($allowedDomain)) {
    Send-Response ([HttpStatusCode]::BadRequest) @{ decision = "error"; reason = "Provide an email ending with $allowedDomain" }
    return
}

try {
    # 2. Token from managed identity
    $tokenUri = "$($env:IDENTITY_ENDPOINT)?resource=https://graph.microsoft.com&api-version=2019-08-01"
    $token = (Invoke-RestMethod -Uri $tokenUri -Headers @{ "X-IDENTITY-HEADER" = $env:IDENTITY_HEADER }).access_token
    $h = @{ Authorization = "Bearer $token" }

    # 3. User details
    $u = Invoke-RestMethod -Headers $h -Uri ("https://graph.microsoft.com/v1.0/users/" + [uri]::EscapeDataString($email) + '?$select=id,displayName,userPrincipalName,accountEnabled')

    # 4. Sign-in failures in the last 24 hours
    $locked = 0; $badPwd = 0; $signInCheck = "ok"
    try {
        $since  = (Get-Date).ToUniversalTime().AddHours(-24).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $filter = "userPrincipalName eq '$($u.userPrincipalName)' and createdDateTime ge $since"
        $si = (Invoke-RestMethod -Headers $h -Uri ('https://graph.microsoft.com/v1.0/auditLogs/signIns?$top=50&$filter=' + [uri]::EscapeDataString($filter))).value
        $locked = @($si | Where-Object { $_.status.errorCode -eq 50053 }).Count   # 50053 = account locked
        $badPwd = @($si | Where-Object { $_.status.errorCode -eq 50126 }).Count   # 50126 = wrong password
    } catch { $signInCheck = "unavailable" }

    # 5. Is the user registered for self-service password reset?
    $ssprRegistered = $false
    try {
        $reg = Invoke-RestMethod -Headers $h -Uri "https://graph.microsoft.com/v1.0/reports/authenticationMethods/userRegistrationDetails/$($u.id)"
        $ssprRegistered = [bool]$reg.isSsprRegistered
    } catch { }

    # 6. Decision (safe rules)
    if (-not $u.accountEnabled) {
        $decision = "escalate"; $reason = "Account is disabled. Needs admin review (not auto-enabled for security)."
    } elseif ($locked -gt 0 -and $ssprRegistered) {
        $decision = "self-service"; $reason = "Smart lockout detected. User is SSPR-registered and can reset at aka.ms/sspr or wait 15 minutes."
    } elseif ($locked -gt 0) {
        $decision = "escalate"; $reason = "Smart lockout detected but user is not registered for SSPR. Help Desk must verify identity and reset."
    } else {
        $decision = "guide"; $reason = "No lockout found in the last 24 hours. Likely a typo or saved old password. Send KB0002."
    }

    Send-Response ([HttpStatusCode]::OK) @{
        email            = $u.userPrincipalName
        displayName      = $u.displayName
        accountEnabled   = $u.accountEnabled
        lockoutEvents24h = $locked
        badPassword24h   = $badPwd
        ssprRegistered   = $ssprRegistered
        signInLogCheck   = $signInCheck
        decision         = $decision
        reason           = $reason
    }
}
catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) { Send-Response ([HttpStatusCode]::NotFound) @{ decision = "escalate"; reason = "User not found" }; return }
    Send-Response ([HttpStatusCode]::InternalServerError) @{ decision = "escalate"; reason = $_.Exception.Message }
}