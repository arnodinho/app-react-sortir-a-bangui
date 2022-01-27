import React, {useState} from 'react';
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {BaseStyle, Images, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  Card,
  Button,
  ProfileDescription,
} from '@components';
import styles from './styles';

export default function AboutUs({navigation}) {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const [ourTeam] = useState([
    {
      id: '1',
      screen: 'Profile1',
      image: Images.profile3,
      subName: 'Développeur',
      name: 'Arnaud YANGA-ESSO',
    },
    {
      id: '2',
      screen: 'Profile2',
      image: Images.profile4,
      subName: 'Communication',
      name: 'Audrey YANGA-ESSO',
    },
  ]);

  return (
    <View style={{flex: 1}}>
      <Header
        title={t('about_us')}
        renderLeft={() => {
          return (
            <Icon
              name="arrow-left"
              size={20}
              color={colors.primary}
              enableRTL={true}
            />
          );
        }}
        onPressLeft={() => {
          navigation.goBack();
        }}
      />
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
        <ScrollView style={{flex: 1}}>
          <ImageBackground source={Images.trip4} style={styles.banner}>
            <Text title1 semibold whiteColor>
              {t('about_us')}
            </Text>
            <Text subhead whiteColor></Text>
          </ImageBackground>
          <View style={styles.content}>
            <Text headline semibold>
              {t('who_we_are').toUpperCase()}
            </Text>
            <Text body2 style={{marginTop: 5}}>
              Cette appication est dédiée à la promotion de la ville de Bangui.
              Une ville où il fait bon vivre. Vous y trouverez tous les endroits
              qu'il vous faut pour sortir prendre un verre avec des ami(e)s,
              aller faire du sport, son shopping, trouver un bon restaurant, les
              lieux culturels dans la ville, et même des endroits dont vous ne
              soupçonnez même pas l'existence. Bref tous ce que regorge Bangui
              la coquette est à portée de vos doigts
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.profileItem,
              {borderBottomColor: colors.border, borderBottomWidth: 1, marginLeft:20},
            ]}
            onPress={() => {
              navigation.navigate('ContactUs');
            }}>
            <Text headline semibold style={styles.titleContact}>
              {t('contact_us')}
            </Text>
            <Icon
              name="angle-right"
              size={18}
              color={colors.primary}
              style={{marginLeft: 5, marginBottom: 8}}
              enableRTL={true}
            />
          </TouchableOpacity>
          <Text headline semibold style={styles.title}>
            Notre équipe
          </Text>
          <View style={{paddingHorizontal: 20}}>
            {ourTeam.map((item, index) => {
              return (
                <ProfileDescription
                  key={'service' + index}
                  image={item.image}
                  name={item.name}
                  subName={item.subName}
                  description={item.description}
                  style={{marginBottom: 10}}
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
