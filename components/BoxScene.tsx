"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";

export type FaceImages = { front: string | null; right: string | null; top: string | null };

function Box({ images, scale }: { images: FaceImages; scale: number }) {
  const urls = [images.right, images.right, images.top, images.top, images.front, images.front].map(v => v || "/placeholder.svg");
  const textures = useTexture(urls) as THREE.Texture[];
  textures.forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
  const materials = textures.map((texture, i) => <meshStandardMaterial key={i} map={texture} roughness={0.48} metalness={0.02} />);
  return <mesh scale={scale} castShadow receiveShadow rotation={[-0.15,0.65,0]}>
    <boxGeometry args={[2.6, 3.3, 1]} />{materials}
  </mesh>;
}

export default function BoxScene({ images, scale=1, className="" }: { images: FaceImages; scale?: number; className?: string }) {
 return <div className={`h-full w-full overflow-hidden rounded-3xl ${className}`}><Canvas gl={{ preserveDrawingBuffer:true, antialias:true }} shadows camera={{ position:[4.5,3.7,6], fov:38 }}>
   <color attach="background" args={["#eef2ff"]}/><ambientLight intensity={1.8}/><directionalLight position={[4,6,5]} intensity={3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/><Environment preset="studio"/>
   <Suspense fallback={null}><Box images={images} scale={scale}/></Suspense><OrbitControls enablePan={false} minDistance={4} maxDistance={9} minPolarAngle={0.65} maxPolarAngle={2.1}/>
 </Canvas></div>
}
