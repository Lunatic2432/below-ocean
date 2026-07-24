import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

function CameraController() {
  const { camera } = useThree();

  const targetY = useRef(5);

  useEffect(() => {
    const handleScroll = () => {
      targetY.current = 5 - window.scrollY * 0.05;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useFrame(() => {
    camera.position.y += (targetY.current - camera.position.y) * 0.05;
  });

  return null;
}

export default CameraController;