using namespace System.Net
param($Request, $TriggerMetadata)

function Send-Response($code, $obj) {
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = $code
        Headers    = @{ "Content-Type" = "application/json" }
        Body       = ($obj | ConvertTo-Json -Depth 5)
    })
}

# 1. Read input (query or body)
$first = $Request.Query.firstName;  if (-not $first) { $first = $Request.Body.firstName }
$last  = $Request.Query.lastName;   if (-not $last)  { $last  = $Request.Body.lastName }
$title = $Request.Query.jobTitle;   if (-not $title) { $title = $Request.Body.jobTitle }
$dept  = $Request.Query.department; if (-not $dept)  { $dept  = $Request.Body.department }

# 2. Safety checks
$allowedDepts = @("Finance","Sales","HR","IT","Operations")
if (-not $first -or -not $last) {
    Send-Response ([HttpStatusCode]::BadRequest) @{ success = $false; reason = "firstName and lastName are required" }; return
}
if ($allowedDepts -notcontains $dept) {
    Send-Response ([HttpStatusCode]::BadRequest) @{ success = $false; reason = "Department must be one of: $($allowedDepts -join ', ')" }; return
}

# 3. Build a clean username: maria.lopez@domain
$domain = "shinwari260.onmicrosoft.com"
$clean  = { param($s) ($s.ToLower() -replace '[^a-z]', '') }
$alias  = "$(& $clean $first).$(& $clean $last)"
$upn    = "$alias@$domain"

# 4. Temporary password (must be changed at first sign-in)
$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
$tempPwd = 'Tmp!' + (-join (1..10 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })) + '9'

try {
    # 5. Token from managed identity
    $tokenUri = "$($env:IDENTITY_ENDPOINT)?resource=https://graph.microsoft.com&api-version=2019-08-01"
    $token = (Invoke-RestMethod -Uri $tokenUri -Headers @{ "X-IDENTITY-HEADER" = $env:IDENTITY_HEADER }).access_token
    $h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

    # 6. Stop if the user already exists
    $exists = $null
    try { $exists = Invoke-RestMethod -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$upn" } catch { }
    if ($exists) {
        Send-Response ([HttpStatusCode]::Conflict) @{ success = $false; upn = $upn; reason = "User already exists. Nothing was changed." }; return
    }

    # 7. Create the user
    $newUser = @{
        accountEnabled    = $true
        displayName       = "$first $last"
        givenName         = $first
        surname           = $last
        jobTitle          = $title
        department        = $dept
        mailNickname      = $alias
        userPrincipalName = $upn
        usageLocation     = "CA"
        passwordProfile   = @{ password = $tempPwd; forceChangePasswordNextSignIn = $true }
    } | ConvertTo-Json
    $u = Invoke-RestMethod -Method Post -Headers $h -Uri "https://graph.microsoft.com/v1.0/users" -Body $newUser

    $steps = @("User created")

    # 8. Add to department group (Dept-Sales etc.)
    try {
        $groupName = "Dept-$dept"
        $g = (Invoke-RestMethod -Headers $h -Uri ("https://graph.microsoft.com/v1.0/groups?`$filter=displayName eq '$groupName'")).value | Select-Object -First 1
        if ($g) {
            $ref = @{ "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/$($u.id)" } | ConvertTo-Json
            Invoke-RestMethod -Method Post -Headers $h -Uri "https://graph.microsoft.com/v1.0/groups/$($g.id)/members/`$ref" -Body $ref | Out-Null
            $steps += "Added to $groupName"
        } else { $steps += "WARNING: group $groupName not found" }
    } catch { $steps += "WARNING: group add failed - $($_.Exception.Message)" }

    # 9. Assign the E5 license
    try {
        $skus = (Invoke-RestMethod -Headers $h -Uri "https://graph.microsoft.com/v1.0/subscribedSkus").value
        $e5 = $skus | Where-Object { $_.skuPartNumber -in @("SPE_E5","ENTERPRISEPREMIUM") } | Select-Object -First 1
        if ($e5) {
            $lic = @{ addLicenses = @(@{ skuId = $e5.skuId }); removeLicenses = @() } | ConvertTo-Json -Depth 4
            Invoke-RestMethod -Method Post -Headers $h -Uri "https://graph.microsoft.com/v1.0/users/$($u.id)/assignLicense" -Body $lic | Out-Null
            $steps += "License assigned: $($e5.skuPartNumber)"
        } else { $steps += "WARNING: E5 license not found" }
    } catch { $steps += "WARNING: license failed - $($_.Exception.Message)" }

    Send-Response ([HttpStatusCode]::OK) @{
        success      = $true
        upn          = $upn
        displayName  = "$first $last"
        tempPassword = $tempPwd
        steps        = ($steps -join "; ")
    }
}
catch {
    Send-Response ([HttpStatusCode]::InternalServerError) @{ success = $false; upn = $upn; reason = $_.Exception.Message }
}