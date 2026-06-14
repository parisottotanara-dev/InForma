# Genera le icone PNG dell'app (192px e 512px) disegnando il logo InForma.
# Uso: powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'icons'
if (-not [System.IO.Directory]::Exists($outDir)) { [System.IO.Directory]::CreateDirectory($outDir) | Out-Null }

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

foreach ($size in 192, 512) {
    $s = $size / 512.0   # il disegno è progettato su una griglia 512
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # sfondo: quadrato arrotondato con gradiente teal -> verde
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(14, 165, 163),
        [System.Drawing.Color]::FromArgb(52, 211, 153),
        45.0)
    $bgPath = New-RoundedPath 0 0 $size $size (110 * $s)
    $g.FillPath($brush, $bgPath)

    # bilanciere bianco
    $white = [System.Drawing.Brushes]::White
    $g.FillPath($white, (New-RoundedPath ( 96 * $s) (236 * $s) (320 * $s) ( 40 * $s) (14 * $s)))  # barra
    $g.FillPath($white, (New-RoundedPath (120 * $s) (176 * $s) ( 44 * $s) (160 * $s) (16 * $s)))  # disco int. sx
    $g.FillPath($white, (New-RoundedPath (348 * $s) (176 * $s) ( 44 * $s) (160 * $s) (16 * $s)))  # disco int. dx
    $g.FillPath($white, (New-RoundedPath ( 68 * $s) (206 * $s) ( 34 * $s) (100 * $s) (13 * $s)))  # disco est. sx
    $g.FillPath($white, (New-RoundedPath (410 * $s) (206 * $s) ( 34 * $s) (100 * $s) (13 * $s)))  # disco est. dx

    $out = Join-Path $outDir "icon-$size.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "Creata: $out"
}
