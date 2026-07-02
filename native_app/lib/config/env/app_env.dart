import 'package:flutter_dotenv/flutter_dotenv.dart';

/// 应用环境枚举
enum AppEnv {
  dev,
  prod;

  static AppEnv fromString(String value) {
    return AppEnv.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => AppEnv.dev,
    );
  }
}

/// 环境配置，从 .env 文件加载
class EnvConfig {
  final String apiBaseUrl;
  final AppEnv appEnv;

  const EnvConfig({
    required this.apiBaseUrl,
    required this.appEnv,
  });

  /// 是否为开发环境
  bool get isDev => appEnv == AppEnv.dev;

  /// 是否为生产环境
  bool get isProd => appEnv == AppEnv.prod;

  /// 从 dotenv 创建配置
  factory EnvConfig.fromDotEnv() {
    return EnvConfig(
      apiBaseUrl: dotenv.env['API_BASE_URL'] ?? '',
      appEnv: AppEnv.fromString(dotenv.env['APP_ENV'] ?? 'dev'),
    );
  }
}

/// 全局环境配置单例，在 main() 中初始化
late final EnvConfig envConfig;
