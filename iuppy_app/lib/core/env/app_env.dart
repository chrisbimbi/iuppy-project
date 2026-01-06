class AppEnv {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:4000');
  static const appScheme  = String.fromEnvironment('APP_SCHEME', defaultValue: 'iuppy');
  static const companyId  = String.fromEnvironment('COMPANY_ID', defaultValue: '000c0911-58b3-4c80-84bc-fe015eec1961');
  static const companyKey = String.fromEnvironment('COMPANY_KEY', defaultValue: '');
  static const appName    = String.fromEnvironment('APP_NAME', defaultValue: 'Iuppy');
}

class EnvConfig {
  final String apiBaseUrl;
  final String appScheme;
  final String companyId;
  final String companyKey;
  final String appName;

  const EnvConfig({
    required this.apiBaseUrl,
    required this.appScheme,
    required this.companyId,
    required this.companyKey,
    required this.appName,
  });
}
