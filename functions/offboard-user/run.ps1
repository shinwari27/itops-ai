using namespace System.Net
param($Request, $TriggerMetadata)

function Send-Response($code, $obj) {
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = $code
        Headers    = @{ "Content-Type" = "application/json" }
        Body       = ($obj | ConvertTo-Json -Depth 5)
    })
}

# 1. Input + domain safety check
$email = $Request.Query.email
if (-not $email) { $email = $Request.Body.email }
$domain = "@shinwari260.onmicrosoft.com"
if (-not $email -or -not $email.ToLower().EndsWith($domain)) {
    Send-Response ([HttpStatusCode]::BadRequest) @{ success = $false; reason = "Provide an email ending with $domain" }; return
}

# 2. Protected accounts that must NEVER be offboarded
$protectedUsers  = @("e5trail@shinwari260.onmicrosoft.com")
$protectedGroup  = "IT-Admins"
if ($protectedUsers -contains $email.ToLower()) {
    Send-Response ([HttpStatusCode]::Forbidden) @{ success = $false; reason = "Protected admin account. Offboarding refused." }; return
}

try {
    # 3. Token from managed identity
    $tokenUri = "$($env:IDENTITY_ENDPOINT)?resource=https://graph.microsoft.com&api-version=2019-08-01"
    $token = (Invoke-RestMethod -Uri $tokenUri -Headers @{ "X-IDENTITY-HEADER" = $env:IDENTITY_HEADER }).access_token
    $h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

    # 4. Find the user
    $u = Invoke-RestMethod -Headers $h -Uri ("https://graph.microsoft.com/v1.0/users/" + [uri]::EscapeDataString($email) + '?$select=id,displayName,userPrincipalName,accountEnabled,assignedLicenses')

    # 5. Get their groups, and refuse if they are an IT admin
    $groups = (Invoke-RestMethod -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$($u.id)/memberOf/microsoft.graph.group?`$select=id,displayName,groupTypes").value
    if ($groups.displayName -contains $protectedGroup) {
        Send-Response ([HttpStatusCode]::Forbidden) @{ success = $false; upn = $u.userPrincipalName; reason = "User is in $protectedGroup. Offboarding refused." }; return
    }

    $steps = @()

    # 6. Disable the account
    $body = @{ accountEnabled = $false } | ConvertTo-Json
    Invoke-RestMethod -Method Patch -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$($u.id)" -Body $body | Out-Null
    $steps += "Account disabled"

    # 7. Sign out everywhere
    try {
        Invoke-RestMethod -Method Post -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$($u.id)/revokeSignInSessions" | Out-Null
        $steps += "Sessions revoked"
    } catch { $steps += "WARNING: session revoke failed" }

    # 8. Remove from groups (skip dynamic groups - they manage themselves)
    foreach ($g in $groups) {
        if ($g.groupTypes -contains "DynamicMembership") { continue }
        try {
            Invoke-RestMethod -Method Delete -Headers $h -Uri "https://graph.microsoft.com/v1.0/groups/$($g.id)/members/$($u.id)/`$ref" | Out-Null
            $steps += "Removed from $($g.displayName)"
        } catch { $steps += "WARNING: could not remove from $($g.displayName)" }
    }

    # 9. Remove all licenses
    $skuIds = @($u.assignedLicenses | ForEach-Object { "$($_.skuId)" })
    if ($skuIds.Count -gt 0) {
        try {
            $lic = '{"addLicenses":[],"removeLicenses":["' + ($skuIds -join '","') + '"]}'
            Invoke-RestMethod -Method Post -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$($u.id)/assignLicense" -Body $lic | Out-Null
            $steps += "Licenses removed ($($skuIds.Count))"
        } catch { $steps += "WARNING: license removal failed - $($_.ErrorDetails.Message)" }
    } else { $steps += "No licenses to remove" }

    Send-Response ([HttpStatusCode]::OK) @{
        success     = $true
        upn         = $u.userPrincipalName
        displayName = $u.displayName
        steps       = ($steps -join "; ")
    }
}
catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) { Send-Response ([HttpStatusCode]::NotFound) @{ success = $false; reason = "User not found" }; return }
    Send-Response ([HttpStatusCode]::InternalServerError) @{ success = $false; reason = $_.Exception.Message }
}