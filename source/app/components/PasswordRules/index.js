import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {BaseColor} from '@config';
import Text from '../Text';
import Icon from '../Icon';
import {checkPassword} from '@utils/password';

/**
 * Live checklist of the password policy (see utils/password.js), shown under
 * a "new password" field.
 */
export default function PasswordRules({password = '', style}) {
  const {t} = useTranslation();
  const rules = checkPassword(password);
  const items = [
    {ok: rules.length, label: t('password_rule_length')},
    {ok: rules.uppercase, label: t('password_rule_uppercase')},
    {ok: rules.digit, label: t('password_rule_digit')},
  ];
  return (
    <View style={[styles.container, style]}>
      {items.map(item => (
        <View key={item.label} style={styles.row}>
          <Icon
            name={item.ok ? 'check-circle' : 'circle'}
            solid={item.ok}
            size={14}
            color={item.ok ? BaseColor.greenColor : BaseColor.grayColor}
          />
          <Text
            caption1
            style={[
              styles.label,
              {color: item.ok ? BaseColor.greenColor : BaseColor.grayColor},
            ]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {width: '100%', marginTop: 8},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  label: {marginLeft: 8},
});
