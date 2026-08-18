Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Dev\aprovando-tech\Gemini_Generated_Image_585w1f585w1f585w.jfif"
$outPath = "c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
# Crop the right portion: from x = 1180 to 2752
$rect = New-Object System.Drawing.Rectangle(1180, 0, 1572, 1536)
$dest = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Apply a soft alpha gradient on the left edge (first 180px) to seamlessly blend into the dark/aurora background!
for ($x = 0; $x -lt 180; $x++) {
    $alphaFactor = $x / 180.0
    for ($y = 0; $y -lt 1536; $y++) {
        $c = $dest.GetPixel($x, $y)
        $newAlpha = [int]($c.A * $alphaFactor)
        $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($newAlpha, $c.R, $c.G, $c.B))
    }
}

$dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dest.Dispose()
Write-Host "Processed hero scene image successfully!"
