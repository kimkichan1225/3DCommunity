import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

function InspectGLTF() {
  const { scene } = useGLTF('/resources/GameView/PublicSquare.glb');

  useEffect(() => {
    // Traverse the scene to find the object
    let found = false;
    scene.traverse((child) => {
      if (child.name === 'cliff_block_rock002') {
        console.log('Found object:', child);
        found = true;
      }
    });

    if (!found) {
      console.log('Object cliff_block_rock002 not found in the GLTF file.');
    }
  }, [scene]);

  return null;
}

useGLTF.preload('/resources/GameView/PublicSquare.glb');

export default InspectGLTF;