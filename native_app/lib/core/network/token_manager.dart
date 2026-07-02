import '../storage/secure_storage.dart';

/// Token 存储 Key 常量
class TokenKeys {
  TokenKeys._();

  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
}

/// Token 管理器
/// 管理 Access Token 和 Refresh Token 的存取
class TokenManager {
  final SecureStorage _secureStorage;

  /// 认证状态变化回调，供 AuthNotifier 监听
  void Function()? onAuthStateChanged;

  TokenManager({SecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? SecureStorage();

  String? _accessToken;
  String? _refreshToken;

  /// 获取 Access Token
  String? get accessToken => _accessToken;

  /// 获取 Refresh Token
  String? get refreshToken => _refreshToken;

  /// 是否有有效的 Access Token
  bool get hasToken => _accessToken != null && _accessToken!.isNotEmpty;

  /// 是否有 Refresh Token
  bool get hasRefreshToken =>
      _refreshToken != null && _refreshToken!.isNotEmpty;

  /// 初始化，从 SecureStorage 加载 Token
  Future<void> init() async {
    _accessToken = await _secureStorage.read(key: TokenKeys.accessToken);
    _refreshToken = await _secureStorage.read(key: TokenKeys.refreshToken);
  }

  /// 保存 Token
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    await _secureStorage.write(
      key: TokenKeys.accessToken,
      value: accessToken,
    );

    if (refreshToken != null) {
      await _secureStorage.write(
        key: TokenKeys.refreshToken,
        value: refreshToken,
      );
    }

    onAuthStateChanged?.call();
  }

  /// 仅更新 Access Token
  Future<void> updateAccessToken(String accessToken) async {
    _accessToken = accessToken;
    await _secureStorage.write(
      key: TokenKeys.accessToken,
      value: accessToken,
    );
  }

  /// 清除所有 Token
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;

    await _secureStorage.delete(key: TokenKeys.accessToken);
    await _secureStorage.delete(key: TokenKeys.refreshToken);

    onAuthStateChanged?.call();
  }

  /// 获取 Authorization Header 值
  String? get authorizationHeader {
    if (hasToken) {
      return 'Bearer $_accessToken';
    }
    return null;
  }
}

/// 全局 TokenManager 单例
final tokenManager = TokenManager();
