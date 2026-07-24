import { Canvas } from "@react-three/fiber";
import CameraController from "../systems/CameraController";

function Ocean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

export default function OpeningScene() {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={1} />

      <Ocean />

      <CameraController />
    </Canvas>
  );
}