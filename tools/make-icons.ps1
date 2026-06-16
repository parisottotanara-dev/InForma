# Genera le icone PNG dell'app disegnando il logo InForma (tema dark/glass).
# Produce, a 192 e 512 px:
#   icon-<size>.png           -> tile arrotondato (purpose "any")
#   icon-<size>-maskable.png  -> sfondo a tutto campo (purpose "maskable")
# Uso: powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'icons'
if (-not [System.IO.Directory]::Exists($outDir)) { [System.IO.Directory]::CreateDirectory($outDir) | Out-Null }

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    if ($r -le 0) { $p.AddRectangle((New-Object System.Drawing.RectangleF($x, $y, $w, $h))); return $p }
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

# Bilanciere: rettangoli arrotondati su griglia 512, centrati in (256,256)
$BAR = @(
    @(196, 241, 120, 30, 15),
    @(156, 216,  34, 80, 15),
    @(322, 216,  34, 80, 15),
    @(120, 196,  30, 120, 14),
    @(362, 196,  30, 120, 14)
)

function Draw-Icon([int]$size, [bool]$maskable) {
    $s = $size / 512.0
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $corner = if ($maskable) { 0 } else { 116 * $s }

    # --- tile con gradiente teal (3 stop) ---
    $tile = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 15, 118, 110),
        [System.Drawing.Color]::FromArgb(255, 11, 59, 57),
        45.0)
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
    $blend.Colors = @(
        [System.Drawing.Color]::FromArgb(255, 15, 118, 110),
        [System.Drawing.Color]::FromArgb(255, 14, 165, 163),
        [System.Drawing.Color]::FromArgb(255, 11, 59, 57))
    $blend.Positions = @(0.0, 0.55, 1.0)
    $tile.InterpolationColors = $blend
    $tilePath = New-RoundedPath 0 0 $size $size $corner
    $g.FillPath($tile, $tilePath)

    # --- alone di luce menta dietro al bilanciere ---
    $cx = 256 * $s; $cy = 256 * $s; $gr = 168 * $s
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowPath.AddEllipse($cx - $gr, $cy - $gr, $gr * 2, $gr * 2)
    $glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $glow.CenterPoint = New-Object System.Drawing.PointF($cx, $cy)
    $glow.CenterColor = [System.Drawing.Color]::FromArgb(150, 94, 234, 212)
    $glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 94, 234, 212))
    $g.FillPath($glow, $glowPath)

    # --- sheen diagonale (vetro) in alto a sinistra ---
    $sheenPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $sr = 300 * $s
    $sheenPath.AddEllipse((-60 * $s), (-120 * $s), $sr * 2, $sr * 1.4)
    $sheen = New-Object System.Drawing.Drawing2D.PathGradientBrush($sheenPath)
    $sheen.CenterColor = [System.Drawing.Color]::FromArgb(46, 255, 255, 255)
    $sheen.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 255, 255, 255))
    $g.FillPath($sheen, $sheenPath)

    # --- bilanciere con gradiente verticale chiaro ---
    $barRect = New-Object System.Drawing.Rectangle([int](120 * $s), [int](196 * $s), [int](272 * $s), [int](120 * $s))
    $barBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $barRect,
        [System.Drawing.Color]::FromArgb(255, 240, 253, 250),
        [System.Drawing.Color]::FromArgb(255, 153, 246, 228),
        90.0)
    foreach ($b in $BAR) {
        $p = New-RoundedPath ($b[0] * $s) ($b[1] * $s) ($b[2] * $s) ($b[3] * $s) ($b[4] * $s)
        $g.FillPath($barBrush, $p)
    }

    $out = Join-Path $outDir ("icon-{0}{1}.png" -f $size, $(if ($maskable) { '-maskable' } else { '' }))
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "Creata: $out"
}

foreach ($size in 192, 512) {
    Draw-Icon $size $false
    Draw-Icon $size $true
}
