Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class MascotExtractor {
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

                double centerX = 530.0;
                double centerY = 510.0;
                double radiusX = 370.0;
                double radiusY = 410.0;

                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        int idx = y * stride + x * 4;
                        byte b = srcPixels[idx];
                        byte g = srcPixels[idx + 1];
                        byte r = srcPixels[idx + 2];

                        double maxC = Math.Max(r, Math.Max(g, b));
                        
                        double dx = (x - centerX) / radiusX;
                        double dy = (y - centerY) / radiusY;
                        double dist = Math.Sqrt(dx * dx + dy * dy);

                        double radialAlpha = 1.0;
                        if (dist > 0.82) {
                            radialAlpha = Math.Max(0.0, 1.0 - (dist - 0.82) / 0.18);
                            radialAlpha = radialAlpha * radialAlpha * (3.0 - 2.0 * radialAlpha);
                        }

                        double blackFloor = 30.0;
                        double solidFloor = 70.0;

                        if (radialAlpha <= 0.001 || maxC <= blackFloor) {
                            destPixels[idx] = 0;
                            destPixels[idx + 1] = 0;
                            destPixels[idx + 2] = 0;
                            destPixels[idx + 3] = 0;
                        } else if (maxC >= solidFloor && dist <= 0.82) {
                            destPixels[idx] = b;
                            destPixels[idx + 1] = g;
                            destPixels[idx + 2] = r;
                            destPixels[idx + 3] = 255;
                        } else {
                            double lumAlpha = (maxC - blackFloor) / (solidFloor - blackFloor);
                            lumAlpha = Math.Min(1.0, Math.Max(0.0, lumAlpha));
                            double finalAlpha = lumAlpha * radialAlpha;
                            byte a = (byte)Math.Min(255, Math.Max(0, (int)(finalAlpha * 255)));

                            if (a > 0) {
                                double scale = Math.Max(0.35, finalAlpha);
                                destPixels[idx] = (byte)Math.Min(255, (int)(b / scale));
                                destPixels[idx + 1] = (byte)Math.Min(255, (int)(g / scale));
                                destPixels[idx + 2] = (byte)Math.Min(255, (int)(r / scale));
                                destPixels[idx + 3] = a;
                            } else {
                                destPixels[idx] = 0;
                                destPixels[idx + 1] = 0;
                                destPixels[idx + 2] = 0;
                                destPixels[idx + 3] = 0;
                            }
                        }
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

[MascotExtractor]::Process("c:\Dev\aprovando-tech\frontend\src\assets\hero-mascot.jpg", "c:\Dev\aprovando-tech\frontend\src\assets\hero-mascot.png")
Write-Host "Perfect Mascot PNG generated!"
