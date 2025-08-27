// Helper puro (sem dependências externas)
export async function getCroppedSquare(file: File, targetSize = 512): Promise<File> {
    const img = await readImageFromFile(file);
    const size = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - size) / 2);
    const sy = Math.floor((img.height - size) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);

    const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png', 0.92)
    );

    return new File([blob], renameToPng(file.name), { type: 'image/png' });
}

function readImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

function renameToPng(name: string) {
    const base = name.replace(/\.[^.]+$/, '');
    return `${base}.png`;
}