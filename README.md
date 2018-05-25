# React Native Image Crop ()
A component for react-native crop image,  such as edit user head.

## Installation
```sh
npm install ..
```

## Usage

### Example

```

## Screencasts



#### Props
- `imageWidth: PropTypes.number.required`  //must be image real origin imageWidth
- `imageHeight: PropTypes.number.required` //must be image real origin imageHeight
- `editRectWidth: PropTypes.number.optional` //default: 212 [the edit rect width]
- `editRectHeight: PropTypes.number.optional` //default: 212 [the edit rect height]
- `editRectRadius: PropTypes.number.optional` //default: 106, the rect is round
- `overlayColor: PropTypes.string.optional` //default: rgba(0, 0, 0, 0.5)
#### Functions
- `getCropData()` //return ImageEditor.cropImage's cropData widthout displaySize
