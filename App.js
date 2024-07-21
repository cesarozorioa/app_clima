// In App.js in a new project

import * as React from 'react';
import { useState,useEffect } from 'react';
import { View, Text,FlatList, TextInput,StyleSheet,Pressable } from 'react-native';
import { createStaticNavigation,useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button } from 'react-native';
import municipios from './municipios.json';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';


function HomeScreen() {
  const [search, setSearch] = useState('');
  const [filteredMunicipios, setFilteredMunicipios] = useState([]);
  useEffect(() => {
    setFilteredMunicipios(municipios);
}, []);

const handleSearch = (text) => {
  setSearch(text);
  const filtered = municipios.filter(municipio =>
      municipio.Población.toLowerCase().includes(text.toLowerCase())
  );
  setFilteredMunicipios(filtered);
};
  const navigation = useNavigation();
  const datos = filteredMunicipios; 
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>      
       <TextInput
                placeholder="Buscar municipio"
                value={search}
                onChangeText={handleSearch}
                style={{ padding: 10, borderColor: 'gray', borderWidth: 1 }}
            />
            <FlatList 
                data={filteredMunicipios}
                keyExtractor={(item) => item.Población.toString()}
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigation.navigate('Details', { municipio: item })}>
                        <Text style={styles.listado}>{item.Población}</Text>
                    </Pressable>
                )}
            />
    </View>
  );
}

function DetailsScreen({route}) {
  const navigation = useNavigation();  
  const {municipio} = route.params;
  const [weather, setWeather] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const YOUR_API_KEY='ac82f5dc34cf532b557ba42823097470'
  useEffect(() => {
    const fetchWeather = async () => {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${municipio.Población}&appid=${YOUR_API_KEY}`);
            setWeather(response.data);
              
        try {
            // Obtén las coordenadas del municipio
            const geocodeResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${municipio.Población}&limit=1&appid=${YOUR_API_KEY}`);
            
            if (geocodeResponse.data.length === 0) {
                throw new Error('No se encontraron coordenadas para el municipio');
            }            

            const { lat, lon } = geocodeResponse.data[0];            

            // Solicita el pronóstico del tiempo usando las coordenadas
            const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/onecall`, {
                params: {
                    lat: lat,
                    lon: lon,
                    exclude: 'minutely',
                    appid: 'ac82f5dc34cf532b557ba42823097471',
                    units: 'metric',
                    lang: 'es'
                }
            });
            setCurrentWeather(weatherResponse.data.current);
            setHourlyForecast(weatherResponse.data.hourly.slice(0, 5));  // Primeras 5 horas
            setDailyForecast(weatherResponse.data.daily.slice(0, 7));  // Primeros 7 días

        } catch (error) {
            console.error(error);
            alert('Error al obtener el pronóstico del tiempo. Key incorrecta. Por favor, intenta nuevamente.');
        }
    };
    fetchWeather();
}, [municipio]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>      
      <Text>Población: {JSON.stringify(municipio.Población)}</Text>
      <View>
      {weather && (
                <View>
                    <Text>Temperatura Actual: {weather.main.temp}</Text>
                    <Text>Descripción: {weather.weather[0].description}</Text>
                    {/* Agregar más información del tiempo aquí */}
                </View>
            )}
      </View>      

      {currentWeather && (
                <View>
                    <Text>Temperatura actual: {currentWeather.temp}°C</Text>
                    <Text>Descripción: {currentWeather.weather[0].description}</Text>
                </View>
            )}
            <Text>Pronóstico por horas:</Text>
            <FlatList
                horizontal
                data={hourlyForecast}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={{ margin: 10 }}>
                        <Text>{new Date(item.dt * 1000).toLocaleTimeString()}</Text>
                        <Text>{item.temp}°C</Text>
                        <Text>{item.weather[0].description}</Text>
                    </View>
                )}
            />
            <Text>Pronóstico por días:</Text>
            <FlatList
                data={dailyForecast}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={{ margin: 10 }}>
                        <Text>{new Date(item.dt * 1000).toLocaleDateString()}</Text>
                        <Text>Max: {item.temp.max}°C</Text>
                        <Text>Min: {item.temp.min}°C</Text>
                        <Text>{item.weather[0].description}</Text>

                    </View>
                )}
            />
            <Button title="Detalles del municipio" onPress={() => navigation.navigate('DetailMunicipio', { municipio})} />
      
    </View>
  );
}

function DetailMuncipioScreen({route}) {
  const {municipio} = route.params;
  
  const latitud = parseFloat(municipio.Latitud.replace(",", "."));
  const longitud = parseFloat(municipio.Longitud.replace(",", ".")); 
  
  const [origin, setOrigin] = useState({ latitude: latitud, longitude: longitud });
  
 
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>      
      <Text>Comunidad Autónoma: {JSON.stringify(municipio.Comunidad)}</Text>
      <Text>Provincia: {JSON.stringify(municipio.Provincia)}</Text>      
      <Text>Población: {JSON.stringify(municipio.Población)}</Text>
      <MapView  
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        region={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}        
        zoomLevel={50}
      >
        <Marker coordinate={origin} />
      </MapView> 
      <Text>Habitantes: {JSON.stringify(municipio.Habitantes)}</Text>
      <Text>Mujeres: {JSON.stringify(municipio.Mujeres)}</Text>
      <Text>Hombres: {JSON.stringify(municipio.Hombres)}</Text>
            
    </View>
  );
}
const RootStack = createNativeStackNavigator({
  initialRouteName: 'Home',
  screenOptions: {
    headerStyle: { backgroundColor: 'tomato' },
  },
  screens: {
    Home: {
      screen: HomeScreen,
      options: {
        title: 'Inicio',
      },
    },
    Details: {
      screen: DetailsScreen,
      options: {   
          
          title: 'Detalles del municipio',       
      },
    },
    DetailMunicipio:{
      screen: DetailMuncipioScreen,
      options: {   
          
          title: 'Detalles del municipio',       
      },
    }, 
   
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return <Navigation />;
}
const styles = StyleSheet.create({
  
  map :{
    width: '100%',
    height: '50%',
  },
  listado: {
    color: 'blue',
    fontSize: 20,
    fontWeight: 'bold',

  }
});