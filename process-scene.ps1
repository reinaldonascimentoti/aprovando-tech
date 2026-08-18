Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class SceneProcessor {
    public static void Process(string inputPath, string outputPath) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int width = src.Width;
            int height = src.Height;
            using (Bitmap dest = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                BitmapData srcData = src.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadOnly, PixelFormat.Format32bppRgb);
                BitmapData destData = dest.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int stride = srcData.Stride;
                byte[] srcPixels = new byte[stride * height];
                byte[] destPixels = new byte[stride * height];

                Marshal.Copy(srcData.Scan0, srcPixels, 0, srcPixels.Length);

                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        int idx = y * stride + x * 4;
                        byte b = srcPixels[idx];
                        byte g = srcPixels[idx + 1];
                        byte r = srcPixels[idx + 2];

                        // Soft border alpha falloff so the image has zero rectangular edges
                        double fadeX = Math.Min((double)x / 40.0, (double)(width - 1 - x) / 40.0);
                        double fadeY = Math.Min((double)y / 40.0, (double)(height - 1 - y) / 40.0);
                        double edgeFade = Math.Min(1.0, Math.Min(fadeX, fadeY));
                        edgeFade = Math.Max(0.0, edgeFade);
                        edgeFade = edgeFade * edgeFade * (3.0 - 2.0 * edgeFade); // Smoothstep

                        byte a = (byte)(edgeFade * 255.0);

                        destPixels[idx] = b;
                        destPixels[idx + 1] = g;
                        destPixels[idx + 2] = r;
                        destPixels[idx + 3] = a;
                    }
                }

                Marshal.Copy(destPixels, 0, destData.Scan0, destPixels.Length);
                src.UnlockBits(srcData);
                dest.UnlockBits(destData);

                dest.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

[SceneProcessor]::Process("c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.jpg", "c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.png")
Write-Host "hero-scene.png created with 100% original pixel quality and smooth soft edges!"
