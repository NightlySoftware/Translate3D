/* eslint-disable react/no-unknown-property */
import {Canvas, useFrame} from '@react-three/fiber';
import {OrbitControls, useGLTF} from '@react-three/drei';
import {useRef} from 'react';
import type {Group} from 'three';

function Cube({scale = 0.012}: {scale?: number}) {
  const groupRef = useRef<Group>(null);
  const {scene} = useGLTF('/models/cube.gltf') as unknown as {scene: Group};

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return <primitive object={scene} scale={scale} ref={groupRef} />;
}

useGLTF.preload('/models/cube.gltf');

export default function RotatingCubeClient() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden rounded-lg border border-dark/10 bg-light">
        <Canvas camera={{position: [0, 0, 5]}}>
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

      <p className="pointer-events-none absolute left-10 top-20 text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-tight">
        Tus
        <br />
        <span className="pl-10">ideas</span>
        <img
          src="/red_dash.png"
          alt=""
          className="pointer-events-none absolute -bottom-6 right-0 w-64 select-none"
          style={{mixBlendMode: 'multiply'}}
          loading="lazy"
        />
      </p>

      <p className="pointer-events-none absolute bottom-20 right-10 text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-tight">
        en tus
        <br />
        manos
      </p>
    </div>
  );
}

/* eslint-enable react/no-unknown-property */
