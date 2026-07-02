import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// 安全存储封装
/// 封装 FlutterSecureStorage，提供统一的读写接口
class SecureStorage {
  final FlutterSecureStorage _storage;

  SecureStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  /// 读取值
  Future<String?> read({required String key}) async {
    return await _storage.read(key: key);
  }

  /// 写入值
  Future<void> write({required String key, required String value}) async {
    await _storage.write(key: key, value: value);
  }

  /// 删除值
  Future<void> delete({required String key}) async {
    await _storage.delete(key: key);
  }

  /// 检查 key 是否存在
  Future<bool> containsKey({required String key}) async {
    return await _storage.containsKey(key: key);
  }

  /// 删除所有数据
  Future<void> deleteAll() async {
    await _storage.deleteAll();
  }
}

/// 全局 SecureStorage 单例
final secureStorage = SecureStorage();
