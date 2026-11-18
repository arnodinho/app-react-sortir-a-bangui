import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {BaseStyle, BaseColor, useTheme} from '@config';
import {
  Image,
  Header,
  SafeAreaView,
  Icon,
  Text,
  StarRating,
  Button,
  TextInput,
} from '@components';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {productActions} from '@actions';
import {userSelect} from '@selectors';

export default function Feedback({navigation, route}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(userSelect);
  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 0,
  });
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(5);
  const [review, setReview] = useState('');
  const [success, setSuccess] = useState({
    title: true,
    review: true,
  });

  /**
   * @description Called when user sumitted form
   * @author Passion UI <passionui.com>
   * @date 2019-08-03
   */
  const onSubmit = () => {
    if (review == '') {
      setSuccess({
        ...success,
        review: review != '' ? true : false,
      });
    } else {
      const params = {
        post: route.params?.id,
        rating: rate,
        content: review,
      };
      setLoading(true);
      dispatch(
        productActions.onFeekBack(params, response => {
          setLoading(false);
          // Success: wp/v2/comments returns the created comment ({id, status}).
          // Failure: the saga passes the axios error response or a string.
          if (!response?.id) {
            Alert.alert({
              title: t('feedback'),
              message:
                response?.data?.message ??
                response?.data?.code ??
                String(response ?? t('comment_send_error')),
            });
            return;
          }
          route.params?.reload?.();
          // Comments are held for moderation (WordPress "comment_moderation");
          // only moderators' own comments are published right away.
          const published = response.status === 'approved';
          Alert.alert({
            type: 'success',
            title: t('feedback'),
            message: t(published ? 'comment_published' : 'comment_pending'),
            action: [{onPress: () => navigation.goBack()}],
          });
        }),
      );
    }
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('feedback')}
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
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={offsetKeyboard}
        style={{flex: 1}}>
        <ScrollView contentContainerStyle={{alignItems: 'center', padding: 20}}>
          <Image
            source={{uri: user.image}}
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
            }}
          />
          <View style={{width: 160}}>
            <StarRating
              starSize={26}
              maxStars={5}
              rating={rate}
              selectedStar={rating => {
                setRate(rating);
              }}
              fullStarColor={BaseColor.yellowColor}
              containerStyle={{padding: 5}}
            />
            <Text caption1 grayColor style={{textAlign: 'center'}}>
              {t('tap_to_rate')}
            </Text>
          </View>
          <TextInput
            style={{marginTop: 10, height: 150}}
            onChangeText={text => setReview(text)}
            textAlignVertical="top"
            multiline={true}
            success={success.review}
            placeholder={t('input')}
            value={review}
          />
        </ScrollView>
        <View style={{paddingVertical: 15, paddingHorizontal: 20}}>
          <Button loading={loading} full onPress={() => {onSubmit();}}>
            {t('feedback')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
