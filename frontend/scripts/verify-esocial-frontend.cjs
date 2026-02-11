#!/usr/bin/env node
/**
 * Frontend eSocial Configuration Verification Script
 * 
 * Validates:
 * 1. Service file structure
 * 2. Component file structure
 * 3. TypeScript interfaces
 * 4. API integration
 * 5. Form validation logic
 */

const fs = require('fs');
const path = require('path');

const results = [];

function log(category, test, passed, message) {
    results.push({ category, test, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} [${category}] ${test}: ${message}`);
}

// ===== 1. SERVICE VALIDATION =====
console.log('\n🔍 VALIDATING FRONTEND SERVICE...\n');

const servicePath = path.join(__dirname, '../src/app/modules/nr1/services/esocial-config.service.ts');
const serviceExists = fs.existsSync(servicePath);

log('Service', 'File exists', serviceExists, serviceExists ? 'Service file found' : 'Service file missing');

if (serviceExists) {
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    // Check interfaces
    const hasConfigInterface = serviceContent.includes('export interface EsocialConfig');
    const hasDtoInterface = serviceContent.includes('export interface UpdateEsocialConfigDto');
    log('Service', 'TypeScript interfaces', hasConfigInterface && hasDtoInterface, 'Has required interfaces');

    // Check API methods
    const apiMethods = [
        'getConfig', 'updateConfig', 'uploadCertificate',
        'testConnection', 'toggleEnabled', 'getStatus'
    ];

    apiMethods.forEach(method => {
        const hasMethod = serviceContent.includes(`${method}:`);
        log('Service', `API method: ${method}`, hasMethod, hasMethod ? `Has ${method}` : `Missing ${method}`);
    });

    // Check API calls
    const usesApiGet = serviceContent.includes('api.get(');
    const usesApiPut = serviceContent.includes('api.put(');
    const usesApiPost = serviceContent.includes('api.post(');
    const usesApiPatch = serviceContent.includes('api.patch(');
    log('Service', 'HTTP methods', usesApiGet && usesApiPut && usesApiPost && usesApiPatch, 'Uses all required HTTP methods');

    // Check endpoints
    const endpoints = [
        '/nr1/esocial/config',
        '/nr1/esocial/config/certificate',
        '/nr1/esocial/config/test',
        '/nr1/esocial/config/toggle',
        '/nr1/esocial/config/status'
    ];

    endpoints.forEach(endpoint => {
        const hasEndpoint = serviceContent.includes(`'${endpoint}'`);
        log('Service', `Endpoint: ${endpoint}`, hasEndpoint, hasEndpoint ? `Calls ${endpoint}` : `Missing ${endpoint}`);
    });

    // Check FormData usage for file upload
    const usesFormData = serviceContent.includes('new FormData()');
    log('Service', 'File upload', usesFormData, usesFormData ? 'Uses FormData for upload' : 'No file upload support');
}

// ===== 2. COMPONENT VALIDATION =====
console.log('\n🔍 VALIDATING FRONTEND COMPONENT...\n');

const componentPath = path.join(__dirname, '../src/app/modules/nr1/views/esocial/EsocialConfigPage.tsx');
const componentExists = fs.existsSync(componentPath);

log('Component', 'File exists', componentExists, componentExists ? 'Component file found' : 'Component file missing');

if (componentExists) {
    const componentContent = fs.readFileSync(componentPath, 'utf-8');

    // Check React imports
    const importsReact = componentContent.includes("import React");
    const importsState = componentContent.includes('useState');
    const importsEffect = componentContent.includes('useEffect');
    log('Component', 'React hooks', importsReact && importsState && importsEffect, 'Uses React hooks');

    // Check Bootstrap components
    const bootstrapComponents = ['Form', 'Button', 'Alert', 'Spinner', 'Badge', 'Row', 'Col'];
    const hasBootstrap = bootstrapComponents.every(comp => componentContent.includes(comp));
    log('Component', 'UI components', hasBootstrap, hasBootstrap ? 'Uses Bootstrap components' : 'Missing UI components');

    // Check service usage
    const usesService = componentContent.includes('EsocialConfigService');
    log('Component', 'Service integration', usesService, usesService ? 'Uses eSocial service' : 'Not connected to service');

    // Check state management
    const states = [
        'config', 'loading', 'saving', 'testing',
        'certificateFile', 'certificatePassword', 'testResult', 'formData'
    ];

    states.forEach(state => {
        const hasState = componentContent.includes(`useState`) && (componentContent.includes(`${state},`) || componentContent.includes(`${state}]`));
        log('Component', `State: ${state}`, hasState, hasState ? `Manages ${state} state` : `Missing ${state} state`);
    });

    // Check form sections
    const sections = [
        'Toggle de Habilitação',
        'Ambiente eSocial',
        'Certificado Digital',
        'Médico do Trabalho',
        'Engenheiro de Segurança',
        'Validação'
    ];

    sections.forEach(section => {
        const hasSection = componentContent.includes(section);
        log('Component', `Section: ${section}`, hasSection, hasSection ? `Has ${section}` : `Missing ${section}`);
    });

    // Check handlers
    const handlers = [
        'handleToggle', 'handleFieldChange', 'handleFileChange',
        'handleUploadCertificate', 'handleSave', 'handleTestConnection'
    ];

    handlers.forEach(handler => {
        const hasHandler = componentContent.includes(`const ${handler}`);
        log('Component', `Handler: ${handler}`, hasHandler, hasHandler ? `Has ${handler}` : `Missing ${handler}`);
    });

    // Check validation
    const hasValidation = componentContent.includes('isFormValid');
    log('Component', 'Form validation', hasValidation, hasValidation ? 'Has form validation' : 'No validation');

    // Check UF list
    const hasUFs = componentContent.includes('const UFS');
    log('Component', 'UF list', hasUFs, hasUFs ? 'Has Brazilian states' : 'Missing UF list');

    // Check loading states
    const hasLoadingState = componentContent.includes('Spinner');
    log('Component', 'Loading indicators', hasLoadingState, hasLoadingState ? 'Shows loading states' : 'No loading feedback');

    // Check error handling
    const hasTryCatch = componentContent.includes('try {') && componentContent.includes('catch');
    log('Component', 'Error handling', hasTryCatch, hasTryCatch ? 'Has error handling' : 'No error handling');

    // Check status badges
    const hasBadges = componentContent.includes('Badge');
    log('Component', 'Status badges', hasBadges, hasBadges ? 'Shows status badges' : 'No visual status');
}

// ===== 3. INTEGRATION VALIDATION =====
console.log('\n🔍 VALIDATING INTEGRATION...\n');

if (serviceExists && componentExists) {
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');
    const componentContent = fs.readFileSync(componentPath, 'utf-8');

    // Check if component imports service
    const importsService = componentContent.includes("from '../../services/esocial-config.service'");
    log('Integration', 'Service import', importsService, importsService ? 'Component imports service' : 'Service not imported');

    // Check if component uses service methods
    const serviceMethodsUsed = [
        'EsocialConfigService.getConfig',
        'EsocialConfigService.updateConfig',
        'EsocialConfigService.uploadCertificate',
        'EsocialConfigService.testConnection',
        'EsocialConfigService.toggleEnabled'
    ];

    serviceMethodsUsed.forEach(method => {
        const usesMethod = componentContent.includes(method);
        log('Integration', `Uses: ${method}`, usesMethod, usesMethod ? `Calls ${method}` : `Doesn't use ${method}`);
    });
}

// ===== 4. TYPE SAFETY =====
console.log('\n🔍 VALIDATING TYPE SAFETY...\n');

if (serviceExists) {
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    // Check TypeScript usage
    const usesTypes = serviceContent.includes(': Promise<') || serviceContent.includes('interface');
    log('TypeSafety', 'TypeScript', usesTypes, usesTypes ? 'Uses TypeScript types' : 'No type annotations');

    // Check return types
    const hasReturnTypes = serviceContent.includes('Promise<EsocialConfig>') && serviceContent.includes('Promise<{ success: boolean');
    log('TypeSafety', 'Return types', hasReturnTypes, hasReturnTypes ? 'Methods have return types' : 'Missing return types');
}

// ===== SUMMARY =====
console.log('\n' + '='.repeat(80));
console.log('📊 FRONTEND VALIDATION SUMMARY');
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
    console.log('⚠️  Frontend validation incomplete. Please fix the issues above.\n');
    process.exit(1);
} else {
    console.log('🎉 Frontend validation PASSED! Everything looks perfect!\n');
    process.exit(0);
}
