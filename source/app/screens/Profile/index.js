import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {BaseStyle, BaseColor, BaseSetting, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  Button,
  ProfileDetail,
} from '@components';
import styles from './styles';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {userSelect} from '@selectors';
import useAccount from '@utils/useAccount';

export default function Profile({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const user = useSelector(userSelect);

  const [loading, setLoading] = useState(false);

  const {signOut, onDeleteAccount, deleting} = useAccount(navigation);

  /**
   * on Logout
   *
   */
  const onLogout = () => {
    setLoading(true);
    signOut();
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header title={t('profile')} />
      <ScrollView>
        <View style={styles.contain}>
          <ProfileDetail
            image={user.image}
            textFirst={user.name}
            point={user.rate}
            textSecond={user.description}
            textThird={user.email}
          />
          <TouchableOpacity
            style={[
              styles.profileItem,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: 1,
                marginTop: 15,
              },
            ]}
            onPress={() => {
              navigation.navigate('ProfileEdit');
            }}>
            <Text body1>{t('edit_profile')}</Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.profileItem,
              {borderBottomColor: colors.border, borderBottomWidth: 1},
            ]}
            onPress={() => {
              navigation.navigate('ChangePassword');
            }}>
            <Text body1>{t('change_password')}</Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.profileItem,
              {borderBottomColor: colors.border, borderBottomWidth: 1},
            ]}
            onPress={() => {
              navigation.navigate('AboutUs');
            }}>
            <Text body1>A propos de nous</Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileItem}
            onPress={() => {
              navigation.navigate('ContactUs');
            }}>
            <Text body1>{t('contact_us')} </Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.profileItem,
              {borderBottomColor: colors.border, borderBottomWidth: 1},
            ]}
            onPress={() => Linking.openURL(BaseSetting.privacyPolicyUrl)}>
            <Text body1>{t('privacy_policy')}</Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileItem}
            disabled={loading || deleting}
            onPress={onDeleteAccount}>
            <Text body1 style={{color: BaseColor.orangeColor}}>
              {t('delete_account')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={{paddingHorizontal: 20, paddingVertical: 15}}>
        <Button full loading={loading} onPress={onLogout}>
          {t('sign_out')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
