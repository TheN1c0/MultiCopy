Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "icono.png"
$iconsDir = Join-Path $PSScriptRoot "icons"
$storeDir = Join-Path $PSScriptRoot "store_assets"

if (-not (Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir | Out-Null }
if (-not (Test-Path $storeDir)) { New-Item -ItemType Directory -Path $storeDir | Out-Null }

$srcImage = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-SquareIcon($src, $size, $targetPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $destImage = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($src, $destRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)
    
    $destImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destImage.Dispose()
}

# 1. Iconos del Manifest y Extension
$manifestSizes = @(16, 32, 48, 128)
foreach ($s in $manifestSizes) {
    $p = Join-Path $iconsDir "icon$s.png"
    Resize-SquareIcon $srcImage $s $p
    Write-Host "[Icons] Generado: icons/icon$s.png ($s x $s px)"
}

# 2. Iconos de Tienda (Chrome / Edge)
$storeSizes = @(128, 300, 512)
foreach ($s in $storeSizes) {
    $p = Join-Path $storeDir "icon$s.png"
    Resize-SquareIcon $srcImage $s $p
    Write-Host "[Store] Generado: store_assets/icon$s.png ($s x $s px)"
}

# 3. Promo Tile Pequeña (440x280)
function Create-PromoSmall($src, $targetPath) {
    $width = 440
    $height = 280
    $destImage = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destImage)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fondo cálido elegante
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#faf8f5")
    $g.Clear($bgColor)

    # Dibujar icono a la izquierda / centrado
    $iconSize = 140
    $iconX = 40
    $iconY = ($height - $iconSize) / 2
    $iconRect = New-Object System.Drawing.Rectangle($iconX, $iconY, $iconSize, $iconSize)
    $g.DrawImage($src, $iconRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)

    # Textos
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2b2927"))
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#635f59"))

    $g.DrawString("MultiCopy", $titleFont, $textBrush, 200, 105)
    $g.DrawString("Excel Form Autofill", $subFont, $subBrush, 202, 140)

    $destImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $titleFont.Dispose()
    $subFont.Dispose()
    $textBrush.Dispose()
    $subBrush.Dispose()
    $g.Dispose()
    $destImage.Dispose()
    Write-Host "[Store] Generado: store_assets/promo_small_440x280.png"
}

# 4. Promo Marquee / Banner Grande (1400x560)
function Create-PromoMarquee($src, $targetPath) {
    $width = 1400
    $height = 560
    $destImage = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destImage)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fondo papel sutil
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#faf8f5")
    $g.Clear($bgColor)

    # Dibujar icono
    $iconSize = 300
    $iconX = 180
    $iconY = ($height - $iconSize) / 2
    $iconRect = New-Object System.Drawing.Rectangle($iconX, $iconY, $iconSize, $iconSize)
    $g.DrawImage($src, $iconRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)

    # Textos
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 56, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $badgeFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2b2927"))
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#635f59"))
    $badgeBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#f3e9a9"))
    $badgeTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#594f13"))

    # Badge
    $badgeRect = New-Object System.Drawing.Rectangle(530, 185, 170, 32)
    $g.FillRectangle($badgeBgBrush, $badgeRect)
    $g.DrawString("AUTOFILL EXCEL", $badgeFont, $badgeTextBrush, 542, 190)

    # Titulo y subtitulo
    $g.DrawString("MultiCopy", $titleFont, $textBrush, 525, 225)
    $g.DrawString("Rellena formularios web automáticamente con filas de Excel", $subFont, $subBrush, 530, 295)

    $destImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $titleFont.Dispose()
    $subFont.Dispose()
    $badgeFont.Dispose()
    $textBrush.Dispose()
    $subBrush.Dispose()
    $badgeBgBrush.Dispose()
    $badgeTextBrush.Dispose()
    $g.Dispose()
    $destImage.Dispose()
    Write-Host "[Store] Generado: store_assets/promo_marquee_1400x560.png"
}

Create-PromoSmall $srcImage (Join-Path $storeDir "promo_small_440x280.png")
Create-PromoMarquee $srcImage (Join-Path $storeDir "promo_marquee_1400x560.png")

$srcImage.Dispose()
Write-Host "¡Todos los recursos para Chrome y Microsoft Edge han sido creados con éxito!"
