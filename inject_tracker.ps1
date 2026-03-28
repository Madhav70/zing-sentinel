$pages = @("index.html","features.html","pricing.html","about.html","blog.html","dashboard.html","login.html","signup.html")
$tag = '</body>'
$inject = '    <script src="tracker.js"></script>' + "`n</body>"

foreach ($p in $pages) {
    $path = "c:\Users\Admin\Downloads\Fintech Startup\$p"
    $content = Get-Content $path -Raw -Encoding UTF8
    if ($content -match [regex]::Escape('<script src="tracker.js"></script>')) {
        Write-Host "Already injected: $p"
        continue
    }
    $updated = $content.Replace($tag, $inject)
    [System.IO.File]::WriteAllText($path, $updated, [System.Text.Encoding]::UTF8)
    Write-Host "Injected tracker into: $p"
}
Write-Host "Done."
