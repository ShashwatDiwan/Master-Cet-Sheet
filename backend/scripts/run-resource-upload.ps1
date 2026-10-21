[CmdletBinding()]
param(
    [switch]$Execute
)

$ErrorActionPreference = 'Stop'
$backendRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $backendRoot 'docs\resource-upload-manifest-verified-52.json'

function Read-Secret([string]$Prompt) {
    $secureValue = Read-Host -Prompt $Prompt -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Verified upload manifest was not found: $manifestPath"
}

Write-Host ''
Write-Host 'This runs on this computer, not on Render.' -ForegroundColor Cyan
Write-Host "Mode: $(if ($Execute) { 'REAL UPLOAD (52 PDFs)' } else { 'DRY RUN (no files or database rows changed)' })" -ForegroundColor Yellow
Write-Host ''

# Use the same Render PostgreSQL connection values that the live service uses.
$env:DB_URL = Read-Host -Prompt 'Render DB_URL'
$env:DB_USERNAME = Read-Host -Prompt 'Render DB_USERNAME'
$env:DB_PASSWORD = Read-Secret 'Render DB_PASSWORD'
$env:APP_JWT_SECRET = Read-Secret 'Render APP_JWT_SECRET'

# These are Supabase Storage credentials only; they do not replace the Render database.
$env:SUPABASE_URL = Read-Host -Prompt 'Supabase project URL'
$env:SUPABASE_SERVICE_ROLE_KEY = Read-Secret 'Supabase service_role key'
$env:SUPABASE_STORAGE_BUCKET = 'cet-resources'
$env:SUPABASE_SIGNED_URL_TTL_SECONDS = '3600'
$env:SUPABASE_STORAGE_MAX_FILE_BYTES = '52428800'

# Keep this one-shot local process isolated from migration and cache behavior.
$env:FLYWAY_ENABLED = 'false'
$env:JPA_DDL_AUTO = 'validate'
$env:APP_CACHE_SHEET_CATALOG_ENABLED = 'false'
$env:APP_CACHE_SHEET_CATALOG_WARM_ON_STARTUP = 'false'
$env:RESOURCE_UPLOAD_ENABLED = 'true'
$env:RESOURCE_UPLOAD_DRY_RUN = if ($Execute) { 'false' } else { 'true' }
$env:RESOURCE_UPLOAD_MANIFEST = $manifestPath
$env:SERVER_PORT = '0'

try {
    Push-Location $backendRoot
    & .\mvnw.cmd spring-boot:run
}
finally {
    Pop-Location
    @(
        'DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'APP_JWT_SECRET',
        'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET',
        'SUPABASE_SIGNED_URL_TTL_SECONDS', 'SUPABASE_STORAGE_MAX_FILE_BYTES',
        'FLYWAY_ENABLED', 'JPA_DDL_AUTO',
        'APP_CACHE_SHEET_CATALOG_ENABLED', 'APP_CACHE_SHEET_CATALOG_WARM_ON_STARTUP',
        'RESOURCE_UPLOAD_ENABLED', 'RESOURCE_UPLOAD_DRY_RUN', 'RESOURCE_UPLOAD_MANIFEST',
        'SERVER_PORT'
    ) | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}
