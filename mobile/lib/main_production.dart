import 'package:flutter/material.dart';
import 'package:mobile/config/flavor_config.dart';
import 'main.dart' as app;

void main() {
  FlavorConfig(
    flavor: Flavor.production,
    name: 'Production',
    apiBaseUrl: 'https://api.iuppy.com',
  );
  app.main();
}
