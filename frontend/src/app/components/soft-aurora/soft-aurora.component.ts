import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Shader sources ───────────────────────────────────────────────────────────

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-soft-aurora',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container class="soft-aurora-container"></div>`,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .soft-aurora-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: absolute;
    }
    .soft-aurora-container canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  `],
})
export class SoftAuroraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  @Input() speed = 0.6;
  @Input() scale = 1.5;
  @Input() brightness = 1.2;
  @Input() color1 = '#7c3aed';
  @Input() color2 = '#4f46e5';
  @Input() noiseFrequency = 2.5;
  @Input() noiseAmplitude = 1.0;
  @Input() bandHeight = 0.5;
  @Input() bandSpread = 1.0;
  @Input() octaveDecay = 0.1;
  @Input() layerOffset = 0;
  @Input() colorSpeed = 1.0;
  @Input() enableMouseInteraction = true;
  @Input() mouseInfluence = 0.25;

  private animId = 0;
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private currentMouse = [0.5, 0.5];
  private targetMouse = [0.5, 0.5];
  private resizeObserver!: ResizeObserver;

  // Bound handlers for cleanup
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseLeave!: () => void;

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => this.initGL());
  }

  private initGL(): void {
    const container = this.containerRef.nativeElement;
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    this.gl = gl;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Compile shaders
    const vert = this.compileShader(gl.VERTEX_SHADER, vertexShader);
    const frag = this.compileShader(gl.FRAGMENT_SHADER, fragmentShader);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link failed:', gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;
    gl.useProgram(program);

    // Full-screen triangle
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, 'uv');
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    const uniformNames = [
      'uTime', 'uResolution', 'uSpeed', 'uScale', 'uBrightness',
      'uColor1', 'uColor2', 'uNoiseFreq', 'uNoiseAmp', 'uBandHeight',
      'uBandSpread', 'uOctaveDecay', 'uLayerOffset', 'uColorSpeed',
      'uMouse', 'uMouseInfluence', 'uEnableMouse',
    ];
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }

    // Set static uniforms
    gl.uniform1f(this.uniforms['uSpeed'], this.speed);
    gl.uniform1f(this.uniforms['uScale'], this.scale);
    gl.uniform1f(this.uniforms['uBrightness'], this.brightness);
    gl.uniform3fv(this.uniforms['uColor1'], hexToVec3(this.color1));
    gl.uniform3fv(this.uniforms['uColor2'], hexToVec3(this.color2));
    gl.uniform1f(this.uniforms['uNoiseFreq'], this.noiseFrequency);
    gl.uniform1f(this.uniforms['uNoiseAmp'], this.noiseAmplitude);
    gl.uniform1f(this.uniforms['uBandHeight'], this.bandHeight);
    gl.uniform1f(this.uniforms['uBandSpread'], this.bandSpread);
    gl.uniform1f(this.uniforms['uOctaveDecay'], this.octaveDecay);
    gl.uniform1f(this.uniforms['uLayerOffset'], this.layerOffset);
    gl.uniform1f(this.uniforms['uColorSpeed'], this.colorSpeed);
    gl.uniform1f(this.uniforms['uMouseInfluence'], this.mouseInfluence);
    gl.uniform1i(this.uniforms['uEnableMouse'], this.enableMouseInteraction ? 1 : 0);

    // Resize handling
    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(this.uniforms['uResolution'], canvas.width, canvas.height, canvas.width / canvas.height);
    };
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(container);
    resize();

    // Mouse interaction
    if (this.enableMouseInteraction) {
      this.boundMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        this.targetMouse = [
          (e.clientX - rect.left) / rect.width,
          1.0 - (e.clientY - rect.top) / rect.height,
        ];
      };
      this.boundMouseLeave = () => { this.targetMouse = [0.5, 0.5]; };
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('mouseleave', this.boundMouseLeave);
    }

    // Render loop
    const update = (time: number) => {
      this.animId = requestAnimationFrame(update);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(this.uniforms['uTime'], time * 0.001);

      if (this.enableMouseInteraction) {
        this.currentMouse[0] += 0.05 * (this.targetMouse[0] - this.currentMouse[0]);
        this.currentMouse[1] += 0.05 * (this.targetMouse[1] - this.currentMouse[1]);
      }
      gl.uniform2f(this.uniforms['uMouse'], this.currentMouse[0], this.currentMouse[1]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    this.animId = requestAnimationFrame(update);
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.resizeObserver?.disconnect();
    if (this.gl) {
      const canvas = this.gl.canvas as HTMLCanvasElement;
      if (this.enableMouseInteraction && this.boundMouseMove) {
        canvas.removeEventListener('mousemove', this.boundMouseMove);
        canvas.removeEventListener('mouseleave', this.boundMouseLeave);
      }
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}
