'use client';

export default function Spinner({
  size = 8,
  color = '#f9bbc4',
}: {
  size?: number;
  color?: string;
}) {
  const borderSize = size / 2;
  return (
    <div
      className="animate-spin rounded-full border-t-transparent"
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderWidth: `${borderSize}px`,
        borderColor: `${color}`,
      }}
    />
  );
}
