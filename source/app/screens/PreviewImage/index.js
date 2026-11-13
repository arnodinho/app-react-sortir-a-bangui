import React, {useState} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {BaseStyle, BaseColor, useTheme} from '@config';
import PagerView from 'react-native-pager-view';
import {
  Image,
  Header,
  SafeAreaView,
  Icon,
  Text,
  PaginationDots,
} from '@components';
import styles from './styles';

export default function PreviewImage({navigation, route}) {
  const {colors} = useTheme();

  let flatListRef = null;
  let swiperRef = null;

  const images = route.params?.gallery ?? [];
  const [indexSelected, setIndexSelected] = useState(0);

  /**
   * call when select image
   *
   * @param {*} value
   */
  const onSelect = value => {
    setIndexSelected(value);
    flatListRef.scrollToIndex({
      animated: true,
      index: value,
    });
  };

  /**
   * @description Called when image item is selected or activated
   * @author Passion UI <passionui.com>
   * @date 2019-08-03
   * @param {*} touched
   * @returns
   */
  const onTouchImage = touched => {
    if (touched === indexSelected) {
      return;
    }
    swiperRef?.setPage(touched);
  };

  return (
    <SafeAreaView
      style={[BaseStyle.safeAreaView, {backgroundColor: 'black'}]}
      edges={['right', 'left']}>
      <Header
        style={{backgroundColor: 'black'}}
        title=""
        renderLeft={() => {
          return (
            <Icon name="arrow-left" size={20} color={BaseColor.whiteColor} />
          );
        }}
        onPressLeft={() => {
          navigation.goBack();
        }}
        barStyle="light-content"
      />
      <View style={{flex: 1}}>
        <PagerView
          ref={ref => {
            swiperRef = ref;
          }}
          style={{flex: 1}}
          initialPage={0}
          onPageSelected={e => onSelect(e.nativeEvent.position)}>
          {images.map((item, key) => (
            <View key={`image${key}`}>
              <Image
                style={{width: '100%', height: '100%'}}
                resizeMode="contain"
                source={{uri: item.full}}
              />
            </View>
          ))}
        </PagerView>
        <PaginationDots
          style={{bottom: 0}}
          count={images.length}
          activeIndex={indexSelected}
          dotStyle={{backgroundColor: BaseColor.dividerColor}}
          activeDotColor={colors.primary}
        />
      </View>
      <View
        style={{
          paddingVertical: 10,
        }}>
        <View style={styles.lineText}>
          <Text body2 whiteColor>
            {indexSelected + 1}/{images.length}
          </Text>
        </View>
        <FlatList
          ref={ref => {
            flatListRef = ref;
          }}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={(item, index) => item.full}
          renderItem={({item, index}) => (
            <TouchableOpacity
              onPress={() => {
                onTouchImage(index);
              }}
              activeOpacity={0.9}>
              <Image
                style={{
                  width: 70,
                  height: 70,
                  marginLeft: 20,
                  borderRadius: 8,
                  borderColor:
                    index == indexSelected
                      ? colors.primaryLight
                      : BaseColor.grayColor,
                  borderWidth: 1,
                }}
                source={{uri: item.full}}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
