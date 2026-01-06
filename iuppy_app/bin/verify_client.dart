import 'dart:io';

void main(List<String> args) {
  if (args.isEmpty) {
    print('Usage: dart bin/verify_client.dart <slug>');
    exit(1);
  }

  final slug = args[0];
  print('🕵️‍♂️ Verifying configuration for client: $slug');

  bool hasErrors = false;

  // 1. Verify Icon
  final iconPath = 'assets/icons/$slug.png';
  if (!File(iconPath).existsSync()) {
    print('❌ Missing Icon: $iconPath');
    hasErrors = true;
  } else {
    print('✅ Icon found');
  }

  // 2. Verify Splash
  final splashPath = 'assets/splash/$slug.png';
  if (!File(splashPath).existsSync()) {
    print('❌ Missing Splash: $splashPath');
    hasErrors = true;
  } else {
    print('✅ Splash found');
  }

  // 3. Verify GoogleService-Info.plist
  final plistPath = 'ios/config/$slug/GoogleService-Info.plist';
  if (!File(plistPath).existsSync()) {
    print('❌ Missing GoogleService-Info.plist: $plistPath');
    print(
        '   👉 Action: Download from Firebase for package com.br.iuppy.$slug');
    hasErrors = true;
  } else {
    print('✅ GoogleService-Info.plist found');
  }

  // 4. Verify google-services.json (Android)
  // Logic: flavor name is <slug>Dev (assuming dev for verification)
  final jsonPath = 'android/app/src/${slug}Dev/google-services.json';
  if (!File(jsonPath).existsSync()) {
    print('❌ Missing google-services.json: $jsonPath');
    print(
        '   👉 Action: Download from Firebase (Android app) and place it there.');
    hasErrors = true;
  } else {
    print('✅ google-services.json found');
  }

  print('------------------------------------------------');
  if (hasErrors) {
    print(
        '⛔️ Verification FAILED. Please fix the above errors before building.');
    exit(1);
  } else {
    print('🟢 Verification PASSED. You are ready to build!');
  }
}
