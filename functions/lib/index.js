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
exports.processVideo = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const admin = __importStar(require("firebase-admin"));
const video_processor_1 = require("./video-processor");
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
admin.initializeApp();
const videoProcessor = new video_processor_1.VideoProcessor();
// Configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.iuppy.com.br/api';
const API_KEY = process.env.API_KEY || 'system-secret';
const SERVICE_ACCOUNT = 'firebase-adminsdk-fbsvc@iuppy-app.iam.gserviceaccount.com';
exports.processVideo = (0, storage_1.onObjectFinalized)({
    cpu: 2,
    memory: "4GiB",
    serviceAccount: SERVICE_ACCOUNT,
    timeoutSeconds: 540, // 9 minutes
}, async (event) => {
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType;
    const bucketName = object.bucket;
    // 1. Validation
    if (!filePath || !contentType) {
        return console.log('File has no path or content type.');
    }
    // Filter: Only process files in 'raw/' directory
    if (!filePath.includes('/raw/')) {
        return console.log('File is not in raw/ directory, skipping.');
    }
    // Filter: Process video files only
    if (!contentType.startsWith('video/')) {
        return console.log('File is not a video.');
    }
    // Avoid loops
    if (filePath.includes('optimized') || filePath.includes('thumb')) {
        return console.log('File is already processed.');
    }
    console.log(`Processing video: ${filePath}`);
    try {
        // 2. Extract from company-first structure: {companyId}/journeys/steps/{stepId}/raw/...
        const parts = filePath.split('/');
        // Part 0: companyId (UUID)
        // Part 1: module (journeys, news, chat_files, etc.)
        // Part 2: steps
        // Part 3: stepId
        // Part 4: raw
        // Part 5: filename
        const companyId = parts[0];
        const module = parts[1];
        // Validate module
        if (module !== 'journeys') {
            console.log(`Not a journey video (module: ${module}), skipping.`);
            return;
        }
        // Extract stepId
        const stepsIndex = parts.indexOf('steps');
        let stepId = '';
        if (stepsIndex !== -1 && parts.length > stepsIndex + 1) {
            stepId = parts[stepsIndex + 1];
        }
        // Validation
        if (!companyId || !stepId) {
            console.error('Invalid path structure. Expected: {companyId}/journeys/steps/{stepId}/raw/...');
            console.error('Got:', filePath);
            return;
        }
        // Validate UUID format for companyId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(companyId)) {
            console.error('Invalid companyId format (not a UUID):', companyId);
            return;
        }
        console.log(`Company: ${companyId}, Step: ${stepId}`);
        // 3. Transcode video and generate thumbnail
        const result = await videoProcessor.process(bucketName, filePath, path.basename(filePath), contentType);
        console.log(`Video processed successfully. Optimized: ${result.optimizedPath}, Thumbnail: ${result.thumbnailPath}`);
        // 4. Construct public URLs
        const optimizedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(result.optimizedPath)}?alt=media`;
        const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(result.thumbnailPath)}?alt=media`;
        // 5. Notify backend (include companyId for validation)
        console.log(`Notifying backend for company ${companyId}, step ${stepId}...`);
        await axios_1.default.patch(`${BACKEND_API_URL}/journeys/steps/${stepId}/video-callback`, {
            optimizedUrl,
            thumbnailUrl,
            metadata: result.metadata,
            companyId // Include for backend validation
        }, { headers: { 'x-api-key': API_KEY } });
        console.log('Backend notified successfully.');
    }
    catch (error) {
        console.error('Error processing video:', error);
        throw error; // Re-throw to mark function as failed in logs
    }
});
//# sourceMappingURL=index.js.map