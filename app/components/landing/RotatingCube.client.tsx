/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import type { Group } from 'three';
import cubeModelUrl from '~/assets/models/cube.glb?url';

function Cube({ scale = 0.012 }: { scale?: number }) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(cubeModelUrl) as unknown as { scene: Group };

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return <primitive object={scene} scale={scale} ref={groupRef} />;
}

useGLTF.preload(cubeModelUrl);

export default function RotatingCubeClient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <directionalLight position={[-5, 2, -5]} intensity={3} />
        <directionalLight position={[5, 2, 5]} intensity={3} />
        <directionalLight position={[5, 2, -5]} intensity={3} />
        <directionalLight position={[-5, 2, 5]} intensity={3} />
        <Cube />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

/* eslint-enable react/no-unknown-property */
