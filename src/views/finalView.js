import FinalScreen from '../components/final.js';
import React, {Component} from 'react';

const FinalView = ({ route, navigation }) => {
  return <FinalScreen parentState={route.params.parentState} navigate={navigation.navigate} />;
}

export default FinalView;
