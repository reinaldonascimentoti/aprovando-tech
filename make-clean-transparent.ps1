Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class UltraTransparentScene2 {
    private static bool PointInConvexQuad(double px, double py, double[] x, double[] y) {
        bool neg = false, pos = false;
        for (int i = 0; i < 4; i++) {
            int next = (i + 1) % 4;
            double cross = (px - x[i]) * (y[next] - y[i]) - (py - y[i]) * (x[next] - x[i]);
            if (cross < 0) neg = true;
            if (cross > 0) pos = true;
            if (neg && pos) return false;
        }
        return true;
    }

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

                // Precise 4-point quad for Pareto Card
                double[] paretoX = { 54, 348, 318, 56 };
                double[] paretoY = { 180, 214, 480, 482 };

                // Precise 4-point quad for Aprovação Card
                double[] aprovX = { 346, 592, 586, 346 };
                double[] aprovY = { 170, 168, 372, 412 };

                // Precise 4-point quad for Schedule Card
                double[] schedX = { 282, 502, 500, 282 };
                double[] schedY = { 462, 458, 662, 664 };

                // AI Chip
                double chipMinX = 285, chipMaxX = 385, chipMinY = 70, chipMaxY = 175;

                // Mascot & light rays center
                double rayCenterX = 720.0;
                double rayCenterY = 370.0;
                double rayRadiusX = 260.0;
                double rayRadiusY = 220.0;

                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        int idx = y * stride + x * 4;
                        byte b = srcPixels[idx];
                        byte g = srcPixels[idx + 1];
                        byte r = srcPixels[idx + 2];

                        double maxC = Math.Max(r, Math.Max(g, b));

                        bool inPareto = PointInConvexQuad(x, y, paretoX, paretoY);
                        bool inAprov = PointInConvexQuad(x, y, aprovX, aprovY);
                        bool inSched = PointInConvexQuad(x, y, schedX, schedY);
                        bool inChip = (x >= chipMinX && x <= chipMaxX && y >= chipMinY && y <= chipMaxY && maxC >= 35.0);

                        // Mascot region: x: 500..980, y: 250..890
                        bool inMascotBounds = (x >= 500 && x <= 980 && y >= 250 && y <= 890);

                        double alpha = 0.0;

                        if (inPareto || inAprov || inSched || inChip) {
                            // Inside holographic glass cards: keep the glass tint and 100% of the content/text/bars
                            if (maxC >= 55.0) {
                                alpha = 1.0;
                            } else if (maxC >= 15.0) {
                                alpha = 0.75 + 0.25 * ((maxC - 15.0) / (55.0 - 15.0));
                            } else {
                                alpha = 0.70;
                            }
                        } else if (inMascotBounds && maxC >= 58.0) {
                            // Inside solid mascot/cylinder
                            alpha = 1.0;
                        } else if (inMascotBounds && maxC >= 32.0 && y >= 320 && y <= 880 && x >= 520 && x <= 960) {
                            // Soft edge for mascot body
                            alpha = (maxC - 32.0) / (58.0 - 32.0);
                        } else {
                            // Volumetric light rays with soft elliptical falloff
                            double rdx = (x - rayCenterX) / rayRadiusX;
                            double rdy = (y - rayCenterY) / rayRadiusY;
                            double rayDist = Math.Sqrt(rdx * rdx + rdy * rdy);

                            if (rayDist < 1.0 && maxC > 28.0) {
                                double baseA = (maxC - 28.0) / (90.0 - 28.0);
                                baseA = Math.Min(1.0, Math.Max(0.0, baseA));
                                double radialFade = Math.Max(0.0, 1.0 - rayDist);
                                radialFade = radialFade * radialFade * (3.0 - 2.0 * radialFade); // Smoothstep
                                alpha = baseA * radialFade * 0.85;
                            }
                        }

                        alpha = Math.Min(1.0, Math.Max(0.0, alpha));
                        byte a = (byte)(alpha * 255.0);

                        if (a > 0) {
                            double scale = Math.Max(0.35, alpha);
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

                Marshal.Copy(destPixels, 0, destData.Scan0, destPixels.Length);
                src.UnlockBits(srcData);
                dest.UnlockBits(destData);

                dest.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

[UltraTransparentScene2]::Process("c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.jpg", "c:\Dev\aprovando-tech\frontend\src\assets\hero-scene.png")
Write-Host "Perfect transparent hero-scene.png created successfully!"
