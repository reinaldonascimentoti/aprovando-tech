Add-Type -AssemblyName System.Drawing

$inputPath = "c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.jpg"
$outputPath = "c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.png"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $bmp.Width
$height = $bmp.Height

$outBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Center of the light burst (behind the mascot) is around x = 720, y = 350
$centerX = 720.0
$centerY = 350.0
$maxRadius = 380.0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $r = [double]$c.R
        $g = [double]$c.G
        $b = [double]$c.B

        $maxC = [Math]::Max($r, [Math]::Max($g, $b))

        # Check if inside solid elements (mascot, cylinder, charts)
        # Charts are in x: 50..500, y: 150..650
        # Mascot is in x: 480..980, y: 250..920
        $isSolid = ($maxC -ge 75.0)

        # Distance from light burst center
        $distFromCenter = [Math]::Sqrt([Math]::Pow($x - $centerX, 2) + [Math]::Pow($y - $centerY, 2))
        
        # Radial falloff for background rays
        $radialFactor = 1.0
        if ($distFromCenter -gt 180.0) {
            $radialFactor = [Math]::Max(0.0, 1.0 - (($distFromCenter - 180.0) / ($maxRadius - 180.0)))
            # Smooth cubic ease
            $radialFactor = $radialFactor * $radialFactor * (3.0 - 2.0 * $radialFactor)
        }

        # Background luminance noise threshold
        $blackFloor = 22.0
        
        if ($maxC -le $blackFloor) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            if ($isSolid) {
                # Elements that are solid colors/white belly/mascot
                $alphaNorm = 1.0
            } else {
                # Pure glow / light rays - apply unmultiplied alpha + radial falloff
                $baseAlpha = ($maxC - $blackFloor) / (255.0 - $blackFloor)
                $alphaNorm = [Math]::Pow($baseAlpha, 1.2) * $radialFactor
            }

            $finalA = [int]([Math]::Round([Math]::Min(255.0, [Math]::Max(0.0, $alphaNorm * 255.0))))
            
            if ($finalA -gt 0) {
                # Unmultiply color for pure additive glow blending
                $scale = [Math]::Max(0.2, $alphaNorm)
                $finalR = [int]([Math]::Min(255.0, [Math]::Round($r / $scale)))
                $finalG = [int]([Math]::Min(255.0, [Math]::Round($g / $scale)))
                $finalB = [int]([Math]::Min(255.0, [Math]::Round($b / $scale)))
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($finalA, $finalR, $finalG, $finalB))
            } else {
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
}

$outBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$outBmp.Dispose()

Write-Host "Smooth transparent PNG generated successfully!"
