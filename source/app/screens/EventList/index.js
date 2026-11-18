import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BaseStyle, BaseColor, useTheme} from '@config';
import {Header, SafeAreaView, Icon, Text, EventCard} from '@components';
import {eventActions} from '@actions';
import {userSelect} from '@selectors';

const PER_PAGE = 20;
const SCOPES = ['upcoming', 'past'];

/** Agenda: upcoming (default) or past events, paginated. */
export default function EventList({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(userSelect);
  const insets = useSafeAreaInsets();

  const [scope, setScope] = useState('upcoming');
  const [list, setList] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    (page = 1) =>
      new Promise(resolve => {
        dispatch(
          eventActions.onLoadEvents({page, per_page: PER_PAGE, scope}, res => {
            if (res.success) {
              setList(current =>
                page === 1 ? res.list : [...(current ?? []), ...res.list],
              );
              setPagination(res.pagination);
            } else if (page === 1) {
              setList([]);
            }
            resolve();
          }),
        );
      }),
    [dispatch, scope],
  );

  useEffect(() => {
    setList(null);
    load(1);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !pagination?.allowLoadMore) {
      return;
    }
    setLoadingMore(true);
    await load(pagination.page + 1);
    setLoadingMore(false);
  };

  const onAddEvent = () => {
    if (user) {
      navigation.navigate('AddEvent', {onCreated: onRefresh});
      return;
    }
    Alert.alert({
      title: t('add_event'),
      message: t('add_event_login_required'),
      action: [
        {text: t('later')},
        {
          text: t('sign_in'),
          onPress: () =>
            // The Alert screen pops itself after this callback: wait for it.
            setTimeout(
              () =>
                navigation.navigate('SignIn', {
                  source: 'add_event',
                  success: () => navigation.navigate('AddEvent'),
                }),
              350,
            ),
        },
      ],
    });
  };

  const renderTabs = () => (
    <View style={[styles.tabs, {borderColor: colors.border}]}>
      {SCOPES.map(item => {
        const active = item === scope;
        return (
          <TouchableOpacity
            key={item}
            style={[
              styles.tab,
              active && {borderBottomColor: colors.primary},
            ]}
            onPress={() => setScope(item)}>
            <Text
              body1
              semibold={active}
              style={{color: active ? colors.primary : BaseColor.grayColor}}>
              {t(`events_${item}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Icon name="calendar-alt" size={40} color={BaseColor.grayColor} />
      <Text body2 grayColor style={styles.emptyText}>
        {t(scope === 'upcoming' ? 'events_empty' : 'events_past_empty')}
      </Text>
    </View>
  );

  return (
    <View style={styles.flex}>
      <Header
        title={t('agenda')}
        renderLeft={() => (
          <Icon
            name="arrow-left"
            size={20}
            color={colors.primary}
            enableRTL={true}
          />
        )}
        onPressLeft={() => navigation.goBack()}
      />
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
        {renderTabs()}
        <FlatList
          contentContainerStyle={styles.content}
          data={list ?? [1, 2, 3]}
          keyExtractor={(item, index) => (list ? item.id : `loading${index}`)}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              tintColor={colors.primary}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} /> : null
          }
          renderItem={({item}) => (
            <EventCard
              loading={!list}
              event={item}
              style={styles.item}
              onPress={() => navigation.navigate('EventDetail', {id: item.id})}
            />
          )}
        />
      </SafeAreaView>
      {/* Same floating "+" as Home's add-place button. No tab bar here: keep
          it above the home indicator. */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('add_event')}
        activeOpacity={0.8}
        onPress={onAddEvent}
        style={[
          styles.fab,
          {backgroundColor: colors.primary, bottom: 20 + insets.bottom},
        ]}>
        <Icon name="plus" size={22} color={BaseColor.whiteColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  flex: {flex: 1},
  tabs: {flexDirection: 'row', borderBottomWidth: 1},
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  // Bottom padding keeps the last item reachable above the floating "+".
  content: {padding: 20, paddingBottom: 96, flexGrow: 1},
  item: {marginBottom: 24},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyText: {marginTop: 12, textAlign: 'center'},
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
};
