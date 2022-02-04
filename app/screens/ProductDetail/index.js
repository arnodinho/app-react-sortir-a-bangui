import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Animated,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {BaseColor, useTheme, BaseStyle} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  StarRating,
  Tag,
  Image,
  ListItem,
} from '@components';
import {
  Placeholder,
  PlaceholderLine,
  Progressive,
  PlaceholderMedia,
} from 'rn-placeholder';
import {useTranslation} from 'react-i18next';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import * as Utils from '@utils';
import {useDispatch, useSelector} from 'react-redux';
import {productActions, wishListActions} from '@actions';
import {userSelect} from '@selectors';
import styles from './styles';

export default function ProductDetail({navigation, route}) {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const dispatch = useDispatch();
  const id = route.params?.id;
  const user = useSelector(userSelect);
  const deltaY = new Animated.Value(0);
  const [loading, setLoading] = useState(true);
  const [like, setLike] = useState(null);
  const [product, setProduct] = useState(null);
  const [collapseHour, setCollapseHour] = useState(false);
  const [heightHeader, setHeightHeader] = useState(Utils.heightHeader());
  const heightImageBanner = Utils.scaleWithPixel(250, 1);

  useEffect(() => {
    dispatch(
      productActions.onLoadProduct({id}, item => {
        setLoading(false);
        setProduct(item);
        setLike(item.favorite);
      }),
    );
  }, [dispatch, id]);

  /**
   * on loaddata
   *
   */
  const loadData = () => {
    dispatch(
      productActions.onLoadProduct({id}, item => {
        setLoading(false);
        setProduct(item);
        setLike(item.favorite);
      }),
    );
  };

  /**
   * like action
   * @param {*} value
   */
  const onLike = value => {
    if (user) {
      setLike(null);
      dispatch(
        wishListActions.onSave({post_id: id}, value, () => {
          route.params?.onLike?.(value);
          setLike(value);
        }),
      );
    } else {
      navigation.navigate({
        name: 'SignIn',
        params: {
          success: () => {
            setLike(null);
            dispatch(
              wishListActions.onSave({post_id: id}, value, () => {
                route.params?.onLike?.(value);
                setLike(value);
              }),
            );
          },
        },
      });
    }
  };

  /**
   * on Review action
   */
  const onReview = () => {
    const params = {
      ...route.params,
      reload: loadData,
    };
    if (user) {
      navigation.navigate({
        name: 'Review',
        params,
      });
    } else {
      navigation.navigate({
        name: 'SignIn',
        params: {
          success: () => {
            navigation.navigate({
              name: 'Review',
              params,
            });
          },
        },
      });
    }
  };

  /**
   * go product detail
   * @param {*} item
   */
  const onProductDetail = item => {
    navigation.navigate({
      name: 'ProductDetail',
      params: {
        id: item.id,
        onLike: favorite => {
          item.favorite = favorite;
          dispatch(wishListActions.onUpdate(item));
        },
      },
      key: Date.now().toString(),
    });
  };

  /**
   * Open action
   * @param {*} item
   */
  const onOpen = (type, title, link) => {
    Alert.alert({
      title: title,
      message: `${t('do_you_want_open')} ${title} ?`,
      action: [
        {
          text: t('cancel'),
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: t('done'),
          onPress: () => {
            switch (type) {
              case 'web':
                Linking.openURL(link);
                break;
              case 'phone':
                Linking.openURL('tel://' + link);
                break;
              case 'email':
                Linking.openURL('mailto:' + link);
                break;
              case 'address':
                Linking.openURL(link);
                break;
            }
          },
        },
      ],
    });
  };

  /**
   * collapse open time
   */
  const onCollapse = () => {
    Utils.enableExperimental();
    setCollapseHour(!collapseHour);
  };

  /**
   * render wishlist status
   *
   */
  const renderWishList = () => {
    if (like == null) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    return (
      <TouchableOpacity onPress={() => onLike(!like)}>
        {like ? (
          <Icon name="heart" color={colors.primaryLight} solid size={25} />
        ) : (
          <Icon name="heart" color={colors.primaryLight} size={25} />
        )}
      </TouchableOpacity>
    );
  };
  const renderOpenHours = () => {
    if (product?.is_scheduled === 'oui') {
      return (
        <View>
          <TouchableOpacity style={styles.line} onPress={onCollapse}>
            <View
              style={[styles.contentIcon, {backgroundColor: colors.border}]}>
              <Icon name="clock" size={16} color={BaseColor.whiteColor} />
            </View>
            <View style={styles.contentInforAction}>
              <View>
                <Text caption2 grayColor>
                  {t('open_hour')}
                </Text>
              </View>
              <Icon
                name={collapseHour ? 'angle-up' : 'angle-down'}
                size={24}
                color={BaseColor.grayColor}
              />
            </View>
          </TouchableOpacity>
          <View
            style={{
              paddingLeft: 40,
              paddingRight: 20,
              marginTop: 5,
              height: collapseHour ? 0 : null,
              overflow: 'hidden',
            }}>
            {product?.openTime?.map?.(item => {
              return (
                <View
                  style={[styles.lineWorkHours, {borderColor: colors.border}]}
                  key={item.label}>
                  <Text body2 grayColor>
                    {t(item.label)}
                  </Text>
                  <Text body2 accentColor semibold>
                    {`${item.start} - ${item.end}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      );
    }
  };

  const renderTelephone = () => {
    if (product?.phone) {
      return (
        <TouchableOpacity
          style={styles.line}
          onPress={() => {
            onOpen('phone', t('tel'), product?.phone);
          }}>
          <View style={[styles.contentIcon, {backgroundColor: colors.border}]}>
            <Icon name="mobile-alt" size={16} color={BaseColor.whiteColor} />
          </View>
          <View style={{marginLeft: 10}}>
            <Text caption2 grayColor>
              {t('tel')}
            </Text>
            <Text footnote semibold style={{marginTop: 5}}>
              {product?.phone}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderEmail = () => {
    if (product?.email) {
      return (
        <TouchableOpacity
          style={styles.line}
          onPress={() => {
            onOpen('email', t('envelope'), product?.email);
          }}>
          <View style={[styles.contentIcon, {backgroundColor: colors.border}]}>
            <Icon name="envelope" size={16} color={BaseColor.whiteColor} />
          </View>
          <View style={{marginLeft: 10}}>
            <Text caption2 grayColor>
              {t('mailto')}
            </Text>
            <Text footnote semibold style={{marginTop: 5}}>
              {product?.email}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderWebsite = () => {
    if (product?.website) {
      return (
        <TouchableOpacity
          style={styles.line}
          onPress={() => {
            onOpen('web', t('website'), product?.website);
          }}>
          <View style={[styles.contentIcon, {backgroundColor: colors.border}]}>
            <Icon name="globe" size={16} color={BaseColor.whiteColor} />
          </View>
          <View style={{marginLeft: 10}}>
            <Text caption2 grayColor>
              {t('website')}
            </Text>
            <Text footnote semibold style={{marginTop: 5}}>
              {product?.website}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };
  /**
   * render Banner
   * @returns
   */
  const renderBanner = () => {
    if (loading) {
      return (
        <Placeholder Animation={Progressive}>
          <Animated.View
            style={[
              styles.imgBanner,
              {
                height: deltaY.interpolate({
                  inputRange: [
                    0,
                    Utils.scaleWithPixel(140),
                    Utils.scaleWithPixel(140),
                  ],
                  outputRange: [heightImageBanner, heightHeader, heightHeader],
                }),
              },
            ]}>
            <PlaceholderMedia style={{width: '100%', height: '100%'}} />
          </Animated.View>
        </Placeholder>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('PreviewImage', {
            gallery: product?.gallery,
          });
        }}>
        <ImageBackground
          source={{uri: product?.image?.full}}
          style={styles.banner}>

          <Header
            title=""
            renderLeft={() => {
              return (
                <Icon
                  name="arrow-left"
                  size={25}
                  color={BaseColor.whiteColor}
                />
              );
            }}
            renderRight={() => {
              return (
                <Icon name="images" size={35} color={BaseColor.whiteColor} />
              );
            }}
            onPressLeft={() => {
              navigation.goBack();
            }}
            onPressRight={() => {
              navigation.navigate('PreviewImage', {
                gallery: product?.gallery,
              });
            }}
          />
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  /**
   * render Content View
   * @returns
   */
  const renderContent = () => {
    if (loading) {
      return (
        <ScrollView
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {y: deltaY},
                },
              },
            ],
            {useNativeDriver: false},
          )}
          onContentSizeChange={() => {
            setHeightHeader(Utils.heightHeader());
          }}
          scrollEventThrottle={8}>
          <View style={{height: 255 - heightHeader}} />
          <Placeholder Animation={Progressive}>
            <View
              style={{
                paddingHorizontal: 20,
                marginBottom: 20,
              }}>
              <PlaceholderLine style={{width: '50%', marginTop: 10}} />
              <PlaceholderLine style={{width: '70%'}} />
              <PlaceholderLine style={{width: '40%'}} />
              <View style={styles.line}>
                <PlaceholderMedia style={styles.contentIcon} />
                <View style={{marginLeft: 10, flex: 1, paddingTop: 10}}>
                  <PlaceholderLine style={{width: '40%'}} />
                </View>
              </View>
              <View style={styles.line}>
                <PlaceholderMedia style={styles.contentIcon} />
                <View style={{marginLeft: 10, flex: 1, paddingTop: 10}}>
                  <PlaceholderLine style={{width: '40%'}} />
                </View>
              </View>
              <View style={styles.line}>
                <PlaceholderMedia style={styles.contentIcon} />
                <View style={{marginLeft: 10, flex: 1, paddingTop: 10}}>
                  <PlaceholderLine style={{width: '40%'}} />
                </View>
              </View>
              <View style={styles.line}>
                <PlaceholderMedia style={styles.contentIcon} />
                <View style={{marginLeft: 10, flex: 1, paddingTop: 10}}>
                  <PlaceholderLine style={{width: '40%'}} />
                </View>
              </View>
              <View style={styles.line}>
                <PlaceholderMedia style={styles.contentIcon} />
                <View style={{marginLeft: 10, flex: 1, paddingTop: 10}}>
                  <PlaceholderLine style={{width: '40%'}} />
                </View>
              </View>
              <PlaceholderLine
                style={{width: '100%', height: 250, marginTop: 20}}
              />
            </View>
          </Placeholder>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {y: deltaY},
              },
            },
          ],
          {useNativeDriver: false},
        )}
        onContentSizeChange={() => {
          setHeightHeader(Utils.heightHeader());
        }}
        scrollEventThrottle={8}>
        {renderBanner()}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 20,
          }}>
          <View style={styles.lineSpace}>
            <Text title1 semibold style={{paddingRight: 15}}>
              {product?.title}
            </Text>
            {renderWishList()}
          </View>
          <View style={styles.lineSpace}>
            <View>
              <Text caption1 grayColor>
                {product?.category?.title}
              </Text>
              <TouchableOpacity style={styles.rateLine} onPress={onReview}>
                <Tag rateSmall style={{marginRight: 5}} onPress={onReview}>
                  {product?.rate}
                </Tag>
                <StarRating
                  disabled={true}
                  starSize={20}
                  maxStars={5}
                  rating={product?.rate}
                  fullStarColor={BaseColor.yellowColor}
                  on
                />
                <Text footnote grayColor style={{marginLeft: 5}}>
                  ({product?.numRate})
                </Text>
              </TouchableOpacity>
            </View>
            <Tag status>{product?.status}</Tag>
          </View>
          <View
            style={[
              styles.line,
              {
                borderColor: colors.border,
                borderBottomWidth: 1,
                paddingBottom: 20,
              },
            ]}>
            <Text body2 style={{lineHeight: 20}}>
              {product?.description}
            </Text>
          </View>
          <TouchableOpacity style={styles.line}>
            <View
              style={[styles.contentIcon, {backgroundColor: colors.border}]}>
              <Icon
                name="map-marker-alt"
                size={16}
                color={BaseColor.whiteColor}
              />
            </View>
            <View style={{marginLeft: 10}}>
              <Text caption2 grayColor>
                {t('address')}
              </Text>
              <Text footnote semibold style={{marginTop: 5}}>
                {product?.address}
              </Text>
            </View>
          </TouchableOpacity>
          {renderTelephone()}
          {renderEmail()}
          {renderWebsite()}
          {renderOpenHours()}
        </View>
        <Text
          title3
          semibold
          style={{
            paddingHorizontal: 20,
            paddingBottom: 5,
            paddingTop: 15,
          }}>
          {t('facilities')}
        </Text>
        <View style={[styles.wrapContent, {borderColor: colors.border}]}>
          {product?.features?.map?.(item => {
            return (
              <Tag
                key={item.id.toString()}
                icon={
                  <Icon
                    name={Utils.iconConvert(item.icon)}
                    size={12}
                    color={colors.accent}
                    solid
                    style={{marginRight: 5}}
                  />
                }
                chip
                style={{
                  marginTop: 8,
                  marginRight: 8,
                }}>
                {item.title}
              </Tag>
            );
          })}
        </View>
        <View style={[styles.contentDescription, {borderColor: colors.border}]}>
          <View
            style={{
              paddingVertical: 20,
              flexDirection: 'row',
            }}>
            <View style={{flex: 1}}>
              <Text caption1 grayColor>
                {t('date_established')}
              </Text>
              <Text headline style={{marginTop: 5}}>
                {product?.dateEstablish}
              </Text>
            </View>
            <View style={{flex: 1, alignItems: 'flex-end'}}>
              <Text caption1 grayColor>
                {t('price_range')}
              </Text>
              <Text headline style={{marginTop: 5, fontSize: 15}}>
                {`${product?.priceMin ?? '-'}XAF - ${
                  product?.priceMax ?? '-'
                }XAF`}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 180,
              paddingVertical: 20,
            }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={{
                latitude: parseFloat(product?.location?.latitude ?? 0.0),
                longitude: parseFloat(product?.location?.longitude ?? 0.0),
                latitudeDelta: 0.005,
                longitudeDelta: 0.009,
              }}>
              <Marker
                coordinate={{
                  latitude: parseFloat(product?.location?.latitude ?? 0.0),
                  longitude: parseFloat(product?.location?.longitude ?? 0.0),
                }}
              />
            </MapView>
          </View>
        </View>
        <Text
          title3
          semibold
          style={{
            paddingHorizontal: 20,
            paddingVertical: 15,
          }}>
          {t('featured')}
        </Text>
        <FlatList
          contentContainerStyle={{paddingLeft: 5, paddingRight: 20}}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={product?.related ?? []}
          keyExtractor={(item, index) => item.id.toString()}
          renderItem={({item, index}) => (
            <ListItem
              grid
              image={item.image?.full}
              title={item.title}
              subtitle={item.category?.title}
              location={item.address}
              phone={item.phone}
              rate={item.rate}
              status={item.status}
              rateStatus={item.rateStatus}
              numReviews={item.numReviews}
              favorite={item.favorite}
              onPress={() => onProductDetail(item)}
              onPressTag={onReview}
              style={{
                marginLeft: 15,
                marginBottom: 15,
                width: Dimensions.get('window').width / 2,
              }}
            />
          )}
        />
      </ScrollView>
    );
  };

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
        {renderContent()}
      </SafeAreaView>
    </View>
  );
}
