"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type FaceImages = {
  front: string | null;
  back: string | null;
  right: string | null;
  left: string | null;
  top: string | null;
  bottom: string | null;
};

type BoxProps = {
  images: FaceImages;
  scale: number;
};

function Box({ images, scale }: BoxProps) {
  /*
   * Three.js BoxGeometry material indexes:
   *
   * material-0 = RIGHT
   * material-1 = LEFT
   * material-2 = TOP
   * material-3 = BOTTOM
   * material-4 = FRONT
   * material-5 = BACK
   */

  const rightUrl =
    images.right || "/placeholder.svg";

  const leftUrl =
    images.left || "/placeholder.svg";

  const topUrl =
    images.top || "/placeholder.svg";

  const bottomUrl =
    images.bottom || "/placeholder.svg";

  const frontUrl =
    images.front || "/placeholder.svg";

  const backUrl =
    images.back || "/placeholder.svg";

  /*
   * Load each URL separately.
   *
   * Do NOT use one texture for all six
   * materials.
   */
  const rightTexture =
    useLoader(
      THREE.TextureLoader,
      rightUrl,
    );

  const leftTexture =
    useLoader(
      THREE.TextureLoader,
      leftUrl,
    );

  const topTexture =
    useLoader(
      THREE.TextureLoader,
      topUrl,
    );

  const bottomTexture =
    useLoader(
      THREE.TextureLoader,
      bottomUrl,
    );

  const frontTexture =
    useLoader(
      THREE.TextureLoader,
      frontUrl,
    );

  const backTexture =
    useLoader(
      THREE.TextureLoader,
      backUrl,
    );

  /*
   * Configure every texture independently.
   */
  const textures = [
    rightTexture,
    leftTexture,
    topTexture,
    bottomTexture,
    frontTexture,
    backTexture,
  ];

  textures.forEach((texture) => {
    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy = 8;

    texture.wrapS =
      THREE.ClampToEdgeWrapping;

    texture.wrapT =
      THREE.ClampToEdgeWrapping;

    texture.needsUpdate = true;
  });

  return (
    <mesh
      scale={scale}
      castShadow
      receiveShadow
    >
      <boxGeometry
        args={[2.4, 3, 1.5]}
      />

      {/* RIGHT */}
      <meshStandardMaterial
        attach="material-0"
        map={rightTexture}
        roughness={0.48}
        metalness={0.02}
      />

      {/* LEFT */}
      <meshStandardMaterial
        attach="material-1"
        map={leftTexture}
        roughness={0.48}
        metalness={0.02}
      />

      {/* TOP */}
      <meshStandardMaterial
        attach="material-2"
        map={topTexture}
        roughness={0.48}
        metalness={0.02}
      />

      {/* BOTTOM */}
      <meshStandardMaterial
        attach="material-3"
        map={bottomTexture}
        roughness={0.48}
        metalness={0.02}
      />

      {/* FRONT */}
      <meshStandardMaterial
        attach="material-4"
        map={frontTexture}
        roughness={0.48}
        metalness={0.02}
      />

      {/* BACK */}
      <meshStandardMaterial
        attach="material-5"
        map={backTexture}
        roughness={0.48}
        metalness={0.02}
      />
    </mesh>
  );
}

export default function BoxScene({
  images,
  scale,
}: {
  images: FaceImages;
  scale: number;
}) {
  /*
   * Always provide all six values.
   * This prevents an undefined image from
   * accidentally becoming the texture for
   * another face.
   */
  const safeImages: FaceImages = {
    front: images?.front ?? null,
    back: images?.back ?? null,
    right: images?.right ?? null,
    left: images?.left ?? null,
    top: images?.top ?? null,
    bottom: images?.bottom ?? null,
  };

  return (
    <Canvas
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
      }}
      camera={{
        position: [5, 4, 6],
        fov: 42,
      }}
      dpr={[1, 2]}
      shadows
    >
      <ambientLight intensity={2.2} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={3}
        castShadow
      />

      <directionalLight
        position={[-5, 3, -4]}
        intensity={1.2}
      />

      <directionalLight
        position={[0, -3, 4]}
        intensity={0.8}
      />

      <Box
        images={safeImages}
        scale={scale}
      />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={12}
      />
    </Canvas>
  );
}