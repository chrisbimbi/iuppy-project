#!/usr/bin/env ts-node
/**
 * eSocial Configuration Architecture Verification Script
 * 
 * This script validates:
 * 1. Entity structure
 * 2. Service methods
 * 3. Controller endpoints
 * 4. Encryption/Decryption
 * 5. Module registration
 * 6. DTO validation
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
    category: string;
    test: string;
    passed: boolean;
    message: string;
}

const results: ValidationResult[] = [];

function log(category: string, test: string, passed: boolean, message: string) {
    results.push({ category, test, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} [${category}] ${test}: ${message}`);
}

// ===== 1. ENTITY VALIDATION =====
console.log('\n🔍 VALIDATING ENTITY...\n');

const entityPath = path.join(__dirname, '../src/modules/nr1/entities/company-esocial-config.entity.ts');
const entityExists = fs.existsSync(entityPath);

log('Entity', 'File exists', entityExists, entityExists ? 'Entity file found' : 'Entity file missing');

if (entityExists) {
    const entityContent = fs.readFileSync(entityPath, 'utf-8');

    // Check required decorators
    const hasEntity = entityContent.includes('@Entity');
    log('Entity', '@Entity decorator', hasEntity, hasEntity ? 'Has @Entity decorator' : 'Missing @Entity decorator');

    // Check required columns
    const requiredColumns = [
        'companyId', 'enabled', 'environment',
        'certificateData', 'certificatePassword', 'certificateExpiry',
        'medicoNome', 'medicoCpf', 'medicoCrm', 'medicoUf',
        'engenheiroNome', 'engenheiroCpf', 'engenheiroCrea', 'engenheiroUf',
        'configured', 'connectionTested'
    ];

    requiredColumns.forEach(col => {
        const hasColumn = entityContent.includes(col);
        log('Entity', `Column: ${col}`, hasColumn, hasColumn ? `Has ${col}` : `Missing ${col}`);
    });

    // Check timestamps
    const hasCreatedAt = entityContent.includes('@CreateDateColumn');
    const hasUpdatedAt = entityContent.includes('@UpdateDateColumn');
    log('Entity', 'Timestamps', hasCreatedAt && hasUpdatedAt, 'Has createdAt and updatedAt');
}

// ===== 2. SERVICE VALIDATION =====
console.log('\n🔍 VALIDATING SERVICE...\n');

const servicePath = path.join(__dirname, '../src/modules/nr1/services/nr1-esocial-config.service.ts');
const serviceExists = fs.existsSync(servicePath);

log('Service', 'File exists', serviceExists, serviceExists ? 'Service file found' : 'Service file missing');

if (serviceExists) {
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    // Check Injectable decorator
    const hasInjectable = serviceContent.includes('@Injectable()');
    log('Service', '@Injectable', hasInjectable, hasInjectable ? 'Has @Injectable decorator' : 'Missing @Injectable');

    // Check encryption methods
    const hasEncrypt = serviceContent.includes('private encrypt(');
    const hasDecrypt = serviceContent.includes('private decrypt(');
    log('Service', 'Encryption', hasEncrypt && hasDecrypt, 'Has encrypt/decrypt methods');

    // Check required methods
    const requiredMethods = [
        'getConfig', 'updateConfig', 'uploadCertificate',
        'testConnection', 'toggleEnabled', 'isConfigured',
        'getCertificateForUsage'
    ];

    requiredMethods.forEach(method => {
        const hasMethod = serviceContent.includes(`async ${method}(`);
        log('Service', `Method: ${method}`, hasMethod, hasMethod ? `Has ${method}` : `Missing ${method}`);
    });

    // Check encryption algorithm
    const hasAES256 = serviceContent.includes('aes-256-cbc');
    log('Service', 'AES-256 encryption', hasAES256, hasAES256 ? 'Uses AES-256-CBC' : 'Wrong encryption algorithm');

    // Check environment variable usage
    const usesEnvKey = serviceContent.includes('process.env.ESOCIAL_ENCRYPTION_KEY');
    log('Service', 'Environment key', usesEnvKey, usesEnvKey ? 'Uses env variable for key' : 'Hardcoded key (security risk)');
}

// ===== 3. CONTROLLER VALIDATION =====
console.log('\n🔍 VALIDATING CONTROLLER...\n');

const controllerPath = path.join(__dirname, '../src/modules/nr1/controllers/nr1-esocial-config.controller.ts');
const controllerExists = fs.existsSync(controllerPath);

log('Controller', 'File exists', controllerExists, controllerExists ? 'Controller file found' : 'Controller file missing');

if (controllerExists) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

    // Check decorator
    const hasController = controllerContent.includes('@Controller');
    log('Controller', '@Controller', hasController, hasController ? 'Has @Controller decorator' : 'Missing decorator');

    // Check route prefix
    const hasRoute = controllerContent.includes("'nr1/esocial/config'");
    log('Controller', 'Route prefix', hasRoute, hasRoute ? 'Correct route prefix' : 'Wrong route prefix');

    // Check JWT Guard
    const hasGuard = controllerContent.includes('@UseGuards(JwtAccessGuard)');
    log('Controller', 'JWT Guard', hasGuard, hasGuard ? 'Protected with JWT' : 'No authentication');

    // Check required endpoints
    const endpoints = [
        { method: '@Get()', name: 'getConfig' },
        { method: '@Put()', name: 'updateConfig' },
        { method: '@Post(\'certificate\')', name: 'uploadCertificate' },
        { method: '@Post(\'test\')', name: 'testConnection' },
        { method: '@Patch(\'toggle\')', name: 'toggleEnabled' },
        { method: '@Get(\'status\')', name: 'getStatus' }
    ];

    endpoints.forEach(ep => {
        const hasEndpoint = controllerContent.includes(ep.method) && controllerContent.includes(ep.name);
        log('Controller', `Endpoint: ${ep.name}`, hasEndpoint, hasEndpoint ? `Has ${ep.name}` : `Missing ${ep.name}`);
    });

    // Check file upload interceptor
    const hasFileInterceptor = controllerContent.includes('FileInterceptor');
    log('Controller', 'File upload', hasFileInterceptor, hasFileInterceptor ? 'Has file upload support' : 'No file upload');

    // Check sensitive data filtering
    const filtersSensitiveData = controllerContent.includes('***ENCRYPTED***');
    log('Controller', 'Security', filtersSensitiveData, filtersSensitiveData ? 'Filters sensitive data' : 'Exposes sensitive data');
}

// ===== 4. DTO VALIDATION =====
console.log('\n🔍 VALIDATING DTOs...\n');

const dtoPath = path.join(__dirname, '../src/modules/nr1/dto/esocial-config.dto.ts');
const dtoExists = fs.existsSync(dtoPath);

log('DTO', 'File exists', dtoExists, dtoExists ? 'DTO file found' : 'DTO file missing');

if (dtoExists) {
    const dtoContent = fs.readFileSync(dtoPath, 'utf-8');

    // Check validation decorators
    const hasValidation = dtoContent.includes('class-validator');
    log('DTO', 'Validation', hasValidation, hasValidation ? 'Uses class-validator' : 'No validation');

    // Check DTOs
    const hasUpdateDto = dtoContent.includes('export class UpdateEsocialConfigDto');
    const hasToggleDto = dtoContent.includes('export class ToggleEsocialDto');
    log('DTO', 'DTO classes', hasUpdateDto && hasToggleDto, 'Has all required DTOs');
}

// ===== 5. MODULE REGISTRATION =====
console.log('\n🔍 VALIDATING MODULE REGISTRATION...\n');

const modulePath = path.join(__dirname, '../src/modules/nr1/nr1.module.ts');
const moduleExists = fs.existsSync(modulePath);

log('Module', 'File exists', moduleExists, moduleExists ? 'Module file found' : 'Module file missing');

if (moduleExists) {
    const moduleContent = fs.readFileSync(modulePath, 'utf-8');

    // Check entity import and registration
    const importsEntity = moduleContent.includes("import { CompanyEsocialConfigEntity }");
    const registersEntity = moduleContent.includes('CompanyEsocialConfigEntity,');
    log('Module', 'Entity registered', importsEntity && registersEntity, 'Entity properly registered');

    // Check service import and registration
    const importsService = moduleContent.includes("import { Nr1EsocialConfigService }");
    const registersService = moduleContent.includes('Nr1EsocialConfigService,');
    log('Module', 'Service registered', importsService && registersService, 'Service properly registered');

    // Check controller import and registration
    const importsController = moduleContent.includes("import { Nr1EsocialConfigController }");
    const registersController = moduleContent.includes('Nr1EsocialConfigController,');
    log('Module', 'Controller registered', importsController && registersController, 'Controller properly registered');
}

// ===== 6. MIGRATION VALIDATION =====
console.log('\n🔍 VALIDATING MIGRATION...\n');

const migrationsDir = path.join(__dirname, '../src/database/migrations');
const migrations = fs.readdirSync(migrationsDir);
const esocialMigration = migrations.find(m => m.includes('CompanyEsocialConfig'));

log('Migration', 'File exists', !!esocialMigration, esocialMigration ? `Found: ${esocialMigration}` : 'Migration not generated');

// ===== 7. ENVIRONMENT VARIABLES =====
console.log('\n🔍 VALIDATING ENVIRONMENT...\n');

const envExamplePath = path.join(__dirname, '../.env.example');
if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    const hasEncryptionKey = envContent.includes('ESOCIAL_ENCRYPTION_KEY');
    log('Environment', '.env.example', hasEncryptionKey, hasEncryptionKey ? 'Has ESOCIAL_ENCRYPTION_KEY' : 'Missing encryption key variable');
}

// ===== SUMMARY =====
console.log('\n' + '='.repeat(80));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(80) + '\n');

const categories = [...new Set(results.map(r => r.category))];
categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const passed = catResults.filter(r => r.passed).length;
    const total = catResults.length;
    const percentage = Math.round((passed / total) * 100);

    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${cat}: ${passed}/${total} (${percentage}%)`);
});

const totalPassed = results.filter(r => r.passed).length;
const totalTests = results.length;
const overallPercentage = Math.round((totalPassed / totalTests) * 100);

console.log('\n' + '='.repeat(80));
console.log(`🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
console.log('='.repeat(80) + '\n');

// Failed tests detail
const failed = results.filter(r => !r.passed);
if (failed.length > 0) {
    console.log('❌ FAILED TESTS:\n');
    failed.forEach(f => {
        console.log(`   [${f.category}] ${f.test}: ${f.message}`);
    });
    console.log('');
}

// Exit with error if not 100%
if (overallPercentage < 100) {
    console.log('⚠️  Architecture validation incomplete. Please fix the issues above.\n');
    process.exit(1);
} else {
    console.log('🎉 Architecture validation PASSED! Everything looks perfect!\n');
    process.exit(0);
}
