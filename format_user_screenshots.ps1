Add-Type -AssemblyName System.Drawing

$storeDir = Join-Path $PSScriptRoot "store_assets"

function Format-ScreenshotTo1280x800($sourceFileName, $outputFileName) {
    $srcPath = Join-Path $storeDir $sourceFileName
    $outPath = Join-Path $storeDir $outputFileName
    
    if (-not (Test-Path $srcPath)) { return }
    
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $targetWidth = 1280
    $targetHeight = 800
    
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background elegante Lo-Fi Paper Desk (#eae6df)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#eae6df"))
    $g.FillRectangle($bgBrush, 0, 0, $targetWidth, $targetHeight)

    # Calcular escalado manteniendo proporción de aspecto
    $maxW = $targetWidth - 100
    $maxH = $targetHeight - 80
    
    $scaleW = $maxW / $srcImg.Width
    $scaleH = $maxH / $srcImg.Height
    $scale = [Math]::Min($scaleW, $scaleH)
    
    # Si la imagen es pequeña (ej: popup individual), no sobre-escalarla al infinito para mantener nitidez
    if ($srcImg.Width -lt 600 -and $srcImg.Height -lt 700) {
        $scale = [Math]::Min($scale, 1.25)
    }

    $destW = [int]($srcImg.Width * $scale)
    $destH = [int]($srcImg.Height * $scale)
    $destX = [int](($targetWidth - $destW) / 2)
    $destY = [int](($targetHeight - $destH) / 2)

    # Sombra suave detrás de la captura
    $shadowRect = New-Object System.Drawing.Rectangle(($destX + 4), ($destY + 6), $destW, $destH)
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 43, 41, 39))
    $g.FillRectangle($shadowBrush, $shadowRect)

    # Dibujar la captura original con bordes limpios
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $g.DrawImage($srcImg, $destRect, 0, 0, $srcImg.Width, $srcImg.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#c4bcb0"), [float]1.0)
    $g.DrawRectangle($borderPen, $destRect)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $borderPen.Dispose()
    $shadowBrush.Dispose()
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $srcImg.Dispose()
    
    Write-Host "[OK] Adaptado: $outputFileName (1280 x 800 px) a partir de $sourceFileName"
}

1..5 | ForEach-Object {
    Format-ScreenshotTo1280x800 "screenshot_$_.png" "screenshot_$($_)_1280x800.png"
}

Write-Host "Todas las capturas han sido transformadas exactamente a 1280x800 px!"
