Add-Type -AssemblyName System.Drawing

$storeDir = Join-Path $PSScriptRoot "store_assets"
$logoPath = Join-Path $PSScriptRoot "icono.png"
if (-not (Test-Path $storeDir)) { New-Item -ItemType Directory -Path $storeDir | Out-Null }

$logoImg = [System.Drawing.Image]::FromFile($logoPath)

function Create-Screenshot1($targetPath) {
    $width = 1280
    $height = 800
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background Desk
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#eae6df"))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # Web Page Container
    $webCard = New-Object System.Drawing.Rectangle(70, 70, 750, 660)
    $webBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#ffffff"))
    $g.FillRectangle($webBrush, $webCard)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d8d1c4"), [float]1.5)
    $g.DrawRectangle($borderPen, $webCard)

    # Web Header Bar
    $webHeaderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($webHeaderBrush, 70, 70, 750, 50)
    $g.DrawLine($borderPen, 70, 120, 820, 120)

    $titleFont = New-Object System.Drawing.Font("Segoe UI", [float]16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $headTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2b2927"))
    $g.DrawString("Portal Corporativo - Formulario de Registro", $titleFont, $headTextBrush, [float]95, [float]83)

    # Form Fields in Web Page
    $lblFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $valFont = New-Object System.Drawing.Font("Segoe UI", [float]12, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $lblBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#635f59"))
    $inputBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#c4bcb0"), [float]1.0)
    $inputFill = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))

    $fields = @(
        @("RUT / Identificacion", "12.345.678-9", 100, 150, 310),
        @("Nombre", "Juan", 440, 150, 350),
        @("Apellido", "Perez", 100, 240, 310),
        @("Correo Electronico", "juan.perez@empresa.cl", 440, 240, 350),
        @("Telefono de Contacto", "+56 9 1234 5678", 100, 330, 310),
        @("Fecha de Nacimiento", "1990-08-20", 440, 330, 350),
        @("Sexo / Genero", "Masculino", 100, 420, 310),
        @("Tipo de Contrato", "Indefinido", 440, 420, 350),
        @("Observaciones", "Ingeniero de Software Senior con experiencia en arquitecturas cloud.", 100, 510, 690)
    )

    foreach ($f in $fields) {
        $g.DrawString($f[0], $lblFont, $lblBrush, [float]$f[2], [float]$f[3])
        $boxHeight = if ($f[0] -eq "Observaciones") { 70 } else { 38 }
        $g.FillRectangle($inputFill, [float]$f[2], [float]($f[3] + 20), [float]$f[4], [float]$boxHeight)
        $g.DrawRectangle($inputBorder, [float]$f[2], [float]($f[3] + 20), [float]$f[4], [float]$boxHeight)
        $g.DrawString($f[1], $valFont, $headTextBrush, [float]($f[2] + 10), [float]($f[3] + 30))
    }

    # Toast Success Notification
    $toastRect = New-Object System.Drawing.Rectangle(100, 645, 450, 45)
    $toastBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($toastBg, $toastRect)
    $g.DrawRectangle($borderPen, $toastRect)
    $greenBar = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#5a8a6e"))
    $g.FillRectangle($greenBar, 100, 645, 6, 45)
    $toastFont = New-Object System.Drawing.Font("Segoe UI", [float]12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("MultiCopy: Se rellenaron los 9 campos con exito", $toastFont, $headTextBrush, [float]120, [float]658)

    # Extension Popup Card (Floating on Right)
    $popRect = New-Object System.Drawing.Rectangle(860, 70, 350, 660)
    $popBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($popBg, $popRect)
    $popBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#2b2927"), [float]2.0)
    $g.DrawRectangle($popBorder, $popRect)

    # Popup Header
    $g.DrawImage($logoImg, (New-Object System.Drawing.Rectangle(885, 95, 42, 42)), 0, 0, $logoImg.Width, $logoImg.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $popTitleFont = New-Object System.Drawing.Font("Segoe UI", [float]18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $popSubFont = New-Object System.Drawing.Font("Segoe UI", [float]10, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("MultiCopy", $popTitleFont, $headTextBrush, [float]938, [float]93)
    $g.DrawString("Excel Form Autofill", $popSubFont, $lblBrush, [float]940, [float]118)

    # Status Card
    $statusRect = New-Object System.Drawing.Rectangle(885, 160, 300, 70)
    $cardBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#f3efe6"))
    $g.FillRectangle($cardBg, $statusRect)
    $cardBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d8d1c4"), [float]1.0)
    $g.DrawRectangle($cardBorder, $statusRect)

    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#5a8a6e"))
    $g.FillEllipse($dotBrush, 902, 178, 10, 10)
    $statusHeadFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Fila detectada (9 datos)", $statusHeadFont, $headTextBrush, [float]920, [float]175)
    $g.DrawString("Fila copiada desde Excel lista para rellenar", $popSubFont, $lblBrush, [float]920, [float]195)

    # Preview Items
    $prevRect = New-Object System.Drawing.Rectangle(885, 245, 300, 320)
    $g.FillRectangle($cardBg, $prevRect)
    $g.DrawRectangle($cardBorder, $prevRect)
    $g.DrawString("VISTA PREVIA DE COLUMNAS", $lblFont, $lblBrush, [float]900, [float]260)

    $prevList = @(
        @("RUT (Col A)", "12.345.678-9"),
        @("Nombre (Col B)", "Juan"),
        @("Apellido (Col C)", "Perez"),
        @("Email (Col D)", "juan.perez@empresa.cl"),
        @("Telefono (Col E)", "912345678"),
        @("Fecha (Col F)", "20/08/1990")
    )
    $yP = 290
    foreach ($p in $prevList) {
        $g.DrawString($p[0], $popSubFont, $lblBrush, [float]900, [float]$yP)
        $g.DrawString($p[1], $popSubFont, $headTextBrush, [float]1020, [float]$yP)
        $g.DrawLine($cardBorder, 900, ($yP + 22), 1165, ($yP + 22))
        $yP += 32
    }

    # Big Fill Button
    $btnRect = New-Object System.Drawing.Rectangle(885, 590, 300, 52)
    $btnFill = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2b2927"))
    $btnTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($btnFill, $btnRect)
    $btnFont = New-Object System.Drawing.Font("Segoe UI", [float]13, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("RELLENAR FORMULARIO", $btnFont, $btnTextBrush, [float]940, [float]606)

    # Shortcut Bar
    $g.DrawString("Atajo rapido: Ctrl + Shift + Y", $popSubFont, $lblBrush, [float]960, [float]660)

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "[Screenshot] Generado: store_assets/screenshot_1_autofill_1280x800.png"
}

function Create-Screenshot2($targetPath) {
    $width = 1280
    $height = 800
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background Desk
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#eae6df"))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # Banner floating on top
    $bannerRect = New-Object System.Drawing.Rectangle(290, 30, 700, 54)
    $bannerBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($bannerBg, $bannerRect)
    $bannerBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#2b2927"), [float]2.0)
    $g.DrawRectangle($bannerBorder, $bannerRect)
    
    $badgeRect = New-Object System.Drawing.Rectangle(310, 42, 90, 30)
    $badgeBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#f3e9a9"))
    $g.FillRectangle($badgeBg, $badgeRect)
    $badgeFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $badgeTxt = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#594f13"))
    $g.DrawString("MULTICOPY", $badgeFont, $badgeTxt, [float]320, [float]50)

    $bannerFont = New-Object System.Drawing.Font("Segoe UI", [float]13, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2b2927"))
    $g.DrawString("Haz clic en el campo que quieres rellenar:  Columna B (Nombre)", $bannerFont, $darkBrush, [float]415, [float]48)

    # Center Card
    $centerCard = New-Object System.Drawing.Rectangle(240, 110, 800, 640)
    $cardBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#faf8f5"))
    $g.FillRectangle($cardBg, $centerCard)
    $g.DrawRectangle($bannerBorder, $centerCard)

    # Title
    $hFont = New-Object System.Drawing.Font("Segoe UI", [float]20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Configuracion de Campos y Mapeo Visual", $hFont, $darkBrush, [float]280, [float]140)
    $subFont = New-Object System.Drawing.Font("Segoe UI", [float]12, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#635f59"))
    $g.DrawString("Asocia columnas de Excel con elementos web mediante un solo clic", $subFont, $mutedBrush, [float]282, [float]175)

    # Config Editor Card
    $editBox = New-Object System.Drawing.Rectangle(280, 210, 720, 150)
    $editFill = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#f3efe6"))
    $g.FillRectangle($editFill, $editBox)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d8d1c4"), [float]1.5)
    $g.DrawRectangle($borderPen, $editBox)

    $lblFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Nombre del campo:  Nombre del Trabajador", $lblFont, $darkBrush, [float]305, [float]230)
    $g.DrawString("Dato de la fila:  Columna B (Letras activadas)  -  Se asume inicio en Columna A", $lblFont, $mutedBrush, [float]305, [float]260)

    # Big Pick Button
    $pickBtnRect = New-Object System.Drawing.Rectangle(305, 295, 230, 44)
    $btnAccent = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#b9d5e6"))
    $g.FillRectangle($btnAccent, $pickBtnRect)
    $g.DrawRectangle($borderPen, $pickBtnRect)
    $pickTxtBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#1d4359"))
    $g.DrawString("Elegir campo en la pagina", $bannerFont, $pickTxtBrush, [float]325, [float]308)

    # List of configured fields
    $g.DrawString("CAMPOS CONFIGURADOS EN EL PERFIL", $lblFont, $mutedBrush, [float]280, [float]390)

    $fieldList = @(
        @("RUT", "Columna A", "Vinculado a input#rut"),
        @("Nombre", "Columna B", "Vinculado a input#nombre"),
        @("Apellido", "Columna C", "Vinculado a input#apellido"),
        @("Correo Electronico", "Columna D", "Vinculado a input[type='email']"),
        @("Telefono", "Columna E", "Vinculado a input#telefono")
    )

    $yL = 420
    foreach ($fl in $fieldList) {
        $rowRect = New-Object System.Drawing.Rectangle(280, $yL, 720, 48)
        $g.FillRectangle($cardBg, $rowRect)
        $g.DrawRectangle($borderPen, $rowRect)

        $g.DrawString($fl[0], $bannerFont, $darkBrush, [float]305, [float]($yL + 14))
        $g.DrawString($fl[1], $subFont, $mutedBrush, [float]480, [float]($yL + 16))
        
        $succBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#5a8a6e"))
        $g.DrawString($fl[2], $lblFont, $succBrush, [float]620, [float]($yL + 16))

        $yL += 58
    }

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "[Screenshot] Generado: store_assets/screenshot_2_fields_1280x800.png"
}

Create-Screenshot1 (Join-Path $storeDir "screenshot_1_autofill_1280x800.png")
Create-Screenshot2 (Join-Path $storeDir "screenshot_2_fields_1280x800.png")

$logoImg.Dispose()
Write-Host "Screenshots oficiales para la tienda generadas exitosamente!"
