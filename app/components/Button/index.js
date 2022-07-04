import React from 'react';
import {TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {BaseColor, useTheme} from '@config';
import {Text} from '@components';
import styles from './styles';

export default function Button(props) {
  const {colors} = useTheme();
  const {
    style,
    styleText,
    icon,
    outline,
    full,
    round,
    loading,
    children,
    ...rest
  } = props;

  return (
    <TouchableOpacity
      {...rest}
      style={StyleSheet.flatten([
        [styles.default, {backgroundColor: colors.primary}],
        outline && [
          styles.outline,
          {backgroundColor: colors.card, borderColor: colors.primary},
        ],
        full && styles.full,
        round && styles.round,
        style,
      ])}
      activeOpacity={0.9}>
      {icon ? icon : null}
      <Text
        style={StyleSheet.flatten([
          styles.textDefault,
          outline && {color: colors.primary},
          styleText,
        ])}
        numberOfLines={1}>
        {children || 'Button'}
      </Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={outline ? colors.primary : BaseColor.whiteColor}
          style={styles.loadingContent}
        />
      ) : null}
    </TouchableOpacity>
  );
}
