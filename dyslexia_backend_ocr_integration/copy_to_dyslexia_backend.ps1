# Run from DyslexAI project root:
#   .\dyslexia_backend_ocr_integration\copy_to_dyslexia_backend.ps1 -Target "C:\path\to\dyslexia-backend"
param(
    [Parameter(Mandatory=$true)]
    [string]$Target
)

$src = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $src "backend"
$targetApp = Join-Path $Target "app"

$dirs = @(
    @{ From = "app\ocr"; To = "app\ocr" },
    @{ From = "app\correction"; To = "app\correction" },
    @{ From = "app\utils"; To = "app\utils" },
    @{ From = "app\pipeline"; To = "app\pipeline" }
)

foreach ($d in $dirs) {
    $subdir = $d.From -replace "^app\\", ""
    $from = Join-Path (Join-Path $backend "app") $subdir
    $to = Join-Path (Join-Path $Target "app") $subdir
    if (Test-Path $from) {
        New-Item -ItemType Directory -Path (Split-Path $to) -Force | Out-Null
        Copy-Item -Path "$from\*" -Destination $to -Recurse -Force
        Write-Host "Copied $($d.From) -> $($d.To)"
    }
}

# Core: use integration's config (adapted for dyslexia-backend layout)
$coreFrom = Join-Path $PSScriptRoot "app\core"
$coreTo = Join-Path $Target "app\core"
New-Item -ItemType Directory -Path $coreTo -Force | Out-Null
Copy-Item -Path "$coreFrom\*" -Destination $coreTo -Recurse -Force
Write-Host "Copied app/core (integration config)"

# OCR service
$svcFrom = Join-Path $PSScriptRoot "app\services\ocr_service.py"
$svcTo = Join-Path $Target "app\services\ocr_service.py"
Copy-Item -Path $svcFrom -Destination $svcTo -Force
Write-Host "Copied app/services/ocr_service.py"

Write-Host "`nDone. Next: apply PATCH_sessions.py changes manually, add deps, update .env"
