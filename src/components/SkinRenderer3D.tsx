'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SkinTraits } from '@/lib/traitGenerator';
import { createSkinTexture } from '@/lib/skinRenderer';

interface SkinRenderer3DProps {
    traits: SkinTraits;
    width?: number;
    height?: number;
}

/**
 * Three.js를 사용한 3D 스킨 렌더링 컴포넌트
 */
export function SkinRenderer3D({ traits, width = 512, height = 512 }: SkinRenderer3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        mesh: THREE.Mesh;
        animationId: number;
    } | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // 스킨 텍스처 생성
        const textureCanvas = createSkinTexture(traits);

        // Scene 설정
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.5, 4);
        camera.lookAt(0, 1, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Minecraft 캐릭터 모델 생성
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.magFilter = THREE.NearestFilter; // Pixel-perfect rendering
        texture.minFilter = THREE.NearestFilter;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 1;
        scene.add(mesh);

        // 애니메이션 루프
        const animate = () => {
            const animationId = requestAnimationFrame(animate);

            // 회전 애니메이션
            mesh.rotation.y += 0.01;

            renderer.render(scene, camera);

            // 참조 저장
            if (sceneRef.current) {
                sceneRef.current.animationId = animationId;
            }
        };

        animate();

        // 참조 저장
        sceneRef.current = {
            scene,
            camera,
            renderer,
            mesh,
            animationId: 0, // 초기값, animate에서 업데이트됨
        };

        // 윈도우 리사이즈 핸들러
        const handleResize = () => {
            if (!sceneRef.current) return;

            const { camera, renderer } = sceneRef.current;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // 클린업
        return () => {
            window.removeEventListener('resize', handleResize);

            if (sceneRef.current) {
                const { scene, renderer, animationId } = sceneRef.current;

                cancelAnimationFrame(animationId);

                scene.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                        if (object.material instanceof THREE.Material) {
                            object.material.dispose();
                        }
                    }
                });

                renderer.dispose();
                sceneRef.current = null;
            }
        };
    }, [traits, width, height]);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="rounded-lg shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                Three.js 3D 렌더링
            </div>
        </div>
    );
}
