import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  centerView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    height: 250,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  imgBanner: {
    width: '100%',
    height: 250,
    position: 'absolute',
  },
  imageShow: {
    marginTop: 200,
  },
  lineSpace: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLine: {
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    paddingRight: 15,
  },
  wishlist: {
    width: 32,
    height: 34, // ≈ first line of the title1 text
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rateLine: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  contentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
    marginRight: 5,
  },
  // Explicit size: with absoluteFillObject the native map view gets no frame
  // under Fabric and stays blank.
  map: {
    width: '100%',
    height: '100%',
  },
  contentInforAction: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  lineWorkHours: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  wrapContent: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  contentDescription: {
    marginHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
  },
});
