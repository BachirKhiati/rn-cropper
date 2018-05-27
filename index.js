import React from 'react';
import {
  View,
  PanResponder,
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions
} from 'react-native';

import ClipRect from './Rect';

const { width } = Dimensions.get('window');

export default class extends React.Component {
  constructor(props) {
    super(props);
    let { width, height } = Dimensions.get('window');
    console.log('test', width, width);
    this.state = {
      imageWidth: null,
      imageHeight: null,
      loaded: false,
      editRectWidth: 200,
      editRectHeight: 200,
      editRectRadius: 0,
      width: 1080,
      height: 1080,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      source: ''
    };
  }

  matchDimesions(layout) {
    const { height } = layout;
    this.setState(
      {
        editRectWidth: height,
        editRectHeight: height
      },
      () => {
        const { source, style } = this.props;
        console.log('style');
        console.log(style);

        Image.getSize(source.uri, (w, h) => {
          this.setState(
            {
              imageWidth: w,
              imageHeight: h,
              source: source
            },
            () => {
              this.Loaded();
              this.setState({
                loaded: true
              });
            }
          );
        });
      }
    );
  }

  Loaded() {
    const { editRectWidth, editRectHeight } = this.state;
    const { imageWidth, imageHeight } = this.state;
    this.lastGestureDx = null;
    this.translateX = 0;
    this.animatedTranslateX = new Animated.Value(this.translateX);

    // 上次/当前/动画 y 位移
    this.lastGestureDy = null;
    this.translateY = 0;
    this.animatedTranslateY = new Animated.Value(this.translateY);

    // 缩放大小
    this.scale = 1.2;
    this.animatedScale = new Animated.Value(this.scale);
    this.lastZoomDistance = null;
    this.currentZoomDistance = 0;

    //图片大小
    if (imageWidth < imageHeight) {
      this.imageMinWidth = editRectWidth;
      this.imageMinHeight = imageHeight / imageWidth * editRectHeight;
    } else {
      this.imageMinWidth = imageWidth / imageHeight * editRectWidth;
      this.imageMinHeight = editRectHeight;
    }
    this.imageMinSize = Math.floor(
      Math.sqrt(
        this.imageMinWidth * this.imageMinWidth +
          this.imageMinHeight * this.imageMinHeight
      )
    );

    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => false,

      onPanResponderGrant: (evt, gestureState) => {
        this.lastGestureDx = null;
        this.lastGestureDy = null;
        this.lastZoomDistance = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        const { changedTouches } = evt.nativeEvent;
        if (changedTouches.length <= 1) {
          this.translateX +=
            this.lastGestureDx === null
              ? 0
              : gestureState.dx - this.lastGestureDx;
          this.translateY +=
            this.lastGestureDy === null
              ? 0
              : gestureState.dy - this.lastGestureDy;
          this.lastGestureDx = gestureState.dx;
          this.lastGestureDy = gestureState.dy;
          this.updateTranslate();
        } else {
          const widthDistance =
            changedTouches[1].pageX - changedTouches[0].pageX;
          const heightDistance =
            changedTouches[1].pageY - changedTouches[0].pageY;
          this.currentZoomDistance = Math.floor(
            Math.sqrt(
              widthDistance * widthDistance + heightDistance * heightDistance
            )
          );

          if (this.lastZoomDistance !== null) {
            let scale =
              this.scale +
              (this.currentZoomDistance - this.lastZoomDistance) *
                this.scale /
                this.imageMinSize;
            if (scale < 1) {
              scale = 1;
            }
            this.animatedScale.setValue(scale);
            this.updateTranslate();
            this.scale = scale;
          }
          this.lastZoomDistance = this.currentZoomDistance;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {},
      onPanResponderTerminate: (evt, gestureState) => {}
    });
  }

  updateTranslate() {
    const { editRectWidth, editRectHeight } = this.state;
    const xOffest = (this.imageMinWidth - editRectWidth / 1.1 / this.scale) / 2;
    const yOffest =
      (this.imageMinHeight - editRectHeight / 1.1 / this.scale) / 2;

    if (this.translateX > xOffest) {
      this.translateX = xOffest;
    }
    if (this.translateX < -xOffest) {
      this.translateX = -xOffest;
    }
    if (this.translateY > yOffest) {
      this.translateY = yOffest;
    }
    if (this.translateY < -yOffest) {
      this.translateY = -yOffest;
    }
    this.animatedTranslateX.setValue(this.translateX);
    this.animatedTranslateY.setValue(this.translateY);
  }
  getCropData() {
    const { editRectWidth, editRectHeight } = this.state;
    const { imageWidth, imageHeight } = this.state;
    const ratioX = imageWidth / this.imageMinWidth;
    const ratioY = imageHeight / this.imageMinHeight;
    const width = editRectWidth / 1.1 / this.scale;
    const height = editRectHeight / 1.1 / this.scale;
    const x = this.imageMinWidth / 2 - (width / 2 + this.translateX);
    const y = this.imageMinHeight / 2 - (height / 2 + this.translateY);
    return {
      offset: { x: x * ratioX, y: y * ratioY },
      size: { width: width * ratioX, height: height * ratioY },
      displaySize: { width: this.state.width, height: this.state.height }
    };
  }
  render() {
    const animatedStyle = {
      transform: [
        {
          scale: this.animatedScale
        },
        {
          translateX: this.animatedTranslateX
        },
        {
          translateY: this.animatedTranslateY
        }
      ]
    };
    const {
      editRectWidth,
      editRectHeight,
      editRectRadius,
      source,
      style,
      overlayColor
    } = this.state;
    return (
      <View
        onLayout={event => {
          this.matchDimesions(event.nativeEvent.layout);
        }}
      >
        {this.state.loaded && (
          <View
            style={[styles.container, style]}
            {...this.imagePanResponder.panHandlers}
          >
            <Animated.View style={animatedStyle}>
              <ImageBackground
                resizeMode="cover"
                style={{
                  width: this.imageMinWidth,
                  height: this.imageMinHeight
                }}
                source={source}
              />
            </Animated.View>
            <View style={styles.editboxContainer}>
              <View style={{ flex: 1, backgroundColor: overlayColor }} />
              <View style={styles.editboxMiddle}>
                <View style={{ flex: 1, backgroundColor: overlayColor }} />
                <View
                  style={{
                    width: editRectWidth / 1.1,
                    height: editRectHeight / 1.1
                  }}
                >
                  <ClipRect
                    style={{
                      width: editRectWidth,
                      height: editRectHeight,
                      borderRadius: editRectRadius,
                      color: overlayColor
                    }}
                  />
                  <View
                    style={[
                      styles.clipRectBoder,
                      { borderRadius: editRectRadius }
                    ]}
                  />
                </View>
                <View style={{ flex: 1, backgroundColor: overlayColor }} />
              </View>
              <View style={{ flex: 1, backgroundColor: overlayColor }} />
            </View>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'black'
  },
  editboxContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  clipRectBoder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: '#FFFFFF',
    borderWidth: 2
  },
  editboxMiddle: {
    flexDirection: 'row'
  }
});
