import React from 'react';
import {View, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

/**
 * react-native-pager-view doesn't ship a dot indicator (react-native-swiper
 * did) — this replicates just enough of that look: a row of dots, the
 * active one tinted with activeDotColor.
 */
export default function PaginationDots(props) {
  props = {...PaginationDots.defaultProps, ...props};

  return (
    <View style={[styles.container, props.style]}>
      {Array.from({length: props.count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            props.dotStyle,
            index === props.activeIndex && {
              backgroundColor: props.activeDotColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

PaginationDots.propTypes = {
  count: PropTypes.number.isRequired,
  activeIndex: PropTypes.number.isRequired,
  activeDotColor: PropTypes.string,
  dotStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

PaginationDots.defaultProps = {
  activeDotColor: '#4499ff',
  dotStyle: {},
  style: {},
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
