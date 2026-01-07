"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage_1 = require("@google-cloud/storage");
// @ts-ignore
const ffmpegInstaller = __importStar(require("@ffmpeg-installer/ffmpeg"));
// Initialize FFmpeg with the binary from the installer
fluent_ffmpeg_1.default.setFfmpegPath(ffmpegInstaller.path);
const storage = new storage_1.Storage();
class VideoProcessor {
    constructor() { }
    async process(bucketName, filePath, fileName, contentType) {
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
        }
        finally {
            // Cleanup
            if (fs.existsSync(workingDir)) {
                fs.rmSync(workingDir, { recursive: true, force: true });
            }
        }
    }
    transcodeVideo(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .outputOptions([
                '-c:v libx264',
                '-crf 26',
                '-preset fast',
                '-c:a aac',
                '-b:a 128k',
                '-movflags +faststart',
                '-vf scale=\'min(1080,iw)\':-2' // Max 1080p width, keep aspect ratio
            ])
                .on('end', () => {
                // Get metadata of output
                fluent_ffmpeg_1.default.ffprobe(outputPath, (err, metadata) => {
                    var _a, _b;
                    if (err) {
                        // If probe fails, simpler return
                        resolve({ duration: 0, size: 0, format: 'mp4' });
                    }
                    else {
                        resolve({
                            duration: metadata.format.duration || 0,
                            size: metadata.format.size || 0,
                            format: 'mp4',
                            width: (_a = metadata.streams[0]) === null || _a === void 0 ? void 0 : _a.width,
                            height: (_b = metadata.streams[0]) === null || _b === void 0 ? void 0 : _b.height
                        });
                    }
                });
            })
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }
    generateThumbnail(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .screenshots({
                timestamps: ['20%'],
                filename: path.basename(outputPath),
                folder: path.dirname(outputPath),
                size: '640x?' // Resize thumbnail
            })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
    }
}
exports.VideoProcessor = VideoProcessor;
//# sourceMappingURL=video-processor.js.map