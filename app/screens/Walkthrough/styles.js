import {StyleSheet} from 'react-native';
import * as Utils from '@utils';

export default StyleSheet.create({
  contain: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: '100%',
    height: 350,
  },
  contentPage: {
    bottom: 0,
  },
  contentActionBottom: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  img: {
    width: Utils.scaleWithPixel(200),
    height: Utils.scaleWithPixel(200),
    borderRadius: Utils.scaleWithPixel(200) / 2,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  textSlide: {
    marginTop: 30,
  },
  button: {marginTop: 20},
  share_touchable_floatingactionbutton: {
    position: 'absolute',
    width: 50,
    height: 50,
    right: 30,
    bottom: 15,
    elevation: 4,
    zIndex: 2,
    borderRadius: 30,
    backgroundColor: '#5DADE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  share_image: {
    width: 30,
  }
});
