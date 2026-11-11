import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import {SafeAreaView, Text, Button, Image, Icon} from '@components';
import styles from './styles';
import Swiper from 'react-native-swiper';
import {BaseColor, BaseStyle, Images, useTheme} from '@config';
import {useTranslation} from 'react-i18next';

export default function Walkthrough({navigation}) {
  const [slide] = useState([
    {key: 3, image: Images.trip3},
    {key: 4, image: Images.trip4},
    {key: 1, image: Images.trip2},
    {key: 2, image: Images.trip1},
  ]);
  const {colors} = useTheme();
  const {t} = useTranslation();
  const linked =
    Platform.OS === 'android'
      ? 'https://play.google.com/store/apps/details?id=com.ayanga.sortirabangui'
      : 'https://apps.apple.com/fr/app/sortir-%C3%A0-bangui/id1606544116';

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <ScrollView
        style={BaseStyle.safeAreaView}
        contentContainerStyle={styles.contain}>
        <View style={styles.wrapper}>
          <Swiper
            dotStyle={{
              backgroundColor: BaseColor.dividerColor,
            }}
            activeDotColor={colors.primary}
            paginationStyle={styles.contentPage}
            removeClippedSubviews={false}>
            {slide.map((item, index) => {
              return (
                <View style={styles.slide} key={item.key}>
                  <Image source={item.image} style={styles.img} />
                  <Text body1 style={styles.textSlide}>
                    {t('pick_your_destication')}
                  </Text>
                </View>
              );
            })}
          </Swiper>
        </View>
        <Button
          full
          style={styles.button}
          onPress={() => navigation.navigate('SignIn')}>
          {t('sign_in')}
        </Button>
        <View style={styles.contentActionBottom}>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text body1 grayColor>
              {t('not_have_account')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{marginTop: 20}}
            onPress={() => navigation.navigate('AboutUs')}>
            <Text body1 grayColor>
              {t('A propos de nous')}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.share_touchable_floatingactionbutton}
          onPress={() =>
            Share.share({
              title: 'Bantu-dico',
              message:
                'Hello !  Je te recommande cette application de tourisme : Sortirà Bangui ' +
                linked,
            })
          }>
          <Icon name="share-alt" size={30} color={'white'} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
