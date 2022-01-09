import React, {useState, useEffect} from 'react';
import {FlatList, RefreshControl, ActivityIndicator, View} from 'react-native';
import {BaseStyle, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  RateDetail,
  CommentItem,
  Button
} from '@components';
import styles from './styles';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';
import {productActions} from '@actions';

export default function Review({navigation, route}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    dispatch(
      productActions.onLoadReview({post_id: route.params?.id}, item => {
        setData(item);
        setLoading(false);
        setRefreshing(false);
      }),
    );
  }, [dispatch, route.params.id]);

  /**
   * on Load data
   *
   */
  const loadData = reload => {
    if (reload) route.params?.reload?.();
    dispatch(
      productActions.onLoadReview({post_id: route.params?.id}, item => {
        setData(item);
        setLoading(false);
        setRefreshing(false);
      }),
    );
  };

  /**
   * on Refresh commemt
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const onComment = () => {
    params = {
      ...route.params,
      reload: () => {
        loadData(true);
      },
    };
    navigation.navigate({name: 'Feedback', params});
  };

  /**
   * render content
   * @returns
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <FlatList
        contentContainerStyle={{padding: 20}}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            tintColor={colors.primary}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        data={data?.list ?? []}
        keyExtractor={(item, index) => item.id.toString()}
        ListHeaderComponent={() => (
          <RateDetail
            point={data?.rating?.avg ?? 0}
            maxPoint={5}
            totalRating={data?.rating?.total ?? 0}
            data={data?.rating?.data}
          />
        )}
        renderItem={({item}) => (
          <CommentItem
            style={{marginTop: 10}}
            image={item.authorImage}
            name={item.author}
            rate={item.rate}
            date={item.date}
            comment={item.content}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('reviews')}
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
      {renderContent()}
      <View style={{paddingVertical: 15, paddingHorizontal: 20, marginBottom: 20}}>
          <Button
            loading={loading}
            full
            onPress={() => {
              onComment();
            }}>
             {t('write')}
          </Button>
        </View>
    </SafeAreaView>
  );
}
