import React, {useState} from 'react';
import {View, ScrollView, ImageBackground, FlatList} from 'react-native';
import {useTranslation} from 'react-i18next';
import {BaseStyle, Images, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  Card,
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
      subName: 'CEO Founder',
      name: 'Arnaud YANGA-ESSO',
    },
    {
      id: '2',
      screen: 'Profile2',
      image: Images.profile4,
      subName: 'Sale Manager',
      name: 'Audrey YANGA-ESSO',
    }
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
            <Text subhead whiteColor>
            
            </Text>
          </ImageBackground>
          <View style={styles.content}>
            <Text headline semibold>
              {t('who_we_are').toUpperCase()}
            </Text>
            <Text body2 style={{marginTop: 5}}>
              The song's lyrics allude to District 12, a region of the fictional
              country of Panem in The Hunger Games universe, subject to the
              nation's mining industry, and recounts the feelings of the rebels
              in District 12 at the onset of the rebellion towards the end of
              Catching Fire. In addition, the song makes several apparent
              references to The Hunger Games, especially the events of Catching
              Fire, including the attic where the protagonists of the novel meet
              during the rebellion of District 11 and "the view from up here"
            </Text>
          </View>

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
                  onPress={() => navigation.navigate(item.screen)}
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
