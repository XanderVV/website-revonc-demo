/* ============================================================
   HERO BLOB — Noise-displaced organic sphere
   Three.js + custom GLSL shaders, CSS glow (no post-processing)
   ============================================================ */
(function () {
  'use strict';

  /* --- Simplex 3D noise (Ashima Arts) injected into shaders --- */
  var noiseGLSL = [
    'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}',
    'vec4 permute(vec4 x){return mod289((x*34.+1.)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}',
    'float snoise(vec3 v){',
    '  const vec2 C=vec2(1./6.,1./3.);',
    '  const vec4 D=vec4(0.,.5,1.,2.);',
    '  vec3 i=floor(v+dot(v,C.yyy));',
    '  vec3 x0=v-i+dot(i,C.xxx);',
    '  vec3 g=step(x0.yzx,x0.xyz);',
    '  vec3 l=1.-g;',
    '  vec3 i1=min(g.xyz,l.zxy);',
    '  vec3 i2=max(g.xyz,l.zxy);',
    '  vec3 x1=x0-i1+C.xxx;',
    '  vec3 x2=x0-i2+C.yyy;',
    '  vec3 x3=x0-D.yyy;',
    '  i=mod289(i);',
    '  vec4 p=permute(permute(permute(',
    '    i.z+vec4(0.,i1.z,i2.z,1.))',
    '    +i.y+vec4(0.,i1.y,i2.y,1.))',
    '    +i.x+vec4(0.,i1.x,i2.x,1.));',
    '  float n_=.142857142857;',
    '  vec3 ns=n_*D.wyz-D.xzx;',
    '  vec4 j=p-49.*floor(p*ns.z*ns.z);',
    '  vec4 x_=floor(j*ns.z);',
    '  vec4 y_=floor(j-7.*x_);',
    '  vec4 x=x_*ns.x+ns.yyyy;',
    '  vec4 y=y_*ns.x+ns.yyyy;',
    '  vec4 h=1.-abs(x)-abs(y);',
    '  vec4 b0=vec4(x.xy,y.xy);',
    '  vec4 b1=vec4(x.zw,y.zw);',
    '  vec4 s0=floor(b0)*2.+1.;',
    '  vec4 s1=floor(b1)*2.+1.;',
    '  vec4 sh=-step(h,vec4(0.));',
    '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;',
    '  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    '  vec3 p0=vec3(a0.xy,h.x);',
    '  vec3 p1=vec3(a0.zw,h.y);',
    '  vec3 p2=vec3(a1.xy,h.z);',
    '  vec3 p3=vec3(a1.zw,h.w);',
    '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
    '  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);',
    '  m=m*m;',
    '  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}'
  ].join('\n');

  /* --- Vertex shader --- */
  var vertexShader = [
    'uniform float uTime;',
    'uniform float uAmplitude;',
    'uniform float uFrequency;',
    'uniform vec3 uMouse;',
    'varying float vDisplacement;',
    'varying vec3 vNormal;',
    'varying vec3 vWorldPos;',
    noiseGLSL,
    'void main(){',
    '  vNormal = normalize(normalMatrix * normal);',
    '  // Two octaves of noise for organic feel',
    '  float n1 = snoise(position * uFrequency + uTime * 0.3);',
    '  float n2 = snoise(position * uFrequency * 2.0 + uTime * 0.5) * 0.5;',
    '  float noise = n1 + n2;',
    '  // Mouse influence — subtle bulge toward cursor',
    '  float mouseDist = length(position.xy - uMouse.xy);',
    '  float mouseInfluence = smoothstep(1.5, 0.0, mouseDist) * 0.15;',
    '  float displacement = noise * uAmplitude + mouseInfluence;',
    '  vDisplacement = displacement;',
    '  vec3 newPos = position + normal * displacement;',
    '  vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);',
    '}'
  ].join('\n');

  /* --- Fragment shader --- */
  var fragmentShader = [
    'uniform float uTime;',
    'varying float vDisplacement;',
    'varying vec3 vNormal;',
    'varying vec3 vWorldPos;',
    'void main(){',
    '  // Teal base → orange at high displacement peaks',
    '  vec3 teal = vec3(0.106, 0.690, 0.667);',
    '  vec3 orange = vec3(0.843, 0.416, 0.016);',
    '  vec3 brightTeal = vec3(0.220, 0.850, 0.820);',
    '  // Map displacement to color mix',
    '  float colorMix = smoothstep(-0.1, 0.4, vDisplacement);',
    '  vec3 baseColor = mix(teal, orange, colorMix);',
    '  // Fresnel-like edge glow for depth',
    '  vec3 viewDir = normalize(cameraPosition - vWorldPos);',
    '  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 3.0);',
    '  baseColor = mix(baseColor, brightTeal, fresnel * 0.7);',
    '  // Subtle pulsing brightness (4s cycle)',
    '  float pulse = 0.88 + 0.12 * sin(uTime * 1.57);',
    '  baseColor *= pulse;',
    '  // Bright emissive output — CSS handles glow',
    '  float emissiveStrength = 0.55 + fresnel * 0.9 + colorMix * 0.25;',
    '  gl_FragColor = vec4(baseColor * emissiveStrength, 1.0);',
    '}'
  ].join('\n');

  /* --- Setup --- */
  var canvas = document.getElementById('heroBlob');
  if (!canvas) return;

  // Check WebGL support
  try {
    var testGL = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testGL) throw 'no webgl';
  } catch (e) {
    canvas.style.display = 'none';
    var fallback = document.getElementById('heroBlobFallback');
    if (fallback) fallback.style.display = 'block';
    return;
  }

  // Reduced motion check
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var THREE = window.THREE;
  if (!THREE) return;

  var container = canvas.parentElement;

  // Renderer — transparent background, CSS provides the glow
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  // Scene & Camera
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.5;

  // Geometry — high-detail icosahedron for smooth morphing
  var geometry = new THREE.IcosahedronGeometry(1.2, 48);

  // Uniforms
  var uniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: 0.28 },
    uFrequency: { value: 1.5 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) }
  };

  // Material
  var material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms
  });

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // --- Sizing ---
  function resize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Mouse tracking (normalized to blob space) ---
  var mouseTarget = { x: 0, y: 0 };
  var mouseCurrent = { x: 0, y: 0 };

  document.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    mouseTarget.x = (e.clientX - cx) / (rect.width / 2);
    mouseTarget.y = -(e.clientY - cy) / (rect.height / 2);
  });

  // --- Animation loop ---
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var elapsed = clock.getElapsedTime();

    if (!reducedMotion) {
      uniforms.uTime.value = elapsed;

      // Smooth mouse interpolation
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.05;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.05;
      uniforms.uMouse.value.set(mouseCurrent.x, mouseCurrent.y, 0);

      // Gentle rotation
      mesh.rotation.y = elapsed * 0.08;
      mesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
    }

    renderer.render(scene, camera);
  }

  animate();
})();
