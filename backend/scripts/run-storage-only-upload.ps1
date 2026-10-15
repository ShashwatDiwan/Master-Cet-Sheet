$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot

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

$env:SUPABASE_URL = Read-Host -Prompt 'Supabase Project URL (https://<project-ref>.supabase.co)'
$env:SUPABASE_SERVICE_ROLE_KEY = Read-Secret 'Supabase service_role key'
$env:SUPABASE_STORAGE_BUCKET = 'cet-resources'

try {
    & (Join-Path $scriptRoot 'upload-storage-only.ps1')
}
finally {
    Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_STORAGE_BUCKET -ErrorAction SilentlyContinue
}
