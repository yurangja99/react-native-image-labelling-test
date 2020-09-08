import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import Canvas, {Image as CanvasImage} from 'react-native-canvas';

// 화면 크기 얻기
const {width} = Dimensions.get("screen");

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      ctx: null,
      drawing: false,
      points: [],
      imgIndex: 1
    };
  }

  handleCanvas = async (canvas) => {
    if (canvas) {
      // 캔버스 크기
      canvas.width = width - 20;
      canvas.height = width - 20;      
      // 컨텍스트, 초기 캔버스 저장
      const ctx = canvas.getContext('2d');
      this.setState({ctx}, () => this.onInit());
    }
  };

  onInit = () => {
    const {ctx, imgIndex} = this.state;
    // 캔버스 배경색 설정
    ctx.clearRect(0, 0, width, width);
    ctx.beginPath();
    ctx.fillStyle = '#ddd';
    ctx.fillRect(0, 0, width - 20, width - 20);
    // 캔버스에 이미지 로드
    var image = new CanvasImage(ctx.canvas);
    image.src = `https://labelling-app-test.s3.ap-northeast-2.amazonaws.com/${imgIndex}.jpg`;
    image.addEventListener('load', () => {
      ctx.drawImage(image, 0, 0, width, width);
    });
    
    this.setState({drawing: false, points: []});
  }

  onPress = (event) => {
    const {points, drawing, ctx} = this.state;
    const {locationX, locationY} = event.nativeEvent;
    console.log(`pressed (${locationX}, ${locationY})`);
    // 점 목록의 길이가 4 미만이라면 새로운 점을 추가
    if (points.length < 4) {
      points.push(Object({x: locationX, y: locationY}));
      // 선분의 시작점인지 끝점인지에 따라 다르게 행동한다.
      if (drawing === true) {
        // 점 찍기
        ctx.fillStyle = 'yellow';
        ctx.fillRect(locationX - 5, locationY - 5, 10, 10);
        // 선분을 마무리짓는다.
        ctx.lineTo(locationX, locationY);
        ctx.stroke();
      } else {
        // 점 찍기
        ctx.fillStyle = 'yellow';
        ctx.fillRect(locationX - 5, locationY - 5, 10, 10);
        // 선분 긋기를 시작한다.
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.moveTo(locationX, locationY);
      }
      // state 갱신
      this.setState({points, drawing: !drawing});
    }
  };

  calculate_angle = () => {
    const {points} = this.state;
    // points의 길이가 2 미만인 경우, 0 반환
    if (points.length < 2) return Object({large: 0.0, small: 0.0});
    // tan(theta1) 계산
    const x1 = points[1].y - points[0].y;
    const y1 = points[0].x - points[1].x;
    const tan1 = x1 === 0.0 ? y1 : y1 / x1;
    // points의 길이가 4 미만인 경우, theta1 반환
    const angle1 = (Math.atan(tan1) * 180 / Math.PI).toFixed(5);
    if (points.length < 4) {
      const result = Math.abs(angle1);
      return result >= 90.0 ? Object({large: result, small: 180.0 - result})
      : Object({large: 180.0 - result, small: result});
    }
    // points의 길이가 4인 경우, tan(theta2) 계산 이후 theta 반환
    const x2 = points[3].y - points[2].y;
    const y2 = points[2].x - points[3].x;
    const tan2 = x2 === 0.0 ? y2 : y2 / x2;
    const angle2 = (Math.atan(tan2) * 180 / Math.PI).toFixed(5);
    const between =  Math.abs(angle2 - angle1).toFixed(5);
    return between >= 90.0 ? Object({large: between, small: 180.0 - between})
      : Object({large: 180.0 - between, small: between});
  };

  onChangeImage = item => {
    this.setState({imgIndex: item}, () => this.onInit());
  }

  render () {
    const {imgIndex} = this.state;
    const angles = this.calculate_angle();
    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.title}>Image Labelling Test App</Text>
        <Text style={styles.instruction}>이 예제에서는 두 개의 선분을 그리면 그 사이의 예각과 둔각을 구해 줍니다.</Text>
        <Text style={styles.instruction}>횡단보도 프로젝트의 경우, 여러 횡단보도 사진이 있고, 라벨링할 정보도 여러 가지가 있지만, 일단 이 예제에서는 14개의 사진에 대한 각도 정보만 라벨링하도록 하겠습니다.</Text>
        <Text style={styles.instruction}>두 번 터치하면 선분이 그어지고, 선분 두 개가 그려지면 더 이상 새로운 선분을 그을 수 없습니다.</Text>
        <Text style={styles.instruction}>초기화 버튼을 누르면, 모든 선분들이 지워집니다.</Text>
        <Text style={styles.instruction}>결과는 아래의 각도 탭에 나타납니다. 처음에는 0°, 선분이 하나면 세로선과의 예각과 둔각, 선분이 두 개면 두 선분 사이의 예각과 둔각을 나타냅니다.</Text>
        <View style={styles.canvas_container} >
          <TouchableWithoutFeedback 
            onPress={this.onPress}>
            <View>
              <Canvas ref={this.handleCanvas} />
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.button}>
          <Text>현재 사진: Img {imgIndex}</Text>
        </View>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {[...Array(14).keys()].map(item => (
            <TouchableOpacity 
              key={item + 1}
              onPress={() => this.onChangeImage(item + 1)}
              style={styles.button}>
              <Text>Img {item + 1}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity 
          style={styles.button}
          onPress={this.onInit} >
          <Text>초기화</Text>
        </TouchableOpacity>
        <View style={styles.result}>
          <Text>예각: {angles.small}°</Text>
          <Text>둔각: {angles.large}°</Text>
        </View>
      </ScrollView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#eee",
    width: "100%",
    height: "100%"
  },
  title: {
    fontSize: 30,
    color: "#555",
    fontWeight: "bold",
    alignSelf: "center"
  },
  instruction: {
    color: "#666",
    marginVertical: 5,
    paddingHorizontal: 10
  }, 
  canvas_container: {
    backgroundColor: "black",
    padding: 10
  },
  button: {
    backgroundColor: "#02b242",
    padding: 10,
    marginTop: 10,
    marginHorizontal: 10,
    alignItems: "center",
    borderRadius: 5
  },
  result: {
    backgroundColor: "#02a2c2",
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 10,
    alignItems: "center",
    borderRadius: 5
  }
});

export default App;