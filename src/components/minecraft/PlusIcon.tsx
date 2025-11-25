interface PlusIconProps {
    size?: number;
    className?: string;
}

export function PlusIcon({ size = 32, className = '' }: PlusIconProps) {
    const pixelSize = size / 8; // 8x8 픽셀 그리드

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 8 8"
            className={className}
            style={{ imageRendering: 'pixelated' }}
        >
            {/* 세로 라인 */}
            <rect x="3" y="1" width="2" height="6" fill="#FFD700" />

            {/* 가로 라인 */}
            <rect x="1" y="3" width="6" height="2" fill="#FFD700" />

            {/* 입체감을 위한 하이라이트 (상단/좌측) */}
            <rect x="3" y="1" width="1" height="6" fill="#FFED4E" opacity="0.6" />
            <rect x="1" y="3" width="6" height="1" fill="#FFED4E" opacity="0.6" />

            {/* 입체감을 위한 그림자 (하단/우측) */}
            <rect x="4" y="1" width="1" height="6" fill="#AA8700" opacity="0.4" />
            <rect x="1" y="4" width="6" height="1" fill="#AA8700" opacity="0.4" />
        </svg>
    );
}
