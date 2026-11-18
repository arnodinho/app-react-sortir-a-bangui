import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  flex: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  contain: {padding: 20},
  contentTitle: {
    alignItems: 'flex-start',
    width: '100%',
    height: 32,
    justifyContent: 'center',
    marginTop: 8,
  },
  hint: {marginBottom: 8},
  select: {flexDirection: 'row', alignItems: 'center'},
  multiline: {height: 120, paddingTop: 10},
  photoList: {paddingVertical: 4},
  photoItem: {marginRight: 10},
  photo: {width: 80, height: 80, borderRadius: 8},
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  // Explicit size: with absoluteFillObject the native map view got no
  // frame under Fabric and stayed blank.
  map: {width: '100%', height: '100%'},
  footer: {paddingVertical: 15, paddingHorizontal: 20},
});
