# ============================================================
#  ZING STABLE BACKEND (v4.0)
#  Fast, Reliable, Simple HTTP (Secure Context)
# ============================================================

$port = 8090
$root = "C:\Users\Admin\Downloads\Fintech Startup"
$dbFile = Join-Path $root "location_logs.csv"

# Ensure database exists
if (-not (Test-Path $dbFile)) {
    "lat,lon,acc,city,country,isp,status,user_agent,created_at" | Out-File $dbFile -Encoding utf8
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Zing Sentinel Running at http://localhost:$port"
Write-Host "Admin Panel: http://localhost:$port/admin.html"

Start-Process "http://localhost:$port/index.html"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8";
    ".css"  = "text/css";
    ".js"   = "application/javascript";
    ".json" = "application/json";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".svg"  = "image/svg+xml"
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $urlPath = $req.Url.LocalPath
        
        if ($urlPath -eq "/log-location" -and $req.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($req.InputStream)
            $json = $reader.ReadToEnd()
            $data = $json | ConvertFrom-Json
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $newLine = "$($data.lat),$($data.lon),$($data.acc),`"$($data.city)`",`"$($data.country)`",`"$($data.isp)`",$($data.status),`"$($data.user_agent)`",$timestamp"
            $newLine | Out-File $dbFile -Append -Encoding utf8
            $resMsg = [System.Text.Encoding]::UTF8.GetBytes('{"status":"Logged"}')
            $res.StatusCode = 200
            $res.OutputStream.Write($resMsg, 0, $resMsg.Length)
            $res.OutputStream.Close()
            continue
        }

        if ($urlPath -eq "/admin/location-logs" -and $req.HttpMethod -eq "GET") {
            $logs = Import-Csv $dbFile
            $json = $logs | ConvertTo-Json -Depth 2
            $resMsg = [System.Text.Encoding]::UTF8.GetBytes($json)
            $res.StatusCode = 200
            $res.ContentType = "application/json"
            $res.AddHeader("Access-Control-Allow-Origin", "*")
            $res.OutputStream.Write($resMsg, 0, $resMsg.Length)
            $res.OutputStream.Close()
            continue
        }

        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        $fPath = Join-Path $root $urlPath.TrimStart('/')
        
        if (Test-Path $fPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fPath)
            $mime = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($fPath)
            $res.StatusCode = 200
            $res.ContentType = $mime
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.OutputStream.Close()
    } catch {
        Write-Host "Error: $_"
    }
}
