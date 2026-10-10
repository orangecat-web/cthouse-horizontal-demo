// 依 Orange Cat lab.html 上線版整理的 WebGL 等距柱狀投影；不依賴 Three.js 或外部 CDN。
const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
const float PI = 3.141592653589793;
void main() {
  vec2 screen = v_uv * 2.0 - 1.0;
  float focal = 1.0 / tan(radians(u_fov) * 0.5);
  vec3 ray = normalize(vec3(screen.x * u_resolution.x / u_resolution.y, screen.y, focal));
  float cp = cos(u_pitch), sp = sin(u_pitch);
  vec3 tilted = vec3(ray.x, cp * ray.y + sp * ray.z, -sp * ray.y + cp * ray.z);
  float cy = cos(u_yaw), sy = sin(u_yaw);
  vec3 direction = vec3(cy * tilted.x + sy * tilted.z, tilted.y, -sy * tilted.x + cy * tilted.z);
  float longitude = atan(direction.x, direction.z);
  float latitude = asin(clamp(direction.y, -1.0, 1.0));
  vec2 panoramaUV = vec2(fract(longitude / (2.0 * PI) + 0.5), clamp(0.5 - latitude / PI, 0.001, 0.999));
  gl_FragColor = texture2D(u_image, panoramaUV);
}`

export class PanoramaRenderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true })
    if (!gl) throw new Error('此瀏覽器無法啟用 WebGL 環景。')
    this.gl = gl
    this.canvas = canvas
    this.shaders = []
    try {
      this.program = gl.createProgram()
      for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
        const shader = gl.createShader(type)
        this.shaders.push(shader)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('環景著色器無法編譯。')
        gl.attachShader(this.program, shader)
      }
      gl.linkProgram(this.program)
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('環景程式無法連結。')
      this.position = gl.getAttribLocation(this.program, 'a_position')
      this.uniforms = Object.fromEntries(['u_image', 'u_resolution', 'u_yaw', 'u_pitch', 'u_fov'].map(name => [name, gl.getUniformLocation(this.program, name)]))
      this.buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      this.texture = gl.createTexture()
    } catch (error) { this.destroy(); throw error }
  }
  // 僅接受 2:1 等距柱狀素材；非 2 的次方尺寸使用 CLAMP_TO_EDGE，避免 WebGL1 紋理失效。
  setImage(image) {
    if (Math.abs(image.naturalWidth / image.naturalHeight - 2) > .1) throw new Error('請使用 2:1 等距柱狀全景圖片。')
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    const powerOfTwo = value => (value & (value - 1)) === 0
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, powerOfTwo(image.naturalWidth) && powerOfTwo(image.naturalHeight) ? gl.REPEAT : gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.hasImage = true
  }
  draw({ yaw, pitch, fov }) {
    if (!this.hasImage) return
    const gl = this.gl
    // 限制像素倍率與 GPU 紋理／繪圖能力，避免全螢幕或手機產生超大 canvas。
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), Math.round(this.canvas.clientWidth * ratio)))
    const height = Math.max(1, Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), Math.round(this.canvas.clientHeight * ratio)))
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height }
    gl.viewport(0, 0, width, height)
    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.enableVertexAttribArray(this.position)
    gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(this.uniforms.u_image, 0)
    gl.uniform2f(this.uniforms.u_resolution, width, height)
    gl.uniform1f(this.uniforms.u_yaw, yaw * Math.PI / 180)
    gl.uniform1f(this.uniforms.u_pitch, pitch * Math.PI / 180)
    gl.uniform1f(this.uniforms.u_fov, fov)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  destroy() {
    const gl = this.gl
    if (!gl) return
    if (this.texture) gl.deleteTexture(this.texture)
    if (this.buffer) gl.deleteBuffer(this.buffer)
    if (this.program) gl.deleteProgram(this.program)
    this.shaders.forEach(shader => gl.deleteShader(shader))
    this.hasImage = false
  }
}

// 世界座標經逆視角旋轉後投影到畫面，與 shader 的 yaw／pitch 保持一致，單位均為度。
export function projectPanoramaHotspot(hotspot, view, size) {
  if (!size.width || !size.height) return null
  const radians = degrees => degrees * Math.PI / 180
  const yaw = radians(hotspot.yaw), pitch = radians(hotspot.pitch)
  const x = Math.sin(yaw) * Math.cos(pitch), y = Math.sin(pitch), z = Math.cos(yaw) * Math.cos(pitch)
  const cy = Math.cos(radians(view.yaw)), sy = Math.sin(radians(view.yaw))
  const rotatedX = cy * x - sy * z, rotatedZ = sy * x + cy * z
  const cp = Math.cos(radians(view.pitch)), sp = Math.sin(radians(view.pitch))
  const cameraY = cp * y - sp * rotatedZ, cameraZ = sp * y + cp * rotatedZ
  if (cameraZ <= 0) return null
  const focal = 1 / Math.tan(radians(view.fov) / 2)
  const screenX = rotatedX / cameraZ * focal / (size.width / size.height), screenY = cameraY / cameraZ * focal
  if (Math.abs(screenX) > 1 || Math.abs(screenY) > 1) return null
  return { left: `${(screenX + 1) * 50}%`, top: `${(1 - screenY) * 50}%` }
}
