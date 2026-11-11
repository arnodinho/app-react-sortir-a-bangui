import React from 'react';
import {TouchableOpacity, Share} from 'react-native';
import {Icon} from '@components';
import styles from './styles';
import {useTheme} from '@config';

export default function ShareButton() {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={styles.share_touchable_floatingactionbutton}
      onPress={() =>
        Share.share({
          title: 'Bantu-dico',
          message:
            'Hello !  Je te recommande cette application : Le dictionnaire pratique Français - Lingala - Sango disponible sur Playstore  https://play.google.com/store/apps/details?id=com.bantudico',
        })
      }>
      <Icon name="share" size={30} color={colors.primaryLight} solid />
    </TouchableOpacity>
  );
}
