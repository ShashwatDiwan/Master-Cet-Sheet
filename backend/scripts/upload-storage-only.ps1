[CmdletBinding()]
param(
    [string]$ManifestPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\resource-upload-manifest-verified-52.json')
)

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1 does not always preload this assembly.
Add-Type -AssemblyName System.Net.Http

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_URL) -or [string]::IsNullOrWhiteSpace($env:SUPABASE_SERVICE_ROLE_KEY)) {
    throw 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be supplied as environment variables.'
}
if (-not (Test-Path -LiteralPath $ManifestPath)) {
    throw "Manifest not found: $ManifestPath"
}

$bucket = if ([string]::IsNullOrWhiteSpace($env:SUPABASE_STORAGE_BUCKET)) { 'cet-resources' } else { $env:SUPABASE_STORAGE_BUCKET }
$baseUrl = $env:SUPABASE_URL.TrimEnd('/')
$apiKey = $env:SUPABASE_SERVICE_ROLE_KEY
$manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json

function Get-ObjectKey($entry) {
    $subject = ([string]$entry.subject).Trim().ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $subject = $subject.Trim('-')
    if ([string]::IsNullOrWhiteSpace($subject)) { $subject = 'unknown' }
    $type = ([string]$entry.type).Trim().ToLowerInvariant()
    return "resources/$subject/chapter-$($entry.chapterId)/$type/resource-$($entry.resourceId)/v$($entry.version).pdf"
}

function Get-EncodedObjectPath([string]$objectKey) {
    $encodedPath = (($objectKey -split '/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    return "$bucket/$encodedPath"
}

function Get-AuthenticatedObjectUrl([string]$objectKey) {
    return "$baseUrl/storage/v1/object/authenticated/$(Get-EncodedObjectPath $objectKey)"
}

function Get-UploadUrl([string]$objectKey) {
    return "$baseUrl/storage/v1/object/$(Get-EncodedObjectPath $objectKey)"
}

function New-Request([System.Net.Http.HttpMethod]$method, [string]$url) {
    $request = [System.Net.Http.HttpRequestMessage]::new($method, $url)
    [void]$request.Headers.TryAddWithoutValidation('apikey', $apiKey)
    [void]$request.Headers.TryAddWithoutValidation('Authorization', "Bearer $apiKey")
    return $request
}

function Get-RemoteHash([System.Net.Http.HttpClient]$client, [string]$url) {
    $request = New-Request ([System.Net.Http.HttpMethod]::Get) $url
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    try {
        if (-not $response.IsSuccessStatusCode) {
            return @{ Exists = $false; Status = [int]$response.StatusCode }
        }
        $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try {
            $sha256 = $hasher.ComputeHash($bytes)
        }
        finally {
            $hasher.Dispose()
        }
        $hex = -join ($sha256 | ForEach-Object { $_.ToString('x2') })
        return @{ Exists = $true; Status = [int]$response.StatusCode; SizeBytes = [int64]$bytes.Length; Sha256 = $hex }
    }
    finally {
        $response.Dispose()
        $request.Dispose()
    }
}

$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromMinutes(5)
$records = [System.Collections.Generic.List[object]]::new()

try {
    foreach ($entry in $manifest) {
        $source = [string]$entry.sourcePath
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
            throw "Local PDF not found: $source"
        }
        $localInfo = Get-Item -LiteralPath $source
        $localHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
        $objectKey = Get-ObjectKey $entry
        $downloadUrl = Get-AuthenticatedObjectUrl $objectKey
        $uploadUrl = Get-UploadUrl $objectKey

        $remote = Get-RemoteHash $client $downloadUrl
        if ($remote.Exists) {
            if ($remote.SizeBytes -ne $localInfo.Length -or $remote.Sha256 -ne $localHash) {
                throw "Existing object differs from local PDF: $objectKey"
            }
            Write-Host "Verified existing resource $($entry.resourceId): $objectKey"
        }
        else {
            $request = New-Request ([System.Net.Http.HttpMethod]::Put) $uploadUrl
            $request.Headers.Add('x-upsert', 'false')
            $stream = [System.IO.File]::OpenRead($source)
            $content = [System.Net.Http.StreamContent]::new($stream)
            $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/pdf')
            $request.Content = $content
            $response = $null
            try {
                $response = $client.SendAsync($request).GetAwaiter().GetResult()
                if (-not $response.IsSuccessStatusCode) {
                    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                    throw "Storage upload failed for $objectKey (HTTP $([int]$response.StatusCode)): $body"
                }
            }
            finally {
                if ($null -ne $response) { $response.Dispose() }
                $content.Dispose()
                $stream.Dispose()
                $request.Dispose()
            }

            $remote = Get-RemoteHash $client $downloadUrl
            if (-not $remote.Exists -or $remote.SizeBytes -ne $localInfo.Length -or $remote.Sha256 -ne $localHash) {
                throw "Storage verification failed for $objectKey"
            }
            Write-Host "Uploaded and verified resource $($entry.resourceId): $objectKey"
        }

        $records.Add([pscustomobject]@{
            ResourceId = [int]$entry.resourceId
            ObjectKey = $objectKey
            Version = [int]$entry.version
            SizeBytes = [int64]$localInfo.Length
            Sha256 = $localHash
        })
    }

    $sqlPath = Join-Path (Split-Path -Parent $ManifestPath) 'register-verified-52-resource-files.sql'
    $values = $records | ForEach-Object {
        $key = $_.ObjectKey.Replace("'", "''")
        "    ($($_.ResourceId), '$key', $($_.Version), 'application/pdf', $($_.SizeBytes), '$($_.Sha256)', CURRENT_TIMESTAMP)"
    }
    $sql = @(
        'BEGIN;',
        '',
        'INSERT INTO resource_files (resource_id, object_key, version, content_type, size_bytes, sha256, uploaded_at)',
        'VALUES',
        ($values -join ",`n"),
        'ON CONFLICT (resource_id) DO UPDATE SET',
        '    object_key = EXCLUDED.object_key,',
        '    version = EXCLUDED.version,',
        '    content_type = EXCLUDED.content_type,',
        '    size_bytes = EXCLUDED.size_bytes,',
        '    sha256 = EXCLUDED.sha256,',
        '    uploaded_at = EXCLUDED.uploaded_at;',
        '',
        'COMMIT;'
    ) -join "`n"
    [System.IO.File]::WriteAllText($sqlPath, $sql, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Storage upload completed and verified for $($records.Count) files."
    Write-Host "Render registration SQL written to: $sqlPath"
}
finally {
    $client.Dispose()
}
