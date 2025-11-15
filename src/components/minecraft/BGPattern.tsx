import React from 'react';
import { cn } from '@/lib/utils';

type BGVariantType = 'dots' | 'diagonal-stripes' | 'grid' | 'horizontal-lines' | 'vertical-lines' | 'checkerboard';

interface BGPatternProps extends React.ComponentProps<'div'> {
  variant?: BGVariantType;
  size?: number;
  fill?: string;
}

function getBgImage(variant: BGVariantType, fill: string, size: number) {
  switch (variant) {
    case 'dots':
      return `radial-gradient(${fill} 1px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case 'diagonal-stripes':
      return `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
    case 'horizontal-lines':
      return `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case 'vertical-lines':
      return `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
    case 'checkerboard':
      return `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
    default:
      return undefined;
  }
}

export const BGPattern = ({
  variant = 'grid',
  size = 4,
  fill = '#3d2817',
  className,
  style,
  ...props
}: BGPatternProps) => {
  const bgSize = `${size}px ${size}px`;
  const backgroundImage = getBgImage(variant, fill, size);

  return (
    <div
      className={cn('absolute inset-0 z-[-10] size-full', className)}
      style={{
        backgroundImage,
        backgroundSize: bgSize,
        ...style,
      }}
      {...props}
    />
  );
};
