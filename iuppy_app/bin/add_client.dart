import 'dart:io';

/// Usage: dart bin/add_client.dart --name="Acme Corp" --slug="acme" --bundle-id="com.acme.app" --scheme="acmeapp" --key="COMPANY_KEY_VALUE"
///
/// This script:
/// 1. Updates android/app/build.gradle with new flavors (dev/prod).
/// 2. Creates ios/Flutter/<slug>Dev.xcconfig and ios/Flutter/<slug>Prod.xcconfig.
/// 3. Runs ios/setup_flavors.rb to register schemes and build configs in Xcode.
/// 4. Creates flutter_launcher_icons-<slug>.yaml and flutter_native_splash-<slug>.yaml template files.

void main(List<String> args) async {
  final parser = _SimpleArgParser(args);
  final name = parser.get('name');
  final slug = parser.get('slug');
  final bundleId = parser.get('bundle-id');
  final scheme = parser.get('scheme');

  if (name == null || slug == null || bundleId == null || scheme == null) {
    stdout.writeln(
        '❌ Usage: dart bin/add_client.dart --name="Acme Corp" --slug="acme" --bundle-id="com.acme.app" --scheme="acme_app" [--key="optional_key"]');
    exit(1);
  }

  stdout.writeln('🚀 Generating client: $name ($slug)');

  // 1. Android
  await _updateAndroidGradle(slug, bundleId, name, scheme);

  // 2. iOS Configs
  await _createIosXcconfigs(slug, bundleId, name, scheme);

  // 3. iOS Xcode Project Update (Ruby)
  await _runRubyScript(slug, bundleId, name, scheme);

  // 3.5 Update Podfile
  await _updatePodfile(slug);

  // 4. Asset Configs
  await _createAssetConfigs(slug);

  stdout.writeln('\n✅ Client "$slug" added successfully!');
  stdout.writeln('👉 Next steps:');
  stdout.writeln('   1. Add icon to assets/icons/$slug.png');
  stdout.writeln('   2. Add splash to assets/splash/$slug.png');
  stdout
      .writeln('   3. Download GoogleService-Info.plist to ios/config/$slug/');
  stdout.writeln(
      '   3. Run: flutter pub run flutter_launcher_icons -f flutter_launcher_icons-$slug.yaml');
  stdout.writeln(
      '   4. Run: flutter pub run flutter_native_splash:create --path=flutter_native_splash-$slug.yaml');
  stdout.writeln('   5. Test: flutter run --flavor ${slug}Dev');
}

Future<void> _updateAndroidGradle(
    String slug, String bundleId, String name, String scheme) async {
  final file = File('android/app/build.gradle');
  if (!file.existsSync()) {
    stdout.writeln('❌ android/app/build.gradle not found!');
    return;
  }

  String content = await file.readAsString();

  // Check if flavor already exists
  if (content.contains('${slug}Dev {')) {
    stdout.writeln('⚠️ Android flavors for $slug already exist. Skipping.');
    return;
  }

  // We are using FLATTENED flavors (no extra dimensions per client)
  // Ensure we have "env" dimension or "flavor" dimension.
  // For simplicity, we stick to what was there or ensure 'env' is used if that matches the plan.
  // The plan was to flatten.

  if (!content.contains('flavorDimensions "env"')) {
    // If it's pure standard, maybe insert it?
    // But let's assume valid base.
    // We'll append to productFlavors.
  }

  final newFlavors = '''
        ${slug}Dev {
            dimension "env"
            applicationId "$bundleId.dev"
            resValue "string", "app_name", "$name DEV"
            manifestPlaceholders = [ appAuthRedirectScheme: "${scheme}dev" ]
        }
        ${slug}Prod {
            dimension "env"
            applicationId "$bundleId"
            resValue "string", "app_name", "$name"
            manifestPlaceholders = [ appAuthRedirectScheme: "$scheme" ]
        }
  ''';

  // Insert before the closing brace of productFlavors
  // This is a naive regex replacement, assuming standard formatting.
  final flavorBlockEnd = RegExp(r'productFlavors\s*\{.*\}', dotAll: true);

  if (flavorBlockEnd.hasMatch(content)) {
    // Hard to insert purely with regex without parsing balanced braces.
    // Trick: Find the last "}" before "buildTypes" or end of android block?
    // Or just find "productFlavors {" and insert at the end of it?

    // Let's retry simpler: Find "prod {" (the existing one) and insert after it?
    // Or find the last closing brace of a flavor.

    // Safer: Append to existing flavours
    if (content.contains('prod {')) {
      // We find the closing brace of prod and insert after
      // This is risky with just text processing.
      // Let's assume the file ends with the closing brace of productFlavors indent.

      // Strategy: replace "productFlavors {" with "productFlavors {\n$newFlavors"
      // This puts it at the TOP of productFlavors. Safe and easy.
      content = content.replaceFirst(
          'productFlavors {', 'productFlavors {\n$newFlavors');
      await file.writeAsString(content);
      stdout.writeln('✅ Android build.gradle updated.');
    } else {
      stdout.writeln('❌ Could not find productFlavors block in build.gradle');
    }
  }
}

