// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'resubmit_view_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ResubmitState {

 bool get isLoading; bool get isSubmitting; String? get nickname; String? get errorMessage;
/// Create a copy of ResubmitState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ResubmitStateCopyWith<ResubmitState> get copyWith => _$ResubmitStateCopyWithImpl<ResubmitState>(this as ResubmitState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ResubmitState&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.nickname, nickname) || other.nickname == nickname)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode => Object.hash(runtimeType,isLoading,isSubmitting,nickname,errorMessage);

@override
String toString() {
  return 'ResubmitState(isLoading: $isLoading, isSubmitting: $isSubmitting, nickname: $nickname, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class $ResubmitStateCopyWith<$Res>  {
  factory $ResubmitStateCopyWith(ResubmitState value, $Res Function(ResubmitState) _then) = _$ResubmitStateCopyWithImpl;
@useResult
$Res call({
 bool isLoading, bool isSubmitting, String? nickname, String? errorMessage
});




}
/// @nodoc
class _$ResubmitStateCopyWithImpl<$Res>
    implements $ResubmitStateCopyWith<$Res> {
  _$ResubmitStateCopyWithImpl(this._self, this._then);

  final ResubmitState _self;
  final $Res Function(ResubmitState) _then;

/// Create a copy of ResubmitState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? isLoading = null,Object? isSubmitting = null,Object? nickname = freezed,Object? errorMessage = freezed,}) {
  return _then(_self.copyWith(
isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,nickname: freezed == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ResubmitState].
extension ResubmitStatePatterns on ResubmitState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ResubmitState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ResubmitState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ResubmitState value)  $default,){
final _that = this;
switch (_that) {
case _ResubmitState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ResubmitState value)?  $default,){
final _that = this;
switch (_that) {
case _ResubmitState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool isLoading,  bool isSubmitting,  String? nickname,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ResubmitState() when $default != null:
return $default(_that.isLoading,_that.isSubmitting,_that.nickname,_that.errorMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool isLoading,  bool isSubmitting,  String? nickname,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _ResubmitState():
return $default(_that.isLoading,_that.isSubmitting,_that.nickname,_that.errorMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool isLoading,  bool isSubmitting,  String? nickname,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _ResubmitState() when $default != null:
return $default(_that.isLoading,_that.isSubmitting,_that.nickname,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _ResubmitState implements ResubmitState {
  const _ResubmitState({this.isLoading = false, this.isSubmitting = false, this.nickname, this.errorMessage});
  

@override@JsonKey() final  bool isLoading;
@override@JsonKey() final  bool isSubmitting;
@override final  String? nickname;
@override final  String? errorMessage;

/// Create a copy of ResubmitState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ResubmitStateCopyWith<_ResubmitState> get copyWith => __$ResubmitStateCopyWithImpl<_ResubmitState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ResubmitState&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.nickname, nickname) || other.nickname == nickname)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode => Object.hash(runtimeType,isLoading,isSubmitting,nickname,errorMessage);

@override
String toString() {
  return 'ResubmitState(isLoading: $isLoading, isSubmitting: $isSubmitting, nickname: $nickname, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$ResubmitStateCopyWith<$Res> implements $ResubmitStateCopyWith<$Res> {
  factory _$ResubmitStateCopyWith(_ResubmitState value, $Res Function(_ResubmitState) _then) = __$ResubmitStateCopyWithImpl;
@override @useResult
$Res call({
 bool isLoading, bool isSubmitting, String? nickname, String? errorMessage
});




}
/// @nodoc
class __$ResubmitStateCopyWithImpl<$Res>
    implements _$ResubmitStateCopyWith<$Res> {
  __$ResubmitStateCopyWithImpl(this._self, this._then);

  final _ResubmitState _self;
  final $Res Function(_ResubmitState) _then;

/// Create a copy of ResubmitState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? isLoading = null,Object? isSubmitting = null,Object? nickname = freezed,Object? errorMessage = freezed,}) {
  return _then(_ResubmitState(
isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,nickname: freezed == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
