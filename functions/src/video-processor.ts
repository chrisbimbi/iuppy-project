import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { Storage } from '@google-cloud/storage';
// @ts-ignore
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Initialize FFmpeg with the binary from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const storage = new Storage();

interface VideoMetadata {
    duration: number;
    size: number;
    format: string;
    width?: number;
    height?: number;
}

export class VideoProcessor {
    constructor() { }

    async process(
        bucketName: string,
        filePath: string,
        fileName: string,
        contentType: string
    ): Promise<{ optimizedPath: string; thumbnailPath: string; metadata: VideoMetadata }> {

        const bucket = storage.bucket(bucketName);
        const fileNameBase = path.basename(filePath, path.extname(filePath));
        const workingDir = path.join(os.tmpdir(), 'video_processing_' + Date.now());

        // Paths
        const tempFilePath = path.join(workingDir, fileName); // Source
        const optimizedFileName = `optimized_${fileNameBase}.mp4`;
        const optimizedFilePath = path.join(workingDir, optimizedFileName);
        const thumbnailFileName = `thumb_${fileNameBase}.jpg`;
        const thumbnailFilePath = path.join(workingDir, thumbnailFileName);

        // Create temp dir
        if (!fs.existsSync(workingDir)) {
            fs.mkdirSync(workingDir);
        }

        try {
            console.log(`Downloading ${filePath} to ${tempFilePath}...`);
            await bucket.file(filePath).download({ destination: tempFilePath });

            console.log('Starting transcoding...');
            const metadata = await this.transcodeVideo(tempFilePath, optimizedFilePath);

            console.log('Generating thumbnail...');
            await this.generateThumbnail(tempFilePath, thumbnailFilePath);

            // Upload results
            // Structure: same directory as raw, or a sibling 'optimized' directory?
            // Let's put it in the same parent dir but change name? 
            // Better: journeys/{id}/optimized/filename.mp4
            // Input: journeys/{id}/raw/filename.mp4
            const parentDir = path.dirname(filePath); // journeys/{id}/raw
            const grandParentDir = path.dirname(parentDir); // journeys/{id}

            const destinationOptimized = path.join(grandParentDir, 'optimized', optimizedFileName);
            const destinationThumb = path.join(grandParentDir, 'thumbnails', thumbnailFileName);

            console.log(`Uploading to ${destinationOptimized}...`);
            await bucket.upload(optimizedFilePath, {
                destination: destinationOptimized,
                metadata: { contentType: 'video/mp4' }
            });

            console.log(`Uploading to ${destinationThumb}...`);
            await bucket.upload(thumbnailFilePath, {
                destination: destinationThumb,
                metadata: { contentType: 'image/jpeg' }
            });

            return {
                optimizedPath: destinationOptimized,
                thumbnailPath: destinationThumb,
                metadata
            };

        } finally {
            // Cleanup
            if (fs.existsSync(workingDir)) {
                fs.rmSync(workingDir, { recursive: true, force: true });
            }
        }
    }

    private transcodeVideo(inputPath: string, outputPath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-crf 26',           // Compression level (18-28 is good range)
                    '-preset fast',      // Speed vs Compression
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart', // Critical for streaming
                    '-vf scale=\'min(1080,iw)\':-2' // Max 1080p width, keep aspect ratio
                ])
                .on('end', () => {
                    // Get metadata of output
                    ffmpeg.ffprobe(outputPath, (err: Error | null, metadata: any) => {
                        if (err) {
                            // If probe fails, simpler return
                            resolve({ duration: 0, size: 0, format: 'mp4' });
                        } else {
                            resolve({
                                duration: metadata.format.duration || 0,
                                size: metadata.format.size || 0,
                                format: 'mp4',
                                width: metadata.streams[0]?.width,
                                height: metadata.streams[0]?.height
                            });
                        }
                    });
                })
                .on('error', (err: Error) => reject(err))
                .save(outputPath);
        });
    }

    private generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .screenshots({
                    timestamps: ['20%'], // Capture at 20% mark
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath),
                    size: '640x?' // Resize thumbnail
                })
                .on('end', () => resolve())
                .on('error', (err: Error) => reject(err));
        });
    }
}
