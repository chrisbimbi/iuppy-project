export const sanitizeFileName = (fileName: string): string => {
    return fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-');
};

export const simulateFileUpload = async (file: File, prefix: string): Promise<string> => {
    const fileName = sanitizeFileName(`${prefix}-${file.name}`);
    const timestamp = Date.now();
    const url = `http://localhost:3000/uploads/${fileName}-${timestamp}`;

    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return url;
};