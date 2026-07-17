// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'account_review_view_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$AccountReviewState {

 bool get isLoading; int get auditStatus; String? get auditRemark; String? get nickname; String? get phone; String? get createTime; String? get errorMessage;
/// Create a copy of AccountReviewState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AccountReviewStateCopyWith<AccountReviewState> get copyWith => _$AccountReviewStateCopyWithImpl<AccountReviewState>(this as AccountReviewState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AccountReviewState&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.auditStatus, auditStatus) || other.auditStatus == auditStatus)&&(identical(other.auditRemark, auditRemark) || other.auditRemark == auditRemark)&&(identical(other.nickname, nickname) || other.nickname == nickname)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.createTime, createTime) || other.createTime == createTime)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode => Object.hash(runtimeType,isLoading,auditStatus,auditRemark,nickname,phone,createTime,errorMessage);

@override
String toString() {
  return 'AccountReviewState(isLoading: $isLoading, auditStatus: $auditStatus, auditRemark: $auditRemark, nickname: $nickname, phone: $phone, createTime: $createTime, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class $AccountReviewStateCopyWith<$Res>  {
  factory $AccountReviewStateCopyWith(AccountReviewState value, $Res Function(AccountReviewState) _then) = _$AccountReviewStateCopyWithImpl;
@useResult
$Res call({
 bool isLoading, int auditStatus, String? auditRemark, String? nickname, String? phone, String? createTime, String? errorMessage
});




}
/// @nodoc
class _$AccountReviewStateCopyWithImpl<$Res>
    implements $AccountReviewStateCopyWith<$Res> {
  _$AccountReviewStateCopyWithImpl(this._self, this._then);

  final AccountReviewState _self;
  final $Res Function(AccountReviewState) _then;

/// Create a copy of AccountReviewState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? isLoading = null,Object? auditStatus = null,Object? auditRemark = freezed,Object? nickname = freezed,Object? phone = freezed,Object? createTime = freezed,Object? errorMessage = freezed,}) {
  return _then(_self.copyWith(
isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,auditStatus: null == auditStatus ? _self.auditStatus : auditStatus // ignore: cast_nullable_to_non_nullable
as int,auditRemark: freezed == auditRemark ? _self.auditRemark : auditRemark // ignore: cast_nullable_to_non_nullable
as String?,nickname: freezed == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,createTime: freezed == createTime ? _self.createTime : createTime // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [AccountReviewState].
extension AccountReviewStatePatterns on AccountReviewState {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AccountReviewState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AccountReviewState() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AccountReviewState value)  $default,){
final _that = this;
switch (_that) {
case _AccountReviewState():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AccountReviewState value)?  $default,){
final _that = this;
switch (_that) {
case _AccountReviewState() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool isLoading,  int auditStatus,  String? auditRemark,  String? nickname,  String? phone,  String? createTime,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AccountReviewState() when $default != null:
return $default(_that.isLoading,_that.auditStatus,_that.auditRemark,_that.nickname,_that.phone,_that.createTime,_that.errorMessage);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool isLoading,  int auditStatus,  String? auditRemark,  String? nickname,  String? phone,  String? createTime,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _AccountReviewState():
return $default(_that.isLoading,_that.auditStatus,_that.auditRemark,_that.nickname,_that.phone,_that.createTime,_that.errorMessage);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool isLoading,  int auditStatus,  String? auditRemark,  String? nickname,  String? phone,  String? createTime,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _AccountReviewState() when $default != null:
return $default(_that.isLoading,_that.auditStatus,_that.auditRemark,_that.nickname,_that.phone,_that.createTime,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _AccountReviewState implements AccountReviewState {
  const _AccountReviewState({this.isLoading = false, this.auditStatus = 0, this.auditRemark, this.nickname, this.phone, this.createTime, this.errorMessage});
  

@override@JsonKey() final  bool isLoading;
@override@JsonKey() final  int auditStatus;
@override final  String? auditRemark;
@override final  String? nickname;
@override final  String? phone;
@override final  String? createTime;
@override final  String? errorMessage;

/// Create a copy of AccountReviewState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AccountReviewStateCopyWith<_AccountReviewState> get copyWith => __$AccountReviewStateCopyWithImpl<_AccountReviewState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AccountReviewState&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.auditStatus, auditStatus) || other.auditStatus == auditStatus)&&(identical(other.auditRemark, auditRemark) || other.auditRemark == auditRemark)&&(identical(other.nickname, nickname) || other.nickname == nickname)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.createTime, createTime) || other.createTime == createTime)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode => Object.hash(runtimeType,isLoading,auditStatus,auditRemark,nickname,phone,createTime,errorMessage);

@override
String toString() {
  return 'AccountReviewState(isLoading: $isLoading, auditStatus: $auditStatus, auditRemark: $auditRemark, nickname: $nickname, phone: $phone, createTime: $createTime, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$AccountReviewStateCopyWith<$Res> implements $AccountReviewStateCopyWith<$Res> {
  factory _$AccountReviewStateCopyWith(_AccountReviewState value, $Res Function(_AccountReviewState) _then) = __$AccountReviewStateCopyWithImpl;
@override @useResult
$Res call({
 bool isLoading, int auditStatus, String? auditRemark, String? nickname, String? phone, String? createTime, String? errorMessage
});




}
/// @nodoc
class __$AccountReviewStateCopyWithImpl<$Res>
    implements _$AccountReviewStateCopyWith<$Res> {
  __$AccountReviewStateCopyWithImpl(this._self, this._then);

  final _AccountReviewState _self;
  final $Res Function(_AccountReviewState) _then;

/// Create a copy of AccountReviewState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? isLoading = null,Object? auditStatus = null,Object? auditRemark = freezed,Object? nickname = freezed,Object? phone = freezed,Object? createTime = freezed,Object? errorMessage = freezed,}) {
  return _then(_AccountReviewState(
isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,auditStatus: null == auditStatus ? _self.auditStatus : auditStatus // ignore: cast_nullable_to_non_nullable
as int,auditRemark: freezed == auditRemark ? _self.auditRemark : auditRemark // ignore: cast_nullable_to_non_nullable
as String?,nickname: freezed == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,createTime: freezed == createTime ? _self.createTime : createTime // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
