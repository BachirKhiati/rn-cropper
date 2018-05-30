import React from 'react'
import { View, PanResponder, Animated, Image, StyleSheet, ActivityIndicator,Platform } from 'react-native'
import ClipRect from './Rect'
export default class extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      imageWidth: null,
      imageHeight: null,
      loaded: false,
      editRectWidth: null,
      editRectHeight: null,
      editRectRadius: null,
      cropWidth: 1080,
      cropHeight: 1080,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      source: null,
      scale: 1,
      cropBorder: 1.1
    }
  }

  componentWillReceiveProps (nextProps) {
    if ((nextProps.source.uri && nextProps.source.uri !== this.state.source) 
    && this.state.editRectWidth!==null ) {
      if(this.state.loaded){
        this.setState({loaded: false})
      }
      Image.getSize(nextProps.source.uri, (w, h) => {
        this.setState(
          {
            imageWidth: w,
            imageHeight: h,
            source: nextProps.source
          },
        () => {
          this.panGesture()
          setTimeout(function(){ this.setState({
           loaded: true
          })}.bind(this), 300);


        }
      )
      })
    }
  }

  matchViewDimensions (layout) {
    const { height } = layout
    const { source, type, cropWidth, cropHeight } = this.props
    
    if((height!==0 && 
      height !==this.state.editRectWidth) 
      && this.state.editRectWidth=== null
      && this.state.source===null 
     && this.state.source!==source.uri ){
      if(this.state.loaded){
        this.setState({loaded: false})
      }
      if(type==='profile'){
        Platform.OS==='ios' ? editRectRadius=height/2.4 : editRectRadius=height/2.4
        cropBorder=1.2
      }
      else{
        editRectRadius=0
        cropBorder=1.1
      }

      Image.getSize(source.uri, (w, h) => {
        this.setState(
          {
            cropBorder,
            imageWidth: w,
            imageHeight: h,
            source: source,
            editRectWidth: height,
            editRectHeight: height,
            cropWidth,
            cropHeight,
            editRectRadius
          },
          () => {
            this.panGesture()
            setTimeout(function(){ this.setState({
              loaded: true
            })}.bind(this), 300);
          }
        )
      })
    }
  }

  panGesture () {
    const { editRectWidth, editRectHeight } = this.state
    const { imageWidth, imageHeight } = this.state
    let percentage = 2
    this.lastGestureDx = null
    this.translateX = 0
    this.animatedTranslateX = new Animated.Value(this.translateX)

    this.lastGestureDy = null
    this.translateY = 0
    this.animatedTranslateY = new Animated.Value(this.translateY)

    this.scale = 1
    this.animatedScale = new Animated.Value(this.scale)
    this.lastZoomDistance = null
    this.currentZoomDistance = 0

    if (imageWidth < imageHeight) {
      this.imageMinWidth = editRectWidth
      this.imageMinHeight = imageHeight / imageWidth * editRectHeight
    } else {
      this.imageMinWidth = imageWidth / imageHeight * editRectWidth
      this.imageMinHeight = editRectHeight
    }
    this.imageMinSize = Math.floor(
      Math.sqrt(
        this.imageMinWidth * this.imageMinWidth +
          this.imageMinHeight * this.imageMinHeight
      )
    )

    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onShouldBlockNativeResponder: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        this.lastGestureDx = null
        this.lastGestureDy = null
        this.lastZoomDistance = null
      },

      onPanResponderMove: (evt, gestureState) => {
        const { changedTouches } = evt.nativeEvent
        if (changedTouches.length <= 1 && this.scale === 1) {
          this.translateX +=
            this.lastGestureDx === null
              ? 0
              : gestureState.dx / percentage - this.lastGestureDx
          this.translateY +=
            this.lastGestureDy === null
              ? 0
              : gestureState.dy / percentage - this.lastGestureDy
          this.lastGestureDx = gestureState.dx / percentage
          this.lastGestureDy = gestureState.dy / percentage
          this.updateTranslate()
        } else if (changedTouches.length <= 1 && this.scale > 1) {
          if (this.scale > 1 && this.scale < 1.5) {
            percentage = this.scale * 2
          }
          if (this.scale > 1.5 && this.scale < 2) {
            percentage = this.scale * 3
          }
          if (this.scale > 2 && this.scale < 2.5) {
            percentage = this.scale * 4
          }
          if (this.scale > 2.5 && this.scale <= 3) {
            percentage = this.scale * 4.5
          }
          this.translateX +=
              this.lastGestureDx === null
                ? 0
                : gestureState.dx / percentage - this.lastGestureDx
          this.translateY +=
              this.lastGestureDy === null
                ? 0
                : gestureState.dy / percentage - this.lastGestureDy
          this.lastGestureDx = gestureState.dx / percentage
          this.lastGestureDy = gestureState.dy / percentage
          this.updateTranslate()
        } else {
          const widthDistance =
            changedTouches[1].pageX - changedTouches[0].pageX
          const heightDistance =
            changedTouches[1].pageY - changedTouches[0].pageY
          this.currentZoomDistance = Math.floor(
            Math.sqrt(
              widthDistance * widthDistance + heightDistance * heightDistance
            )
          )
          if (this.lastZoomDistance !== null) {
            let scale =
              this.scale +
              (this.currentZoomDistance - this.lastZoomDistance) *
                this.scale /
                this.imageMinSize
            if (scale < 1) {
              scale = 1
            }
            if (scale >= 3) {
              scale = 3
            }
            this.animatedScale.setValue(scale)
            this.updateTranslate()
            this.scale = scale
            this.setState({scale})
          }
          this.lastZoomDistance = this.currentZoomDistance
        }
      },
      onPanResponderRelease: (evt, gestureState) => {},
      onPanResponderTerminate: (evt, gestureState) => {}
    })
  }

  updateTranslate () {
    const { editRectWidth, editRectHeight } = this.state
    const xOffest = (this.imageMinWidth - editRectWidth / this.state.cropBorder / this.scale) / 2
    const yOffest =
      (this.imageMinHeight - editRectHeight / this.state.cropBorder / this.scale) / 2

    if (this.translateX > xOffest) {
      this.translateX = xOffest
    }
    if (this.translateX < -xOffest) {
      this.translateX = -xOffest
    }
    if (this.translateY > yOffest) {
      this.translateY = yOffest
    }
    if (this.translateY < -yOffest) {
      this.translateY = -yOffest
    }
    this.animatedTranslateX.setValue(this.translateX)
    this.animatedTranslateY.setValue(this.translateY)
  }
  getCropData () {
    const { editRectWidth, editRectHeight } = this.state
    const { imageWidth, imageHeight } = this.state
    const ratioX = imageWidth / this.imageMinWidth
    const ratioY = imageHeight / this.imageMinHeight
    const width = editRectWidth / this.state.cropBorder / this.scale
    const height = editRectHeight / this.state.cropBorder / this.scale
    const x = this.imageMinWidth / 2 - (width / 2 + this.translateX)
    const y = this.imageMinHeight / 2 - (height / 2 + this.translateY)
    return {
      offset: { x: x * ratioX, y: y * ratioY },
      size: { width: width * ratioX, height: height * ratioY },
      displaySize: { width: this.state.cropWidth, height: this.state.cropHeight }
    }
  }
  render () {
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
    }
    const {
      editRectWidth,
      editRectHeight,
      editRectRadius,
      source,
      style,
      overlayColor
    } = this.state
    return (
      <View
        onLayout={event => {
          this.matchViewDimensions(event.nativeEvent.layout)
        }}
      >
        {this.state.loaded ? (
          <View
            style={[styles.container, style]}
            {...this.imagePanResponder.panHandlers}
          >
            <Animated.Image
              useNativeDriver
              style={[
                animatedStyle,
                {
                  width: this.imageMinWidth,
                  height: this.imageMinHeight
                }
              ]}
              source={source}
              resizeMode='contain'
            />
            <View style={styles.editboxContainer}>
              <View style={{ flex: 1, backgroundColor: overlayColor }} />
              <View style={styles.editboxMiddle}>
                <View style={{ flex: 1, backgroundColor: overlayColor }} />
                      <View
                        style={{
                          width:( editRectWidth / this.state.cropBorder),
                          height: (editRectHeight / this.state.cropBorder)
                        }}
                      >
                            <ClipRect
                              style={{
                                width:( editRectWidth / this.state.cropBorder) ,
                                height: (editRectHeight / this.state.cropBorder),
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

                   <View style={{flex:1,backgroundColor: overlayColor }} />
              </View>
              <View style={{ flex: 1, backgroundColor: overlayColor }} />
            </View>
          </View>
        ):<View style={styles.splash} >
        <ActivityIndicator size='large' color={'#ade6ec'} />
      </View> 
        }

      </View>
    )
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
    left: 0,
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
    flexDirection: 'row',
    
  },
  splash: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
})
