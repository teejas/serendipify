import HomeScreen from '../components/home.js';
import React, {Component} from 'react';

const HomeView = ({ navigation }) => {
  return <HomeScreen navigate={navigation.navigate}/>
}

export default HomeView;