Future<void> _createIosXcconfigs(
    String slug, String bundleId, String name, String scheme) async {
  final devConfig = '''
#include "Generated.xcconfig"
#include "Pods/Target Support Files/Pods-Runner/Pods-Runner.debug.xcconfig"

FLUTTER_TARGET=lib/main.dart
ASSET_PREFIX=$slug
BUNDLE_DISPLAY_NAME=$name DEV
BUNDLE_SUFFIX=.dev
DEEP_LINK_SCHEME=${scheme}dev
PRODUCT_BUNDLE_IDENTIFIER=$bundleId
''';

  final prodConfig = '''
#include "Generated.xcconfig"
#include "Pods/Target Support Files/Pods-Runner/Pods-Runner.release.xcconfig"

FLUTTER_TARGET=lib/main.dart
ASSET_PREFIX=$slug
BUNDLE_DISPLAY_NAME=$name
BUNDLE_SUFFIX=
DEEP_LINK_SCHEME=$scheme
PRODUCT_BUNDLE_IDENTIFIER=$bundleId
''';

  await File('ios/Flutter/${slug}Dev.xcconfig').writeAsString(devConfig);
  await File('ios/Flutter/${slug}Prod.xcconfig').writeAsString(prodConfig);
  stdout.writeln('✅ iOS xcconfig files created.');
}

Future<void> _runRubyScript(
    String slug, String bundleId, String name, String scheme) async {
  stdout.writeln('💎 Running ruby script to update Xcode project...');

  final result = await Process.run(
    'ruby',
    [
      'setup_flavors.rb',
      slug,
      bundleId,
      bundleId, // Prod Bundle ID same as base usually
      "$name DEV",
      name,
      "${scheme}dev",
      scheme
    ],
    workingDirectory: 'ios',
  );

  if (result.exitCode != 0) {
    stdout.writeln('❌ Ruby script failed:');
    stdout.writeln(result.stdout);
    stdout.writeln(result.stderr);
  } else {
    stdout.writeln('✅ Xcode Project updated successfully.');
  }
}

Future<void> _updatePodfile(String slug) async {
  final file = File('ios/Podfile');
  if (!file.existsSync()) {
    stdout.writeln('❌ ios/Podfile not found!');
    return;
  }

  String content = await file.readAsString();
  if (content.contains("'Debug-${slug}Dev' => :debug")) {
    stdout.writeln('⚠️ Podfile mappings for $slug already exist. Skipping.');
    return;
  }

  // Find the end of project 'Runner' block
  final projectBlockEnd =
      content.indexOf('}', content.indexOf("project 'Runner'"));
  if (projectBlockEnd != -1) {
    // Determine indentation (assuming 2 spaces or user's style)
    // We'll just assume standard 2 spaces indent relative to block start or just manual.
    // Let's insert before the closing brace.
    final insertion = '''
  'Debug-${slug}Dev' => :debug,
  'Release-${slug}Prod' => :release,
  'Profile-${slug}Prod' => :release,''';

    content =
        content.replaceRange(projectBlockEnd, projectBlockEnd, '$insertion\n');
    await file.writeAsString(content);
    stdout.writeln('✅ ios/Podfile updated with new mappings.');
  } else {
    stdout.writeln('❌ Could not find project \'Runner\' block in Podfile.');
  }
}

Future<void> _createAssetConfigs(String slug) async {
  final icons = '''
flutter_launcher_icons:
  android: true
  ios: "AppIcon-$slug"
  image_path: assets/icons/$slug.png
  remove_alpha_ios: true
''';

  final splash = '''
flutter_native_splash:
  color: "#ffffff"
  image: assets/splash/$slug.png
  android_12:
    image: assets/splash/$slug.png
    icon_background_color: "#ffffff"
''';

  await File('flutter_launcher_icons-$slug.yaml').writeAsString(icons);
  await File('flutter_native_splash-$slug.yaml').writeAsString(splash);
  stdout.writeln('✅ Asset config files created.');

  // Create placeholders if they don't exist
  Directory('assets/icons').createSync(recursive: true);
  Directory('assets/splash').createSync(recursive: true);

  // 5. Create config directory for GoogleService-Info.plist
  Directory('ios/config/$slug').createSync(recursive: true);
  stdout.writeln('✅ Created config directory: ios/config/$slug');
}

class _SimpleArgParser {
  final Map<String, String> _map = {};
  _SimpleArgParser(List<String> args) {
    for (var arg in args) {
      if (arg.startsWith('--')) {
        final keyVal = arg.substring(2).split('=');
        if (keyVal.length == 2) {
          _map[keyVal[0]] = keyVal[1];
        }
      }
    }
  }
  String? get(String key) => _map[key];
}
