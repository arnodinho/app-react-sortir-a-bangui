import React, {useCallback, useEffect, useState} from 'react';
import Slider from '@react-native-assets/slider';
import PropTypes from 'prop-types';

import Thumb from './Thumb';
import Rail from './Rail';
import RailSelected from './RailSelected';

import styles from './styles';

export default function RangeSlider(props) {
  props = {...RangeSlider.defaultProps, ...props};

  const [range, setRange] = useState([props.min, props.max]);

  useEffect(() => {
    setRange([props.min, props.max]);
  }, [props.min, props.max]);

  const CustomThumb = useCallback(() => <Thumb />, []);

  const CustomTrack = useCallback(
    ({track, style}) =>
      track === 'mid' ? (
        <RailSelected color={props.selectionColor} style={style} />
      ) : (
        <Rail color={props.color} style={style} />
      ),
    [props.color, props.selectionColor],
  );

  return (
    <Slider
      style={[styles.slider, props.style]}
      minimumValue={props.min}
      maximumValue={props.max}
      step={1}
      range={range}
      CustomThumb={CustomThumb}
      CustomTrack={CustomTrack}
      onValueChange={([low, high]) => {
        setRange([low, high]);
        props.onValueChanged(low, high);
      }}
    />
  );
}

RangeSlider.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  color: PropTypes.string,
  selectionColor: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  onValueChanged: PropTypes.func,
};

RangeSlider.defaultProps = {
  style: {},
  color: '#7f7f7f',
  selectionColor: '#4499ff',
  min: 0,
  max: 100,
  onValueChanged: (low, hight) => {},
};
