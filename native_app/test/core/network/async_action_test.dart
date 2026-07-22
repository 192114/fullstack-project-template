import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/core/network/async_action.dart';

void main() {
  group('runAsyncAction', () {
    test('returns success result with data when action completes', () async {
      final result = await runAsyncAction(() async => 'value');

      expect(result.success, isTrue);
      expect(result.data, 'value');
      expect(result.errorMessage, isNull);
      expect(result.errorCode, isNull);
    });

    test('returns failure result with message and code on ApiException', () async {
      final result = await runAsyncAction<String>(() async {
        throw const ApiException(code: 10004, message: '手机号或密码错误');
      });

      expect(result.success, isFalse);
      expect(result.data, isNull);
      expect(result.errorMessage, '手机号或密码错误');
      expect(result.errorCode, 10004);
    });

    test('returns generic failure message on unknown exception', () async {
      final result = await runAsyncAction<String>(() async {
        throw StateError('boom');
      });

      expect(result.success, isFalse);
      expect(result.data, isNull);
      expect(result.errorMessage, '未知错误，请稍后重试');
      expect(result.errorCode, isNull);
    });
  });
}
