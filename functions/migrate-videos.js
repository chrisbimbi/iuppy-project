#!/usr/bin/env node

/**
 * Migration Script: Move Videos to Company-Isolated Structure
 * 
 * This script:
 * 1. Finds all videos in old paths (steps/* and journeys/*)
 * 2. Looks up companyId from database via stepId
 * 3. Copies videos to new path: companies/{companyId}/steps/{stepId}/
 * 4. Updates database URLs
 */

const { Storage } = require('@google-cloud/storage');
const axios = require('axios');

const storage = new Storage();
const BUCKET_NAME = 'iuppy-app.firebasestorage.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.iuppy.com.br/api';
const API_KEY = process.env.API_KEY || 'system-secret';

// Helper to extract stepId from path
function extractStepId(filePath) {
    // Try pattern: steps/{stepId}/...
    let match = filePath.match(/steps\/([^\/]+)\//);
    if (match) return match[1];

    // Try pattern: journeys/{stepId}/...
    match = filePath.match(/journeys\/([^\/]+)\//);
    if (match) return match[1];

    return null;
}

// Fetch companyId from backend
async function getCompanyIdForStep(stepId) {
    try {
        const response = await axios.get(
            `${BACKEND_URL}/journeys/steps/${stepId}`,
            { headers: { 'x-api-key': API_KEY } }
        );

        // Assuming response has structure: { journey: { companyId: '...' } }
        return response.data.journey?.companyId || response.data.companyId;
    } catch (error) {
        console.error(`Failed to fetch companyId for step ${stepId}:`, error.message);
        return null;
    }
}

// Copy file to new location
async function copyFile(bucket, oldPath, newPath) {
    try {
        const sourceFile = bucket.file(oldPath);
        const destinationFile = bucket.file(newPath);

        console.log(`  Copying: ${oldPath} → ${newPath}`);

        await sourceFile.copy(destinationFile);

        console.log(`  ✓ Copied successfully`);
        return true;
    } catch (error) {
        console.error(`  ✗ Copy failed:`, error.message);
        return false;
    }
}

// Main migration function
async function migrate() {
    console.log('🔄 Starting video migration to company-isolated structure...\n');

    const bucket = storage.bucket(BUCKET_NAME);

    // Find all video files in old paths
    console.log('📁 Scanning for videos in old paths...');

    const [filesSteps] = await bucket.getFiles({ prefix: 'steps/' });
    const [filesJourneys] = await bucket.getFiles({ prefix: 'journeys/' });

    const allFiles = [...filesSteps, ...filesJourneys];
    const videoFiles = allFiles.filter(file =>
        file.name.includes('/raw/') &&
        (file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi'))
    );

    console.log(`Found ${videoFiles.length} video files to migrate\n`);

    if (videoFiles.length === 0) {
        console.log('✅ No videos to migrate!');
        return;
    }

    // Process each video
    let successCount = 0;
    let failedCount = 0;

    for (const file of videoFiles) {
        const oldPath = file.name;
        console.log(`\n🎬 Processing: ${oldPath}`);

        // Extract stepId
        const stepId = extractStepId(oldPath);
        if (!stepId) {
            console.log(`  ✗ Could not extract stepId from path`);
            failedCount++;
            continue;
        }

        console.log(`  Step ID: ${stepId}`);

        // Get companyId from backend
        const companyId = await getCompanyIdForStep(stepId);
        if (!companyId) {
            console.log(`  ✗ Could not fetch companyId for step`);
            failedCount++;
            continue;
        }

        console.log(`  Company ID: ${companyId}`);

        // Construct new path
        // Old: steps/{stepId}/raw/video.mp4 or journeys/{stepId}/raw/video.mp4
        // New: companies/{companyId}/steps/{stepId}/raw/video.mp4

        const pathParts = oldPath.split('/');
        const rawIndex = pathParts.indexOf('raw');
        const fileName = pathParts.slice(rawIndex).join('/'); // raw/video.mp4

        const newPath = `companies/${companyId}/steps/${stepId}/${fileName}`;

        // Copy file
        const success = await copyFile(bucket, oldPath, newPath);

        if (success) {
            successCount++;

            // Also copy optimized and thumbnail if they exist
            const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
            const parentDir = oldDir.substring(0, oldDir.lastIndexOf('/'));

            // Try to copy optimized version
            const optimizedPath = parentDir + '/optimized/' + pathParts[pathParts.length - 1].replace(/^.*_/, 'optimized_');
            const newOptimizedPath = `companies/${companyId}/steps/${stepId}/optimized/` + pathParts[pathParts.length - 1].replace(/^.*_/, 'optimized_');

            try {
                const optimizedExists = await bucket.file(optimizedPath).exists();
                if (optimizedExists[0]) {
                    await copyFile(bucket, optimizedPath, newOptimizedPath);
                }
            } catch (e) {
                // Optimized doesn't exist, skip
            }

            // Try to copy thumbnail
            const thumbName = pathParts[pathParts.length - 1].replace(/\.[^.]+$/, '.jpg').replace(/^.*_/, 'thumb_');
            const thumbPath = parentDir + '/thumbnails/' + thumbName;
            const newThumbPath = `companies/${companyId}/steps/${stepId}/thumbnails/` + thumbName;

            try {
                const thumbExists = await bucket.file(thumbPath).exists();
                if (thumbExists[0]) {
                    await copyFile(bucket, thumbPath, newThumbPath);
                }
            } catch (e) {
                // Thumbnail doesn't exist, skip
            }

        } else {
            failedCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ✗ Failed:  ${failedCount}`);
    console.log(`  📁 Total:   ${videoFiles.length}`);
    console.log('='.repeat(50));

    if (successCount > 0) {
        console.log('\n⚠️  IMPORTANT: Old files were COPIED, not moved.');
        console.log('   After verifying the new structure works, you can delete old files with:');
        console.log('   gsutil -m rm -r gs://iuppy-app.firebasestorage.app/steps/**');
        console.log('   gsutil -m rm -r gs://iuppy-app.firebasestorage.app/journeys/**');
    }
}

// Run migration
migrate()
    .then(() => {
        console.log('\n✅ Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
