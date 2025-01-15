import 'package:flutter/material.dart';
import 'package:mobile/config/flavor_config.dart';
import 'main.dart' as app;

void main() {
  FlavorConfig(
    flavor: Flavor.development,
    name: 'Development',
    apiBaseUrl: 'https://api-dev.iuppy.com',
  );
  app.main();
}
