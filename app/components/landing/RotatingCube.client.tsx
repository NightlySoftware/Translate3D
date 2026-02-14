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
    <div className="relative h-full w-full">
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

      <p className="pointer-events-none uppercase absolute left-5 lg:left-10 top-10 lg:top-20 text-[56px] lg:text-[96px] font-extrabold leading-[0.95] tracking-tight drop-shadow-[0_0_2px_#fff] drop-shadow-[0_0_8px_#fff] lg:drop-shadow-none">
        Tus
        <br />
        <span className="pl-5 lg:pl-10">ideas</span>
        <img
          src="/red_dash.png"
          alt=""
          className="pointer-events-none absolute -bottom-6 right-0 w-32 lg:w-64 select-none"
          style={{ mixBlendMode: 'multiply' }}
          loading="lazy"
        />
      </p>

      <p className="pointer-events-none uppercase absolute bottom-10 lg:bottom-20 right-5 lg:right-10 text-[56px] lg:text-[96px] font-extrabold leading-[0.95] tracking-tight drop-shadow-[0_0_2px_#fff] drop-shadow-[0_0_8px_#fff] lg:drop-shadow-none">
        en tus
        <br />
        manos
      </p>
    </div>
  );
}

/* eslint-enable react/no-unknown-property */
