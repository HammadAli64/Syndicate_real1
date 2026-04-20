'use client'

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import { useEffect, useRef } from 'react'
import './FlyingPosters.css'

type FlyingPostersProps = {
  items: string[]
  planeWidth?: number
  planeHeight?: number
  distortion?: number
  scrollEase?: number
  cameraFov?: number
  cameraZ?: number
  orbitRadius?: number
  orbitSpeed?: number
}

type PosterItem = {
  mesh: Mesh
  texture: Texture
  theta: number
}

const vertexShader = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uDistortion;
uniform float uVelocity;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  float wave = sin((p.y * 7.0) + (uTime * 2.0)) * 0.02 * uDistortion;
  float push = cos((p.x * 8.0) + (uTime * 1.5)) * 0.02 * uDistortion;
  p.z += (wave + push) * (0.65 + min(abs(uVelocity), 3.0) * 0.25);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const fragmentShader = `
precision highp float;
uniform sampler2D tMap;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tMap, vUv);
  if (color.a < 0.04) discard;
  gl_FragColor = color;
}
`

export default function FlyingPosters({
  items,
  planeWidth = 320,
  planeHeight = 320,
  distortion = 3,
  scrollEase = 0.01,
  cameraFov = 45,
  cameraZ = 20,
  orbitRadius = 5.5,
  orbitSpeed = 0.12,
}: FlyingPostersProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || items.length === 0) return

    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    root.appendChild(gl.canvas)

    const camera = new Camera(gl, { fov: cameraFov })
    camera.position.z = cameraZ
    const scene = new Transform()

    const geometry = new Plane(gl, { widthSegments: 24, heightSegments: 24 })
    const posters: PosterItem[] = []

    const interaction = {
      target: 0,
      current: 0,
      velocity: 0,
      dragging: false,
      lastX: 0,
    }

    const toWorldScale = () => {
      const h = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const pxToWorld = h / Math.max(1, root.clientHeight)
      return { w: planeWidth * pxToWorld, h: planeHeight * pxToWorld }
    }

    const makePoster = (src: string, index: number, length: number) => {
      const texture = new Texture(gl, { generateMipmaps: true })
      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        transparent: true,
        uniforms: {
          tMap: { value: texture },
          uTime: { value: 0 },
          uDistortion: { value: distortion },
          uVelocity: { value: 0 },
        },
      })

      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = src
      img.onload = () => {
        texture.image = img
      }

      const mesh = new Mesh(gl, { geometry, program })
      mesh.setParent(scene)

      const initial = (index / length) * Math.PI * 2
      posters.push({ mesh, texture, theta: initial })
    }

    items.forEach((src, index) => makePoster(src, index, items.length))

    const onResize = () => {
      const width = root.clientWidth
      const height = root.clientHeight
      renderer.setSize(width, height)
      camera.perspective({ aspect: width / Math.max(1, height) })
      const scale = toWorldScale()
      posters.forEach((poster) => {
        poster.mesh.scale.set(scale.w, scale.h, 1)
      })
    }

    const onWheel = (event: WheelEvent) => {
      interaction.target += event.deltaY * 0.0012
    }

    const beginDrag = (x: number) => {
      interaction.dragging = true
      interaction.lastX = x
    }

    const moveDrag = (x: number) => {
      if (!interaction.dragging) return
      const delta = x - interaction.lastX
      interaction.lastX = x
      interaction.target -= delta * 0.008
    }

    const endDrag = () => {
      interaction.dragging = false
    }

    const onMouseDown = (event: MouseEvent) => beginDrag(event.clientX)
    const onMouseMove = (event: MouseEvent) => moveDrag(event.clientX)
    const onTouchStart = (event: TouchEvent) => beginDrag(event.touches[0]?.clientX ?? 0)
    const onTouchMove = (event: TouchEvent) => moveDrag(event.touches[0]?.clientX ?? 0)

    root.addEventListener('wheel', onWheel, { passive: true })
    root.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', endDrag)
    window.addEventListener('resize', onResize)
    onResize()

    let raf = 0
    const animate = (timeMs: number) => {
      const time = timeMs * 0.001
      interaction.current += (interaction.target - interaction.current) * scrollEase
      interaction.velocity = interaction.current - interaction.velocity * 0.85

      posters.forEach((poster, i) => {
        const theta = poster.theta + interaction.current + time * orbitSpeed
        const x = Math.cos(theta) * orbitRadius
        const z = Math.sin(theta) * orbitRadius
        const y = Math.sin(theta * 1.3 + i * 0.7) * 0.6

        poster.mesh.position.set(x, y, z)
        poster.mesh.rotation.y = -theta + Math.PI * 0.5
        poster.mesh.rotation.x = y * 0.08
        poster.mesh.program.uniforms.uTime.value = time + i * 0.5
        poster.mesh.program.uniforms.uDistortion.value = distortion
        poster.mesh.program.uniforms.uVelocity.value = interaction.target - interaction.current
      })

      renderer.render({ scene, camera })
      raf = window.requestAnimationFrame(animate)
    }
    raf = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(raf)
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', endDrag)
      window.removeEventListener('resize', onResize)
      if (gl.canvas.parentElement === root) {
        root.removeChild(gl.canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [cameraFov, cameraZ, distortion, items, orbitRadius, orbitSpeed, planeHeight, planeWidth, scrollEase])

  return (
    <section className="flying-posters">
      <div ref={rootRef} className="flying-posters__canvas" />
    </section>
  )
}
