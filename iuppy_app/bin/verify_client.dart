import 'dart:io';

void main(List<String> args) {
  if (args.isEmpty) {
    stdout.writeln('Usage: dart bin/verify_client.dart <slug>');
    exit(1);
  }

  final slug = args[0];
  stdout.writeln('🕵️‍♂️ Verifying configuration for client: $slug');

  bool hasErrors = false;

  // 1. Verify Icon
  final iconPath = 'assets/icons/$slug.png';
  if (!File(iconPath).existsSync()) {
    stdout.writeln('❌ Missing Icon: $iconPath');
    hasErrors = true;
  } else {
    stdout.writeln('✅ Icon found');
  }

  // 2. Verify Splash
  final splashPath = 'assets/splash/$slug.png';
  if (!File(splashPath).existsSync()) {
    stdout.writeln('❌ Missing Splash: $splashPath');
    hasErrors = true;
  } else {
    stdout.writeln('✅ Splash found');
  }

  // 3. Verify GoogleService-Info.plist
  final plistPath = 'ios/config/$slug/GoogleService-Info.plist';
  if (!File(plistPath).existsSync()) {
    stdout.writeln('❌ Missing GoogleService-Info.plist: $plistPath');
    stdout.writeln(
        '   👉 Action: Download from Firebase for package com.br.iuppy.$slug');
    hasErrors = true;
  } else {
    stdout.writeln('✅ GoogleService-Info.plist found');
  }

  // 4. Verify google-services.json (Android)
  // Logic: flavor name is <slug>Dev (assuming dev for verification)
  final jsonPath = 'android/app/src/${slug}Dev/google-services.json';
  if (!File(jsonPath).existsSync()) {
    stdout.writeln('❌ Missing google-services.json: $jsonPath');
    stdout.writeln(
        '   👉 Action: Download from Firebase (Android app) and place it there.');
    hasErrors = true;
  } else {
    stdout.writeln('✅ google-services.json found');
  }

  stdout.writeln('------------------------------------------------');
  if (hasErrors) {
    stdout.writeln(
        '⛔️ Verification FAILED. Please fix the above errors before building.');
    exit(1);
  } else {
    stdout.writeln('🟢 Verification PASSED. You are ready to build!');
  }
}
