import React, {useRef, useState} from 'react';
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

  // Refs must survive re-renders (plain `let` variables were reset to null).
  const flatListRef = useRef(null);
  const swiperRef = useRef(null);

  const images = route.params?.gallery ?? [];
  const [indexSelected, setIndexSelected] = useState(0);

  /**
   * call when select image
   *
   * @param {*} value
   */
  const onSelect = value => {
    setIndexSelected(value);
    // iOS fires onPageSelected even with no page: scrollToIndex on an empty
    // (or shorter) list throws "scrollToIndex out of range".
    if (value >= 0 && value < images.length) {
      flatListRef.current?.scrollToIndex({
        animated: true,
        index: value,
      });
    }
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
    swiperRef.current?.setPage(touched);
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
          ref={swiperRef}
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
          ref={flatListRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={(item, index) => `${index}-${item.full}`}
          // Thumbnails are fixed-size (70 + 20 margin): lets scrollToIndex
          // work for items not rendered yet.
          getItemLayout={(_, index) => ({length: 90, offset: 90 * index, index})}
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
