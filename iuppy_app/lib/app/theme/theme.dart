import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppThemePair {
  final ThemeData light;
  final ThemeData dark;
  AppThemePair(this.light, this.dark);
}

class BrandingColors {
  final Color primary;
  final Color background;
  final Color textOnBackground;
  BrandingColors({
    required this.primary,
    required this.background,
    required this.textOnBackground,
  });
}

ThemeData _base(BrandingColors bc, {Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: bc.primary,
    brightness: brightness,
    primary: bc.primary,
    background: bc.background,
  );
  final textTheme = GoogleFonts.interTextTheme().apply(
    bodyColor: bc.textOnBackground,
    displayColor: bc.textOnBackground,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    textTheme: textTheme,
    scaffoldBackgroundColor: bc.background,
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: bc.background.withOpacity(isDark ? 0.7 : 0.8),
      foregroundColor: bc.textOnBackground,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      surfaceTintColor: Colors.transparent,
    ),
  );
}

class FrostedGlass extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double blur;
  final double overlayOpacity;
  final double borderOpacity;
  const FrostedGlass({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.blur = 20,
    this.overlayOpacity = 0.22,
    this.borderOpacity = 0.4,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
            child: Container(),
          ),
          Container(
            padding: padding,
            decoration: BoxDecoration(
              color: Theme.of(context)
                  .colorScheme
                  .surface
                  .withOpacity(overlayOpacity),
              border: Border.all(
                  color: Colors.white.withOpacity(borderOpacity), width: 1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: child,
          ),
        ],
      ),
    );
  }
}

AppThemePair buildThemes(BrandingColors bc) {
  return AppThemePair(
    _base(bc, brightness: Brightness.light),
    _base(bc, brightness: Brightness.dark),
  );
}
