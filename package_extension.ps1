$zipName = "multicopy_extension.zip"
$zipPath = Join-Path $PSScriptRoot $zipName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$tempFolder = Join-Path $PSScriptRoot "temp_package"
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}

New-Item -ItemType Directory -Path $tempFolder | Out-Null

$itemsToCopy = @(
    "manifest.json",
    "background",
    "content",
    "popup",
    "utils",
    "icons"
)

foreach ($item in $itemsToCopy) {
    $src = Join-Path $PSScriptRoot $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $tempFolder -Recurse
    }
}

Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -Force
Remove-Item $tempFolder -Recurse -Force

Write-Host "============================================="
Write-Host "Paquete listo para subir a Chrome Web Store o Microsoft Edge:"
Write-Host "$zipPath"
Write-Host "============================================="
