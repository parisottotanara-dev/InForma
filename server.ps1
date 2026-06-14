# =====================================================================
# InForma — mini server locale
# Serve l'app su http://localhost:8642 e apre il browser.
# Non richiede alcuna installazione: usa solo PowerShell di Windows.
# Per fermarlo: chiudi la finestra o premi Ctrl+C.
# =====================================================================
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$port = 8642
$url = "http://localhost:$port/"

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
    $listener.Start()
} catch {
    Write-Host "Impossibile avviare il server sulla porta $port (forse e' gia' in esecuzione?)." -ForegroundColor Yellow
    Start-Process $url
    exit
}

Write-Host ""
Write-Host "  InForma e' attiva su $url" -ForegroundColor Green
Write-Host "  Lascia aperta questa finestra mentre usi l'app." -ForegroundColor Gray
Write-Host "  Per chiudere: premi Ctrl+C o chiudi la finestra." -ForegroundColor Gray
Write-Host ""

Start-Process $url

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
        $reqPath = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
        if ($reqPath -eq '/') { $reqPath = '/index.html' }

        # protezione: si resta dentro la cartella dell'app
        $file = Join-Path $root ($reqPath -replace '/', '\')
        $fullFile = [System.IO.Path]::GetFullPath($file)

        $isHead = $ctx.Request.HttpMethod -eq 'HEAD'

        if ($fullFile.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and [System.IO.File]::Exists($fullFile)) {
            $ext = [System.IO.Path]::GetExtension($fullFile).ToLower()
            $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($fullFile)
            $ctx.Response.ContentType = $type
            $ctx.Response.ContentLength64 = $bytes.Length
            if (-not $isHead) { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
        } else {
            $ctx.Response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - non trovato')
            $ctx.Response.ContentLength64 = $msg.Length
            if (-not $isHead) { $ctx.Response.OutputStream.Write($msg, 0, $msg.Length) }
        }
    } catch {
        # una singola richiesta fallita non deve mai fermare il server
        try { $ctx.Response.StatusCode = 500 } catch {}
    } finally {
        try { $ctx.Response.Close() } catch {}
    }
}
